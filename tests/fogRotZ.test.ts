import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_ROT_Z,
  FOG_ROT_Z_SPAWN,
  fogRotZAfterRestart,
  fogRotZFromLook,
} from "../src/render/fogAtmosphere";

describe("fogRotZAfterRestart (R / softReset)", () => {
  test("rot Z fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRotZ = fogRotZAfterRestart();
    expect(bootRotZ).toBe(fogRotZFromLook(FOG_ROT_Z));
    expect(bootRotZ).toBe(FOG_ROT_Z);
    expect(bootRotZ).toBe(FOG_ROT_Z_SPAWN);
    expect(bootRotZ).toBe(0);
    expect(bootRotZ).toBeGreaterThanOrEqual(0);
    expect(bootRotZ).toBeLessThan(Math.PI);
    expect(fogRotZAfterRestart()).toBe(bootRotZ);

    const leftoverRotZ = Math.PI / 2;
    expect(fogRotZFromLook(leftoverRotZ)).toBe(leftoverRotZ);
    expect(fogRotZFromLook(leftoverRotZ)).not.toBe(bootRotZ);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogRotZFromLook(FOG_ROT_Z)).toBe(bootRotZ);
  });

  test("vivo on no cambia rot Z (ctor constant; sync no escribe)", () => {
    const bootRotZ = fogRotZAfterRestart();
    const liveRotZ = fogRotZFromLook(FOG_ROT_Z);
    expect(liveRotZ).toBe(bootRotZ);
    expect(liveRotZ).toBe(fogRotZAfterRestart());
    expect(liveRotZ).toBe(FOG_ROT_Z_SPAWN);

    expect(fogRotZFromLook(FOG_ROT_Z)).toBe(bootRotZ);
    expect(fogRotZFromLook(Math.PI / 2)).not.toBe(bootRotZ);
  });
});

describe("fog mesh rot Z recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rot Z fresco; F9 no helper", () => {
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
    expect(fogSrc).toContain("fogRotZAfterRestart(");
    expect(fogSrc).toContain("fogRotZFromLook(");
    expect(fogSrc).toContain("FOG_ROT_Z_SPAWN");
    expect(fogSrc).toMatch(
      /fogRotZAfterRestart\([\s\S]{0,200}fogRotZFromLook\(/,
    );
    expect(viewSrc).toContain("fogRotZAfterRestart(");
    expect(viewSrc).toContain("fogRotZAfterRestart()");
    expect(viewSrc).not.toContain("fogRotZFromLook(");
    expect(viewSrc).toContain("fog.rotation.z = fogRotZAfterRestart()");
    expect(viewSrc).not.toMatch(/fog\.rotation\.z\s*=\s*0/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogRotZAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogRotZAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogRotZAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogRotZAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogRotZAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogRotZAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogRotZAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogRotZAfterRestart(");
    expect(gameSrc).not.toContain("fogRotZFromLook(");
    expect(saveSrc).not.toContain("fogRotZAfterRestart");
    expect(saveSrc).not.toContain("fogRotZFromLook");
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
