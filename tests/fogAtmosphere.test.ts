import { describe, expect, test } from "vitest";
import {
  ambientRgb,
  atmosphereFor,
  dawnWarmth,
  duskWarmth,
  fogNearFar,
  skyRgb,
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
  test("noche: far menor y near más tight que de día", () => {
    const night = fogNearFar(0.08);
    const day = fogNearFar(1);
    expect(night.far).toBeLessThan(day.far);
    expect(night.near).toBeLessThan(day.near);
    expect(night.near).toBeLessThan(night.far);
    expect(day.near).toBeLessThan(day.far);
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
