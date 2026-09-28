import { stream } from "@/libs/sse";
import { lobbies } from "@/service/lobby-service";

export const dynamic = "force-dynamic";

export const GET = (req: Request) => stream(req, "lobbies", ["lobbies", lobbies.list()]);
