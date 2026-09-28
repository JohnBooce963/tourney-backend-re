import { lobbyAction } from "@/libs/http";
import { lobbies } from "@/service/lobby-service";

export const POST = lobbyAction((id, b) => lobbies.select(id, String(b.token), String(b.item)));
