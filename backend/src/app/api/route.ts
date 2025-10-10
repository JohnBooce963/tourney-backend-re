// import { NextResponse } from 'next/server';
// import { lobbyService } from '@/service/lobby-service';

// const CORS_HEADERS = {
//   'Access-Control-Allow-Origin': 'http://localhost:4200',
//   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type',
// };

// export async function GET() {
//   const lobbies = lobbyService.getAllLobbies();
//   return NextResponse.json(lobbies, { headers: CORS_HEADERS });
// }

// export async function OPTIONS() {
//   return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
// }
import { withCors, corsOptionsResponse } from "@/libs/cor";

export async function GET(req: Request) {
  return withCors(req, { message: "Lobby list works" }, { status: 200 });
}

export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}