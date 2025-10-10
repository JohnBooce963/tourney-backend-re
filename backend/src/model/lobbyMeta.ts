export interface LobbyMeta{
  id: string;
  name: string;
  theme: number;
  players: Record<number, string | null>;
  ownerToken: string;
}