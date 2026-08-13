import { describe, expect, test } from "vitest";
import {
  interactBeepSpec,
  shouldPlayInteractSfx,
  createInteractPlayer,
  playDoor,
  playLoot,
  playUse,
} from "../src/audio/interactPlayer";

describe("interactBeepSpec", () => {
  test("door → 140Hz square 90ms", () => {
    expect(interactBeepSpec("door")).toEqual({
      hz: 140,
      type: "square",
      durationSec: 0.09,
    });
  });

  test("loot → 520Hz sine 70ms", () => {
    expect(interactBeepSpec("loot")).toEqual({
      hz: 520,
      type: "sine",
      durationSec: 0.07,
    });
  });

  test("use → 300Hz triangle 80ms", () => {
    expect(interactBeepSpec("use")).toEqual({
      hz: 300,
      type: "triangle",
      durationSec: 0.08,
    });
  });
});

describe("shouldPlayInteractSfx", () => {
  test("unmuted → true", () => {
    expect(shouldPlayInteractSfx(false)).toBe(true);
  });

  test("muted → false", () => {
    expect(shouldPlayInteractSfx(true)).toBe(false);
  });
});

describe("createInteractPlayer / play* (headless)", () => {
  test("sin window AudioContext → ctx null; lazy no abre; play no rompe", () => {
    const player = createInteractPlayer();
    expect(player.ctx).toBeNull();

    playDoor(player, false);
    playLoot(player, false);
    playUse(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createInteractPlayer();
    playDoor(player, true);
    playLoot(player, true);
    playUse(player, true);
    expect(player.ctx).toBeNull();
    expect(shouldPlayInteractSfx(true)).toBe(false);
  });
});
