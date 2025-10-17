import { NextRequest, NextResponse } from "next/server";
import { lobbyService } from "@/service/lobby-service";
import { corsOptionsResponse, withCors } from "@/libs/cor";
import { GameService } from "@/service/game-service";


export async function POST(req: NextRequest) {
  try {
    const { type, lobbyId, action } = await req.json();

    switch (type) {
      case "playerAction":
        // res = lobbyService.getGameService(lobbyId)?.setPlayerAction(action)
        lobbyService.getGameService(lobbyId)?.setPlayerAction(action);
        return withCors(req, { message : "Process Action" }, { status: 200 });
      case "confirmedAction":
        // res = lobbyService.getGameService(lobbyId)?.handlePlayerAction(action)
        lobbyService.getGameService(lobbyId)?.handlePlayerAction(action)
        return withCors(req, { message : "Confirmed Action" }, { status: 200 });
      case "startDraft":
        await lobbyService.startGame(lobbyId);
        return withCors(req, { message : "Game Start!" }, { status: 200 });
      // case "flipCoin":
      //   const result = lobbyService.flipCoin(lobbyId);
      //   // broadcast automatically via lobbyService events
      //   break;
      // case "getUpdate":
      //   // optional: send current lobby/game status
      //   break;
      default:
        console.warn("Unknown action type:", type);
    }

    // return withCors(req, res, { status: 200 });
  } catch (err) {
    console.error(err);
    return withCors(req, {error: "Failed to handle action"} ,{ status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}