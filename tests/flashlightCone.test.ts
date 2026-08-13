import { describe, expect, test } from "vitest";
import {
  FLASHLIGHT_CONE_HALF_WIDTH,
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_CONE_YAW_OFFSET,
  flashlightConeAngle,
  flashlightConeTip,
  flashlightConeWedge,
} from "../src/render/flashlightCone";

describe("constantes", () => {
  test("length 4.2, half-width 1.15 y yaw offset 0 (no re-aplica PLAYER_GLTF_YAW_OFFSET)", () => {
    expect(FLASHLIGHT_CONE_LENGTH).toBe(4.2);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.15);
    expect(FLASHLIGHT_CONE_YAW_OFFSET).toBe(0);
  });
});

describe("flashlightConeTip", () => {
  test("yaw 0 → +Z", () => {
    const o = flashlightConeTip(0);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
  });

  test("yaw +π/2 → +X", () => {
    const o = flashlightConeTip(Math.PI / 2);
    expect(o.x).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    expect(o.z).toBeCloseTo(0, 10);
  });

  test("yaw π → −Z", () => {
    const o = flashlightConeTip(Math.PI);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(-FLASHLIGHT_CONE_LENGTH, 10);
  });

  test("custom length escala la punta", () => {
    const o = flashlightConeTip(0, 2);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(2, 10);
    const e = flashlightConeTip(Math.PI / 2, 0.25);
    expect(e.x).toBeCloseTo(0.25, 10);
    expect(e.z).toBeCloseTo(0, 10);
  });

  test("yaw/length no finitos → offset finito", () => {
    for (const yaw of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      const o = flashlightConeTip(yaw);
      expect(Number.isFinite(o.x)).toBe(true);
      expect(Number.isFinite(o.z)).toBe(true);
      expect(o.x).toBeCloseTo(0, 10);
      expect(o.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    }
    const d = flashlightConeTip(0, Number.NaN);
    expect(Number.isFinite(d.x)).toBe(true);
    expect(Number.isFinite(d.z)).toBe(true);
    expect(d.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    const inf = flashlightConeTip(Math.PI / 2, Number.POSITIVE_INFINITY);
    expect(Number.isFinite(inf.x)).toBe(true);
    expect(Number.isFinite(inf.z)).toBe(true);
    expect(inf.x).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
  });
});

describe("flashlightConeWedge", () => {
  test("yaw 0: ápice origen; left (−hw,+L); right (+hw,+L)", () => {
    const w = flashlightConeWedge(0);
    expect(w.apex.x).toBeCloseTo(0, 10);
    expect(w.apex.z).toBeCloseTo(0, 10);
    expect(w.left.x).toBeCloseTo(-FLASHLIGHT_CONE_HALF_WIDTH, 10);
    expect(w.left.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    expect(w.right.x).toBeCloseTo(FLASHLIGHT_CONE_HALF_WIDTH, 10);
    expect(w.right.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
  });

  test("yaw +π/2: extremo sobre +X; left (+L,+hw); right (+L,−hw)", () => {
    const w = flashlightConeWedge(Math.PI / 2);
    expect(w.left.x).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    expect(w.left.z).toBeCloseTo(FLASHLIGHT_CONE_HALF_WIDTH, 10);
    expect(w.right.x).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    expect(w.right.z).toBeCloseTo(-FLASHLIGHT_CONE_HALF_WIDTH, 10);
  });

  test("custom length/half-width escala el wedge", () => {
    const w = flashlightConeWedge(0, 3, 0.5);
    expect(w.left.x).toBeCloseTo(-0.5, 10);
    expect(w.left.z).toBeCloseTo(3, 10);
    expect(w.right.x).toBeCloseTo(0.5, 10);
    expect(w.right.z).toBeCloseTo(3, 10);
  });

  test("yaw/length/half-width no finitos → wedge finito", () => {
    const w = flashlightConeWedge(Number.NaN, Number.NaN, Number.NaN);
    expect(Number.isFinite(w.left.x)).toBe(true);
    expect(Number.isFinite(w.left.z)).toBe(true);
    expect(Number.isFinite(w.right.x)).toBe(true);
    expect(Number.isFinite(w.right.z)).toBe(true);
    expect(w.left.x).toBeCloseTo(-FLASHLIGHT_CONE_HALF_WIDTH, 10);
    expect(w.left.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
    expect(w.right.x).toBeCloseTo(FLASHLIGHT_CONE_HALF_WIDTH, 10);
    expect(w.right.z).toBeCloseTo(FLASHLIGHT_CONE_LENGTH, 10);
  });
});

describe("flashlightConeAngle", () => {
  test("atan(half-width / length); no finito / length≤0 → default", () => {
    expect(flashlightConeAngle()).toBeCloseTo(
      Math.atan(FLASHLIGHT_CONE_HALF_WIDTH / FLASHLIGHT_CONE_LENGTH),
      10,
    );
    expect(flashlightConeAngle(2, 2)).toBeCloseTo(Math.atan(1), 10);
    expect(flashlightConeAngle(Number.NaN, Number.NaN)).toBeCloseTo(
      Math.atan(FLASHLIGHT_CONE_HALF_WIDTH / FLASHLIGHT_CONE_LENGTH),
      10,
    );
    expect(flashlightConeAngle(0, 1)).toBeCloseTo(
      Math.atan(1 / FLASHLIGHT_CONE_LENGTH),
      10,
    );
  });
});
