import { describe, expect, test } from "vitest";
import { HOSTILE_VISUAL_SCALE } from "../src/render/hostileFigure";

describe("HOSTILE_VISUAL_SCALE", () => {
  test("en rango legible vs Soldier (~1.35–1.6)", () => {
    expect(HOSTILE_VISUAL_SCALE).toBeGreaterThanOrEqual(1.35);
    expect(HOSTILE_VISUAL_SCALE).toBeLessThanOrEqual(1.6);
    expect(HOSTILE_VISUAL_SCALE).toBe(1.5);
  });
});
