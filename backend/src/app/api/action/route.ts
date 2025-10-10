import { NextRequest, NextResponse } from "next/server";
import { lobbyService } from "@/service/lobby-service";

export async function POST(req: NextRequest) {
  try {
    const { type, lobbyId, action } = await req.json();

    switch (type) {
      case "playerAction":
        lobbyService.getGameService(lobbyId)?.setPlayerAction(action);
        break;
      case "confirmedAction":
        lobbyService.getGameService(lobbyId)?.handlePlayerAction(action);
        break;
      case "startDraft":
        lobbyService.getGameService(lobbyId)?.startDraft();
        break;
      case "flipCoin":
        const result = lobbyService.flipCoin(lobbyId);
        // broadcast automatically via lobbyService events
        break;
      case "getUpdate":
        // optional: send current lobby/game status
        break;
      default:
        console.warn("Unknown action type:", type);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", error: "Failed to handle action" }, { status: 500 });
  }
}