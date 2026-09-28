import { HttpError } from "../libs/http";

export type Phase = "squad" | "ban" | "pick";

// Turn order as [phase, slot index]. Even slot index = Player 1, odd = Player 2.
export const ORDER: [Phase, number][] = [
  ["squad", 0], ["squad", 1],
  ["ban", 1], ["ban", 0], ["ban", 2], ["ban", 3], ["ban", 5], ["ban", 4],
  ["pick", 0], ["pick", 1], ["pick", 3], ["pick", 2], ["pick", 4],
  ["pick", 5], ["pick", 7], ["pick", 6], ["pick", 8], ["pick", 9],
];

// Pure ban/pick state machine. No timers or I/O, so it is easy to test.
export class Draft {
  step = 0;
  selected = "";
  slots: Record<Phase, string[]> = { squad: ["", ""], ban: Array(6).fill(""), pick: Array(10).fill("") };

  constructor(private pool: { squad: string[]; op: string[] }, private random = Math.random) {}

  get turn() {
    const s = ORDER[this.step];
    return s ? { phase: s[0], index: s[1], player: s[1] % 2 } : null;
  }

  available(): string[] {
    const t = this.turn;
    if (!t) return [];
    if (t.phase === "squad") return this.pool.squad.filter((id) => !this.slots.squad.includes(id));
    return this.pool.op.filter(
      (id) => !this.slots.ban.includes(id) && (t.phase === "ban" || !this.slots.pick.includes(id)),
    );
  }

  select(player: number, id: string) {
    this.check(player, id);
    this.selected = id;
  }

  confirm(player: number, id: string) {
    this.check(player, id);
    this.commit(id);
  }

  // Turn timer ran out: keep the player's highlighted choice if still valid, else pick at random.
  timeout() {
    const options = this.available();
    this.commit(options.includes(this.selected) ? this.selected : options[Math.floor(this.random() * options.length)] ?? "");
  }

  private check(player: number, id: string) {
    const t = this.turn;
    if (!t) throw new HttpError(409, "Draft is already finished");
    if (t.player !== player) throw new HttpError(403, "It's not your turn");
    if (!this.available().includes(id)) throw new HttpError(400, "That choice isn't available");
  }

  private commit(id: string) {
    const t = this.turn!;
    this.slots[t.phase][t.index] = id;
    this.selected = "";
    this.step++;
  }
}
