import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_SCALE_Z,
  FOG_SCALE_Z_SPAWN,
  fogScaleZAfterRestart,
  fogScaleZFromLook,
} from "../src/render/fogAtmosphere";

describe("fogScaleZAfterRestart (R / softReset)", () => {
  test("scale Z fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootScaleZ = fogScaleZAfterRestart();
    expect(bootScaleZ).toBe(fogScaleZFromLook(FOG_SCALE_Z));
    expect(bootScaleZ).toBe(FOG_SCALE_Z);
    expect(bootScaleZ).toBe(FOG_SCALE_Z_SPAWN);
    expect(bootScaleZ).toBe(1);
    expect(bootScaleZ).toBeGreaterThan(0);
    expect(bootScaleZ).toBeLessThanOrEqual(1);
    expect(fogScaleZAfterRestart()).toBe(bootScaleZ);

    const leftoverScaleZ = 2;
    expect(fogScaleZFromLook(leftoverScaleZ)).toBe(leftoverScaleZ);
    expect(fogScaleZFromLook(leftoverScaleZ)).not.toBe(bootScaleZ);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogScaleZFromLook(FOG_SCALE_Z)).toBe(bootScaleZ);
  });

  test("vivo on no cambia scale Z (ctor constant; sync no escribe)", () => {
    const bootScaleZ = fogScaleZAfterRestart();
    const liveScaleZ = fogScaleZFromLook(FOG_SCALE_Z);
    expect(liveScaleZ).toBe(bootScaleZ);
    expect(liveScaleZ).toBe(fogScaleZAfterRestart());
    expect(liveScaleZ).toBe(FOG_SCALE_Z_SPAWN);

    expect(fogScaleZFromLook(FOG_SCALE_Z)).toBe(bootScaleZ);
    expect(fogScaleZFromLook(2)).not.toBe(bootScaleZ);
  });
});

describe("fog mesh scale Z recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace scale Z fresco; F9 no helper", () => {
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
    expect(fogSrc).toContain("fogScaleZAfterRestart(");
    expect(fogSrc).toContain("fogScaleZFromLook(");
    expect(fogSrc).toContain("FOG_SCALE_Z_SPAWN");
    expect(fogSrc).toMatch(
      /fogScaleZAfterRestart\([\s\S]{0,200}fogScaleZFromLook\(/,
    );
    expect(viewSrc).toContain("fogScaleZAfterRestart(");
    expect(viewSrc).toContain("fogScaleZAfterRestart()");
    expect(viewSrc).not.toContain("fogScaleZFromLook(");
    expect(viewSrc).toContain("fog.scale.z = fogScaleZAfterRestart()");
    expect(viewSrc).not.toMatch(/fog\.scale\.z\s*=\s*1/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogScaleZAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogScaleZAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogScaleZAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogScaleZAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogScaleZAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogScaleZAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogScaleZAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogScaleZAfterRestart(");
    expect(gameSrc).not.toContain("fogScaleZFromLook(");
    expect(saveSrc).not.toContain("fogScaleZAfterRestart");
    expect(saveSrc).not.toContain("fogScaleZFromLook");
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
