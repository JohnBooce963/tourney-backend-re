import { handle, readBody, text } from "@/libs/http";
import { lobbies } from "@/service/lobby-service";

export const dynamic = "force-dynamic";

export const GET = handle(() => lobbies.list());

export const POST = handle(async (req) => {
  const b = await readBody(req);
  return lobbies.create(text(b.name, "Lobby name", 40), Number(b.theme));
});
