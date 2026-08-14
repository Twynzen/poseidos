import { describe, expect, test } from "vitest";
import { HOSTILE_VISUAL_SCALE, hostileYaw } from "../src/render/hostileFigure";

describe("HOSTILE_VISUAL_SCALE", () => {
  test("1.725 (1.5 × 1.15); yaw/FACE_EPS sin cambio", () => {
    expect(HOSTILE_VISUAL_SCALE).toBe(1.725);
    expect(HOSTILE_VISUAL_SCALE).toBeCloseTo(1.5 * 1.15, 5);
  });
});

describe("hostileYaw", () => {
  test("atan2(faceX, faceZ) cuando ambos finitos y no ~0", () => {
    expect(hostileYaw(0, -1)).toBe(Math.atan2(0, -1));
    expect(hostileYaw(1, 0)).toBe(Math.atan2(1, 0));
    expect(hostileYaw(-1, 1)).toBe(Math.atan2(-1, 1));
  });

  test("null si ambos ~0", () => {
    expect(hostileYaw(0, 0)).toBeNull();
    expect(hostileYaw(1e-12, -1e-12)).toBeNull();
  });

  test("null si no finitos", () => {
    expect(hostileYaw(Number.NaN, 1)).toBeNull();
    expect(hostileYaw(1, Number.NaN)).toBeNull();
    expect(hostileYaw(Number.POSITIVE_INFINITY, 0)).toBeNull();
    expect(hostileYaw(0, Number.NEGATIVE_INFINITY)).toBeNull();
  });
});
