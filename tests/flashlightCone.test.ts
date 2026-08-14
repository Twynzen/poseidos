import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  FLASHLIGHT_CONE_HALF_WIDTH,
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_CONE_VISIBLE_EPS,
  FLASHLIGHT_CONE_Y,
  FLASHLIGHT_CONE_YAW_OFFSET,
  FLASHLIGHT_FILL_INTENSITY_MUL,
  FLASHLIGHT_SPOT_INTENSITY_MUL,
  FLASHLIGHT_SPOT_COLOR,
  FLASHLIGHT_SPOT_PENUMBRA,
  FLASHLIGHT_WEDGE_COLOR,
  FLASHLIGHT_WEDGE_FAR_B,
  FLASHLIGHT_WEDGE_FAR_G,
  FLASHLIGHT_WEDGE_FAR_R,
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
  test("length 6.387675, half-width 1.3687875, Y 0.12167 y yaw offset 0 (no re-aplica PLAYER_GLTF_YAW_OFFSET)", () => {
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_LENGTH).toBeCloseTo(5.5545 * 1.15, 10);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBeCloseTo(1.19025 * 1.15, 10);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_CONE_Y).toBeCloseTo(0.1058 * 1.15, 10);
    expect(FLASHLIGHT_CONE_YAW_OFFSET).toBe(0);
  });

  test("far B 0.345 (0.3 × 1.15); R/G/apex/eps/length/half-width/Y/penumbra/intensity/colors/opacity sin cambio", () => {
    expect(FLASHLIGHT_WEDGE_FAR_B).toBe(0.345);
    expect(FLASHLIGHT_WEDGE_FAR_B).toBeCloseTo(0.3 * 1.15, 10);
    expect(FLASHLIGHT_WEDGE_FAR_R).toBe(0.184);
    expect(FLASHLIGHT_WEDGE_FAR_G).toBe(0.253);
    expect(FLASHLIGHT_CONE_VISIBLE_EPS).toBe(0.0174);
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
  });

  test("far G 0.253 (0.22 × 1.15); R/B/apex/eps/length/half-width/Y/penumbra/intensity/colors/opacity sin cambio", () => {
    expect(FLASHLIGHT_WEDGE_FAR_G).toBe(0.253);
    expect(FLASHLIGHT_WEDGE_FAR_G).toBeCloseTo(0.22 * 1.15, 10);
    expect(FLASHLIGHT_WEDGE_FAR_R).toBe(0.184);
    expect(FLASHLIGHT_CONE_VISIBLE_EPS).toBe(0.0174);
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
  });

  test("far R 0.184 (0.16 × 1.15); G/B/apex/eps/length/half-width/Y/penumbra/intensity/colors/opacity sin cambio", () => {
    expect(FLASHLIGHT_WEDGE_FAR_R).toBe(0.184);
    expect(FLASHLIGHT_WEDGE_FAR_R).toBeCloseTo(0.16 * 1.15, 10);
    expect(FLASHLIGHT_CONE_VISIBLE_EPS).toBe(0.0174);
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
  });

  test("visible eps 0.0174 (0.02 × 0.87); length/half-width/Y/penumbra/intensity/colors/opacity sin cambio", () => {
    expect(FLASHLIGHT_CONE_VISIBLE_EPS).toBe(0.0174);
    expect(FLASHLIGHT_CONE_VISIBLE_EPS).toBeCloseTo(0.02 * 0.87, 10);
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
  });

  test("color 0xefffff (0xd0eaff × 1.15, g/b clamp); length/half-width/Y/opacities/spot/fill/penumbra sin cambio (no double-apply)", () => {
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect((FLASHLIGHT_WEDGE_COLOR >> 16) & 0xff).toBe(0xef);
    expect((FLASHLIGHT_WEDGE_COLOR >> 8) & 0xff).toBe(0xff);
    expect(FLASHLIGHT_WEDGE_COLOR & 0xff).toBe(0xff);
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("color: FLASHLIGHT_WEDGE_COLOR");
  });

  test("spot color 0xf8ffff (0xd8eeff × 1.15, g/b clamp); wedge/length/half-width/Y/opacities/spot/fill/penumbra sin cambio (no double-apply)", () => {
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    expect((FLASHLIGHT_SPOT_COLOR >> 16) & 0xff).toBe(0xf8);
    expect((FLASHLIGHT_SPOT_COLOR >> 8) & 0xff).toBe(0xff);
    expect(FLASHLIGHT_SPOT_COLOR & 0xff).toBe(0xff);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect(FLASHLIGHT_CONE_LENGTH).toBe(6.387675);
    expect(FLASHLIGHT_CONE_HALF_WIDTH).toBe(1.3687875);
    expect(FLASHLIGHT_CONE_Y).toBe(0.12167);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("FLASHLIGHT_SPOT_COLOR");
    expect(viewSrc).toContain("torchSpot.color.setHex(FLASHLIGHT_SPOT_COLOR)");
  });

  test("haz: penumbra 0.2645, spot ×3.6501, fill ×0.83648125, cuña 0xefffff opacity 0.727375/0.3345925", () => {
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBe(0.2645);
    expect(FLASHLIGHT_SPOT_PENUMBRA).toBeCloseTo(0.23 * 1.15, 10);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBe(3.6501);
    expect(FLASHLIGHT_SPOT_INTENSITY_MUL).toBeCloseTo(3.174 * 1.15, 10);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBe(0.83648125);
    expect(FLASHLIGHT_FILL_INTENSITY_MUL).toBeCloseTo(0.727375 * 1.15, 10);
    expect(FLASHLIGHT_WEDGE_COLOR).toBe(0xefffff);
    expect(FLASHLIGHT_SPOT_COLOR).toBe(0xf8ffff);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBe(0.727375);
    expect(FLASHLIGHT_WEDGE_OPACITY_BASE).toBeCloseTo(0.6325 * 1.15, 10);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBe(0.3345925);
    expect(FLASHLIGHT_WEDGE_OPACITY_GAIN).toBeCloseTo(0.29095 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("i * FLASHLIGHT_SPOT_INTENSITY_MUL");
    expect(viewSrc).toContain("i * FLASHLIGHT_FILL_INTENSITY_MUL");
    expect(viewSrc).toContain("FLASHLIGHT_SPOT_PENUMBRA");
    expect(viewSrc).not.toMatch(/const FLASHLIGHT_SPOT_INTENSITY_MUL = 2\.4/);
    expect(viewSrc).not.toMatch(/const FLASHLIGHT_SPOT_INTENSITY_MUL = 2\.76/);
    expect(viewSrc).not.toMatch(/torchSpot\.intensity = .*\b2\.4\b/);
    expect(viewSrc).not.toMatch(/torchSpot\.intensity = .*\b2\.76\b/);
    expect(viewSrc).not.toMatch(/const FLASHLIGHT_FILL_INTENSITY_MUL = 0\.55/);
    expect(viewSrc).not.toMatch(/const FLASHLIGHT_FILL_INTENSITY_MUL = 0\.6325/);
    expect(viewSrc).not.toMatch(/torchLight\.intensity = .*\b0\.55\b/);
    expect(viewSrc).not.toMatch(/torchLight\.intensity = .*\b0\.6325\b/);
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
  test("visible solo si intensity > 0.0174", () => {
    expect(flashlightConeVisible(0)).toBe(false);
    expect(flashlightConeVisible(0.0174)).toBe(false);
    expect(flashlightConeVisible(FLASHLIGHT_CONE_VISIBLE_EPS)).toBe(false);
    expect(flashlightConeVisible(0.02)).toBe(true);
    expect(flashlightConeVisible(0.021)).toBe(true);
    expect(flashlightConeVisible(1.5)).toBe(true);
    expect(flashlightConeVisible(Number.NaN)).toBe(false);
  });

  test("opacity 0 off; on = base + intensity × gain", () => {
    expect(flashlightWedgeOpacity(0)).toBe(0);
    expect(flashlightWedgeOpacity(0.0174)).toBe(0);
    expect(flashlightWedgeOpacity(1)).toBeCloseTo(
      Math.min(
        1,
        FLASHLIGHT_WEDGE_OPACITY_BASE + FLASHLIGHT_WEDGE_OPACITY_GAIN,
      ),
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
  test("ápice más brillante que el extremo lejano (tip → far fade); far R 0.184 / G 0.253 / B 0.345", () => {
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
    expect(c[3]).toBeCloseTo(0.184, 5);
    expect(c[3]).toBeCloseTo(FLASHLIGHT_WEDGE_FAR_R, 5);
    expect(c[4]).toBeCloseTo(0.253, 5);
    expect(c[4]).toBeCloseTo(FLASHLIGHT_WEDGE_FAR_G, 5);
    expect(c[5]).toBeCloseTo(0.345, 5);
    expect(c[5]).toBeCloseTo(FLASHLIGHT_WEDGE_FAR_B, 5);
    expect(c[6]).toBeCloseTo(0.184, 5);
    expect(c[6]).toBeCloseTo(FLASHLIGHT_WEDGE_FAR_R, 5);
    expect(c[7]).toBeCloseTo(0.253, 5);
    expect(c[7]).toBeCloseTo(FLASHLIGHT_WEDGE_FAR_G, 5);
    expect(c[8]).toBeCloseTo(0.345, 5);
    expect(c[8]).toBeCloseTo(FLASHLIGHT_WEDGE_FAR_B, 5);
  });
});
