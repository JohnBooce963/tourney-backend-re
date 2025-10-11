import Ably from "ably";

const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY! });;

export const publishLobbies = (data: any) => {
  ably.channels.get("lobbies").publish("lobbies", data);
};

export const publishLobbyUpdate = (lobbyId: string, data: any) => {
  ably.channels.get(`lobby-${lobbyId}`).publish("lobbyUpdate", data);
};