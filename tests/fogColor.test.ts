import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_COLOR,
  FOG_COLOR_SPAWN,
  fogColorAfterRestart,
  fogColorFromLook,
} from "../src/render/fogAtmosphere";

describe("fogColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle FOG_COLOR 0x050508); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = fogColorAfterRestart();
    expect(bootColor).toBe(fogColorFromLook(FOG_COLOR));
    expect(bootColor).toBe(FOG_COLOR);
    expect(bootColor).toBe(FOG_COLOR_SPAWN);
    expect(bootColor).toBe(0x050508);
    expect((bootColor >> 16) & 0xff).toBe(0x05);
    expect((bootColor >> 8) & 0xff).toBe(0x05);
    expect(bootColor & 0xff).toBe(0x08);
    expect(fogColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0x1a1a28;
    expect(fogColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(fogColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogColorFromLook(FOG_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = fogColorAfterRestart();
    const liveColor = fogColorFromLook(FOG_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(fogColorAfterRestart());
    expect(liveColor).toBe(FOG_COLOR_SPAWN);

    expect(fogColorFromLook(FOG_COLOR)).toBe(bootColor);
    expect(fogColorFromLook(0x1a1a28)).not.toBe(bootColor);
  });
});

describe("fog mesh color recreate lock (R / softReset)", () => {
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
    const fogSrc = readFileSync(
      resolve(process.cwd(), "src/render/fogAtmosphere.ts"),
      "utf8",
    );
    expect(fogSrc).toContain("fogColorAfterRestart(");
    expect(fogSrc).toContain("fogColorFromLook(");
    expect(fogSrc).toContain("FOG_COLOR_SPAWN");
    expect(fogSrc).toMatch(
      /fogColorAfterRestart\([\s\S]{0,200}fogColorFromLook\(/,
    );
    expect(viewSrc).toContain("fogColorAfterRestart(");
    expect(viewSrc).toContain("fogColorAfterRestart()");
    expect(viewSrc).not.toContain("fogColorFromLook(");
    expect(viewSrc).toContain("color: fogColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*FOG_COLOR,/);
    expect(viewSrc).not.toMatch(/fogMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogColorAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3400}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogColorAfterRestart(");
    expect(gameSrc).not.toContain("fogColorFromLook(");
    expect(saveSrc).not.toContain("fogColorAfterRestart");
    expect(saveSrc).not.toContain("fogColorFromLook");
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
