import { NextRequest, NextResponse } from "next/server";
import { lobbyService } from "@/service/lobby-service";


type Client = {
  id: string;
  send: (msg: string) => void;
};

const clients: Map<string, Client> = new Map();

const allowedOrigins = [
  "http://localhost:4200",
  "https://tourney-frontend.vercel.app"
];

function broadcast(payload: any) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => client.send(msg));
}

// Subscribe to lobbyService events
lobbyService.on("lobbyUpdate", (lobbies) => broadcast({ type: "lobbies", data: lobbies }));
lobbyService.on("gameUpdate", (update) => broadcast({ type: "status", data: update }));
lobbyService.on("lobbyDeleted", ({ lobbyId }) => broadcast({ type: "lobbyDeleted", data: { lobbyId } }));

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const headers = new Headers({});

  if(allowedOrigins.includes(origin)){
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");
    headers.set("Access-Control-Allow-Origin", origin);
  }

  const stream = new ReadableStream({
    start(controller) {
      const clientId = crypto.randomUUID();
      const send = (msg: string) => controller.enqueue(msg);
      clients.set(clientId, { id: clientId, send });

      // Send initial lobbies
      controller.enqueue(`data: ${JSON.stringify({ type: "lobbies", data: lobbyService.getAllLobbies() })}\n\n`);

      // Remove client on disconnect
      req.signal.addEventListener("abort", () => {
        clients.delete(clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}