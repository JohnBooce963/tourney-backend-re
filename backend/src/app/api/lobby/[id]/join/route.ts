import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
         
        const { playerName, slot } = await req.json();

    if (!id) {
      return withCors(req, { error: "Lobby Not Found" }, { status: 404 });
    }

    const slotNum = parseInt(slot, 10) as 1 | 2;
    if (![1, 2].includes(slotNum)) {
      return withCors(req, { error: "Invalid slot" }, { status: 400 });
    }

    const lobby = lobbyService.joinLobby(id, playerName, slotNum);
    // const lobby = lobbyService.getLobbyInfo(id);

    return withCors(req, lobby, { status: 200 });
  } catch (err) {
    return withCors(req, { error: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}