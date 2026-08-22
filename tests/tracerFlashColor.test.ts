import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_FLASH_COLOR_SPAWN,
  tracerFlashColorAfterRestart,
  tracerFlashColorFromLook,
} from "../src/render/tracers";
import { TRACER_FLASH_COLOR } from "../src/render/worldView";

describe("tracerFlashColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle TRACER_FLASH_COLOR 0xffdd6e); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = tracerFlashColorAfterRestart();
    expect(bootColor).toBe(tracerFlashColorFromLook(TRACER_FLASH_COLOR));
    expect(bootColor).toBe(TRACER_FLASH_COLOR);
    expect(bootColor).toBe(TRACER_FLASH_COLOR_SPAWN);
    expect(bootColor).toBe(0xffdd6e);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xdd);
    expect(bootColor & 0xff).toBe(0x6e);
    expect(tracerFlashColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xffc060;
    expect(tracerFlashColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(tracerFlashColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerFlashColorFromLook(TRACER_FLASH_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = tracerFlashColorAfterRestart();
    const liveColor = tracerFlashColorFromLook(TRACER_FLASH_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(tracerFlashColorAfterRestart());
    expect(liveColor).toBe(TRACER_FLASH_COLOR_SPAWN);

    expect(tracerFlashColorFromLook(TRACER_FLASH_COLOR)).toBe(bootColor);
    expect(tracerFlashColorFromLook(0xffc060)).not.toBe(bootColor);
  });
});

describe("tracer flash color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(tracerSrc).toContain("tracerFlashColorAfterRestart(");
    expect(tracerSrc).toContain("tracerFlashColorFromLook(");
    expect(tracerSrc).toContain("TRACER_FLASH_COLOR_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerFlashColorAfterRestart\([\s\S]{0,200}tracerFlashColorFromLook\(/,
    );
    expect(viewSrc).toContain("tracerFlashColorAfterRestart(");
    expect(viewSrc).toContain("tracerFlashColorAfterRestart()");
    expect(viewSrc).not.toContain("tracerFlashColorFromLook(");
    expect(viewSrc).toContain(
      "new THREE.PointLight(tracerFlashColorAfterRestart(), TRACER_FLASH_INTENSITY, tracerFlashDistanceAfterRestart(), tracerFlashDecayAfterRestart())",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*TRACER_FLASH_COLOR,\s*TRACER_FLASH_INTENSITY,\s*TRACER_FLASH_DISTANCE,\s*tracerFlashDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(/flash\.color\s*=/);
    expect(viewSrc).not.toMatch(/t\.flash\.color/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerFlashColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerFlashColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerFlashColorAfterRestart(");
    expect(gameSrc).not.toContain("tracerFlashColorFromLook(");
    expect(saveSrc).not.toContain("tracerFlashColorAfterRestart");
    expect(saveSrc).not.toContain("tracerFlashColorFromLook");
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
