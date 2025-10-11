import { NextRequest, NextResponse } from "next/server";
import { lobbyService } from "@/service/lobby-service";


type Client = {
  id: string;
  send: (msg: string) => void;
  lobbyId?: string;
};

const clients: Map<string, Client> = new Map();

const allowedOrigins = [
  "http://localhost:4200",
  "https://tourney-frontend.vercel.app"
];

function broadcast(payload: any, lobbyId?: string) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    // if (!lobbyId || client.lobbyId === lobbyId) {
      
    // }
    client.send(msg);
  });
}

// Subscribe to lobbyService events
lobbyService.on("lobbiesUpdate", (lobbies) =>
  broadcast({ type: "lobbies", data: lobbies })
);

lobbyService.on("lobbyUpdate", ({ lobbyId, lobby, type }) =>
  broadcast({ type: type || "lobbyUpdate", data: lobby }, lobbyId)
);

lobbyService.on("gameUpdate", (update) =>
  broadcast({ type: "gameUpdate", data: update })
);

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const { searchParams } = new URL(req.url);
  const lobbyId = searchParams.get("lobbyId") ?? undefined;
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
      clients.set(clientId, { id: clientId, send, lobbyId });

      // Send initial lobbies
      if (lobbyId) {
        const lobby = lobbyService.getLobbyInfo(lobbyId);
        controller.enqueue(
          `data: ${JSON.stringify({ type: "lobbyUpdate", data: lobby })}\n\n`
        );
      } else {
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "lobbies",
            data: lobbyService.getAllLobbies(),
          })}\n\n`
        );
      }

      // Remove client on disconnect
      req.signal.addEventListener("abort", () => {
        clients.delete(clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}