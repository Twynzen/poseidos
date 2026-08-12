import { describe, expect, test } from "vitest";
import { ISO_FRUSTUM } from "../src/render/cameraConfig";
import { PLAYER_SOLDIER_MANIFEST } from "../src/render/characterManifest";

describe("ISO_FRUSTUM", () => {
  test("en rango legible 8–12 (zoom vs legacy 16)", () => {
    expect(ISO_FRUSTUM).toBeGreaterThanOrEqual(8);
    expect(ISO_FRUSTUM).toBeLessThanOrEqual(12);
    expect(ISO_FRUSTUM).toBe(10);
  });
});

describe("PLAYER_SOLDIER_MANIFEST scale (iso presence)", () => {
  test("scale > 1 para presencia vs tiles/hostiles", () => {
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBeGreaterThan(1);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});
