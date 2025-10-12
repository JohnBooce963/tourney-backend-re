export interface LobbyMeta{
  id: string;
  name: string;
  theme: number;
  players: {
    [key: number]: string | null; 
  };
  ownerToken: string;
}