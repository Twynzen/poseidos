import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  DEFAULT_TRACER_TTL,
  TRACER_HEIGHT,
  TRACER_TTL_MAX,
  TRACER_TTL_MIN,
  TRACER_WIDTH,
  aimAlongFacing,
  clampTracerTtl,
  tickTracerAge,
  tracerLength,
  tracerMidpoint,
  tracerOpacity,
  tracerOverlayApplies,
  tracerProgress,
  tracerYaw,
} from "../src/render/tracers";

describe("constantes", () => {
  test("TTL 0.22 × 1.15 / altura 1.2075 × 1.15 / rango 0.1725–0.4025", () => {
    expect(DEFAULT_TRACER_TTL).toBe(0.253);
    expect(DEFAULT_TRACER_TTL).toBeCloseTo(0.22 * 1.15, 10);
    expect(TRACER_HEIGHT).toBe(1.388625);
    expect(TRACER_HEIGHT).toBeCloseTo(1.2075 * 1.15, 10);
    expect(TRACER_TTL_MIN).toBe(0.1725);
    expect(TRACER_TTL_MIN).toBeCloseTo(0.15 * 1.15, 10);
    expect(TRACER_TTL_MAX).toBe(0.4025);
    expect(TRACER_TTL_MAX).toBeCloseTo(0.35 * 1.15, 10);
  });

  test("grosor 0.06875 × 1.15; worldView usa el knob (no magic 0.055/0.06875)", () => {
    expect(TRACER_WIDTH).toBe(0.0790625);
    expect(TRACER_WIDTH).toBeCloseTo(0.06875 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("mesh.scale.set(TRACER_WIDTH, TRACER_WIDTH, len)");
    expect(viewSrc).not.toMatch(/scale\.set\(0\.055\b/);
    expect(viewSrc).not.toMatch(/scale\.set\(0\.06875\b/);
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

  test("clampTracerTtl respeta 0.1725–0.4025", () => {
    expect(clampTracerTtl(0.01)).toBe(TRACER_TTL_MIN);
    expect(clampTracerTtl(1)).toBe(TRACER_TTL_MAX);
    expect(clampTracerTtl(1)).toBe(0.4025);
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

describe("tracerOverlayApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya vacío no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(tracerOverlayApplies(true)).toBe(false);
    expect(tracerOverlayApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(tracerOverlayApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(tracerOverlayApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; vivo sí; dt<=0 no-op", () => {
    expect(tickTracerAge(0.1, 0.05, true)).toBe(0.1);
    expect(tickTracerAge(0.1, 0.05, false)).toBeCloseTo(0.15, 10);
    expect(tickTracerAge(0.1, 0, false)).toBe(0.1);
    expect(tickTracerAge(0.1, -1, false)).toBe(0.1);
    expect(tickTracerAge(0.1, Number.NaN, false)).toBe(0.1);
    expect(tracerOpacity(tickTracerAge(0, 0.1, true), 0.2)).toBe(1);
    expect(tracerOpacity(tickTracerAge(0, 0.1, false), 0.2)).toBeCloseTo(0.5, 5);
  });

  test("Game freeze / enterGameOver / F9 load-muerto ocultan tracers; vivo tickea", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("tracerOverlayApplies(");
    expect(src).toContain("this.view.hideTracers()");
    expect(src).toMatch(
      /syncTracerOverlay\(dt = 0\): void \{[\s\S]{0,280}tracerOverlayApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1100}this\.syncTracerOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,1100}this\.syncTracerOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}this\.syncTracerOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncGrassVisual\(dt\);\s*this\.syncTracerOverlay\(dt\);/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}this\.view\.tickTracers\(dt\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("tracerOverlayApplies(");
    expect(viewSrc).toContain("tickTracerAge(");
    expect(viewSrc).toContain("hideTracers: clearTracers");
  });
});
