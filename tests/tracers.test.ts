import { describe, expect, test } from "vitest";
import {
  DEFAULT_TRACER_TTL,
  TRACER_TTL_MAX,
  TRACER_TTL_MIN,
  aimAlongFacing,
  clampTracerTtl,
  tracerLength,
  tracerMidpoint,
  tracerOpacity,
  tracerProgress,
  tracerYaw,
} from "../src/render/tracers";

describe("tracers (geometría headless)", () => {
  test("aimAlongFacing normaliza facing y aplica range", () => {
    const p = aimAlongFacing(2, 3, 1, 0, 7);
    expect(p.x).toBeCloseTo(9, 5);
    expect(p.y).toBeCloseTo(3, 5);

    const diag = aimAlongFacing(0, 0, 3, 4, 5);
    expect(diag.x).toBeCloseTo(3, 5);
    expect(diag.y).toBeCloseTo(4, 5);
  });

  test("aimAlongFacing (0,0) cae a sur como ranged", () => {
    const p = aimAlongFacing(1, 1, 0, 0, 4);
    expect(p.x).toBeCloseTo(1, 5);
    expect(p.y).toBeCloseTo(5, 5);
  });

  test("clampTracerTtl respeta 0.15–0.35", () => {
    expect(clampTracerTtl(0.01)).toBe(TRACER_TTL_MIN);
    expect(clampTracerTtl(1)).toBe(TRACER_TTL_MAX);
    expect(clampTracerTtl(DEFAULT_TRACER_TTL)).toBe(DEFAULT_TRACER_TTL);
    expect(clampTracerTtl(Number.NaN)).toBe(DEFAULT_TRACER_TTL);
  });

  test("progress / opacity lineales", () => {
    expect(tracerProgress(0, 0.2)).toBe(0);
    expect(tracerProgress(0.1, 0.2)).toBeCloseTo(0.5, 5);
    expect(tracerProgress(0.2, 0.2)).toBe(1);
    expect(tracerProgress(0.5, 0.2)).toBe(1);
    expect(tracerOpacity(0, 0.2)).toBe(1);
    expect(tracerOpacity(0.1, 0.2)).toBeCloseTo(0.5, 5);
    expect(tracerOpacity(0.2, 0.2)).toBe(0);
  });

  test("length / midpoint / yaw", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 0, y: 4 };
    expect(tracerLength(from, to)).toBeCloseTo(4, 5);
    expect(tracerMidpoint(from, to)).toEqual({ x: 0, y: 2 });
    // +Z Three = +Y mundo → yaw 0
    expect(tracerYaw(from, to)).toBeCloseTo(0, 5);
    // +X mundo → yaw π/2
    expect(tracerYaw(from, { x: 3, y: 0 })).toBeCloseTo(Math.PI / 2, 5);
    expect(tracerLength(from, from)).toBeGreaterThan(0);
  });
});
