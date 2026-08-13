import { describe, expect, test } from "vitest";
import {
  combatBeepSpec,
  shouldPlayCombatSfx,
  createCombatPlayer,
  playMelee,
  playHit,
  playGun,
} from "../src/audio/combatPlayer";

describe("combatBeepSpec", () => {
  test("melee → 200Hz square 80ms", () => {
    expect(combatBeepSpec("melee")).toEqual({
      hz: 200,
      type: "square",
      durationSec: 0.08,
    });
  });

  test("hit → 90Hz triangle 100ms", () => {
    expect(combatBeepSpec("hit")).toEqual({
      hz: 90,
      type: "triangle",
      durationSec: 0.1,
    });
  });

  test("gun → 400Hz saw 60ms", () => {
    expect(combatBeepSpec("gun")).toEqual({
      hz: 400,
      type: "sawtooth",
      durationSec: 0.06,
    });
  });
});

describe("shouldPlayCombatSfx", () => {
  test("unmuted → true", () => {
    expect(shouldPlayCombatSfx(false)).toBe(true);
  });

  test("muted → false", () => {
    expect(shouldPlayCombatSfx(true)).toBe(false);
  });
});

describe("createCombatPlayer / play* (headless)", () => {
  test("sin window AudioContext → ctx null; lazy no abre; play no rompe", () => {
    const player = createCombatPlayer();
    expect(player.ctx).toBeNull();

    playMelee(player, false);
    playHit(player, false);
    playGun(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createCombatPlayer();
    playMelee(player, true);
    playHit(player, true);
    playGun(player, true);
    expect(player.ctx).toBeNull();
    expect(shouldPlayCombatSfx(true)).toBe(false);
  });
});
