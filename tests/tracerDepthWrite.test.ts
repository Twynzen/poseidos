import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_DEPTH_WRITE,
  TRACER_DEPTH_WRITE_SPAWN,
  tracerDepthWriteAfterRestart,
  tracerDepthWriteFromLook,
} from "../src/render/tracers";

describe("tracerDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = tracerDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(tracerDepthWriteFromLook(TRACER_DEPTH_WRITE));
    expect(bootDepthWrite).toBe(TRACER_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(TRACER_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(tracerDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(tracerDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(tracerDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
      bootDepthWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerDepthWriteFromLook(TRACER_DEPTH_WRITE)).toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = tracerDepthWriteAfterRestart();
    const liveDepthWrite = tracerDepthWriteFromLook(TRACER_DEPTH_WRITE);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(tracerDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(TRACER_DEPTH_WRITE_SPAWN);

    expect(tracerDepthWriteFromLook(TRACER_DEPTH_WRITE)).toBe(bootDepthWrite);
    expect(tracerDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("tracer mesh depthWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthWrite fresco; F9 no helper", () => {
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
    expect(tracerSrc).toContain("tracerDepthWriteAfterRestart(");
    expect(tracerSrc).toContain("tracerDepthWriteFromLook(");
    expect(tracerSrc).toContain("TRACER_DEPTH_WRITE_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerDepthWriteAfterRestart\([\s\S]{0,200}tracerDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("tracerDepthWriteAfterRestart(");
    expect(viewSrc).toContain("tracerDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("tracerDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: tracerDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const tracerMatBase = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/tracerMatBase\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(/t\.mat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideTracers\(\): void \{[\s\S]{0,200}tracerDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function spawnTracer\([\s\S]{0,400}tracerDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickTracers\([\s\S]{0,400}tracerDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("tracerDepthWriteFromLook(");
    expect(saveSrc).not.toContain("tracerDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("tracerDepthWriteFromLook");
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
