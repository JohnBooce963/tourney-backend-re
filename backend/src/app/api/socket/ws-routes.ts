// import { WebSocketServer } from "ws";
// import { v4 as uuidv4 } from "uuid";

// const allowedOrigins = [
//   "http://localhost:4200",
//   "https://tourney-frontend.vercel.app",
// ];

// const lobbies: Record<string, { id: string; name: string; players: string[] }> = {};

// // ✅ Keep a single WebSocket server across requests
// let wss: WebSocketServer = (globalThis as any).wss || new WebSocketServer({ port: 8080 }); // start on 8080 directly

// if (!(globalThis as any).wss) {
//   console.log("✅ WebSocket Server started on ws://localhost:8080");
//   (globalThis as any).wss = wss;

//   wss.on("connection", (ws) => {
//     console.log("Client connected");

//     ws.on("message", (msg) => {
//       const data = JSON.parse(msg.toString());
//       console.log("📩 Received:", data);

//       if (data.type === "createLobby") {
//         const id = uuidv4();
//         lobbies[id] = { id, name: data.lobbyName, players: [data.playerName] };
//         broadcastLobbies();
//       }

//       if (data.type === "joinLobby") {
//         const lobby = lobbies[data.lobbyId];
//         if (lobby && lobby.players.length < 2 && !lobby.players.includes(data.playerName)) {
//           lobby.players.push(data.playerName);
//           broadcastLobbies();
//         }
//       }
//     });

//     ws.on("close", () => {
//       console.log("Client disconnected");
//     });
//   });
// }

// function broadcastLobbies() {
//   const payload = JSON.stringify({ type: "lobbies", data: Object.values(lobbies) });
//   wss?.clients.forEach((client: any) => {
//     if (client.readyState === 1) {
//       client.send(payload);
//     }
//   });
// }

// export async function GET(req: Request) {
//   const origin = req.headers.get("origin");
//   const headers = new Headers();

//   if (origin && allowedOrigins.includes(origin)) {
//     headers.set("Access-Control-Allow-Origin", origin);
//   }
//   headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   headers.set("Access-Control-Allow-Headers", "Content-Type");

//   return new Response("✅ WebSocket server running on ws://localhost:8080", { headers });
// }

// export async function OPTIONS(req: Request) {
//   const origin = req.headers.get("origin");
//   const headers = new Headers();

//   if (origin && allowedOrigins.includes(origin)) {
//     headers.set("Access-Control-Allow-Origin", origin);
//   }
//   headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   headers.set("Access-Control-Allow-Headers", "Content-Type");

//   return new Response(null, { status: 204, headers });
// }

import { WebSocketServer,  WebSocket} from "ws";
import { v4 as uuidv4 } from "uuid";
import { lobbyService } from "@/service/lobby-service";

const clients = new Set<WebSocket>();

export function startWebSocketServer(port = 8080) {
  const wss = new WebSocketServer({ port });
  console.log(`🚀 WebSocket server running on ws://localhost:${port}`);

  // Broadcast helper
  function broadcast(type: string, data: any) {
    const payload = JSON.stringify({ type, data });
    clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    });
  }

  // Update all lobbies whenever lobbyService changes
  lobbyService.on("lobbyUpdate", (lobbies) => broadcast("lobbies", lobbies));

  // Send game updates from gameService
  lobbyService.on("gameUpdate", (update) => {
    broadcast("status", update); // or adjust type based on what you send
  });

  // Handle lobby deletion
  lobbyService.on("lobbyDeleted", (lobbyId) => {
    broadcast("lobbyDeleted", { lobbyId });
  });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    console.log("✅ Client connected");

    // Optional: send current lobbies on connect
    ws.send(JSON.stringify({ type: "lobbies", data: lobbyService.getAllLobbies() }));

    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message.toString());
        console.log("📩 Received:", msg);

        switch (msg.type) {
          case "getUpdate":
            const lobby = lobbyService.getLobbyInfo(msg.lobbyId);
            ws.send(JSON.stringify({ type: "lobbyUpdate", data: lobby }));
            break;

          case "startDraft":
            lobbyService.getGameService(msg.lobbyId)?.startDraft();
            broadcast("draftStart", { lobbyId: msg.lobbyId });
            break;

          case "confirmedAction":
            lobbyService.getGameService(msg.lobbyId)?.handlePlayerAction(msg.action);
            break;
          case "playerAction":
            lobbyService.getGameService(msg.lobbyId)?.setPlayerAction(msg.action);
            break;
          case "flipCoin":
            const result = lobbyService.flipCoin(msg.lobbyId);
            broadcast("coinFlip", result);
            break;

          default:
            console.warn("⚠️ Unknown message type:", msg.type);
        }
      } catch (err) {
        console.error("❌ Failed to handle message:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(ws)
      console.log("❌ Client disconnected");
    });

    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
    });
  });

  return wss;
}