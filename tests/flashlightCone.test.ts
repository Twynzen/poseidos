import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  FLASHLIGHT_CONE_HALF_WIDTH,
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_CONE_Y,
  FLASHLIGHT_CONE_YAW_OFFSET,
  FLASHLIGHT_FILL_INTENSITY_MUL,
  FLASHLIGHT_SPOT_INTENSITY_MUL,
  FLASHLIGHT_SPOT_PENUMBRA,
  FLASHLIGHT_WEDGE_COLOR,
  FLASHLIGHT_WEDGE_OPACITY_BASE,
  FLASHLIGHT_WEDGE_OPACITY_GAIN,
  flashlightConeAngle,
  flashlightConeTip,
  flashlightConeVisible,
  flashlightConeWedge,
  flashlightConeWedgePoints,
  flashlightSpotAngle,
  flashlightWedgeOpacity,
  flashlightWedgeVertexColors,
} from "../src/render/flashlightCone";

describe("constantes", () => {
  test("length 5.5545, half-width 1.035, Y 0.092 y yaw offset 0 (no re-aplica PLAYER_GLTF_YAW_OFFSET)", () => {
    expect(FLASHLIGHT_CONE_LENGTH).toBe(5.5545);
    expect(FLASHLIGHT_CONE_LENGTH).toBeCloseTo(4.83 * 1.15, 10);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.035);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBeCloseTo(0.9 * 1.15, 10);
    expect(FLASHLIGHT_CONE_Y).toBe(0.092);
    expect(FLASHLIGHT_CONE_Y).toBeCloseTo(0.08 * 1.15, 10);
    expect(FLASHLIGHT_CONE_YAW_OFFSET).toBe(0);
  });

  test("haz: penumbra 0.23, spot ×2.76, fill ×0.6325, cuña 0xd0eaff opacity 0.6325/0.253", () => {
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.23);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBeCloseTo(0.2 * 1.15, 10);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(2.76);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBeCloseTo(2.4 * 1.15, 10);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.6325);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBeCloseTo(0.55 * 1.15, 10);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xd0eaff);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.6325);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBeCloseTo(0.55 * 1.15, 10);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.253);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBeCloseTo(0.22 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("i * FLASHLIGHT_SPOT_INTENSITY_MUL");
    expect(viewSrc).toContain("i * FLASHLIGHT_FILL_INTENSITY_MUL");
    expect(viewSrc).toContain("FLASHLIGHT_SPOT_PENUMBRA");
    expect(viewSrc).not.toMatch(/const FLASHLIGHT_SPOT_INTENSITY_MUL = 2\.4/);
    expect(viewSrc).not.toMatch(/torchSpot\.intensity = .*\b2\.4\b/);
    expect(viewSrc).not.toMatch(/const FLASHLIGHT_FILL_INTENSITY_MUL = 0\.55/);
    expect(viewSrc).not.toMatch(/torchLight\.intensity = .*\b0\.55\b/);
    expect(viewSrc).not.toMatch(/new THREE\.SpotLight\([^)]*\b0\.2\b/);
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

describe("flashlightConeAngle / flashlightSpotAngle", () => {
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

  test("flashlightSpotAngle coincide con flashlightConeAngle", () => {
    expect(flashlightSpotAngle()).toBe(flashlightConeAngle());
    expect(flashlightSpotAngle(3, 1)).toBe(flashlightConeAngle(3, 1));
  });
});

describe("flashlightConeWedgePoints", () => {
  test("mismos vértices que flashlightConeWedge", () => {
    const a = flashlightConeWedge(0);
    const b = flashlightConeWedgePoints(0);
    expect(b.apex).toEqual(a.apex);
    expect(b.left).toEqual(a.left);
    expect(b.right).toEqual(a.right);
    const c = flashlightConeWedgePoints(Math.PI / 2, 3, 0.5);
    const d = flashlightConeWedge(Math.PI / 2, 3, 0.5);
    expect(c).toEqual(d);
  });
});

describe("flashlightConeVisible / flashlightWedgeOpacity", () => {
  test("visible solo si intensity > 0.02", () => {
    expect(flashlightConeVisible(0)).toBe(false);
    expect(flashlightConeVisible(0.02)).toBe(false);
    expect(flashlightConeVisible(0.021)).toBe(true);
    expect(flashlightConeVisible(1.5)).toBe(true);
    expect(flashlightConeVisible(Number.NaN)).toBe(false);
  });

  test("opacity 0 off; on = base + intensity × gain", () => {
    expect(flashlightWedgeOpacity(0)).toBe(0);
    expect(flashlightWedgeOpacity(0.02)).toBe(0);
    expect(flashlightWedgeOpacity(1)).toBeCloseTo(
      FLASHLIGHT_WEDGE_OPACITY_BASE + FLASHLIGHT_WEDGE_OPACITY_GAIN,
      10,
    );
    expect(flashlightWedgeOpacity(1.5)).toBeCloseTo(
      Math.min(
        1,
        FLASHLIGHT_WEDGE_OPACITY_BASE + 1.5 * FLASHLIGHT_WEDGE_OPACITY_GAIN,
      ),
      10,
    );
    expect(flashlightWedgeOpacity(10)).toBe(1);
  });
});

describe("flashlightWedgeVertexColors", () => {
  test("ápice más brillante que el extremo lejano (tip → far fade)", () => {
    const c = flashlightWedgeVertexColors();
    expect(c.length).toBe(9);
    const tip = c[0]! + c[1]! + c[2]!;
    const farR = c[3]! + c[4]! + c[5]!;
    const farL = c[6]! + c[7]! + c[8]!;
    expect(tip).toBeGreaterThan(farR);
    expect(tip).toBeGreaterThan(farL);
    expect(c[0]).toBe(1);
    expect(c[1]).toBe(1);
    expect(c[2]).toBe(1);
  });
});
