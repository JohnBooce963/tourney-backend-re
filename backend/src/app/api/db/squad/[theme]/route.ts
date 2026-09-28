import { handle, HttpError } from "@/libs/http";
import { db } from "@/service/db-service";

export const GET = handle(async (_req, { params }: { params: Promise<{ theme: string }> }) => {
  const theme = Number((await params).theme);
  if (!Number.isInteger(theme)) throw new HttpError(400, "Theme must be a number");
  return Response.json(await db.squads(theme), { headers: { "Cache-Control": "public, max-age=3600" } });
});
