import { lobbyService } from "@/service/lobby-service";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, slot } = req.query;

  try {
    const lobby = lobbyService.cancelRole(id as string, Number(slot) as 1 | 2);
    res.status(200).json(lobby);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}