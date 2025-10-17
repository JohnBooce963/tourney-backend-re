import Ably from "ably";

const ably = new Ably.Rest(`${process.env.ABLY_API_KEY}`);

export const publishLobbies = async (data: any) => {
  await ably.channels.get("lobbies").publish("lobbies", data);
};

export const publishLobbyUpdate = async (lobbyId: string, data: any) => {
  await ably.channels.get(`lobby-${lobbyId}`).publish("lobbyUpdate", data);
};

export const publishCoinFlip = async (lobbyId: string, data: any) => {
  await ably.channels.get(`lobby-${lobbyId}`).publish("coinFlip", data);
}

export const publishStartGame = async (lobbyId: string) => {
  await ably.channels.get(`lobby-${lobbyId}`).publish("start", { message: "Game started" });
}

// export const publishTheme = async (lobbyId: string, data: any) => {
//   await ably.channels.get(`draft-${lobbyId}-update`).publish("theme", data);
// }

export const publishStatus = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("status", data);
}

export const publishSelectOp = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("selectOp", data);
}

export const publishSelectSquad = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("selectSquad", data);
}

export const publishBannedSquads = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("bannedSquad", data);
}

export const publishBannedOps = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("bannedOps", data);
}

export const publishPickedOps = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("picked", data);
}

export const publishEndDraft = async (lobbyId: string, data: any) => {
  await ably.channels.get(`draft-${lobbyId}-update`).publish("end", data);
}