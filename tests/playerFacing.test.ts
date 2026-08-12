import { describe, expect, test } from "vitest";
import {
  PLAYER_GLTF_YAW_OFFSET,
  playerGltfYawFromMove,
} from "../src/render/playerFacing";

describe("PLAYER_GLTF_YAW_OFFSET", () => {
  test("default 0 (atan2 ya alinea W→π)", () => {
    expect(PLAYER_GLTF_YAW_OFFSET).toBe(0);
  });
});

describe("playerGltfYawFromMove", () => {
  test("cardinales: W=+Z negativo → π; E → ±π/2", () => {
    expect(playerGltfYawFromMove(0, -1)).toBe(Math.atan2(0, -1));
    expect(playerGltfYawFromMove(1, 0)).toBe(Math.atan2(1, 0));
    expect(playerGltfYawFromMove(-1, 0)).toBe(Math.atan2(-1, 0));
    expect(playerGltfYawFromMove(0, 1)).toBe(Math.atan2(0, 1));
  });

  test("diagonal continua (ejes normalizados WASD), no snap cardinal", () => {
    const inv = 1 / Math.SQRT2;
    // W+D: x>0, z<0
    const yawWd = playerGltfYawFromMove(inv, -inv);
    expect(yawWd).toBe(Math.atan2(inv, -inv));
    expect(yawWd).not.toBe(Math.atan2(1, 0));
    expect(yawWd).not.toBe(Math.atan2(0, -1));
    // W+A: x<0, z<0
    const yawWa = playerGltfYawFromMove(-inv, -inv);
    expect(yawWa).toBe(Math.atan2(-inv, -inv));
    expect(yawWa).not.toBe(yawWd);
  });

  test("null si ~0", () => {
    expect(playerGltfYawFromMove(0, 0)).toBeNull();
    expect(playerGltfYawFromMove(1e-12, -1e-12)).toBeNull();
  });

  test("null si no finitos", () => {
    expect(playerGltfYawFromMove(Number.NaN, 1)).toBeNull();
    expect(playerGltfYawFromMove(1, Number.NaN)).toBeNull();
    expect(playerGltfYawFromMove(Number.POSITIVE_INFINITY, 0)).toBeNull();
  });

  test("offset opcional se suma al atan2", () => {
    const base = playerGltfYawFromMove(1, 0)!;
    expect(playerGltfYawFromMove(1, 0, 0.25)).toBeCloseTo(base + 0.25);
    expect(playerGltfYawFromMove(1, 0, PLAYER_GLTF_YAW_OFFSET)).toBe(base);
  });
});
