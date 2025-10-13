import Ably from "ably";

const ably = new Ably.Rest("4PXB0g.W0QHPw:XfNx7O8M7NKk_ey2jj_CS3ZIhWbg1-s5e8hnF-rnLkQ");

export const publishLobbies = async (data: any) => {
  await ably.channels.get("lobbies").publish("lobbies", data);
};

export const publishLobbyUpdate = async (lobbyId: string, data: any) => {
  await ably.channels.get(`lobby-${lobbyId}`).publish("lobbyUpdate", data);
};

export const publishLobbyDelete = async (lobbyId: string) => {
  await ably.channels.get(`lobbyDelete`).publish("lobbyDelete", lobbyId);
};