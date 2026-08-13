import { describe, expect, test } from "vitest";
import {
  speechBeepSpec,
  shouldPlaySpeechSfx,
  createSpeechPlayer,
  playSpeech,
} from "../src/audio/speechPlayer";

describe("speechBeepSpec", () => {
  test("240Hz sine + 480Hz harmonic, 120ms, gain ~0.07", () => {
    expect(speechBeepSpec()).toEqual({
      hz: 240,
      harmonicHz: 480,
      type: "sine",
      durationSec: 0.12,
      gain: 0.07,
    });
  });
});

describe("shouldPlaySpeechSfx", () => {
  test("unmuted → true", () => {
    expect(shouldPlaySpeechSfx(false)).toBe(true);
  });

  test("muted → false", () => {
    expect(shouldPlaySpeechSfx(true)).toBe(false);
  });
});

describe("createSpeechPlayer / playSpeech (headless)", () => {
  test("sin window AudioContext → ctx null; lazy no abre; play no rompe", () => {
    const player = createSpeechPlayer();
    expect(player.ctx).toBeNull();

    playSpeech(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createSpeechPlayer();
    playSpeech(player, true);
    expect(player.ctx).toBeNull();
    expect(shouldPlaySpeechSfx(true)).toBe(false);
  });
});
