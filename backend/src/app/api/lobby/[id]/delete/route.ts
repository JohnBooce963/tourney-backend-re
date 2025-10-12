import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";
import { publishLobbies } from "@/service/ably-ws-service";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
         
        const { ownerToken } = await req.json();

    if (!id) {
      return withCors(req, { error: "Lobby Not Found" }, { status: 404 });
    }

    if(!ownerToken){
        return withCors(req, { error: "No Token Provided!"}, { status: 400})
    }

    const deleted = lobbyService.deleteLobby(id, ownerToken);
    // const lobby = lobbyService.getLobbyInfo(id);

    publishLobbies(lobbyService.getAllLobbies())

    return withCors(req, deleted, { status: 200 });
  } catch (err) {
    return withCors(req, { error: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}