import { handle } from "@/libs/http";
import { db } from "@/service/db-service";

export const dynamic = "force-dynamic";

export const GET = handle(async () =>
  Response.json(await db.operators(), { headers: { "Cache-Control": "public, max-age=3600" } }),
);
