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
  test("knobs: noche near 23 × 1.15; far/día iguales", () => {
    expect(FOG_NEAR_NIGHT).toBe(26.45);
    expect(FOG_NEAR_NIGHT).toBeCloseTo(23 * 1.15, 10);
    expect(FOG_FAR_NIGHT).toBe(67.85);
    expect(FOG_FAR_NIGHT).toBeCloseTo(59 * 1.15, 10);
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
    expect(fogNearFar(0)).toEqual({ near: 26.45, far: 67.85 });
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

  test("knobs: noche b 0.14 × 1.15; r/g/día iguales", () => {
    expect(SKY_NIGHT).toEqual({ r: 0.0805, g: 0.1035, b: 0.161 });
    expect(SKY_NIGHT.r).toBe(0.0805);
    expect(SKY_NIGHT.g).toBe(0.1035);
    expect(SKY_NIGHT.b).toBe(0.161);
    expect(SKY_NIGHT.b).toBeCloseTo(0.14 * 1.15, 10);
    expect(SKY_DAY).toEqual({ r: 0.26, g: 0.33, b: 0.47 });
  });

  test("d=0 → night sky/fog; noon d=1 → day sky (día sin cambio)", () => {
    expect(skyRgb(0, 0)).toEqual(SKY_NIGHT);
    expect(atmosphereFor(0, 0).sky).toEqual(SKY_NIGHT);
    expect(skyRgb(0.5, 1)).toEqual(SKY_DAY);
    expect(atmosphereFor(0.5, 1).sky).toEqual(SKY_DAY);
  });
});

describe("night / noon light intensity floors", () => {
  test("knobs: night floors 0.276 / 0.184; gains 0.46 × 1.15 / 1.04 × 1.15", () => {
    expect(AMBIENT_INTENSITY_NIGHT).toBe(0.276);
    expect(AMBIENT_INTENSITY_GAIN).toBe(0.529);
    expect(AMBIENT_INTENSITY_GAIN).toBeCloseTo(0.46 * 1.15, 10);
    expect(SUN_INTENSITY_NIGHT).toBe(0.184);
    expect(SUN_INTENSITY_GAIN).toBe(1.196);
    expect(SUN_INTENSITY_GAIN).toBeCloseTo(1.04 * 1.15, 10);
  });

  test("noche d=0.08 → ambient ~0.318, sun ~0.280", () => {
    expect(nightAmbientIntensity(0.08)).toBeCloseTo(0.31832, 5);
    expect(nightSunIntensity(0.08)).toBeCloseTo(0.27968, 5);
  });

  test("noon d=1 → ambient 0.805, sun 1.38 (floors sin cambio)", () => {
    expect(nightAmbientIntensity(1)).toBeCloseTo(0.805, 10);
    expect(nightSunIntensity(1)).toBeCloseTo(1.38, 10);
  });

  test("d=0 → floors; clamp fuera de [0,1]", () => {
    expect(nightAmbientIntensity(0)).toBe(0.276);
    expect(nightSunIntensity(0)).toBe(0.184);
    expect(nightAmbientIntensity(-1)).toBe(0.276);
    expect(nightSunIntensity(2)).toBeCloseTo(1.38, 10);
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
