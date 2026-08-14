import { describe, expect, test } from "vitest";
import {
  AMBIENT_INTENSITY_GAIN,
  AMBIENT_INTENSITY_NIGHT,
  AMBIENT_NIGHT_B_ADD,
  AMBIENT_NIGHT_G_SUB,
  AMBIENT_NIGHT_R_SUB,
  AMBIENT_WARM_PUSH,
  ambientRgb,
  atmosphereFor,
  DAWN_TINT_B,
  DAWN_TINT_G,
  DAWN_TINT_R,
  DUSK_TINT_B,
  DUSK_TINT_G,
  DUSK_TINT_R,
  dawnWarmth,
  duskWarmth,
  FOG_FAR_DAY,
  FOG_FAR_NIGHT,
  FOG_NEAR_DAY,
  FOG_NEAR_NIGHT,
  fogNearFar,
  nightAmbientIntensity,
  nightSunIntensity,
  SKY_DAY,
  SKY_NIGHT,
  SKY_WARM_MIX,
  SKY_WARM_NIGHT_ADD,
  skyRgb,
  SUN_INTENSITY_GAIN,
  SUN_INTENSITY_NIGHT,
  SUN_NIGHT_B_ADD,
  SUN_NIGHT_G_SUB,
  SUN_NIGHT_R_SUB,
  SUN_WARM_B,
  SUN_WARM_G,
  SUN_WARM_R,
  sunRgb,
  type Rgb,
} from "../src/render/fogAtmosphere";
import { GameClock } from "../src/core/clock";

function in01(c: Rgb): void {
  expect(c.r).toBeGreaterThanOrEqual(0);
  expect(c.r).toBeLessThanOrEqual(1);
  expect(c.g).toBeGreaterThanOrEqual(0);
  expect(c.g).toBeLessThanOrEqual(1);
  expect(c.b).toBeGreaterThanOrEqual(0);
  expect(c.b).toBeLessThanOrEqual(1);
}

/** Daylight como GameClock para una phase dada (sin avanzar tiempo). */
function daylightAt(phase: number): number {
  const clock = new GameClock(100);
  clock.elapsed = phase * 100;
  return clock.daylight;
}

describe("fogNearFar", () => {
  test("knobs: día far 100 × 1.15; NIGHT/NEAR_DAY iguales", () => {
    expect(FOG_NEAR_NIGHT).toBe(30.4175);
    expect(FOG_NEAR_NIGHT).toBeCloseTo(26.45 * 1.15, 10);
    expect(FOG_FAR_NIGHT).toBe(78.0275);
    expect(FOG_FAR_NIGHT).toBeCloseTo(67.85 * 1.15, 10);
    expect(FOG_NEAR_DAY).toBe(43.7);
    expect(FOG_NEAR_DAY).toBeCloseTo(38 * 1.15, 10);
    expect(FOG_FAR_DAY).toBe(115);
    expect(FOG_FAR_DAY).toBeCloseTo(100 * 1.15, 10);
  });

  test("noche: far menor y near más tight que de día", () => {
    const night = fogNearFar(0.08);
    const day = fogNearFar(1);
    expect(night.far).toBeLessThan(day.far);
    expect(night.near).toBeLessThan(day.near);
    expect(night.near).toBeLessThan(night.far);
    expect(day.near).toBeLessThan(day.far);
  });

  test("d=0 → night knobs; noon d=1 → day knobs (far día 115)", () => {
    expect(fogNearFar(0)).toEqual({ near: 30.4175, far: 78.0275 });
    expect(fogNearFar(1)).toEqual({ near: 43.7, far: 115 });
  });

  test("near < far siempre en [0,1]", () => {
    for (const d of [0, 0.08, 0.35, 0.54, 0.8, 1]) {
      const f = fogNearFar(d);
      expect(f.near).toBeLessThan(f.far);
    }
  });
});

describe("dawn / dusk warmth bands", () => {
  test("dawn pico en banda 0.2–0.35; dusk en 0.65–0.8", () => {
    expect(dawnWarmth(0.275)).toBeGreaterThan(0.9);
    expect(dawnWarmth(0.1)).toBe(0);
    expect(dawnWarmth(0.5)).toBe(0);
    expect(duskWarmth(0.725)).toBeGreaterThan(0.9);
    expect(duskWarmth(0.5)).toBe(0);
    expect(duskWarmth(0.9)).toBe(0);
  });
});

describe("skyRgb cinematic", () => {
  test("knobs: dawn tint r 0.72 × 1.15 / g 0.38 × 1.15 / b 0.28 × 1.15; dusk r 0.78 × 1.15 / g 0.32 × 1.15 / b 0.18 × 1.15; warm mix 0.35 × 1.15; night add 0.25 × 1.15; sky iguales", () => {
    expect(DAWN_TINT_R).toBe(0.828);
    expect(DAWN_TINT_R).toBeCloseTo(0.72 * 1.15, 10);
    expect(DAWN_TINT_G).toBe(0.437);
    expect(DAWN_TINT_G).toBeCloseTo(0.38 * 1.15, 10);
    expect(DAWN_TINT_B).toBe(0.322);
    expect(DAWN_TINT_B).toBeCloseTo(0.28 * 1.15, 10);
    expect(DUSK_TINT_R).toBe(0.897);
    expect(DUSK_TINT_R).toBeCloseTo(0.78 * 1.15, 10);
    expect(DUSK_TINT_G).toBe(0.368);
    expect(DUSK_TINT_G).toBeCloseTo(0.32 * 1.15, 10);
    expect(DUSK_TINT_B).toBe(0.207);
    expect(DUSK_TINT_B).toBeCloseTo(0.18 * 1.15, 10);
    expect(SKY_WARM_MIX).toBe(0.4025);
    expect(SKY_WARM_MIX).toBeCloseTo(0.35 * 1.15, 10);
    expect(SKY_WARM_NIGHT_ADD).toBe(0.2875);
    expect(SKY_WARM_NIGHT_ADD).toBeCloseTo(0.25 * 1.15, 10);
  });

  test("dawn más cálido que noon (r mayor / r>b)", () => {
    const dawnPhase = 0.275;
    const noonPhase = 0.5;
    const dawn = skyRgb(dawnPhase, daylightAt(dawnPhase));
    const noon = skyRgb(noonPhase, daylightAt(noonPhase));
    expect(dawn.r).toBeGreaterThan(noon.r);
    expect(dawn.r).toBeGreaterThan(dawn.b);
  });

  test("dusk más cálido que noon", () => {
    const duskPhase = 0.725;
    const noonPhase = 0.5;
    const dusk = skyRgb(duskPhase, daylightAt(duskPhase));
    const noon = skyRgb(noonPhase, daylightAt(noonPhase));
    expect(dusk.r).toBeGreaterThan(noon.r);
    expect(dusk.r).toBeGreaterThan(dusk.b);
  });

  test("noche azul/violeta oscuro (b >= r, luminance baja)", () => {
    const night = skyRgb(0, daylightAt(0));
    expect(night.b).toBeGreaterThanOrEqual(night.r);
    expect(night.r + night.g + night.b).toBeLessThan(0.47);
  });

  test("knobs: día r 0.26 × 1.15 / g 0.33 × 1.15 / b 0.47 × 1.15; noche iguales", () => {
    expect(SKY_NIGHT).toEqual({ r: 0.092575, g: 0.119025, b: 0.18515 });
    expect(SKY_NIGHT.r).toBe(0.092575);
    expect(SKY_NIGHT.g).toBe(0.119025);
    expect(SKY_NIGHT.b).toBe(0.18515);
    expect(SKY_DAY).toEqual({ r: 0.299, g: 0.3795, b: 0.5405 });
    expect(SKY_DAY.r).toBe(0.299);
    expect(SKY_DAY.r).toBeCloseTo(0.26 * 1.15, 10);
    expect(SKY_DAY.g).toBe(0.3795);
    expect(SKY_DAY.g).toBeCloseTo(0.33 * 1.15, 10);
    expect(SKY_DAY.b).toBe(0.5405);
    expect(SKY_DAY.b).toBeCloseTo(0.47 * 1.15, 10);
  });

  test("d=0 → night sky/fog; noon d=1 → day sky (día r 0.299 / g 0.3795 / b 0.5405)", () => {
    expect(skyRgb(0, 0)).toEqual(SKY_NIGHT);
    expect(atmosphereFor(0, 0).sky).toEqual(SKY_NIGHT);
    expect(skyRgb(0.5, 1)).toEqual(SKY_DAY);
    expect(atmosphereFor(0.5, 1).sky).toEqual(SKY_DAY);
  });
});

describe("night / noon light intensity floors", () => {
  test("knobs: night floors 0.276 × 1.15 / 0.184 × 1.15; gains 0.529 × 1.15 / 1.196 × 1.15", () => {
    expect(AMBIENT_INTENSITY_NIGHT).toBe(0.3174);
    expect(AMBIENT_INTENSITY_NIGHT).toBeCloseTo(0.276 * 1.15, 10);
    expect(AMBIENT_INTENSITY_GAIN).toBe(0.60835);
    expect(AMBIENT_INTENSITY_GAIN).toBeCloseTo(0.529 * 1.15, 10);
    expect(SUN_INTENSITY_NIGHT).toBe(0.2116);
    expect(SUN_INTENSITY_NIGHT).toBeCloseTo(0.184 * 1.15, 10);
    expect(SUN_INTENSITY_GAIN).toBe(1.3754);
    expect(SUN_INTENSITY_GAIN).toBeCloseTo(1.196 * 1.15, 10);
  });

  test("noche d=0.08 → ambient ~0.366, sun ~0.322", () => {
    expect(nightAmbientIntensity(0.08)).toBeCloseTo(0.366068, 5);
    expect(nightSunIntensity(0.08)).toBeCloseTo(0.321632, 5);
  });

  test("noon d=1 → ambient 0.92575, sun 1.587 (gain sol 1.3754)", () => {
    expect(nightAmbientIntensity(1)).toBeCloseTo(0.92575, 10);
    expect(nightSunIntensity(1)).toBeCloseTo(1.587, 10);
  });

  test("d=0 → floors; clamp fuera de [0,1]", () => {
    expect(nightAmbientIntensity(0)).toBe(0.3174);
    expect(nightSunIntensity(0)).toBe(0.2116);
    expect(nightAmbientIntensity(-1)).toBe(0.3174);
    expect(nightSunIntensity(2)).toBeCloseTo(1.587, 10);
  });
});

describe("ambientRgb night mix", () => {
  test("knobs: night r subtract 0.18 × 0.87; g subtract 0.06 × 0.87; b add 0.14 × 1.15; warm push 0.12 × 1.15", () => {
    expect(AMBIENT_NIGHT_R_SUB).toBe(0.1566);
    expect(AMBIENT_NIGHT_R_SUB).toBeCloseTo(0.18 * 0.87, 10);
    expect(AMBIENT_NIGHT_G_SUB).toBe(0.0522);
    expect(AMBIENT_NIGHT_G_SUB).toBeCloseTo(0.06 * 0.87, 10);
    expect(AMBIENT_NIGHT_B_ADD).toBe(0.161);
    expect(AMBIENT_NIGHT_B_ADD).toBeCloseTo(0.14 * 1.15, 10);
    expect(AMBIENT_WARM_PUSH).toBe(0.138);
    expect(AMBIENT_WARM_PUSH).toBeCloseTo(0.12 * 1.15, 10);
  });

  test("d=0 → night r/g/b follow knobs; b add 0.161", () => {
    const night = ambientRgb(0, 0);
    expect(night.r).toBeCloseTo(0x6a / 255 - AMBIENT_NIGHT_R_SUB, 10);
    expect(night.g).toBeCloseTo(0x6a / 255 - AMBIENT_NIGHT_G_SUB, 10);
    expect(night.b).toBeCloseTo(0x78 / 255 + AMBIENT_NIGHT_B_ADD, 10);
    expect(night.b).toBeCloseTo(0x78 / 255 + 0.161, 10);
  });

  test("dawn/dusk ambient follows AMBIENT_WARM_PUSH", () => {
    const dawnPhase = 0.275;
    const duskPhase = 0.725;
    const dawnPush = dawnWarmth(dawnPhase) * AMBIENT_WARM_PUSH;
    const duskPush = duskWarmth(duskPhase) * AMBIENT_WARM_PUSH;
    const dawn = ambientRgb(1, dawnPhase);
    const dusk = ambientRgb(1, duskPhase);
    expect(dawn.r).toBeCloseTo(0x6a / 255 + dawnPush * 0.2, 10);
    expect(dawn.g).toBeCloseTo(0x6a / 255 + dawnPush * 0.05, 10);
    expect(dawn.b).toBeCloseTo(0x78 / 255 - dawnPush * 0.08, 10);
    expect(dusk.r).toBeCloseTo(0x6a / 255 + duskPush * 0.2, 10);
    expect(dusk.g).toBeCloseTo(0x6a / 255 + duskPush * 0.05, 10);
    expect(dusk.b).toBeCloseTo(0x78 / 255 - duskPush * 0.08, 10);
  });
});

describe("sunRgb night mix", () => {
  test("knobs: night r subtract 0.15 × 0.87; g subtract 0.2 × 0.87; b add 0.12 × 1.15; warm r 0.12 × 1.15; warm g 0.02 × 1.15; warm b 0.14 × 1.15", () => {
    expect(SUN_NIGHT_R_SUB).toBe(0.1305);
    expect(SUN_NIGHT_R_SUB).toBeCloseTo(0.15 * 0.87, 10);
    expect(SUN_NIGHT_G_SUB).toBe(0.174);
    expect(SUN_NIGHT_G_SUB).toBeCloseTo(0.2 * 0.87, 10);
    expect(SUN_NIGHT_B_ADD).toBe(0.138);
    expect(SUN_NIGHT_B_ADD).toBeCloseTo(0.12 * 1.15, 10);
    expect(SUN_WARM_R).toBe(0.138);
    expect(SUN_WARM_R).toBeCloseTo(0.12 * 1.15, 10);
    expect(SUN_WARM_G).toBe(0.023);
    expect(SUN_WARM_G).toBeCloseTo(0.02 * 1.15, 10);
    expect(SUN_WARM_B).toBe(0.161);
    expect(SUN_WARM_B).toBeCloseTo(0.14 * 1.15, 10);
  });

  test("d=0 → night r/g/b follow knobs; b add 0.138", () => {
    const night = sunRgb(0, 0);
    expect(night.r).toBeCloseTo(0.91 - SUN_NIGHT_R_SUB, 10);
    expect(night.g).toBeCloseTo(0.88 - SUN_NIGHT_G_SUB, 10);
    expect(night.g).toBeCloseTo(0.88 - 0.174, 10);
    expect(night.b).toBeCloseTo(0.82 + SUN_NIGHT_B_ADD, 10);
    expect(night.b).toBeCloseTo(0.82 + 0.138, 10);
  });

  test("dawn/dusk sun follows SUN_WARM_R / SUN_WARM_G / SUN_WARM_B", () => {
    const dawnPhase = 0.275;
    const duskPhase = 0.725;
    const dawnWarm = dawnWarmth(dawnPhase);
    const duskWarm = duskWarmth(duskPhase);
    const dawn = sunRgb(1, dawnPhase);
    const dusk = sunRgb(1, duskPhase);
    expect(dawn.r).toBeCloseTo(Math.min(1, 0.91 + dawnWarm * SUN_WARM_R), 10);
    expect(dawn.g).toBeCloseTo(0.88 + dawnWarm * SUN_WARM_G, 10);
    expect(dawn.b).toBeCloseTo(0.82 - dawnWarm * SUN_WARM_B, 10);
    expect(dusk.r).toBeCloseTo(Math.min(1, 0.91 + duskWarm * SUN_WARM_R), 10);
    expect(dusk.g).toBeCloseTo(0.88 + duskWarm * SUN_WARM_G, 10);
    expect(dusk.b).toBeCloseTo(0.82 - duskWarm * SUN_WARM_B, 10);
  });
});

describe("rgb ranges + atmosphereFor", () => {
  test("sky/ambient/sun en 0..1 en fases clave", () => {
    const phases = [0, 0.25, 0.275, 0.5, 0.725, 0.75, 0.9];
    for (const phase of phases) {
      const d = daylightAt(phase);
      in01(skyRgb(phase, d));
      in01(ambientRgb(d, phase));
      in01(sunRgb(d, phase));
      const atm = atmosphereFor(phase, d);
      in01(atm.sky);
      in01(atm.ambient);
      in01(atm.sun);
      expect(atm.near).toBeLessThan(atm.far);
    }
  });
});
