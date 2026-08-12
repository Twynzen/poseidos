import { describe, expect, test } from "vitest";
import {
  HOSTILE_LOCO_IDLE_DIST,
  HOSTILE_LOCO_RUN_SPEED,
  hostileLocoFromDelta,
} from "../src/render/hostileLoco";

describe("hostileLocoFromDelta", () => {
  test("quieto o micro-jitter → idle", () => {
    expect(hostileLocoFromDelta(0, 0, 1 / 60)).toBe("idle");
    expect(hostileLocoFromDelta(HOSTILE_LOCO_IDLE_DIST, 0, 1 / 60)).toBe(
      "idle",
    );
    expect(
      hostileLocoFromDelta(HOSTILE_LOCO_IDLE_DIST / Math.SQRT2, HOSTILE_LOCO_IDLE_DIST / Math.SQRT2, 0.016),
    ).toBe("idle");
  });

  test("walk bajo umbral de run", () => {
    const dt = 1 / 60;
    // speed = 2.4 < 3.5
    const dist = 2.4 * dt;
    expect(hostileLocoFromDelta(dist, 0, dt)).toBe("walk");
    expect(hostileLocoFromDelta(0, dist, dt)).toBe("walk");
  });

  test("run cuando speed ≥ RUN_SPEED", () => {
    const dt = 1 / 60;
    const dist = HOSTILE_LOCO_RUN_SPEED * dt;
    expect(hostileLocoFromDelta(dist, 0, dt)).toBe("run");
    expect(hostileLocoFromDelta(dist * 1.1, 0, dt)).toBe("run");
  });

  test("dt≤0 / no finito → idle (sin división)", () => {
    expect(hostileLocoFromDelta(1, 0, 0)).toBe("idle");
    expect(hostileLocoFromDelta(1, 0, -0.01)).toBe("idle");
    expect(hostileLocoFromDelta(1, 0, Number.NaN)).toBe("idle");
    expect(hostileLocoFromDelta(1, 0, Number.POSITIVE_INFINITY)).toBe("idle");
  });

  test("dx/dz no finitos se tratan como 0", () => {
    // NaN + 1 → dist 1 → run a 10 u/s
    expect(hostileLocoFromDelta(Number.NaN, 1, 0.1)).toBe("run");
    expect(hostileLocoFromDelta(Number.NaN, Number.NaN, 0.1)).toBe("idle");
  });

  test("constantes coherentes", () => {
    expect(HOSTILE_LOCO_IDLE_DIST).toBe(0.02);
    expect(HOSTILE_LOCO_RUN_SPEED).toBe(3.5);
  });
});
