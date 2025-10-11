import { lobbyService } from "@/service/lobby-service";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { ownerToken } = req.body;
  if (!ownerToken) return res.status(400).json({ error: "Missing token" });

  const deleted = lobbyService.deleteLobby(id as string, ownerToken);
  if (!deleted) return res.status(403).json({ error: "Not lobby owner or lobby not found" });
  res.status(200).json({ deleted: true });
}