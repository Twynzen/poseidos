import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_SCALE_X,
  FOG_SCALE_X_SPAWN,
  fogScaleXAfterRestart,
  fogScaleXFromLook,
} from "../src/render/fogAtmosphere";

describe("fogScaleXAfterRestart (R / softReset)", () => {
  test("scale X fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootScaleX = fogScaleXAfterRestart();
    expect(bootScaleX).toBe(fogScaleXFromLook(FOG_SCALE_X));
    expect(bootScaleX).toBe(FOG_SCALE_X);
    expect(bootScaleX).toBe(FOG_SCALE_X_SPAWN);
    expect(bootScaleX).toBe(1);
    expect(bootScaleX).toBeGreaterThan(0);
    expect(bootScaleX).toBeLessThanOrEqual(1);
    expect(fogScaleXAfterRestart()).toBe(bootScaleX);

    const leftoverScaleX = 2;
    expect(fogScaleXFromLook(leftoverScaleX)).toBe(leftoverScaleX);
    expect(fogScaleXFromLook(leftoverScaleX)).not.toBe(bootScaleX);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogScaleXFromLook(FOG_SCALE_X)).toBe(bootScaleX);
  });

  test("vivo on no cambia scale X (ctor constant; sync no escribe)", () => {
    const bootScaleX = fogScaleXAfterRestart();
    const liveScaleX = fogScaleXFromLook(FOG_SCALE_X);
    expect(liveScaleX).toBe(bootScaleX);
    expect(liveScaleX).toBe(fogScaleXAfterRestart());
    expect(liveScaleX).toBe(FOG_SCALE_X_SPAWN);

    expect(fogScaleXFromLook(FOG_SCALE_X)).toBe(bootScaleX);
    expect(fogScaleXFromLook(2)).not.toBe(bootScaleX);
  });
});

describe("fog mesh scale recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace scale X fresco; F9 no helper", () => {
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
    expect(fogSrc).toContain("fogScaleXAfterRestart(");
    expect(fogSrc).toContain("fogScaleXFromLook(");
    expect(fogSrc).toContain("FOG_SCALE_X_SPAWN");
    expect(fogSrc).toMatch(
      /fogScaleXAfterRestart\([\s\S]{0,200}fogScaleXFromLook\(/,
    );
    expect(viewSrc).toContain("fogScaleXAfterRestart(");
    expect(viewSrc).toContain("fogScaleXAfterRestart()");
    expect(viewSrc).not.toContain("fogScaleXFromLook(");
    expect(viewSrc).toContain("fog.scale.x = fogScaleXAfterRestart()");
    expect(viewSrc).not.toMatch(/fog\.scale\.x\s*=\s*1/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogScaleXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogScaleXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogScaleXAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogScaleXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogScaleXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogScaleXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogScaleXAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogScaleXAfterRestart(");
    expect(gameSrc).not.toContain("fogScaleXFromLook(");
    expect(saveSrc).not.toContain("fogScaleXAfterRestart");
    expect(saveSrc).not.toContain("fogScaleXFromLook");
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
