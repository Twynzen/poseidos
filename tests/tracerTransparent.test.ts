import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_TRANSPARENT,
  TRACER_TRANSPARENT_SPAWN,
  tracerTransparentAfterRestart,
  tracerTransparentFromLook,
} from "../src/render/tracers";

describe("tracerTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = tracerTransparentAfterRestart();
    expect(bootTransparent).toBe(tracerTransparentFromLook(TRACER_TRANSPARENT));
    expect(bootTransparent).toBe(TRACER_TRANSPARENT);
    expect(bootTransparent).toBe(TRACER_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(tracerTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(tracerTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(tracerTransparentFromLook(leftoverTransparent)).not.toBe(
      bootTransparent,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerTransparentFromLook(TRACER_TRANSPARENT)).toBe(bootTransparent);
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = tracerTransparentAfterRestart();
    const liveTransparent = tracerTransparentFromLook(TRACER_TRANSPARENT);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(tracerTransparentAfterRestart());
    expect(liveTransparent).toBe(TRACER_TRANSPARENT_SPAWN);

    expect(tracerTransparentFromLook(TRACER_TRANSPARENT)).toBe(bootTransparent);
    expect(tracerTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("tracer mesh transparent recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace transparent fresco; F9 no helper", () => {
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
    expect(tracerSrc).toContain("tracerTransparentAfterRestart(");
    expect(tracerSrc).toContain("tracerTransparentFromLook(");
    expect(tracerSrc).toContain("TRACER_TRANSPARENT_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerTransparentAfterRestart\([\s\S]{0,200}tracerTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("tracerTransparentAfterRestart(");
    expect(viewSrc).toContain("tracerTransparentAfterRestart()");
    expect(viewSrc).not.toContain("tracerTransparentFromLook(");
    expect(viewSrc).toContain("transparent: tracerTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const tracerMatBase = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/tracerMatBase\.transparent\s*=/);
    expect(viewSrc).not.toMatch(/t\.mat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideTracers\(\): void \{[\s\S]{0,200}tracerTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function spawnTracer\([\s\S]{0,400}tracerTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickTracers\([\s\S]{0,400}tracerTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerTransparentAfterRestart(");
    expect(gameSrc).not.toContain("tracerTransparentFromLook(");
    expect(saveSrc).not.toContain("tracerTransparentAfterRestart");
    expect(saveSrc).not.toContain("tracerTransparentFromLook");
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
