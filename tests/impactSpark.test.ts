import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  IMPACT_SPARK_DURATION,
  IMPACT_SPARK_LIGHT_PEAK,
  IMPACT_SPARK_PEAK,
  IMPACT_SPARK_RADIUS,
  createImpactSpark,
  tickImpactSpark,
  triggerImpactSpark,
} from "../src/render/impactSpark";

describe("constantes", () => {
  test("duración 0.22 × 1.15 y pico 1", () => {
    expect(IMPACT_SPARK_DURATION).toBe(0.253);
    expect(IMPACT_SPARK_DURATION).toBeCloseTo(0.22 * 1.15, 10);
    expect(IMPACT_SPARK_PEAK).toBe(1);
  });

  test("radio 0.09 × 1.25; worldView usa el knob (no magic 0.09)", () => {
    expect(IMPACT_SPARK_RADIUS).toBe(0.1125);
    expect(IMPACT_SPARK_RADIUS).toBeCloseTo(0.09 * 1.25, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "new THREE.SphereGeometry(IMPACT_SPARK_RADIUS, 10, 8)",
    );
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.09\b/);
  });

  test("luz PointLight 1.75 × 1.15; worldView usa el knob (no magic 1.4/1.75)", () => {
    expect(IMPACT_SPARK_LIGHT_PEAK).toBe(2.0125);
    expect(IMPACT_SPARK_LIGHT_PEAK).toBeCloseTo(1.75 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("IMPACT_SPARK_LIGHT_PEAK * out.intensity");
    expect(viewSrc).not.toMatch(/const IMPACT_SPARK_LIGHT_PEAK = 1\.4/);
    expect(viewSrc).not.toMatch(/const IMPACT_SPARK_LIGHT_PEAK = 1\.75/);
    expect(viewSrc).not.toMatch(/impactLight\.intensity = .*\b1\.4\b/);
    expect(viewSrc).not.toMatch(/impactLight\.intensity = .*\b1\.75\b/);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createImpactSpark();
    expect(s.active).toBe(false);
    const out = tickImpactSpark(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("trigger + primer tick: intensity cerca de 1 y guarda x/y", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 4.5, -2.25);
    expect(s.active).toBe(true);
    expect(s.x).toBe(4.5);
    expect(s.y).toBe(-2.25);
    const dt = 1 / 60;
    const out = tickImpactSpark(s, dt);
    expect(out.active).toBe(true);
    expect(out.x).toBe(4.5);
    expect(out.y).toBe(-2.25);
    const u = dt / IMPACT_SPARK_DURATION;
    const expected = Math.cos((u * Math.PI) / 2) * IMPACT_SPARK_PEAK;
    expect(out.intensity).toBeCloseTo(expected, 10);
    expect(out.intensity).toBeGreaterThan(0.95);
    expect(out.intensity).toBeLessThanOrEqual(IMPACT_SPARK_PEAK + 1e-12);
  });

  test("al cumplir duración: inactivo e intensity 0", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 1, 2);
    const out = tickImpactSpark(s, IMPACT_SPARK_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
    expect(out.x).toBe(1);
    expect(out.y).toBe(2);
  });

  test("dt extra grande completa el spark en un tick", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 0, 0);
    const out = tickImpactSpark(s, 10);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 3, 7);
    tickImpactSpark(s, 0.05);
    const age = s.age;
    const a = tickImpactSpark(s, 0);
    expect(s.age).toBe(age);
    const b = tickImpactSpark(s, -1);
    expect(s.age).toBe(age);
    expect(a.intensity).toBe(b.intensity);
    expect(a.active).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(7);
  });

  test("re-trigger a mitad reinicia desde t=0 y actualiza pos", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 1, 1);
    tickImpactSpark(s, 0.12);
    expect(s.age).toBeGreaterThan(0);
    triggerImpactSpark(s, 9, -4);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    expect(s.x).toBe(9);
    expect(s.y).toBe(-4);
    const out = tickImpactSpark(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.intensity).toBeGreaterThan(0.95);
    expect(out.x).toBe(9);
    expect(out.y).toBe(-4);
  });
});
