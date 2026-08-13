import { describe, expect, test } from "vitest";
import { CONTAINER_REACH } from "../src/items";
import {
  LOOT_FOCUS_PULSE_AMP,
  LOOT_FOCUS_PULSE_SPEED,
  LOOT_FOCUS_REACH,
  LOOT_FOCUS_SCALE_FAR,
  LOOT_FOCUS_SCALE_NEAR,
  lootFocusInReach,
  lootFocusMul,
  lootFocusPulse,
  lootFocusScale,
  lootRingVisible,
} from "../src/render/lootFocus";

describe("constantes", () => {
  test("reach = CONTAINER_REACH 1.6; near 1.35; far 1.12; pulse 0.08 / 6", () => {
    expect(LOOT_FOCUS_REACH).toBe(CONTAINER_REACH);
    expect(LOOT_FOCUS_REACH).toBe(1.6);
    expect(LOOT_FOCUS_SCALE_NEAR).toBe(1.35);
    expect(LOOT_FOCUS_SCALE_FAR).toBe(1.12);
    expect(LOOT_FOCUS_PULSE_AMP).toBe(0.08);
    expect(LOOT_FOCUS_PULSE_SPEED).toBe(6);
  });
});

describe("lootFocusScale", () => {
  test("1.35 en dist 0; 1.12 en reach; 1.0 fuera", () => {
    expect(lootFocusScale(0)).toBe(1.35);
    expect(lootFocusScale(1.6)).toBeCloseTo(1.12, 10);
    expect(lootFocusScale(1.61)).toBe(1);
    expect(lootFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.8: 1.35 + (1.12-1.35)*0.5 = 1.235
    expect(lootFocusScale(0.8)).toBeCloseTo(1.235, 10);
    const t = 0.25;
    const expected = 1.35 + (1.12 - 1.35) * t;
    expect(lootFocusScale(1.6 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(lootFocusScale(Number.NaN)).toBe(1);
    expect(lootFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("lootFocusPulse", () => {
  test("1 + 0.08 * sin(elapsed * 6)", () => {
    expect(lootFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.08
    expect(lootFocusPulse(Math.PI / 12)).toBeCloseTo(1.08, 10);
    // sin(π) = 0 → 1
    expect(lootFocusPulse(Math.PI / 6)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.92
    expect(lootFocusPulse(Math.PI / 4)).toBeCloseTo(0.92, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(lootFocusPulse(Number.NaN)).toBe(1);
  });
});

describe("lootFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / 12; // pulse = 1.08
    expect(lootFocusMul(0, elapsed)).toBeCloseTo(1.35 * 1.08, 10);
    expect(lootFocusMul(1.6, elapsed)).toBeCloseTo(1.12 * 1.08, 10);
    expect(lootFocusMul(0.8, 0)).toBeCloseTo(1.235, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / 12; // pulse ≠ 1
    expect(lootFocusMul(1.61, elapsed)).toBe(1);
    expect(lootFocusMul(8, elapsed)).toBe(1);
    expect(lootFocusMul(Number.NaN, elapsed)).toBe(1);
  });
});

describe("lootFocusInReach", () => {
  test("incluye el borde; excluye más allá", () => {
    expect(lootFocusInReach(0)).toBe(true);
    expect(lootFocusInReach(1.6)).toBe(true);
    expect(lootFocusInReach(1.61)).toBe(false);
    expect(lootFocusInReach(Number.NaN)).toBe(false);
  });
});

describe("lootRingVisible", () => {
  test("empty → false; con loot → true", () => {
    expect(lootRingVisible(true)).toBe(false);
    expect(lootRingVisible(false)).toBe(true);
  });
});
