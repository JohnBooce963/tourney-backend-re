import type { NextApiRequest, NextApiResponse } from "next";
import { lobbyService } from "@/service/lobby-service";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { playerName, slot } = req.body;

  try {
    const lobby = lobbyService.joinLobby(id as string, playerName, slot);
    res.status(200).json(lobby);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}