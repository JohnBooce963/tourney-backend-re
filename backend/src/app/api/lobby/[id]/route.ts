import { lobbyService } from "@/service/lobby-service";
import { withCors, corsOptionsResponse } from "@/libs/cor";


export async function GET(req: Request,  context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    try{
        const res = lobbyService.getLobbyInfo(id);
        return withCors(req, res, {status: 200})
    }catch (err) {
        return withCors(req, { error: "Failed to get lobby info" }, { status: 500 });
    }
    
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}