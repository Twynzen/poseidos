import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  interactBeepSpec,
  shouldPlayInteractSfx,
  createInteractPlayer,
  interactBeepsAfterRestart,
  interactPlayerScheduled,
  resetInteractPlayerAfterRestart,
  playDoor,
  playLoot,
  playUse,
  type InteractPlayer,
  type InteractVoice,
} from "../src/audio/interactPlayer";
import {
  createAmbientBus,
  toggleAmbientMute,
} from "../src/audio/ambientStub";

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
    expect(player.voices).toEqual([]);

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
    expect(interactPlayerScheduled(player)).toEqual([]);
    expect(shouldPlayInteractSfx(true)).toBe(false);
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

function leftoverVoice(kind: InteractVoice["kind"], gainValue = 0.09): InteractVoice {
  let stopCalls = 0;
  return {
    kind,
    osc: {
      get stopCalls() {
        return stopCalls;
      },
      stop() {
        stopCalls += 1;
      },
      disconnect() {},
    } as unknown as OscillatorNode,
    gain: {
      gain: mockParam(gainValue),
      disconnect() {},
    } as unknown as GainNode,
  };
}

function playerWithLeftover(kinds: InteractVoice["kind"][]): InteractPlayer {
  return {
    ctx: null,
    voices: kinds.map((kind) => leftoverVoice(kind)),
  };
}

describe("resetInteractPlayerAfterRestart (R / softReset)", () => {
  test("reinicio corta beep leftover; door/loot/use previo no filtra el barrio nuevo", () => {
    const boot = createInteractPlayer();
    expect(boot.ctx).toBeNull();
    expect(boot.voices).toEqual([]);
    expect(interactPlayerScheduled(boot)).toEqual([]);
    expect(interactBeepsAfterRestart()).toEqual([]);

    playDoor(boot, false);
    playLoot(boot, false);
    playUse(boot, false);
    expect(boot.ctx).toBeNull();
    expect(interactPlayerScheduled(boot)).toEqual(["door", "loot", "use"]);
    expect(interactBeepSpec("door")).toEqual({
      hz: 140,
      type: "square",
      durationSec: 0.09,
    });
    expect(interactPlayerScheduled(boot)).not.toEqual(interactBeepsAfterRestart());

    resetInteractPlayerAfterRestart(boot);
    expect(interactPlayerScheduled(boot)).toEqual(interactBeepsAfterRestart());
    expect(boot.voices).toEqual([]);
    expect(boot.ctx).toBeNull();

    const leftover = playerWithLeftover(["door", "loot"]);
    const doorOsc = leftover.voices[0]?.osc as unknown as { stopCalls: number };
    const doorGain = leftover.voices[0]?.gain?.gain;
    expect(doorOsc.stopCalls).toBe(0);
    expect(doorGain?.value).toBe(0.09);

    resetInteractPlayerAfterRestart(leftover);
    expect(interactPlayerScheduled(leftover)).toEqual(interactBeepsAfterRestart());
    expect(doorOsc.stopCalls).toBe(1);
    expect(doorGain?.value).toBe(0);
    expect(leftover.ctx).toBeNull();

    const lazy = createInteractPlayer();
    resetInteractPlayerAfterRestart(lazy);
    expect(lazy.ctx).toBeNull();
    expect(lazy.voices).toEqual([]);
    expect(interactPlayerScheduled(lazy)).toEqual([]);
  });

  test("muted se preserva; tick vivo / play* no usa el helper (igual que hoy)", () => {
    const bus = createAmbientBus();
    bus.muted = true;
    const player = playerWithLeftover(["door"]);
    expect(interactPlayerScheduled(player)).toEqual(["door"]);

    resetInteractPlayerAfterRestart(player);
    expect(bus.muted).toBe(true);
    expect(interactPlayerScheduled(player)).toEqual(interactBeepsAfterRestart());
    expect(toggleAmbientMute(bus)).toBe(false);
    resetInteractPlayerAfterRestart(player);
    expect(bus.muted).toBe(false);
    expect(interactPlayerScheduled(player)).toEqual([]);

    const live = createInteractPlayer();
    playDoor(live, false);
    playLoot(live, false);
    expect(live.ctx).toBeNull();
    expect(interactPlayerScheduled(live)).toEqual(["door", "loot"]);
    expect(shouldPlayInteractSfx(false)).toBe(true);
  });

  test("Game softReset usa helper; F9 load no toca player; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetInteractPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,4100}resetInteractPlayerAfterRestart\(this\.interactPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /resetHeartbeatPlayerAfterRestart\(this\.heartbeatPlayer\);[\s\S]{0,240}resetInteractPlayerAfterRestart\(this\.interactPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetInteractPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetInteractPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetInteractPlayerAfterRestart/,
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
