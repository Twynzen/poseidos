import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  ISO_FRUSTUM,
  ISO_FRUSTUM_MAX,
  ISO_FRUSTUM_MIN,
  ISO_FRUSTUM_STEP,
  clampIsoFrustum,
  nextIsoZoom,
  zoomHudMsg,
  zoomInFrustum,
  zoomOutFrustum,
  ZOOM_IN_HUD_MSG,
  ZOOM_OUT_HUD_MSG,
} from "../src/render/cameraConfig";
import { PLAYER_SOLDIER_MANIFEST } from "../src/render/characterManifest";

describe("ISO_FRUSTUM", () => {
  test("en rango legible 8–12 (zoom vs legacy 16)", () => {
    expect(ISO_FRUSTUM).toBeGreaterThanOrEqual(8);
    expect(ISO_FRUSTUM).toBeLessThanOrEqual(12);
    expect(ISO_FRUSTUM).toBe(8);
  });

  test("min/max/step para zoom runtime", () => {
    expect(ISO_FRUSTUM_MIN).toBe(6);
    expect(ISO_FRUSTUM_MAX).toBe(16);
    expect(ISO_FRUSTUM_STEP).toBe(1);
    expect(ISO_FRUSTUM_MIN).toBeLessThan(ISO_FRUSTUM);
    expect(ISO_FRUSTUM_MAX).toBeGreaterThan(ISO_FRUSTUM);
  });
});

describe("clampIsoFrustum / zoomInFrustum / zoomOutFrustum", () => {
  test("clamp dentro de [min, max]", () => {
    expect(clampIsoFrustum(10)).toBe(10);
    expect(clampIsoFrustum(ISO_FRUSTUM_MIN - 5)).toBe(ISO_FRUSTUM_MIN);
    expect(clampIsoFrustum(ISO_FRUSTUM_MAX + 5)).toBe(ISO_FRUSTUM_MAX);
  });

  test("zoom in disminuye frustum (más cerca)", () => {
    expect(zoomInFrustum(10)).toBe(9);
    expect(zoomInFrustum(ISO_FRUSTUM_MIN)).toBe(ISO_FRUSTUM_MIN);
    expect(zoomInFrustum(ISO_FRUSTUM_MIN + 0.5)).toBe(ISO_FRUSTUM_MIN);
  });

  test("zoom out aumenta frustum (más lejos)", () => {
    expect(zoomOutFrustum(10)).toBe(11);
    expect(zoomOutFrustum(ISO_FRUSTUM_MAX)).toBe(ISO_FRUSTUM_MAX);
    expect(zoomOutFrustum(ISO_FRUSTUM_MAX - 0.5)).toBe(ISO_FRUSTUM_MAX);
  });

  test("serie de zooms respeta bounds", () => {
    let f = ISO_FRUSTUM;
    for (let i = 0; i < 20; i++) f = zoomInFrustum(f);
    expect(f).toBe(ISO_FRUSTUM_MIN);
    for (let i = 0; i < 40; i++) f = zoomOutFrustum(f);
    expect(f).toBe(ISO_FRUSTUM_MAX);
  });
});

describe("nextIsoZoom / zoomHudMsg (HUD +/-)", () => {
  test("zoomHudMsg: acercaste vs alejaste", () => {
    expect(ZOOM_IN_HUD_MSG).toBe("acercaste");
    expect(ZOOM_OUT_HUD_MSG).toBe("alejaste");
    expect(zoomHudMsg("in")).toBe(ZOOM_IN_HUD_MSG);
    expect(zoomHudMsg("out")).toBe(ZOOM_OUT_HUD_MSG);
    expect(ZOOM_IN_HUD_MSG).not.toBe(ZOOM_OUT_HUD_MSG);
  });

  test("zoom changed: frustum + lastLootMsg; min/max no spam", () => {
    const midIn = nextIsoZoom(10, true, false);
    expect(midIn).toEqual({
      frustum: 9,
      changed: true,
      msg: ZOOM_IN_HUD_MSG,
    });

    const midOut = nextIsoZoom(10, false, true);
    expect(midOut).toEqual({
      frustum: 11,
      changed: true,
      msg: ZOOM_OUT_HUD_MSG,
    });

    const idle = nextIsoZoom(10, false, false);
    expect(idle).toEqual({ frustum: 10, changed: false, msg: null });

    const atMin = nextIsoZoom(ISO_FRUSTUM_MIN, true, false);
    expect(atMin).toEqual({
      frustum: ISO_FRUSTUM_MIN,
      changed: false,
      msg: null,
    });

    const atMax = nextIsoZoom(ISO_FRUSTUM_MAX, false, true);
    expect(atMax).toEqual({
      frustum: ISO_FRUSTUM_MAX,
      changed: false,
      msg: null,
    });

    const minThenOut = nextIsoZoom(ISO_FRUSTUM_MIN, true, true);
    expect(minThenOut.changed).toBe(true);
    expect(minThenOut.frustum).toBe(ISO_FRUSTUM_MIN + ISO_FRUSTUM_STEP);
    expect(minThenOut.msg).toBe(ZOOM_OUT_HUD_MSG);
  });

  test("Game applyIsoZoomInput asigna lastLootMsg/hudAcc via nextIsoZoom (sin lootToast)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("nextIsoZoom(");
    expect(src).toContain("if (next.msg) this.lastLootMsg = next.msg");
    expect(src).toMatch(
      /if \(!next\.changed\) return;[\s\S]{0,180}this\.hudAcc = 1/,
    );
    expect(src).not.toMatch(/applyIsoZoomInput\(\)[\s\S]{0,400}lootToast/);
    expect((src.match(/consumeZoomIn\(\)/g) ?? []).length).toBe(1);
    expect((src.match(/consumeZoomOut\(\)/g) ?? []).length).toBe(1);
  });
});

describe("PLAYER_SOLDIER_MANIFEST scale (iso presence)", () => {
  test("scale > 1 para presencia vs tiles/hostiles", () => {
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBeGreaterThan(1);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});
