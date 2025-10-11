import Ably from "ably";

const ably = new Ably.Rest("4PXB0g.W0QHPw:XfNx7O8M7NKk_ey2jj_CS3ZIhWbg1-s5e8hnF-rnLkQ");

export const publishLobbies = (data: any) => {
  ably.channels.get("lobbies").publish("lobbies", data);
};

export const publishLobbyUpdate = (lobbyId: string, data: any) => {
  ably.channels.get(`lobby-${lobbyId}`).publish("lobbyUpdate", data);
};