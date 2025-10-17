import { dbService } from "@/service/db-service";
import { corsOptionsResponse, withCors } from "@/libs/cor";

export async function GET(req: Request) {

    try{
        const resTheme = await dbService.getOperatorList();

        return withCors(req, resTheme, { status : 200})
    }
    catch(err){
        return withCors(req, { error: 'Internal Server Error'}, { status: 500})
    }


}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}