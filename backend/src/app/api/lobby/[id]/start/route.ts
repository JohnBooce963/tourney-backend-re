import { lobbyAction } from "@/libs/http";
import { lobbies } from "@/service/lobby-service";

export const POST = lobbyAction((id, b) => lobbies.start(id, String(b.token)));
