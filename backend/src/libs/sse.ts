// In-process Server-Sent Events hub. Lives on globalThis so every route bundle shares it.
// ponytail: single-process only; move to Redis pub/sub if you ever run more than one instance.
type Send = (chunk: string) => void;
const g = globalThis as unknown as { sseChannels?: Map<string, Set<Send>> };
const channels = (g.sseChannels ??= new Map<string, Set<Send>>());

const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export function publish(channel: string, event: string, data: unknown) {
  const msg = frame(event, data);
  channels.get(channel)?.forEach((send) => send(msg));
}

// Opens a stream on `channel` and sends `first` right away, so a (re)connecting client is never stale.
export function stream(req: Request, channel: string, first: [event: string, data: unknown]) {
  const enc = new TextEncoder();
  let cleanup = () => {};
  const body = new ReadableStream({
    start(ctrl) {
      const subs: Set<Send> = channels.get(channel) ?? channels.set(channel, new Set()).get(channel)!;
      const send: Send = (s) => {
        try {
          ctrl.enqueue(enc.encode(s));
        } catch {
          cleanup();
        }
      };
      const ping = setInterval(() => send(": ping\n\n"), 20_000);
      cleanup = () => {
        clearInterval(ping);
        subs.delete(send);
        if (!subs.size && channels.get(channel) === subs) channels.delete(channel);
      };
      subs.add(send);
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          ctrl.close();
        } catch {}
      });
      send("retry: 2000\n" + frame(...first));
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
