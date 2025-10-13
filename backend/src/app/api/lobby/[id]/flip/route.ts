import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";
import { publishCoinFlip } from "@/service/ably-ws-service";

export async function GET(req: Request,   context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    try{
        const res = lobbyService.flipCoin(id);
        await publishCoinFlip(id, res);

        return withCors(req, res, {status: 200})
    }catch(err){
        return withCors(req, { error: "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}