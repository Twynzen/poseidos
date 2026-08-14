import { describe, expect, test } from "vitest";
import {
  ISO_FRUSTUM,
  ISO_FRUSTUM_MAX,
  ISO_FRUSTUM_MIN,
  ISO_FRUSTUM_STEP,
  clampIsoFrustum,
  zoomInFrustum,
  zoomOutFrustum,
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

describe("PLAYER_SOLDIER_MANIFEST scale (iso presence)", () => {
  test("scale > 1 para presencia vs tiles/hostiles", () => {
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBeGreaterThan(1);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});
