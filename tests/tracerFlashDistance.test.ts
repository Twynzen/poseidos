import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_FLASH_DISTANCE_SPAWN,
  tracerFlashDistanceAfterRestart,
  tracerFlashDistanceFromLook,
} from "../src/render/tracers";
import { TRACER_FLASH_DISTANCE } from "../src/render/worldView";

describe("tracerFlashDistanceAfterRestart (R / softReset)", () => {
  test("distance fresco (idle TRACER_FLASH_DISTANCE); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDistance = tracerFlashDistanceAfterRestart();
    expect(bootDistance).toBe(tracerFlashDistanceFromLook(TRACER_FLASH_DISTANCE));
    expect(bootDistance).toBe(TRACER_FLASH_DISTANCE);
    expect(bootDistance).toBe(TRACER_FLASH_DISTANCE_SPAWN);
    expect(bootDistance).toBe(3.68);
    expect(tracerFlashDistanceAfterRestart()).toBe(bootDistance);

    const leftoverDistance = TRACER_FLASH_DISTANCE * 2;
    expect(tracerFlashDistanceFromLook(leftoverDistance)).toBe(leftoverDistance);
    expect(tracerFlashDistanceFromLook(leftoverDistance)).not.toBe(bootDistance);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerFlashDistanceFromLook(TRACER_FLASH_DISTANCE)).toBe(bootDistance);
  });

  test("vivo on no cambia distance (ctor constant; sync no escribe)", () => {
    const bootDistance = tracerFlashDistanceAfterRestart();
    const liveDistance = tracerFlashDistanceFromLook(TRACER_FLASH_DISTANCE);
    expect(liveDistance).toBe(bootDistance);
    expect(liveDistance).toBe(tracerFlashDistanceAfterRestart());
    expect(liveDistance).toBe(TRACER_FLASH_DISTANCE_SPAWN);

    expect(tracerFlashDistanceFromLook(TRACER_FLASH_DISTANCE)).toBe(bootDistance);
    expect(tracerFlashDistanceFromLook(TRACER_FLASH_DISTANCE * 2)).not.toBe(
      bootDistance,
    );
  });
});

describe("tracer flash distance recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace distance fresco; F9 no helper", () => {
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
    expect(tracerSrc).toContain("tracerFlashDistanceAfterRestart(");
    expect(tracerSrc).toContain("tracerFlashDistanceFromLook(");
    expect(tracerSrc).toContain("TRACER_FLASH_DISTANCE_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerFlashDistanceAfterRestart\([\s\S]{0,200}tracerFlashDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("tracerFlashDistanceAfterRestart(");
    expect(viewSrc).toContain("tracerFlashDistanceAfterRestart()");
    expect(viewSrc).not.toContain("tracerFlashDistanceFromLook(");
    expect(viewSrc).toContain(
      "new THREE.PointLight(tracerFlashColorAfterRestart(), TRACER_FLASH_INTENSITY, tracerFlashDistanceAfterRestart(), tracerFlashDecayAfterRestart())",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*tracerFlashColorAfterRestart\(\),\s*TRACER_FLASH_INTENSITY,\s*TRACER_FLASH_DISTANCE,\s*tracerFlashDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(/flash\.distance\s*=/);
    expect(viewSrc).not.toMatch(/t\.flash\.distance/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerFlashDistanceAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerFlashDistanceAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3100}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerFlashDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerFlashDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerFlashDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerFlashDistanceAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerFlashDistanceAfterRestart(");
    expect(gameSrc).not.toContain("tracerFlashDistanceFromLook(");
    expect(saveSrc).not.toContain("tracerFlashDistanceAfterRestart");
    expect(saveSrc).not.toContain("tracerFlashDistanceFromLook");
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
