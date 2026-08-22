import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  speechBeepSpec,
  shouldPlaySpeechSfx,
  createSpeechPlayer,
  speechBeepsAfterRestart,
  speechPlayerScheduled,
  resetSpeechPlayerAfterRestart,
  playSpeech,
  type SpeechPlayer,
  type SpeechVoice,
} from "../src/audio/speechPlayer";
import {
  createAmbientBus,
  toggleAmbientMute,
} from "../src/audio/ambientStub";

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
    expect(player.voices).toEqual([]);

    playSpeech(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createSpeechPlayer();
    playSpeech(player, true);
    expect(player.ctx).toBeNull();
    expect(speechPlayerScheduled(player)).toBe(0);
    expect(shouldPlaySpeechSfx(true)).toBe(false);
  });
});

function mockParam(value: number) {
  return {
    value,
    cancelScheduledValues() {},
    setValueAtTime(v: number) {
      this.value = v;
    },
  };
}

function leftoverVoice(gainValue = 0.07): SpeechVoice {
  let stopCalls = 0;
  let harmStopCalls = 0;
  return {
    osc: {
      get stopCalls() {
        return stopCalls;
      },
      stop() {
        stopCalls += 1;
      },
      disconnect() {},
    } as unknown as OscillatorNode,
    harmonicOsc: {
      get stopCalls() {
        return harmStopCalls;
      },
      stop() {
        harmStopCalls += 1;
      },
      disconnect() {},
    } as unknown as OscillatorNode,
    gain: {
      gain: mockParam(gainValue),
      disconnect() {},
    } as unknown as GainNode,
  };
}

function playerWithLeftover(count: number): SpeechPlayer {
  return {
    ctx: null,
    voices: Array.from({ length: count }, () => leftoverVoice()),
  };
}

describe("resetSpeechPlayerAfterRestart (R / softReset)", () => {
  test("reinicio corta beep leftover; sine previo no filtra el barrio nuevo", () => {
    const boot = createSpeechPlayer();
    expect(boot.ctx).toBeNull();
    expect(boot.voices).toEqual([]);
    expect(speechPlayerScheduled(boot)).toBe(0);
    expect(speechBeepsAfterRestart()).toBe(0);

    playSpeech(boot, false);
    expect(boot.ctx).toBeNull();
    expect(speechPlayerScheduled(boot)).toBe(1);
    expect(speechBeepSpec()).toEqual({
      hz: 240,
      harmonicHz: 480,
      type: "sine",
      durationSec: 0.12,
      gain: 0.07,
    });
    expect(speechPlayerScheduled(boot)).not.toBe(speechBeepsAfterRestart());

    resetSpeechPlayerAfterRestart(boot);
    expect(speechPlayerScheduled(boot)).toBe(speechBeepsAfterRestart());
    expect(boot.voices).toEqual([]);
    expect(boot.ctx).toBeNull();

    const leftover = playerWithLeftover(1);
    const fundOsc = leftover.voices[0]?.osc as unknown as { stopCalls: number };
    const harmOsc = leftover.voices[0]?.harmonicOsc as unknown as {
      stopCalls: number;
    };
    const fundGain = leftover.voices[0]?.gain?.gain;
    expect(fundOsc.stopCalls).toBe(0);
    expect(harmOsc.stopCalls).toBe(0);
    expect(fundGain?.value).toBe(0.07);

    resetSpeechPlayerAfterRestart(leftover);
    expect(speechPlayerScheduled(leftover)).toBe(speechBeepsAfterRestart());
    expect(fundOsc.stopCalls).toBe(1);
    expect(harmOsc.stopCalls).toBe(1);
    expect(fundGain?.value).toBe(0);
    expect(leftover.ctx).toBeNull();

    const lazy = createSpeechPlayer();
    resetSpeechPlayerAfterRestart(lazy);
    expect(lazy.ctx).toBeNull();
    expect(lazy.voices).toEqual([]);
    expect(speechPlayerScheduled(lazy)).toBe(0);
  });

  test("muted se preserva; tick vivo / playSpeech no usa el helper (igual que hoy)", () => {
    const bus = createAmbientBus();
    bus.muted = true;
    const player = playerWithLeftover(1);
    expect(speechPlayerScheduled(player)).toBe(1);

    resetSpeechPlayerAfterRestart(player);
    expect(bus.muted).toBe(true);
    expect(speechPlayerScheduled(player)).toBe(speechBeepsAfterRestart());
    expect(toggleAmbientMute(bus)).toBe(false);
    resetSpeechPlayerAfterRestart(player);
    expect(bus.muted).toBe(false);
    expect(speechPlayerScheduled(player)).toBe(0);

    const live = createSpeechPlayer();
    playSpeech(live, false);
    expect(live.ctx).toBeNull();
    expect(speechPlayerScheduled(live)).toBe(1);
    expect(shouldPlaySpeechSfx(false)).toBe(true);
  });

  test("Game softReset usa helper; F9 load no toca player; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetSpeechPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}resetSpeechPlayerAfterRestart\(this\.speechPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /resetInteractPlayerAfterRestart\(this\.interactPlayer\);[\s\S]{0,240}resetSpeechPlayerAfterRestart\(this\.speechPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetSpeechPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetSpeechPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetSpeechPlayerAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
  });
});
