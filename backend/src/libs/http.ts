export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Wraps a route handler: plain return values become JSON, HttpError becomes its status.
export function handle<C>(fn: (req: Request, ctx: C) => unknown) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      const out = await fn(req, ctx);
      return out instanceof Response ? out : Response.json(out ?? { ok: true });
    } catch (err) {
      // Duck-typed, not instanceof: in `next dev` each route bundles its own copy of HttpError,
      // while the shared lobby service (on globalThis) throws the copy from whichever route created it.
      const status = (err as { status?: unknown })?.status;
      if (typeof status === "number") return Response.json({ error: (err as Error).message }, { status });
      console.error(err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

// POST /api/lobby/[id]/<action> handlers all share this shape.
export const lobbyAction = (fn: (id: string, body: Record<string, unknown>) => unknown) =>
  handle(async (req, { params }: { params: Promise<{ id: string }> }) => fn((await params).id, await readBody(req)));

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") throw new HttpError(400, "Invalid JSON body");
  return body;
}

export function text(value: unknown, field: string, max: number): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s || s.length > max) throw new HttpError(400, `${field} must be 1-${max} characters`);
  return s;
}
