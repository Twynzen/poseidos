import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_ROT_X,
  FOG_ROT_X_SPAWN,
  fogRotXAfterRestart,
  fogRotXFromLook,
} from "../src/render/fogAtmosphere";

describe("fogRotXAfterRestart (R / softReset)", () => {
  test("rot X fresco (idle -Math.PI / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRotX = fogRotXAfterRestart();
    expect(bootRotX).toBe(fogRotXFromLook(FOG_ROT_X));
    expect(bootRotX).toBe(FOG_ROT_X);
    expect(bootRotX).toBe(FOG_ROT_X_SPAWN);
    expect(bootRotX).toBe(-Math.PI / 2);
    expect(bootRotX).toBeLessThan(0);
    expect(bootRotX).toBeGreaterThan(-Math.PI);
    expect(fogRotXAfterRestart()).toBe(bootRotX);

    const leftoverRotX = 0;
    expect(fogRotXFromLook(leftoverRotX)).toBe(leftoverRotX);
    expect(fogRotXFromLook(leftoverRotX)).not.toBe(bootRotX);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogRotXFromLook(FOG_ROT_X)).toBe(bootRotX);
  });

  test("vivo on no cambia rot X (ctor constant; sync no escribe)", () => {
    const bootRotX = fogRotXAfterRestart();
    const liveRotX = fogRotXFromLook(FOG_ROT_X);
    expect(liveRotX).toBe(bootRotX);
    expect(liveRotX).toBe(fogRotXAfterRestart());
    expect(liveRotX).toBe(FOG_ROT_X_SPAWN);

    expect(fogRotXFromLook(FOG_ROT_X)).toBe(bootRotX);
    expect(fogRotXFromLook(0)).not.toBe(bootRotX);
  });
});

describe("fog mesh rot recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rot X fresco; F9 no helper", () => {
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
    expect(fogSrc).toContain("fogRotXAfterRestart(");
    expect(fogSrc).toContain("fogRotXFromLook(");
    expect(fogSrc).toContain("FOG_ROT_X_SPAWN");
    expect(fogSrc).toMatch(
      /fogRotXAfterRestart\([\s\S]{0,200}fogRotXFromLook\(/,
    );
    expect(viewSrc).toContain("fogRotXAfterRestart(");
    expect(viewSrc).toContain("fogRotXAfterRestart()");
    expect(viewSrc).not.toContain("fogRotXFromLook(");
    expect(viewSrc).toContain("fog.rotation.x = fogRotXAfterRestart()");
    expect(viewSrc).not.toMatch(/fog\.rotation\.x\s*=\s*-Math\.PI\s*\/\s*2/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogRotXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogRotXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogRotXAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogRotXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogRotXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogRotXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogRotXAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogRotXAfterRestart(");
    expect(gameSrc).not.toContain("fogRotXFromLook(");
    expect(saveSrc).not.toContain("fogRotXAfterRestart");
    expect(saveSrc).not.toContain("fogRotXFromLook");
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
