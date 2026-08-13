import { describe, expect, test } from "vitest";
import {
  combatBeepSpec,
  shouldPlayCombatSfx,
  createCombatPlayer,
  playMelee,
  playHit,
  playGun,
  playDryFire,
} from "../src/audio/combatPlayer";

describe("combatBeepSpec", () => {
  test("melee → 200Hz square 80ms, gain 0.09", () => {
    expect(combatBeepSpec("melee")).toEqual({
      hz: 200,
      type: "square",
      durationSec: 0.08,
      gain: 0.09,
    });
  });

  test("hit → 90Hz triangle 100ms, gain 0.09", () => {
    expect(combatBeepSpec("hit")).toEqual({
      hz: 90,
      type: "triangle",
      durationSec: 0.1,
      gain: 0.09,
    });
  });

  test("gun → 400Hz saw 60ms, gain 0.09", () => {
    expect(combatBeepSpec("gun")).toEqual({
      hz: 400,
      type: "sawtooth",
      durationSec: 0.06,
      gain: 0.09,
    });
  });

  test("dry → 1100Hz square 35ms, gain 0.06", () => {
    expect(combatBeepSpec("dry")).toEqual({
      hz: 1100,
      type: "square",
      durationSec: 0.035,
      gain: 0.06,
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
    playDryFire(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createCombatPlayer();
    playMelee(player, true);
    playHit(player, true);
    playGun(player, true);
    playDryFire(player, true);
    expect(player.ctx).toBeNull();
    expect(shouldPlayCombatSfx(true)).toBe(false);
  });
});
