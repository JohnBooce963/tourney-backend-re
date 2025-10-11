import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";

export async function POST(req: Request, context: { params: Promise<{ id: string; slot: string }> }) {
  try {
    const { id, slot  } = await context.params;
    const slotNum = Number(slot);

    const updatedLobby = lobbyService.cancelRole(id, slotNum);

    if (!updatedLobby) {
      return withCors(req, { error: "Lobby not found" }, { status: 404 });
    }

    // SSE will automatically broadcast the update because cancelRole emits "lobbyUpdate"
    return withCors(req, updatedLobby, { status: 200 });
  } catch (err) {
    return withCors(req, { error: err || "Unknown error" }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}