import { describe, expect, test } from "vitest";
import {
  MELEE_SWING_ANGLE,
  MELEE_SWING_DURATION,
  createMeleeSwingState,
  tickMeleeSwing,
  triggerMeleeSwing,
} from "../src/render/meleeSwing";

describe("constantes", () => {
  test("duración 0.25s y ángulo 0.40 rad", () => {
    expect(MELEE_SWING_DURATION).toBe(0.25);
    expect(MELEE_SWING_ANGLE).toBe(0.4);
    expect(MELEE_SWING_ANGLE).toBeCloseTo(0.32 * 1.25, 10);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createMeleeSwingState();
    expect(s.active).toBe(false);
    const out = tickMeleeSwing(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("trigger + tick: pitch y yawBias > 0 (ease-out sine)", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    expect(s.active).toBe(true);
    const out = tickMeleeSwing(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeGreaterThan(0);
    expect(out.yawBias).toBeGreaterThan(0);
    expect(out.yawBias).toBeCloseTo(out.pitch * 0.5, 10);
    expect(out.pitch).toBeLessThanOrEqual(MELEE_SWING_ANGLE + 1e-12);
  });

  test("pico en t=0.5: envelope 1, pitch = ANGLE", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION / 2);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeCloseTo(MELEE_SWING_ANGLE, 10);
    expect(out.yawBias).toBeCloseTo(MELEE_SWING_ANGLE * 0.5, 10);
  });

  test("ease-out sine en t=0.25: sin(π/4) · ANGLE", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION / 4);
    const expected = Math.sin(Math.PI / 4) * MELEE_SWING_ANGLE;
    expect(out.pitch).toBeCloseTo(expected, 10);
    expect(out.yawBias).toBeCloseTo(expected * 0.5, 10);
  });

  test("espejo: t=0.75 igual a t=0.25 (vuelve a reposo)", () => {
    const a = createMeleeSwingState();
    const b = createMeleeSwingState();
    triggerMeleeSwing(a);
    triggerMeleeSwing(b);
    const early = tickMeleeSwing(a, MELEE_SWING_DURATION * 0.25);
    const late = tickMeleeSwing(b, MELEE_SWING_DURATION * 0.75);
    expect(late.pitch).toBeCloseTo(early.pitch, 10);
    expect(late.yawBias).toBeCloseTo(early.yawBias, 10);
  });

  test("al cumplir duración: inactivo y ceros (sin snap residual)", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt extra grande completa el swing en un tick", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, 10);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    tickMeleeSwing(s, 0.05);
    const age = s.age;
    const a = tickMeleeSwing(s, 0);
    expect(s.age).toBe(age);
    const b = tickMeleeSwing(s, -1);
    expect(s.age).toBe(age);
    expect(a.pitch).toBe(b.pitch);
    expect(a.yawBias).toBe(b.yawBias);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    tickMeleeSwing(s, 0.1);
    expect(s.age).toBeGreaterThan(0);
    triggerMeleeSwing(s);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION / 2);
    expect(out.pitch).toBeCloseTo(MELEE_SWING_ANGLE, 10);
  });
});
