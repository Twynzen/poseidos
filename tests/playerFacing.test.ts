import { describe, expect, test } from "vitest";
import {
  PLAYER_GLTF_YAW_OFFSET,
  playerGltfYawFromMove,
} from "../src/render/playerFacing";

describe("PLAYER_GLTF_YAW_OFFSET", () => {
  test("π (Soldier walk mira −Z local; S/+Z no moonwalk)", () => {
    expect(PLAYER_GLTF_YAW_OFFSET).toBe(Math.PI);
  });
});

describe("playerGltfYawFromMove", () => {
  test("atan2 cardinales con offset default (π)", () => {
    expect(playerGltfYawFromMove(0, 1)).toBeCloseTo(Math.PI, 5);
    expect(playerGltfYawFromMove(1, 0)).toBeCloseTo(Math.PI / 2 + Math.PI, 5);
    expect(playerGltfYawFromMove(0, -1)).toBeCloseTo(Math.PI + Math.PI, 5);
    expect(playerGltfYawFromMove(-1, 0)).toBeCloseTo(-Math.PI / 2 + Math.PI, 5);
  });

  test("continuo diagonal (no snap cardinal)", () => {
    const yaw = playerGltfYawFromMove(1, -1);
    expect(yaw).not.toBeNull();
    expect(yaw!).toBeCloseTo(Math.atan2(1, -1) + Math.PI, 5);
    const wrapped = ((yaw! % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    expect(wrapped).not.toBeCloseTo(0, 5);
    expect(wrapped).not.toBeCloseTo(Math.PI / 2, 5);
    expect(wrapped).not.toBeCloseTo(Math.PI, 5);
  });

  test("offset explícito 0 (atan2 crudo, sin flip)", () => {
    expect(playerGltfYawFromMove(0, -1, 0)).toBeCloseTo(Math.PI, 5);
    expect(playerGltfYawFromMove(0, 1, 0)).toBeCloseTo(0, 5);
    expect(playerGltfYawFromMove(1, 0, 0)).toBeCloseTo(Math.PI / 2, 5);
  });

  test("null si ~0 move o no finito", () => {
    expect(playerGltfYawFromMove(0, 0)).toBeNull();
    expect(playerGltfYawFromMove(1e-12, 0)).toBeNull();
    expect(playerGltfYawFromMove(Number.NaN, 1)).toBeNull();
    expect(playerGltfYawFromMove(1, Number.POSITIVE_INFINITY)).toBeNull();
    expect(playerGltfYawFromMove(1, 0, Number.NaN)).toBeNull();
  });

  test("S (0,+1) con π: yaw π — walk clip alinea con sur", () => {
    expect(playerGltfYawFromMove(0, 1)).toBeCloseTo(Math.PI, 5);
  });
});
