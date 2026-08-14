import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  BED_FOCUS_PULSE_AMP,
  BED_FOCUS_PULSE_SPEED,
  BED_FOCUS_REACH,
  BED_FOCUS_SCALE_FAR,
  BED_FOCUS_SCALE_NEAR,
  bedFocusInReach,
  bedFocusMul,
  bedBadgeDiscScale,
  bedBadgeFontPx,
  bedBadgeLabel,
  bedBadgeLetterScale,
  bedBadgeY,
  bedFocusPulse,
  bedFocusScale,
  bedRingVisible,
} from "../src/render/bedFocus";

describe("constantes", () => {
  test("reach 1.5; near 1.35; far 1.12; pulse 0.05 / 6", () => {
    expect(BED_FOCUS_REACH).toBe(1.5);
    expect(BED_FOCUS_SCALE_NEAR).toBe(1.35);
    expect(BED_FOCUS_SCALE_FAR).toBe(1.12);
    expect(BED_FOCUS_PULSE_AMP).toBe(0.05);
    expect(BED_FOCUS_PULSE_SPEED).toBe(6);
  });

  test("bedBadgeLabel es Z; font 92; letter 2.76; disc 1.725; Y 2.3", () => {
    expect(bedBadgeLabel).toBe("Z");
    expect(bedBadgeFontPx).toBe(92);
    expect(bedBadgeFontPx).toBeCloseTo(80 * 1.15, 10);
    expect(bedBadgeLetterScale).toBe(2.76);
    expect(bedBadgeLetterScale).toBeCloseTo(2.4 * 1.15, 10);
    expect(bedBadgeDiscScale).toBe(1.725);
    expect(bedBadgeDiscScale).toBeCloseTo(1.5 * 1.15, 10);
    expect(bedBadgeY).toBe(2.3);
    expect(bedBadgeY).toBeCloseTo(2.0 * 1.15, 10);
  });

  test("worldView aplica bedBadgeFontPx al canvas de la letra Z del floatBadge existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "makeBadgeLetterTexture(bedBadgeLabel, bedBadgeFontPx)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = bedBadgeY");
  });

  test("worldView aplica bedBadgeLetterScale a la letra Z del floatBadge existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "icon.scale.set(bedBadgeLetterScale, bedBadgeLetterScale, 1)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = bedBadgeY");
  });

  test("worldView aplica bedBadgeDiscScale al disc del floatBadge Z existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "disc.scale.set(bedBadgeDiscScale, bedBadgeDiscScale, 1)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = bedBadgeY");
  });
});

describe("bedFocusScale", () => {
  test("1.35 en dist 0; 1.12 en reach; 1.0 fuera", () => {
    expect(bedFocusScale(0)).toBe(1.35);
    expect(bedFocusScale(1.5)).toBeCloseTo(1.12, 10);
    expect(bedFocusScale(1.51)).toBe(1);
    expect(bedFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.75: 1.35 + (1.12-1.35)*0.5 = 1.235
    expect(bedFocusScale(0.75)).toBeCloseTo(1.235, 10);
    const t = 0.25;
    const expected = 1.35 + (1.12 - 1.35) * t;
    expect(bedFocusScale(1.5 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(bedFocusScale(Number.NaN)).toBe(1);
    expect(bedFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });

  test("dist negativa se clampa a 0 → 1.35", () => {
    expect(bedFocusScale(-0.4)).toBe(1.35);
    expect(bedFocusInReach(-0.4)).toBe(true);
  });
});

describe("bedFocusPulse", () => {
  test("1 + 0.05 * sin(elapsed * 6)", () => {
    expect(bedFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.05
    expect(bedFocusPulse(Math.PI / 12)).toBeCloseTo(1.05, 10);
    // sin(π) = 0 → 1
    expect(bedFocusPulse(Math.PI / 6)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.95
    expect(bedFocusPulse(Math.PI / 4)).toBeCloseTo(0.95, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(bedFocusPulse(Number.NaN)).toBe(1);
  });

  test("Infinity elapsed trata como 0", () => {
    expect(bedFocusPulse(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("bedFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / 12; // pulse = 1.05
    expect(bedFocusMul(0, elapsed)).toBeCloseTo(1.35 * 1.05, 10);
    expect(bedFocusMul(1.5, elapsed)).toBeCloseTo(1.12 * 1.05, 10);
    expect(bedFocusMul(0.75, 0)).toBeCloseTo(1.235, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / 12; // pulse ≠ 1
    expect(bedFocusMul(1.51, elapsed)).toBe(1);
    expect(bedFocusMul(8, elapsed)).toBe(1);
    expect(bedFocusMul(Number.NaN, elapsed)).toBe(1);
  });
});

describe("bedFocusInReach", () => {
  test("incluye el borde; excluye más allá", () => {
    expect(bedFocusInReach(0)).toBe(true);
    expect(bedFocusInReach(1.5)).toBe(true);
    expect(bedFocusInReach(1.51)).toBe(false);
    expect(bedFocusInReach(Number.NaN)).toBe(false);
  });
});

describe("bedRingVisible", () => {
  test("0 y borde de reach → true", () => {
    expect(bedRingVisible(0)).toBe(true);
    expect(bedRingVisible(BED_FOCUS_REACH)).toBe(true);
  });

  test("justo fuera de reach → false", () => {
    expect(bedRingVisible(1.51)).toBe(false);
  });

  test("NaN / Inf / reach 0 → false", () => {
    expect(bedRingVisible(Number.NaN)).toBe(false);
    expect(bedRingVisible(Number.POSITIVE_INFINITY)).toBe(false);
    expect(bedRingVisible(Number.NEGATIVE_INFINITY)).toBe(false);
    expect(bedRingVisible(0, 0)).toBe(false);
    expect(bedRingVisible(0, Number.NaN)).toBe(false);
    expect(bedRingVisible(0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
