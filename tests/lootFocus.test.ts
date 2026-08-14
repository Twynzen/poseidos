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
  test("reach = CONTAINER_REACH 1.6; near 1.5525; far 1.288; pulse 0.066125 / 6.9", () => {
    expect(LOOT_FOCUS_REACH).toBe(CONTAINER_REACH);
    expect(LOOT_FOCUS_REACH).toBe(1.6);
    expect(LOOT_FOCUS_SCALE_NEAR).toBe(1.5525);
    expect(LOOT_FOCUS_SCALE_NEAR).toBeCloseTo(1.35 * 1.15, 10);
    expect(LOOT_FOCUS_SCALE_FAR).toBe(1.288);
    expect(LOOT_FOCUS_SCALE_FAR).toBeCloseTo(1.12 * 1.15, 10);
    expect(LOOT_FOCUS_PULSE_AMP).toBe(0.066125);
    expect(LOOT_FOCUS_PULSE_AMP).toBeCloseTo(0.0575 * 1.15, 10);
    expect(LOOT_FOCUS_PULSE_SPEED).toBe(6.9);
    expect(LOOT_FOCUS_PULSE_SPEED).toBeCloseTo(6 * 1.15, 10);
  });
});

describe("lootFocusScale", () => {
  test("1.5525 en dist 0; 1.288 en reach; 1.0 fuera", () => {
    expect(lootFocusScale(0)).toBe(1.5525);
    expect(lootFocusScale(1.6)).toBeCloseTo(1.288, 10);
    expect(lootFocusScale(1.61)).toBe(1);
    expect(lootFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.8: 1.5525 + (1.288-1.5525)*0.5 = 1.42025
    expect(lootFocusScale(0.8)).toBeCloseTo(1.42025, 10);
    const t = 0.25;
    const expected = 1.5525 + (1.288 - 1.5525) * t;
    expect(lootFocusScale(1.6 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(lootFocusScale(Number.NaN)).toBe(1);
    expect(lootFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("lootFocusPulse", () => {
  test("1 + 0.066125 * sin(elapsed * 6.9)", () => {
    expect(lootFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.066125
    expect(lootFocusPulse(Math.PI / (2 * 6.9))).toBeCloseTo(1.066125, 10);
    // sin(π) = 0 → 1
    expect(lootFocusPulse(Math.PI / 6.9)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.933875
    expect(lootFocusPulse((3 * Math.PI) / (2 * 6.9))).toBeCloseTo(0.933875, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(lootFocusPulse(Number.NaN)).toBe(1);
  });
});

describe("lootFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse = 1.066125
    expect(lootFocusMul(0, elapsed)).toBeCloseTo(1.5525 * 1.066125, 10);
    expect(lootFocusMul(1.6, elapsed)).toBeCloseTo(1.288 * 1.066125, 10);
    expect(lootFocusMul(0.8, 0)).toBeCloseTo(1.42025, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse ≠ 1
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
  test("con loot en reach (0 y borde) → true", () => {
    expect(lootRingVisible(false, 0)).toBe(true);
    expect(lootRingVisible(false, LOOT_FOCUS_REACH)).toBe(true);
  });

  test("con loot justo fuera de reach → false", () => {
    expect(lootRingVisible(false, 1.61)).toBe(false);
  });

  test("empty → false aunque dist 0", () => {
    expect(lootRingVisible(true, 0)).toBe(false);
  });

  test("NaN / Inf / reach 0 → false", () => {
    expect(lootRingVisible(false, Number.NaN)).toBe(false);
    expect(lootRingVisible(false, Number.POSITIVE_INFINITY)).toBe(false);
    expect(lootRingVisible(false, Number.NEGATIVE_INFINITY)).toBe(false);
    expect(lootRingVisible(false, 0, 0)).toBe(false);
    expect(lootRingVisible(false, 0, Number.NaN)).toBe(false);
    expect(lootRingVisible(false, 0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
