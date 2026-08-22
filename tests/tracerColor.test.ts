import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_COLOR_SPAWN,
  tracerColorAfterRestart,
  tracerColorFromLook,
} from "../src/render/tracers";
import { TRACER_COLOR } from "../src/render/worldView";

describe("tracerColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle TRACER_COLOR 0xffffb8); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = tracerColorAfterRestart();
    expect(bootColor).toBe(tracerColorFromLook(TRACER_COLOR));
    expect(bootColor).toBe(TRACER_COLOR);
    expect(bootColor).toBe(TRACER_COLOR_SPAWN);
    expect(bootColor).toBe(0xffffb8);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xb8);
    expect(tracerColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xffe8a0;
    expect(tracerColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(tracerColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerColorFromLook(TRACER_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = tracerColorAfterRestart();
    const liveColor = tracerColorFromLook(TRACER_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(tracerColorAfterRestart());
    expect(liveColor).toBe(TRACER_COLOR_SPAWN);

    expect(tracerColorFromLook(TRACER_COLOR)).toBe(bootColor);
    expect(tracerColorFromLook(0xffe8a0)).not.toBe(bootColor);
  });
});

describe("tracer mesh color recreate lock (R / softReset)", () => {
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
    expect(tracerSrc).toContain("tracerColorAfterRestart(");
    expect(tracerSrc).toContain("tracerColorFromLook(");
    expect(tracerSrc).toContain("TRACER_COLOR_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerColorAfterRestart\([\s\S]{0,200}tracerColorFromLook\(/,
    );
    expect(viewSrc).toContain("tracerColorAfterRestart(");
    expect(viewSrc).toContain("tracerColorAfterRestart()");
    expect(viewSrc).not.toContain("tracerColorFromLook(");
    expect(viewSrc).toContain("color: tracerColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*TRACER_COLOR,/);
    expect(viewSrc).not.toMatch(/tracerMatBase\.color\s*=/);
    expect(viewSrc).not.toMatch(/t\.mat\.color\s*=/);
    expect(viewSrc).not.toMatch(/mat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideTracers\(\): void \{[\s\S]{0,200}tracerColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerColorAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3600}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerColorAfterRestart(");
    expect(gameSrc).not.toContain("tracerColorFromLook(");
    expect(saveSrc).not.toContain("tracerColorAfterRestart");
    expect(saveSrc).not.toContain("tracerColorFromLook");
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
