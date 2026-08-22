import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  computeLayerGain,
  shouldBeSilent,
  createAmbientPlayer,
  ambientPlayerGainsAfterRestart,
  ambientPlayerVoiceGains,
  resetAmbientPlayerAfterRestart,
  syncAmbientPlayer,
  GAIN_RAMP_SEC,
  type AmbientPlayer,
} from "../src/audio/ambientPlayer";
import {
  createAmbientBus,
  resetAmbientAfterRestart,
  tickAmbient,
  ambientLevels,
  toggleAmbientMute,
  type AmbientLevels,
  type AmbientState,
} from "../src/audio/ambientStub";

const quiet: AmbientState = {
  raining: false,
  isNight: false,
  indoor: false,
  threatNearby: false,
};

const loud: AmbientState = {
  raining: true,
  isNight: true,
  indoor: true,
  threatNearby: true,
};

function settle(
  bus: ReturnType<typeof createAmbientBus>,
  state: AmbientState,
  seconds = 2,
): void {
  const steps = 20;
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) tickAmbient(bus, state, dt);
}

describe("computeLayerGain", () => {
  test("muted → 0 aunque level sea 1", () => {
    expect(computeLayerGain("rain", 1, true)).toBe(0);
    expect(computeLayerGain("night", 0.8, true)).toBe(0);
    expect(computeLayerGain("indoor", 0.5, true)).toBe(0);
    expect(computeLayerGain("threat", 1, true)).toBe(0);
  });

  test("level 0 / inválido → 0", () => {
    expect(computeLayerGain("rain", 0, false)).toBe(0);
    expect(computeLayerGain("night", -0.2, false)).toBe(0);
    expect(computeLayerGain("indoor", NaN, false)).toBe(0);
    expect(computeLayerGain("threat", Infinity, false)).toBe(0);
  });

  test("level positivo → gain > 0 y escala lineal", () => {
    const full = computeLayerGain("rain", 1, false);
    const half = computeLayerGain("rain", 0.5, false);
    expect(full).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(full);
    expect(half).toBeCloseTo(full * 0.5, 8);
  });
});

describe("shouldBeSilent", () => {
  test("muted → true aunque haya niveles", () => {
    expect(
      shouldBeSilent({ rain: 1, night: 1, indoor: 1, threat: 1 }, true),
    ).toBe(true);
  });

  test("todos 0 → true", () => {
    expect(
      shouldBeSilent({ rain: 0, night: 0, indoor: 0, threat: 0 }, false),
    ).toBe(true);
  });

  test("cualquier capa > 0 → false", () => {
    expect(
      shouldBeSilent({ rain: 0.2, night: 0, indoor: 0, threat: 0 }, false),
    ).toBe(false);
    expect(
      shouldBeSilent({ rain: 0, night: 0.3, indoor: 0, threat: 0 }, false),
    ).toBe(false);
  });
});

describe("createAmbientPlayer / syncAmbientPlayer (headless)", () => {
  test("sin window AudioContext → ctx null; lazy no abre; sync no rompe", () => {
    const player = createAmbientPlayer();
    expect(player.ctx).toBeNull();
    expect(player.voices).toBeNull();

    const bus = createAmbientBus();
    settle(bus, loud);
    expect(ambientLevels(bus).rain).toBeGreaterThan(0);
    expect(shouldBeSilent(ambientLevels(bus), bus.muted)).toBe(false);

    syncAmbientPlayer(player, bus);
    expect(player.ctx).toBeNull();
    expect(player.voices).toBeNull();
  });

  test("silencio / mute → no crea ctx; gains lógicos 0", () => {
    const player = createAmbientPlayer();
    const quietBus = createAmbientBus();
    settle(quietBus, quiet);
    expect(shouldBeSilent(ambientLevels(quietBus), quietBus.muted)).toBe(true);
    syncAmbientPlayer(player, quietBus);
    expect(player.ctx).toBeNull();

    const muted = createAmbientBus();
    settle(muted, loud);
    muted.muted = true;
    expect(shouldBeSilent(ambientLevels(muted), muted.muted)).toBe(true);
    for (const layer of ["rain", "night", "indoor", "threat"] as const) {
      expect(computeLayerGain(layer, muted.levels[layer], muted.muted)).toBe(0);
    }
    syncAmbientPlayer(player, muted);
    expect(player.ctx).toBeNull();
  });
});

function mockParam(value: number) {
  return {
    value,
    cancelScheduledValues() {},
    setValueAtTime(v: number) {
      this.value = v;
    },
    linearRampToValueAtTime() {},
  };
}

function playerWithVoiceGains(gains: AmbientLevels): AmbientPlayer {
  return {
    ctx: null,
    voices: {
      rain: { gain: { gain: mockParam(gains.rain) } },
      night: { gain: { gain: mockParam(gains.night) } },
      indoor: { gain: { gain: mockParam(gains.indoor) } },
      threat: { gain: { gain: mockParam(gains.threat) } },
    } as AmbientPlayer["voices"],
  };
}

function rampFrom(from: number, to: number, t: number, dur: number): number {
  if (t <= 0) return from;
  if (t >= dur) return to;
  return from + (to - from) * (t / dur);
}

describe("resetAmbientPlayerAfterRestart (R / softReset)", () => {
  test("reinicio → voices 0; night/threat previo no filtra el drizzle nuevo", () => {
    const boot = createAmbientPlayer();
    expect(boot.ctx).toBeNull();
    expect(boot.voices).toBeNull();
    expect(ambientPlayerVoiceGains(boot)).toBeNull();
    expect(ambientPlayerGainsAfterRestart()).toEqual({
      rain: 0,
      night: 0,
      indoor: 0,
      threat: 0,
    });

    const leftoverNight = computeLayerGain("night", 1, false);
    const leftoverIndoor = computeLayerGain("indoor", 1, false);
    const leftoverThreat = computeLayerGain("threat", 1, false);
    const leftoverRain = computeLayerGain("rain", 0.22, false);
    expect(leftoverNight).toBeGreaterThan(0);
    expect(leftoverIndoor).toBeGreaterThan(0);
    expect(leftoverThreat).toBeGreaterThan(0);
    expect(GAIN_RAMP_SEC).toBe(0.08);

    const player = playerWithVoiceGains({
      rain: leftoverRain,
      night: leftoverNight,
      indoor: leftoverIndoor,
      threat: leftoverThreat,
    });
    expect(ambientPlayerVoiceGains(player)).toEqual({
      rain: leftoverRain,
      night: leftoverNight,
      indoor: leftoverIndoor,
      threat: leftoverThreat,
    });

    resetAmbientPlayerAfterRestart(player);
    const snapped = ambientPlayerVoiceGains(player);
    expect(snapped).toEqual(ambientPlayerGainsAfterRestart());
    expect(snapped?.night).toBe(0);
    expect(snapped?.indoor).toBe(0);
    expect(snapped?.threat).toBe(0);
    expect(snapped?.rain).toBe(0);
    expect(snapped?.night).not.toBe(leftoverNight);
    expect(snapped?.threat).not.toBe(leftoverThreat);

    const drizzleRain = computeLayerGain("rain", 0.9, false);
    expect(rampFrom(leftoverNight, drizzleRain, 0, GAIN_RAMP_SEC)).toBe(
      leftoverNight,
    );
    expect(rampFrom(leftoverThreat, 0, 0, GAIN_RAMP_SEC)).toBe(leftoverThreat);
    expect(rampFrom(0, drizzleRain, 0, GAIN_RAMP_SEC)).toBe(0);
    expect(rampFrom(0, drizzleRain, 0, GAIN_RAMP_SEC)).not.toBe(leftoverNight);
    expect(rampFrom(0, drizzleRain, 0, GAIN_RAMP_SEC)).not.toBe(leftoverThreat);

    const lazy = createAmbientPlayer();
    resetAmbientPlayerAfterRestart(lazy);
    expect(lazy.ctx).toBeNull();
    expect(lazy.voices).toBeNull();
    expect(ambientPlayerVoiceGains(lazy)).toBeNull();
  });

  test("muted se preserva; tick vivo / sync no usa el helper (igual que hoy)", () => {
    const bus = createAmbientBus();
    bus.muted = true;
    bus.levels = { rain: 0.9, night: 0.45, indoor: 0.4, threat: 0.6 };
    const leftover = computeLayerGain("threat", 1, false);
    const player = playerWithVoiceGains({
      rain: leftover,
      night: leftover,
      indoor: leftover,
      threat: leftover,
    });

    resetAmbientAfterRestart(bus);
    resetAmbientPlayerAfterRestart(player);
    expect(bus.muted).toBe(true);
    expect(ambientPlayerVoiceGains(player)).toEqual(
      ambientPlayerGainsAfterRestart(),
    );
    expect(toggleAmbientMute(bus)).toBe(false);
    resetAmbientPlayerAfterRestart(player);
    expect(bus.muted).toBe(false);
    expect(ambientPlayerVoiceGains(player)).toEqual({
      rain: 0,
      night: 0,
      indoor: 0,
      threat: 0,
    });

    const live = createAmbientPlayer();
    const liveBus = createAmbientBus();
    settle(liveBus, loud);
    expect(ambientLevels(liveBus).night).toBeGreaterThan(0);
    syncAmbientPlayer(live, liveBus);
    expect(live.ctx).toBeNull();
    expect(live.voices).toBeNull();
    expect(ambientPlayerVoiceGains(live)).toBeNull();
  });

  test("Game softReset usa helper; F9 load no toca player; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetAmbientPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2000}resetAmbientPlayerAfterRestart\(this\.ambientPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /resetAmbientAfterRestart\(this\.ambient\);[\s\S]{0,240}resetAmbientPlayerAfterRestart\(this\.ambientPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetAmbientPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetAmbientPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetAmbientPlayerAfterRestart/,
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
