import { describe, expect, test } from "vitest";
import {
  DOOR_FOCUS_PULSE_AMP,
  DOOR_FOCUS_PULSE_SPEED,
  DOOR_FOCUS_REACH,
  DOOR_FOCUS_SCALE_FAR,
  DOOR_FOCUS_SCALE_NEAR,
  doorFocusInReach,
  doorFocusMul,
  doorFocusPulse,
  doorFocusScale,
} from "../src/render/doorFocus";

describe("constantes", () => {
  test("reach 1.6; near 1.35; far 1.12; pulse 0.08 / 6", () => {
    expect(DOOR_FOCUS_REACH).toBe(1.6);
    expect(DOOR_FOCUS_SCALE_NEAR).toBe(1.35);
    expect(DOOR_FOCUS_SCALE_FAR).toBe(1.12);
    expect(DOOR_FOCUS_PULSE_AMP).toBe(0.08);
    expect(DOOR_FOCUS_PULSE_SPEED).toBe(6);
  });
});

describe("doorFocusScale", () => {
  test("1.35 en dist 0; 1.12 en reach; 1.0 fuera", () => {
    expect(doorFocusScale(0)).toBe(1.35);
    expect(doorFocusScale(1.6)).toBeCloseTo(1.12, 10);
    expect(doorFocusScale(1.61)).toBe(1);
    expect(doorFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.8: 1.35 + (1.12-1.35)*0.5 = 1.235
    expect(doorFocusScale(0.8)).toBeCloseTo(1.235, 10);
    const t = 0.25;
    const expected = 1.35 + (1.12 - 1.35) * t;
    expect(doorFocusScale(1.6 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(doorFocusScale(Number.NaN)).toBe(1);
    expect(doorFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });

  test("dist negativa se clampa a 0 → 1.35", () => {
    expect(doorFocusScale(-0.4)).toBe(1.35);
    expect(doorFocusInReach(-0.4)).toBe(true);
  });
});

describe("doorFocusPulse", () => {
  test("1 + 0.08 * sin(elapsed * 6)", () => {
    expect(doorFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.08
    expect(doorFocusPulse(Math.PI / 12)).toBeCloseTo(1.08, 10);
    // sin(π) = 0 → 1
    expect(doorFocusPulse(Math.PI / 6)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.92
    expect(doorFocusPulse(Math.PI / 4)).toBeCloseTo(0.92, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(doorFocusPulse(Number.NaN)).toBe(1);
  });

  test("Infinity elapsed trata como 0", () => {
    expect(doorFocusPulse(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("doorFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / 12; // pulse = 1.08
    expect(doorFocusMul(0, elapsed)).toBeCloseTo(1.35 * 1.08, 10);
    expect(doorFocusMul(1.6, elapsed)).toBeCloseTo(1.12 * 1.08, 10);
    expect(doorFocusMul(0.8, 0)).toBeCloseTo(1.235, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / 12; // pulse ≠ 1
    expect(doorFocusMul(1.61, elapsed)).toBe(1);
    expect(doorFocusMul(8, elapsed)).toBe(1);
    expect(doorFocusMul(Number.NaN, elapsed)).toBe(1);
  });
});

describe("doorFocusInReach", () => {
  test("incluye el borde; excluye más allá", () => {
    expect(doorFocusInReach(0)).toBe(true);
    expect(doorFocusInReach(1.6)).toBe(true);
    expect(doorFocusInReach(1.61)).toBe(false);
    expect(doorFocusInReach(Number.NaN)).toBe(false);
  });
});
