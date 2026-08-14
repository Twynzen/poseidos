import { describe, expect, test } from "vitest";
import {
  HIT_LEAN_ANGLE,
  HIT_LEAN_DURATION,
  HIT_LEAN_YAW_RATIO,
  createHitLeanState,
  tickHitLean,
  triggerHitLean,
} from "../src/render/hitLean";

describe("constantes", () => {
  test("duración 0.23 × 1.15, ángulo 0.35 × 1.15 rad y yaw 0.5 × 1.15", () => {
    expect(HIT_LEAN_DURATION).toBe(0.2645);
    expect(HIT_LEAN_DURATION).toBeCloseTo(0.23 * 1.15, 10);
    expect(HIT_LEAN_ANGLE).toBe(0.4025);
    expect(HIT_LEAN_ANGLE).toBeCloseTo(0.35 * 1.15, 10);
    expect(HIT_LEAN_YAW_RATIO).toBe(0.575);
    expect(HIT_LEAN_YAW_RATIO).toBeCloseTo(0.5 * 1.15, 10);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createHitLeanState();
    expect(s.active).toBe(false);
    const out = tickHitLean(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("trigger + tick: pitch y yawBias < 0 (ease-out sine, recoil)", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    expect(s.active).toBe(true);
    const out = tickHitLean(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeLessThan(0);
    expect(out.yawBias).toBeLessThan(0);
    expect(out.yawBias).toBeCloseTo(out.pitch * 0.575, 10);
    expect(out.pitch).toBeGreaterThanOrEqual(-HIT_LEAN_ANGLE - 1e-12);
  });

  test("pico en t=0.5: envelope 1, pitch = -ANGLE", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, HIT_LEAN_DURATION / 2);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeCloseTo(-HIT_LEAN_ANGLE, 10);
    expect(out.yawBias).toBeCloseTo(-HIT_LEAN_ANGLE * 0.575, 10);
  });

  test("ease-out sine en t=0.25: -sin(π/4) · ANGLE", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, HIT_LEAN_DURATION / 4);
    const expected = -Math.sin(Math.PI / 4) * HIT_LEAN_ANGLE;
    expect(out.pitch).toBeCloseTo(expected, 10);
    expect(out.yawBias).toBeCloseTo(expected * 0.575, 10);
  });

  test("espejo: t=0.75 igual a t=0.25 (vuelve a reposo)", () => {
    const a = createHitLeanState();
    const b = createHitLeanState();
    triggerHitLean(a);
    triggerHitLean(b);
    const early = tickHitLean(a, HIT_LEAN_DURATION * 0.25);
    const late = tickHitLean(b, HIT_LEAN_DURATION * 0.75);
    expect(late.pitch).toBeCloseTo(early.pitch, 10);
    expect(late.yawBias).toBeCloseTo(early.yawBias, 10);
  });

  test("al cumplir duración: inactivo y ceros (sin snap residual)", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, HIT_LEAN_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt extra grande completa el lean en un tick", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, 10);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    tickHitLean(s, 0.05);
    const age = s.age;
    const a = tickHitLean(s, 0);
    expect(s.age).toBe(age);
    const b = tickHitLean(s, -1);
    expect(s.age).toBe(age);
    expect(a.pitch).toBe(b.pitch);
    expect(a.yawBias).toBe(b.yawBias);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    tickHitLean(s, 0.1);
    expect(s.age).toBeGreaterThan(0);
    triggerHitLean(s);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    const out = tickHitLean(s, HIT_LEAN_DURATION / 2);
    expect(out.pitch).toBeCloseTo(-HIT_LEAN_ANGLE, 10);
  });
});
