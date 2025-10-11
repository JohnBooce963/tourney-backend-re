import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
         
        const { playerName } = await req.json();

    if (!id) {
      return withCors(req, { error: "Lobby Not Found" }, { status: 404 });
    }

    if(!playerName){
        return withCors(req, { error: "No PlayerName Provided!"}, { status: 400})
    }

    const leave = lobbyService.leaveLobby(id, playerName);
    // const lobby = lobbyService.getLobbyInfo(id);

    return withCors(req, leave, { status: 200 });
  } catch (err) {
    return withCors(req, { error: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}