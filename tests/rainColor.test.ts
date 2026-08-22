import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  RAIN_COLOR,
  RAIN_COLOR_SPAWN,
  rainColorAfterRestart,
  rainColorFromLook,
} from "../src/render/rainStreaks";

describe("rainColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle RAIN_COLOR 0xdeffff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = rainColorAfterRestart();
    expect(bootColor).toBe(rainColorFromLook(RAIN_COLOR));
    expect(bootColor).toBe(RAIN_COLOR);
    expect(bootColor).toBe(RAIN_COLOR_SPAWN);
    expect(bootColor).toBe(0xdeffff);
    expect((bootColor >> 16) & 0xff).toBe(0xde);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xff);
    expect(rainColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xc1e1ff;
    expect(rainColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(rainColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(rainColorFromLook(RAIN_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = rainColorAfterRestart();
    const liveColor = rainColorFromLook(RAIN_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(rainColorAfterRestart());
    expect(liveColor).toBe(RAIN_COLOR_SPAWN);

    expect(rainColorFromLook(RAIN_COLOR)).toBe(bootColor);
    expect(rainColorFromLook(0xc1e1ff)).not.toBe(bootColor);
  });
});

describe("rain mesh color recreate lock (R / softReset)", () => {
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
    const rainSrc = readFileSync(
      resolve(process.cwd(), "src/render/rainStreaks.ts"),
      "utf8",
    );
    expect(rainSrc).toContain("rainColorAfterRestart(");
    expect(rainSrc).toContain("rainColorFromLook(");
    expect(rainSrc).toContain("RAIN_COLOR_SPAWN");
    expect(rainSrc).toMatch(
      /rainColorAfterRestart\([\s\S]{0,200}rainColorFromLook\(/,
    );
    expect(viewSrc).toContain("rainColorAfterRestart(");
    expect(viewSrc).toContain("rainColorAfterRestart()");
    expect(viewSrc).not.toContain("rainColorFromLook(");
    expect(viewSrc).toContain("color: rainColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*RAIN_COLOR,/);
    expect(viewSrc).not.toMatch(/rainMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}rainColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideRain\(\): void \{[\s\S]{0,200}rainColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearRain\(\): void \{[\s\S]{0,200}rainColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncRain\([\s\S]{0,240}rainColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainColorAfterRestart(");
    expect(gameSrc).not.toContain("rainColorFromLook(");
    expect(saveSrc).not.toContain("rainColorAfterRestart");
    expect(saveSrc).not.toContain("rainColorFromLook");
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
