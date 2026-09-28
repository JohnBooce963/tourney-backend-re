import { handle } from "@/libs/http";
import { db } from "@/service/db-service";

// Images are served as real PNGs (not base64 in JSON) so browsers can lazy-load and cache them.
export const GET = handle(async (_req, { params }: { params: Promise<{ kind: string; id: string }> }) => {
  const { kind, id } = await params;
  return new Response(Buffer.from(await db.image(kind, id)), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
});
