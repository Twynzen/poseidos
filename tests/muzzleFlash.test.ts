import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  MUZZLE_FLASH_DURATION,
  MUZZLE_FLASH_PEAK,
  MUZZLE_FLASH_RADIUS,
  MUZZLE_LIGHT_PEAK,
  createMuzzleFlash,
  tickMuzzleFlash,
  triggerMuzzleFlash,
} from "../src/render/muzzleFlash";

describe("constantes", () => {
  test("duración 0.12 × 1.15 y pico 1 × 1.15", () => {
    expect(MUZZLE_FLASH_DURATION).toBe(0.138);
    expect(MUZZLE_FLASH_DURATION).toBeCloseTo(0.12 * 1.15, 10);
    expect(MUZZLE_FLASH_PEAK).toBe(1.15);
    expect(MUZZLE_FLASH_PEAK).toBeCloseTo(1 * 1.15, 10);
  });

  test("radio 0.1375 × 1.15; worldView usa el knob (no magic 0.11/0.1375)", () => {
    expect(MUZZLE_FLASH_RADIUS).toBe(0.158125);
    expect(MUZZLE_FLASH_RADIUS).toBeCloseTo(0.1375 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "new THREE.SphereGeometry(MUZZLE_FLASH_RADIUS, 10, 8)",
    );
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.11\b/);
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.1375\b/);
  });

  test("luz PointLight 2.75 × 1.15; worldView usa el knob (no magic 2.2/2.75)", () => {
    expect(MUZZLE_LIGHT_PEAK).toBe(3.1625);
    expect(MUZZLE_LIGHT_PEAK).toBeCloseTo(2.75 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("MUZZLE_LIGHT_PEAK * out.intensity");
    expect(viewSrc).not.toMatch(/const MUZZLE_LIGHT_PEAK = 2\.2/);
    expect(viewSrc).not.toMatch(/const MUZZLE_LIGHT_PEAK = 2\.75/);
    expect(viewSrc).not.toMatch(/muzzleLight\.intensity = .*\b2\.2\b/);
    expect(viewSrc).not.toMatch(/muzzleLight\.intensity = .*\b2\.75\b/);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createMuzzleFlash();
    expect(s.active).toBe(false);
    const out = tickMuzzleFlash(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("trigger + primer tick: intensity cerca de 1.15 (ease-out sine)", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    expect(s.active).toBe(true);
    const dt = 1 / 60;
    const out = tickMuzzleFlash(s, dt);
    expect(out.active).toBe(true);
    const u = dt / MUZZLE_FLASH_DURATION;
    const expected = Math.cos((u * Math.PI) / 2) * MUZZLE_FLASH_PEAK;
    expect(out.intensity).toBeCloseTo(expected, 10);
    expect(out.intensity).toBeGreaterThan(0.95);
    expect(out.intensity).toBeLessThanOrEqual(MUZZLE_FLASH_PEAK + 1e-12);
  });

  test("al cumplir duración: inactivo e intensity 0", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    const out = tickMuzzleFlash(s, MUZZLE_FLASH_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("dt extra grande completa el flash en un tick", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    const out = tickMuzzleFlash(s, 10);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    tickMuzzleFlash(s, 0.05);
    const age = s.age;
    const a = tickMuzzleFlash(s, 0);
    expect(s.age).toBe(age);
    const b = tickMuzzleFlash(s, -1);
    expect(s.age).toBe(age);
    expect(a.intensity).toBe(b.intensity);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    tickMuzzleFlash(s, 0.08);
    expect(s.age).toBeGreaterThan(0);
    triggerMuzzleFlash(s);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    const out = tickMuzzleFlash(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.intensity).toBeGreaterThan(0.95);
  });
});
