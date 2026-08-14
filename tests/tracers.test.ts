import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_TRACER_TTL,
  TRACER_HEIGHT,
  TRACER_TTL_MAX,
  TRACER_TTL_MIN,
  TRACER_WIDTH,
  aimAlongFacing,
  clampTracerTtl,
  tracerLength,
  tracerMidpoint,
  tracerOpacity,
  tracerProgress,
  tracerYaw,
} from "../src/render/tracers";

describe("constantes", () => {
  test("TTL 0.22 × 1.15 / altura 1.05 / rango 0.15–0.35", () => {
    expect(DEFAULT_TRACER_TTL).toBe(0.253);
    expect(DEFAULT_TRACER_TTL).toBeCloseTo(0.22 * 1.15, 10);
    expect(TRACER_HEIGHT).toBe(1.05);
    expect(TRACER_TTL_MIN).toBe(0.15);
    expect(TRACER_TTL_MAX).toBe(0.35);
  });

  test("grosor 0.055 × 1.25; worldView usa el knob (no magic 0.055)", () => {
    expect(TRACER_WIDTH).toBe(0.06875);
    expect(TRACER_WIDTH).toBeCloseTo(0.055 * 1.25, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("mesh.scale.set(TRACER_WIDTH, TRACER_WIDTH, len)");
    expect(viewSrc).not.toMatch(/scale\.set\(0\.055\b/);
  });
});

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
