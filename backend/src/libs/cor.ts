import { NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:4200",
  "https://tourney-frontend.vercel.app"
];

export function withCors(req: Request, body: any,res: ResponseInit = {}) {
  const origin = req.headers.get("origin") ?? "";
  const headers = new Headers(res.headers || {});

  if (allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new NextResponse(JSON.stringify(body), { ...res, headers });
}

export function corsOptionsResponse(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const headers = new Headers();

  if (allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new NextResponse(null, { status: 204, headers });
}