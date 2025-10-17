import { corsOptionsResponse, withCors } from "@/libs/cor";
import { dbService } from "@/service/db-service";

export async function GET(req: Request,  context: { params: Promise<{ theme: number }> }) {
    const { theme } = await context.params;

    try{
        const res = await dbService.getSpecificTheme(theme);
        return withCors(req, res, {status: 200})
    }catch (err) {
        return withCors(req, { error: "Failed to get lobby info" }, { status: 500 });
    }
    
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}