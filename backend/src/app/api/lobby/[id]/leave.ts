import { lobbyService } from "@/service/lobby-service";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { playerName } = req.body;
  try {
    const lobby = lobbyService.leaveLobby(id as string, playerName);
    res.status(200).json(lobby);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}