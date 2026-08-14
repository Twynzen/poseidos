import { describe, expect, test } from "vitest";
import {
  DEFAULT_NOISE_RING_LIFE,
  RUN_NOISE_RING_MIN_AGE,
  createNoiseRing,
  ringColorHex,
  ringOpacity,
  ringProgress,
  ringScale,
  runNoiseRingReady,
  shouldShowNoiseRing,
  shouldSpawnNoiseRing,
  tickNoiseRing,
} from "../src/render/noiseRings";

describe("noiseRings (headless)", () => {
  test("createNoiseRing defaults", () => {
    const r = createNoiseRing({ x: 1, y: 2, radius: 6, kind: "run" });
    expect(r.x).toBe(1);
    expect(r.y).toBe(2);
    expect(r.radius).toBe(6);
    expect(r.kind).toBe("run");
    expect(r.age).toBe(0);
    expect(r.life).toBe(DEFAULT_NOISE_RING_LIFE);
  });

  test("createNoiseRing respeta life custom", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 4, life: 1.2 });
    expect(r.life).toBe(1.2);
    expect(r.kind).toBe("run");
  });

  test("tick hasta muerto", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 5, life: 0.5 });
    expect(tickNoiseRing(r, 0.2)).toBe(true);
    expect(r.age).toBeCloseTo(0.2, 5);
    expect(tickNoiseRing(r, 0.2)).toBe(true);
    expect(tickNoiseRing(r, 0.2)).toBe(false);
    expect(r.age).toBeGreaterThanOrEqual(0.5);
  });

  test("scale ease-out 0→1 y opacity fade", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 8, life: 1 });
    expect(ringProgress(r)).toBe(0);
    expect(ringScale(r)).toBe(0);
    expect(ringOpacity(r)).toBe(1);

    r.age = 0.5;
    expect(ringProgress(r)).toBeCloseTo(0.5, 5);
    // easeOutQuad(0.5) = 1 - 0.25 = 0.75
    expect(ringScale(r)).toBeCloseTo(0.75, 5);
    expect(ringOpacity(r)).toBeCloseTo(0.5, 5);

    r.age = 1;
    expect(ringProgress(r)).toBe(1);
    expect(ringScale(r)).toBe(1);
    expect(ringOpacity(r)).toBe(0);
  });

  test("scale/opacity bounds en [0,1]", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 3, life: 0.8 });
    for (let t = 0; t <= 20; t++) {
      r.age = (t / 20) * r.life;
      const s = ringScale(r);
      const o = ringOpacity(r);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
    }
  });

  test("shouldShowNoiseRing oculta walk", () => {
    expect(shouldShowNoiseRing("walk")).toBe(false);
    expect(shouldShowNoiseRing("run")).toBe(true);
    expect(shouldShowNoiseRing("door")).toBe(true);
    expect(shouldShowNoiseRing("loot")).toBe(true);
    expect(shouldShowNoiseRing("barricade")).toBe(true);
    expect(shouldShowNoiseRing("attack")).toBe(true);
    expect(shouldShowNoiseRing("gun")).toBe(true);
  });

  test("runNoiseRingReady: null/undefined o >= 0.4", () => {
    expect(RUN_NOISE_RING_MIN_AGE).toBe(0.4);
    expect(runNoiseRingReady(null)).toBe(true);
    expect(runNoiseRingReady(undefined)).toBe(true);
    expect(runNoiseRingReady(0)).toBe(false);
    expect(runNoiseRingReady(0.39)).toBe(false);
    expect(runNoiseRingReady(0.4)).toBe(true);
    expect(runNoiseRingReady(1)).toBe(true);
  });

  test("shouldSpawnNoiseRing: run throttled; walk hidden; others shown", () => {
    expect(shouldSpawnNoiseRing("run")).toBe(true);
    expect(shouldSpawnNoiseRing("run", null)).toBe(true);
    expect(shouldSpawnNoiseRing("run", undefined)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.2)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.39)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.4)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0.8)).toBe(true);

    expect(shouldSpawnNoiseRing("walk")).toBe(false);
    expect(shouldSpawnNoiseRing("walk", 0)).toBe(false);
    expect(shouldSpawnNoiseRing("walk", 1)).toBe(false);

    expect(shouldSpawnNoiseRing("door", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("loot", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("barricade", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("attack", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("gun", 0)).toBe(true);
  });

  test("ringColorHex por kind", () => {
    expect(ringColorHex("run")).toBe(0xe8e8f0);
    expect(ringColorHex("walk")).toBe(0xe8e8f0);
    expect(ringColorHex("door")).toBe(0xe8b060);
    expect(ringColorHex("loot")).toBe(0xe8b060);
    expect(ringColorHex("attack")).toBe(0xff6030);
    expect(ringColorHex("gun")).toBe(0xff6030);
    expect(ringColorHex("barricade")).toBe(0xff6030);
  });
});
