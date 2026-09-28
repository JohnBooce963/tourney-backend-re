import { randomUUID } from "node:crypto";
import { HttpError } from "@/libs/http";
import { publish } from "@/libs/sse";
import { db } from "./db-service";
import { Draft } from "./draft";

const TURN_MS = 90_000;
const RESULT_MS = 10 * 60_000; // finished drafts stay viewable this long, then the lobby closes
const IDLE_MS = 60 * 60_000; // untouched lobbies are removed after this
const MAX_LOBBIES = 50;

type Seat = { name: string; token: string } | null;

type Lobby = {
  id: string;
  name: string;
  theme: number;
  ownerToken: string;
  seats: [Seat, Seat];
  draft: Draft | null;
  turnEndsAt: number;
  closesAt: number;
  timer?: ReturnType<typeof setTimeout>;
  rev: number;
  touched: number;
};

// ponytail: state lives in memory, so it needs one long-running process and a restart clears lobbies.
// Persist lobbies to Postgres if drafts must survive deploys.
class LobbyService {
  private lobbies = new Map<string, Lobby>();
  private lastList = "";

  constructor() {
    setInterval(() => {
      for (const l of this.lobbies.values()) if (Date.now() - l.touched > IDLE_MS) this.remove(l);
    }, 5 * 60_000).unref();
  }

  list() {
    return [...this.lobbies.values()].map(summary);
  }

  view(id: string) {
    const l = this.get(id);
    const d = l.draft;
    return {
      ...summary(l),
      rev: l.rev,
      serverNow: Date.now(),
      closesAt: l.closesAt || null,
      draft: d && { step: d.step, turn: d.turn, selected: d.selected, slots: d.slots, turnEndsAt: l.turnEndsAt },
    };
  }

  async create(name: string, theme: number) {
    if (this.lobbies.size >= MAX_LOBBIES) throw new HttpError(503, "Too many open lobbies, try again later");
    if (!Number.isInteger(theme) || !(await db.squads(theme)).length) throw new HttpError(400, "Unknown theme");
    const l: Lobby = {
      id: randomUUID(), name, theme, ownerToken: randomUUID(),
      seats: [null, null], draft: null, turnEndsAt: 0, closesAt: 0, rev: 0, touched: Date.now(),
    };
    this.lobbies.set(l.id, l);
    this.changed(l);
    return { id: l.id, ownerToken: l.ownerToken };
  }

  join(id: string, name: string, slot: number) {
    const l = this.waiting(id);
    if (slot !== 0 && slot !== 1) throw new HttpError(400, "Slot must be 0 or 1");
    if (l.seats[slot]) throw new HttpError(409, "That seat is taken");
    const token = randomUUID();
    l.seats[slot] = { name, token };
    this.changed(l);
    return { slot, playerToken: token };
  }

  leave(id: string, token: string) {
    const l = this.waiting(id);
    l.seats[this.seatOf(l, token)] = null;
    this.changed(l);
  }

  close(id: string, token: string) {
    const l = this.get(id);
    if (token !== l.ownerToken) throw new HttpError(403, "Only the lobby owner can delete it");
    this.remove(l);
  }

  flip(id: string, token: string) {
    const l = this.get(id);
    this.member(l, token);
    publish(`lobby:${id}`, "coin", { result: Math.random() < 0.5 ? 0 : 1 });
  }

  async start(id: string, token: string) {
    const [squads, ops] = await Promise.all([db.squads(this.get(id).theme), db.operators()]);
    const l = this.waiting(id); // validate after the await: the lobby may have changed meanwhile
    this.member(l, token);
    if (!l.seats[0] || !l.seats[1]) throw new HttpError(409, "Both seats must be filled");
    l.draft = new Draft({ squad: squads.map((s) => s.id), op: ops.map((o) => o.id) });
    this.nextTurn(l);
  }

  select(id: string, token: string, item: string) {
    const l = this.get(id);
    this.drafting(l).select(this.seatOf(l, token), item);
    this.changed(l);
  }

  confirm(id: string, token: string, item: string) {
    const l = this.get(id);
    this.drafting(l).confirm(this.seatOf(l, token), item);
    this.nextTurn(l);
  }

  get(id: string) {
    const l = this.lobbies.get(id);
    if (!l) throw new HttpError(404, "Lobby not found");
    return l;
  }

  private nextTurn(l: Lobby) {
    clearTimeout(l.timer);
    if (l.draft!.turn) {
      l.turnEndsAt = Date.now() + TURN_MS;
      l.timer = setTimeout(() => {
        l.draft!.timeout();
        this.nextTurn(l);
      }, TURN_MS);
    } else {
      l.turnEndsAt = 0;
      l.closesAt = Date.now() + RESULT_MS;
      l.timer = setTimeout(() => this.remove(l), RESULT_MS);
    }
    this.changed(l);
  }

  private remove(l: Lobby) {
    clearTimeout(l.timer);
    if (!this.lobbies.delete(l.id)) return;
    publish(`lobby:${l.id}`, "deleted", {});
    this.publishList();
  }

  private changed(l: Lobby) {
    l.rev++;
    l.touched = Date.now();
    publish(`lobby:${l.id}`, "state", this.view(l.id));
    this.publishList();
  }

  // The list only changes on joins, leaves and status changes, so skip identical re-sends.
  private publishList() {
    const list = this.list();
    const json = JSON.stringify(list);
    if (json !== this.lastList) publish("lobbies", "lobbies", list);
    this.lastList = json;
  }

  private waiting(id: string) {
    const l = this.get(id);
    if (l.draft) throw new HttpError(409, "The draft has already started");
    return l;
  }

  private drafting(l: Lobby) {
    if (!l.draft) throw new HttpError(409, "The draft hasn't started");
    return l.draft;
  }

  private seatOf(l: Lobby, token: string) {
    const i = l.seats.findIndex((s) => s && s.token === token);
    if (i < 0) throw new HttpError(403, "You don't have a seat in this lobby");
    return i;
  }

  private member(l: Lobby, token: string) {
    if (token !== l.ownerToken && !l.seats.some((s) => s?.token === token)) {
      throw new HttpError(403, "Only the owner or seated players can do that");
    }
  }
}

function summary(l: Lobby) {
  return {
    id: l.id,
    name: l.name,
    theme: l.theme,
    players: l.seats.map((s) => s?.name ?? null),
    status: !l.draft ? "waiting" : l.draft.turn ? "drafting" : "done",
  };
}

const g = globalThis as unknown as { lobbyService?: LobbyService };
export const lobbies = (g.lobbyService ??= new LobbyService());
