import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DEFAULT_TRACER_TTL,
  TRACER_COUNT_SPAWN,
  TRACER_HEIGHT,
  TRACER_OPACITY_SPAWN,
  TRACER_TTL_MAX,
  TRACER_TTL_MIN,
  TRACER_WIDTH,
  aimAlongFacing,
  clampTracerTtl,
  tickTracerAge,
  tracerActiveAfterRestart,
  tracerActiveFromLook,
  tracerCountAfterRestart,
  tracerCountFromLook,
  tracerLength,
  tracerMidpoint,
  tracerOpacity,
  tracerOpacityAfterRestart,
  tracerOpacityFromLook,
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

describe("tracerAfterRestart (R / softReset)", () => {
  test("tracer fresco (idle opacity 0 + pool empty); leftover ctor Three opacity 1 / count leftover no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootI = tracerOpacityAfterRestart();
    const bootA = tracerActiveAfterRestart();
    const bootN = tracerCountAfterRestart();
    expect(bootI).toBe(tracerOpacityFromLook(0));
    expect(bootA).toBe(tracerActiveFromLook(false));
    expect(bootN).toBe(tracerCountFromLook(0));
    expect(bootI).toBe(0);
    expect(bootA).toBe(false);
    expect(bootN).toBe(0);
    expect(bootI).toBe(TRACER_OPACITY_SPAWN);
    expect(bootN).toBe(TRACER_COUNT_SPAWN);
    expect(tracerOpacityAfterRestart()).toBe(bootI);
    expect(tracerCountAfterRestart()).toBe(bootN);

    const leftoverCtorOpacity = 1;
    const leftoverCtorCount = 1;
    expect(leftoverCtorOpacity).not.toBe(bootI);
    expect(leftoverCtorCount).not.toBe(bootN);
    expect(tracerOpacityFromLook(1)).toBe(leftoverCtorOpacity);
    expect(tracerOpacityFromLook(1)).not.toBe(bootI);
    expect(tracerCountFromLook(1)).toBe(leftoverCtorCount);
    expect(tracerCountFromLook(1)).not.toBe(bootN);
    expect(tracerOpacity(0, DEFAULT_TRACER_TTL)).toBe(leftoverCtorOpacity);
    expect(tracerOpacity(0, DEFAULT_TRACER_TTL)).not.toBe(bootI);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);

    expect(tracerOpacityFromLook(0)).toBe(bootI);
    expect(tracerActiveFromLook(false)).toBe(bootA);
    expect(tracerCountFromLook(0)).toBe(bootN);
    expect(tracerActiveFromLook(true)).not.toBe(bootA);
  });

  test("vivo tick no usa el helper (opacity avanza con look)", () => {
    const bootI = tracerOpacityAfterRestart();
    const bootA = tracerActiveAfterRestart();
    const bootN = tracerCountAfterRestart();
    const liveI = tracerOpacityFromLook(tracerOpacity(0, DEFAULT_TRACER_TTL));
    const liveA = tracerActiveFromLook(true);
    const liveN = tracerCountFromLook(1);
    const liveMid = tracerOpacityFromLook(
      tracerOpacity(DEFAULT_TRACER_TTL / 2, DEFAULT_TRACER_TTL),
    );
    expect(liveI).toBe(1);
    expect(liveA).toBe(true);
    expect(liveN).toBe(1);
    expect(liveMid).toBeCloseTo(0.5, 5);
    expect(liveI).not.toBe(bootI);
    expect(liveA).not.toBe(bootA);
    expect(liveN).not.toBe(bootN);
    expect(liveMid).not.toBe(bootI);
    expect(liveI).not.toBe(tracerOpacityAfterRestart());
    expect(liveA).not.toBe(tracerActiveAfterRestart());
    expect(liveN).not.toBe(tracerCountAfterRestart());
    expect(liveN).toBeGreaterThan(bootN);

    expect(tracerOpacityFromLook(0)).toBe(bootI);
    expect(tracerActiveFromLook(false)).toBe(bootA);
    expect(tracerCountFromLook(0)).toBe(bootN);
    expect(tracerOpacityFromLook(1)).toBe(1);
    expect(tracerCountFromLook(1)).toBe(1);
  });
});

describe("tracer recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace tracer fresco; F9 no helper", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    const saveSrc = readFileSync(
      resolve(process.cwd(), "src/core/save.ts"),
      "utf8",
    );
    const tracerSrc = readFileSync(
      resolve(process.cwd(), "src/render/tracers.ts"),
      "utf8",
    );
    expect(tracerSrc).toContain("tracerOpacityAfterRestart(");
    expect(tracerSrc).toContain("tracerActiveAfterRestart(");
    expect(tracerSrc).toContain("tracerCountAfterRestart(");
    expect(tracerSrc).toContain("tracerOpacityFromLook(");
    expect(tracerSrc).toContain("tracerActiveFromLook(");
    expect(tracerSrc).toContain("tracerCountFromLook(");
    expect(tracerSrc).toContain("TRACER_OPACITY_SPAWN");
    expect(tracerSrc).toContain("TRACER_COUNT_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerOpacityAfterRestart\([\s\S]{0,200}tracerOpacityFromLook\(/,
    );
    expect(tracerSrc).toMatch(
      /tracerCountAfterRestart\([\s\S]{0,200}tracerCountFromLook\(/,
    );
    expect(viewSrc).toContain("tracerOpacityAfterRestart(");
    expect(viewSrc).toContain("tracerCountAfterRestart(");
    expect(viewSrc).toContain("tracerOpacityFromLook(");
    expect(viewSrc).toMatch(
      /opacity:\s*tracerOpacityAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /liveTracers: LiveTracer\[\] = new Array\(tracerCountAfterRestart\(\)\)/,
    );
    expect(viewSrc).toContain(
      "mat.opacity = tracerOpacityFromLook(tracerOpacity(0, life))",
    );
    expect(viewSrc).toContain(
      "const op = tracerOpacityFromLook(tracerOpacity(t.age, t.ttl))",
    );
    expect(viewSrc).toMatch(
      /tracerColorAfterRestart\(\),[\s\S]{0,200}opacity:\s*tracerOpacityAfterRestart\(\)/,
    );
    expect(viewSrc).not.toMatch(
      /tracerColorAfterRestart\(\),[\s\S]{0,200}opacity:\s*1,/,
    );
    expect(viewSrc).not.toMatch(
      /hideTracers: clearTracers[\s\S]{0,80}tracerOpacityAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3700}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerOpacityAfterRestart(");
    expect(gameSrc).not.toContain("tracerActiveAfterRestart(");
    expect(gameSrc).not.toContain("tracerCountAfterRestart(");
    expect(gameSrc).not.toContain("tracerOpacityFromLook(");
    expect(gameSrc).not.toContain("tracerActiveFromLook(");
    expect(gameSrc).not.toContain("tracerCountFromLook(");
    expect(saveSrc).not.toContain("tracerOpacityAfterRestart");
    expect(saveSrc).not.toContain("tracerCountAfterRestart");
    expect(saveSrc).not.toContain("tracerOpacityFromLook");
    expect(saveSrc).not.toContain("tracerCountFromLook");
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}this\.showHelp\s*=/,
    );
    expect(gameSrc).toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);/,
    );
    expect(gameSrc).not.toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);\s*this\.hudAcc = 1/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
  });
});
