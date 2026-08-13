import { describe, expect, test } from "vitest";
import {
  FACING_CHEVRON_DIST,
  FACING_CHEVRON_YAW_OFFSET,
  facingChevronOffset,
} from "../src/render/facingChevron";

describe("constantes", () => {
  test("dist 0.55 y yaw offset 0 (no re-aplica PLAYER_GLTF_YAW_OFFSET)", () => {
    expect(FACING_CHEVRON_DIST).toBe(0.55);
    expect(FACING_CHEVRON_YAW_OFFSET).toBe(0);
  });
});

describe("facingChevronOffset", () => {
  test("yaw 0 → +Z", () => {
    const o = facingChevronOffset(0);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(FACING_CHEVRON_DIST, 10);
  });

  test("yaw +π/2 → +X", () => {
    const o = facingChevronOffset(Math.PI / 2);
    expect(o.x).toBeCloseTo(FACING_CHEVRON_DIST, 10);
    expect(o.z).toBeCloseTo(0, 10);
  });

  test("yaw π → −Z", () => {
    const o = facingChevronOffset(Math.PI);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(-FACING_CHEVRON_DIST, 10);
  });

  test("custom dist escala el offset", () => {
    const o = facingChevronOffset(0, 2);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(2, 10);
    const e = facingChevronOffset(Math.PI / 2, 0.25);
    expect(e.x).toBeCloseTo(0.25, 10);
    expect(e.z).toBeCloseTo(0, 10);
  });

  test("yaw/dist no finitos → offset finito", () => {
    for (const yaw of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const o = facingChevronOffset(yaw);
      expect(Number.isFinite(o.x)).toBe(true);
      expect(Number.isFinite(o.z)).toBe(true);
      expect(o.x).toBeCloseTo(0, 10);
      expect(o.z).toBeCloseTo(FACING_CHEVRON_DIST, 10);
    }
    const d = facingChevronOffset(0, Number.NaN);
    expect(Number.isFinite(d.x)).toBe(true);
    expect(Number.isFinite(d.z)).toBe(true);
    expect(d.z).toBeCloseTo(FACING_CHEVRON_DIST, 10);
    const inf = facingChevronOffset(Math.PI / 2, Number.POSITIVE_INFINITY);
    expect(Number.isFinite(inf.x)).toBe(true);
    expect(Number.isFinite(inf.z)).toBe(true);
    expect(inf.x).toBeCloseTo(FACING_CHEVRON_DIST, 10);
  });
});
