import { lobbyAction, text } from "@/libs/http";
import { lobbies } from "@/service/lobby-service";

export const POST = lobbyAction((id, b) => lobbies.join(id, text(b.name, "Name", 24), Number(b.slot)));
