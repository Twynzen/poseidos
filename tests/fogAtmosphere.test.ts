import { describe, expect, test } from "vitest";
import {
  AMBIENT_INTENSITY_GAIN,
  AMBIENT_INTENSITY_NIGHT,
  ambientRgb,
  atmosphereFor,
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
  skyRgb,
  SUN_INTENSITY_GAIN,
  SUN_INTENSITY_NIGHT,
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
  test("knobs: noche far 59 × 1.15; near/día iguales", () => {
    expect(FOG_FAR_NIGHT).toBe(67.85);
    expect(FOG_FAR_NIGHT).toBeCloseTo(59 * 1.15, 10);
    expect(FOG_NEAR_NIGHT).toBe(23);
    expect(FOG_NEAR_DAY).toBe(38);
    expect(FOG_FAR_DAY).toBe(100);
  });

  test("noche: far menor y near más tight que de día", () => {
    const night = fogNearFar(0.08);
    const day = fogNearFar(1);
    expect(night.far).toBeLessThan(day.far);
    expect(night.near).toBeLessThan(day.near);
    expect(night.near).toBeLessThan(night.far);
    expect(day.near).toBeLessThan(day.far);
  });

  test("d=0 → night knobs; noon d=1 → day knobs (día sin cambio)", () => {
    expect(fogNearFar(0)).toEqual({ near: 23, far: 67.85 });
    expect(fogNearFar(1)).toEqual({ near: 38, far: 100 });
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
    expect(night.r + night.g + night.b).toBeLessThan(0.45);
  });

  test("knobs: noche 0.07/0.09/0.14; día 0.26/0.33/0.47 sin cambio", () => {
    expect(SKY_NIGHT).toEqual({ r: 0.07, g: 0.09, b: 0.14 });
    expect(SKY_DAY).toEqual({ r: 0.26, g: 0.33, b: 0.47 });
  });

  test("d=0 → night sky/fog; noon d=1 → day sky (día sin cambio)", () => {
    expect(skyRgb(0, 0)).toEqual(SKY_NIGHT);
    expect(skyRgb(0.5, 1)).toEqual(SKY_DAY);
  });
});

describe("night / noon light intensity floors", () => {
  test("knobs: night floors 0.276 / 0.184; gains 0.46 / 1.04", () => {
    expect(AMBIENT_INTENSITY_NIGHT).toBe(0.276);
    expect(AMBIENT_INTENSITY_GAIN).toBe(0.46);
    expect(SUN_INTENSITY_NIGHT).toBe(0.184);
    expect(SUN_INTENSITY_GAIN).toBe(1.04);
  });

  test("noche d=0.08 → ambient ~0.313, sun ~0.267", () => {
    expect(nightAmbientIntensity(0.08)).toBeCloseTo(0.3128, 5);
    expect(nightSunIntensity(0.08)).toBeCloseTo(0.2672, 5);
  });

  test("noon d=1 → ambient 0.736, sun 1.224 (gain/ambient sin cambio)", () => {
    expect(nightAmbientIntensity(1)).toBeCloseTo(0.736, 10);
    expect(nightSunIntensity(1)).toBeCloseTo(1.224, 10);
  });

  test("d=0 → floors; clamp fuera de [0,1]", () => {
    expect(nightAmbientIntensity(0)).toBe(0.276);
    expect(nightSunIntensity(0)).toBe(0.184);
    expect(nightAmbientIntensity(-1)).toBe(0.276);
    expect(nightSunIntensity(2)).toBeCloseTo(1.224, 10);
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
