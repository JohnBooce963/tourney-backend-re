import { test } from "node:test";
import assert from "node:assert/strict";
import { Draft, ORDER } from "./draft";

const pool = { squad: ["s1", "s2", "s3"], op: Array.from({ length: 20 }, (_, i) => `op${i}`) };

test("full draft follows the turn order and fills every slot", () => {
  const d = new Draft(pool);
  for (const [phase, index] of ORDER) {
    const player = d.turn!.player;
    assert.equal(d.turn!.phase, phase);
    assert.equal(player, index % 2);
    assert.throws(() => d.confirm(1 - player, d.available()[0]), /not your turn/);
    d.confirm(player, d.available()[0]);
  }
  assert.equal(d.turn, null);
  assert.deepEqual(d.slots.squad, ["s1", "s2"]);
  assert.ok(![...d.slots.ban, ...d.slots.pick].includes(""));
  assert.equal(new Set([...d.slots.ban, ...d.slots.pick]).size, 16);
});

test("banned or picked operators and wrong-phase items are rejected", () => {
  const d = new Draft(pool);
  assert.throws(() => d.confirm(0, "op0"), /isn't available/); // operator during squad ban
  d.confirm(0, "s1");
  assert.throws(() => d.confirm(1, "s1"), /isn't available/); // already banned squad
  d.confirm(1, "s2");
  d.confirm(1, "op0");
  assert.throws(() => d.confirm(0, "op0"), /isn't available/); // already banned operator
});

test("timeout keeps a valid selection, otherwise picks randomly, and never stalls", () => {
  const d = new Draft(pool, () => 0);
  d.select(0, "s3");
  d.timeout();
  assert.equal(d.slots.squad[0], "s3");
  d.timeout();
  assert.equal(d.slots.squad[1], "s1");

  const empty = new Draft({ squad: [], op: [] });
  for (let i = 0; i < ORDER.length; i++) empty.timeout();
  assert.equal(empty.turn, null);
});
