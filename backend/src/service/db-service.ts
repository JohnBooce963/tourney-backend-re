import { neon } from "@neondatabase/serverless";
import { HttpError } from "@/libs/http";

export type Operator = { id: string; name: string; cls: string; rarity: number };
export type Squad = { id: string; name: string };

// Game data is static, so each query runs once per process and failures are retried next time.
// ponytail: restart the server to pick up DB edits; add a TTL if the data starts changing often.
const g = globalThis as unknown as { dbCache?: Map<string, Promise<unknown>> };
const cache = (g.dbCache ??= new Map());

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(key, load().catch((err) => {
      cache.delete(key);
      throw err;
    }));
  }
  return cache.get(key) as Promise<T>;
}

const sql = () => neon(process.env.DATABASE_URL!);

export const db = {
  operators: () =>
    once("ops", async () =>
      (await sql()`SELECT char_name, char_name_alt, char_class, char_rarity FROM operator
                   WHERE char_playable = '1' ORDER BY char_name_alt`).map(
        (r): Operator => ({ id: r.char_name, name: r.char_name_alt, cls: r.char_class, rarity: Number(r.char_rarity) }),
      ),
    ),

  squads: (theme: number) =>
    once(`squads:${theme}`, async () =>
      (await sql()`SELECT squad_id, squad_name FROM squad WHERE squad_theme = ${theme}`).map(
        (r): Squad => ({ id: r.squad_id, name: r.squad_name }),
      ),
    ),

  image: (kind: string, id: string) =>
    once(`img:${kind}:${id}`, async () => {
      const rows =
        kind === "op" ? await sql()`SELECT char_img AS img FROM operator WHERE char_name = ${id}`
        : kind === "squad" ? await sql()`SELECT squad_img AS img FROM squad WHERE squad_id = ${id}`
        : [];
      if (!rows[0]?.img) throw new HttpError(404, "Image not found");
      return rows[0].img as Uint8Array;
    }),
};
