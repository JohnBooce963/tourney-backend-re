import { handle } from "@/libs/http";
import { lobbies } from "@/service/lobby-service";

export const GET = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => lobbies.view((await params).id));
