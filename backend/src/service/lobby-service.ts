import EventEmitter from "events";
import { GameService } from "./game-service";
import { LobbyMeta } from "@/model/lobbyMeta";
import { publishLobbies, publishLobbyUpdate } from "@/service/ably-ws-service";

export const lobbyService = new (class extends EventEmitter {
  private lobbies: Map<string, LobbyMeta> = new Map();
  private gameServices: Map<string, GameService> = new Map();

  createLobby(name: string, theme: number) {
    const id = crypto.randomUUID();
    const ownerToken = crypto.randomUUID();
    const players = { 0: null, 1: null };

    const meta: LobbyMeta = { id, name, theme, players, ownerToken };
    this.lobbies.set(id, meta);

    const game = new GameService(id, theme);
    game.on("update", (state) => this.emit("gameUpdate", state));
    game.on("end", (lobbyId) => this.deleteLobby(lobbyId, ownerToken));
    this.gameServices.set(id, game);

    
    publishLobbyUpdate(id, this.getLobbyInfo(id));

    publishLobbies(this.getAllLobbies());

    return id;
  }

  joinLobby(lobbyId: string, playerName: string, slot: number) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    if (lobby.players[slot] !== null) throw new Error("Slot taken");
    lobby.players[slot] = playerName;

    publishLobbyUpdate(lobbyId, this.getLobbyInfo(lobbyId));

    publishLobbies(this.getAllLobbies());

    return lobby;
  }

  getLobbyInfo(lobbyId: string) {
    return this.lobbies.get(lobbyId) ?? null;
  }

  getAllLobbies() {
    return Array.from(this.lobbies.values());
  }

  getGameService(lobbyId: string) {
    return this.gameServices.get(lobbyId);
  }

  startGame(lobbyId: string) {
    const game = this.getGameService(lobbyId);
    if (!game) throw new Error("Game not found");
    game.startDraft();
  }

  cancelRole(lobbyId: string, slot: number) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    lobby.players[slot] = null;
    
    publishLobbyUpdate(lobbyId, this.getLobbyInfo(lobbyId));

    return lobby;
  }

  leaveLobby(lobbyId: string, playerName: string) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    for (const slot of [0, 1]) {
      if (lobby.players[slot] === playerName) lobby.players[slot] = null;
    }
    
    publishLobbyUpdate(lobbyId, this.getLobbyInfo(lobbyId));
    publishLobbies(this.getAllLobbies());

    return lobby;
  }

  flipCoin(lobbyId: string) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    return { lobbyId, result };
  }

  deleteLobby(lobbyId: string, token: string) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.ownerToken !== token) return false;
    this.lobbies.delete(lobbyId);
    this.gameServices.delete(lobbyId);

    publishLobbies(this.getAllLobbies());
    publishLobbyUpdate(lobbyId, { type: 'deleted' });

    return true;
  }
})();