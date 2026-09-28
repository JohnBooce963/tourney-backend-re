import { handle } from "@/libs/http";
import { stream } from "@/libs/sse";
import { lobbies } from "@/service/lobby-service";

// A 404 here makes EventSource stop reconnecting, which is what we want for a deleted lobby.
export const GET = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return stream(req, `lobby:${id}`, ["state", lobbies.view(id)]);
});
