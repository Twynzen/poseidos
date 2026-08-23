import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_SIDE,
  TRACER_SIDE_SPAWN,
  tracerSideAfterRestart,
  tracerSideFromLook,
} from "../src/render/tracers";

describe("tracerSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = tracerSideAfterRestart();
    expect(bootSide).toBe(tracerSideFromLook(TRACER_SIDE));
    expect(bootSide).toBe(TRACER_SIDE);
    expect(bootSide).toBe(TRACER_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(tracerSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(tracerSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(tracerSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerSideFromLook(TRACER_SIDE)).toBe(bootSide);
    expect(tracerSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = tracerSideAfterRestart();
    const liveSide = tracerSideFromLook(TRACER_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(tracerSideAfterRestart());
    expect(liveSide).toBe(TRACER_SIDE_SPAWN);

    expect(tracerSideFromLook(TRACER_SIDE)).toBe(bootSide);
    expect(tracerSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("tracer mesh side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(tracerSrc).toContain("tracerSideAfterRestart(");
    expect(tracerSrc).toContain("tracerSideFromLook(");
    expect(tracerSrc).toContain("TRACER_SIDE_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerSideAfterRestart\([\s\S]{0,200}tracerSideFromLook\(/,
    );
    expect(viewSrc).toContain("tracerSideAfterRestart(");
    expect(viewSrc).toContain("tracerSideAfterRestart()");
    expect(viewSrc).not.toContain("tracerSideFromLook(");
    expect(viewSrc).toContain("side: tracerSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const tracerMatBase = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const tracerMatBase = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/tracerMatBase\.side\s*=/);
    expect(viewSrc).not.toMatch(/t\.mat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideTracers\(\): void \{[\s\S]{0,200}tracerSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function spawnTracer\([\s\S]{0,400}tracerSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickTracers\([\s\S]{0,400}tracerSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerSideAfterRestart(");
    expect(gameSrc).not.toContain("tracerSideFromLook(");
    expect(saveSrc).not.toContain("tracerSideAfterRestart");
    expect(saveSrc).not.toContain("tracerSideFromLook");
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
