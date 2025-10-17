import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";
import { publishLobbies } from "@/service/ably-ws-service";


export async function GET(req: Request) {
  try {
    const lobbies = lobbyService.getAllLobbies();
    return withCors(req, lobbies, { status: 200 });
  } catch (err) {
    return withCors(req, { error: "Failed to fetch lobbies" }, { status: 500 });
  }
}

// POST /api/lobby - create a new lobby
export async function POST(req: Request) {
  try {
    const { lobbyName, lobbyTheme } = await req.json();

    if (!lobbyName || lobbyTheme === undefined) {
      return withCors(req, { error: "Missing fields" }, { status: 400 });
    }

    const id = lobbyService.createLobby(lobbyName, lobbyTheme);
    const lobby = lobbyService.getLobbyInfo(await id);

    return withCors(req, lobby, { status: 200 });
  } catch (err) {
    return withCors(req, { error: "Internal Server Error" }, { status: 500 });
  }
}

// OPTIONS /api/lobby - handle CORS preflight
export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}