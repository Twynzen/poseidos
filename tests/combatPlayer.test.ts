import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  combatBeepSpec,
  shouldPlayCombatSfx,
  createCombatPlayer,
  combatBeepsAfterRestart,
  combatPlayerScheduled,
  resetCombatPlayerAfterRestart,
  playMelee,
  playHit,
  playGun,
  playDryFire,
  type CombatPlayer,
  type CombatVoice,
} from "../src/audio/combatPlayer";
import {
  createAmbientBus,
  toggleAmbientMute,
} from "../src/audio/ambientStub";

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
    expect(player.voices).toEqual([]);

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
    expect(combatPlayerScheduled(player)).toEqual([]);
    expect(shouldPlayCombatSfx(true)).toBe(false);
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

function leftoverVoice(kind: CombatVoice["kind"], gainValue = 0.09): CombatVoice {
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

function playerWithLeftover(kinds: CombatVoice["kind"][]): CombatPlayer {
  return {
    ctx: null,
    voices: kinds.map((kind) => leftoverVoice(kind)),
  };
}

describe("resetCombatPlayerAfterRestart (R / softReset)", () => {
  test("reinicio corta beep leftover; hit/gun/melee previo no filtra el barrio nuevo", () => {
    const boot = createCombatPlayer();
    expect(boot.ctx).toBeNull();
    expect(boot.voices).toEqual([]);
    expect(combatPlayerScheduled(boot)).toEqual([]);
    expect(combatBeepsAfterRestart()).toEqual([]);

    playHit(boot, false);
    playGun(boot, false);
    playMelee(boot, false);
    expect(boot.ctx).toBeNull();
    expect(combatPlayerScheduled(boot)).toEqual(["hit", "gun", "melee"]);
    expect(combatBeepSpec("hit")).toEqual({
      hz: 90,
      type: "triangle",
      durationSec: 0.1,
      gain: 0.09,
    });
    expect(combatPlayerScheduled(boot)).not.toEqual(combatBeepsAfterRestart());

    resetCombatPlayerAfterRestart(boot);
    expect(combatPlayerScheduled(boot)).toEqual(combatBeepsAfterRestart());
    expect(boot.voices).toEqual([]);
    expect(boot.ctx).toBeNull();

    const leftover = playerWithLeftover(["hit", "gun"]);
    const hitOsc = leftover.voices[0]?.osc as unknown as { stopCalls: number };
    const hitGain = leftover.voices[0]?.gain?.gain;
    expect(hitOsc.stopCalls).toBe(0);
    expect(hitGain?.value).toBe(0.09);

    resetCombatPlayerAfterRestart(leftover);
    expect(combatPlayerScheduled(leftover)).toEqual(combatBeepsAfterRestart());
    expect(hitOsc.stopCalls).toBe(1);
    expect(hitGain?.value).toBe(0);
    expect(leftover.ctx).toBeNull();

    const lazy = createCombatPlayer();
    resetCombatPlayerAfterRestart(lazy);
    expect(lazy.ctx).toBeNull();
    expect(lazy.voices).toEqual([]);
    expect(combatPlayerScheduled(lazy)).toEqual([]);
  });

  test("muted se preserva; tick vivo / play* no usa el helper (igual que hoy)", () => {
    const bus = createAmbientBus();
    bus.muted = true;
    const player = playerWithLeftover(["hit"]);
    expect(combatPlayerScheduled(player)).toEqual(["hit"]);

    resetCombatPlayerAfterRestart(player);
    expect(bus.muted).toBe(true);
    expect(combatPlayerScheduled(player)).toEqual(combatBeepsAfterRestart());
    expect(toggleAmbientMute(bus)).toBe(false);
    resetCombatPlayerAfterRestart(player);
    expect(bus.muted).toBe(false);
    expect(combatPlayerScheduled(player)).toEqual([]);

    const live = createCombatPlayer();
    playHit(live, false);
    playGun(live, false);
    expect(live.ctx).toBeNull();
    expect(combatPlayerScheduled(live)).toEqual(["hit", "gun"]);
    expect(shouldPlayCombatSfx(false)).toBe(true);
  });

  test("Game softReset usa helper; F9 load no toca player; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetCombatPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}resetCombatPlayerAfterRestart\(this\.combatPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /this\.hotbarSelected = hotbarSelectedAfterRestart\(\);[\s\S]{0,240}resetCombatPlayerAfterRestart\(this\.combatPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetCombatPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetCombatPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetCombatPlayerAfterRestart/,
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
