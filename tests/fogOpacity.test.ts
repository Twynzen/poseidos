import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_OPACITY,
  FOG_OPACITY_SPAWN,
  fogOpacityAfterRestart,
  fogOpacityFromLook,
} from "../src/render/fogAtmosphere";

describe("fogOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle FOG_OPACITY 0.92); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = fogOpacityAfterRestart();
    expect(bootOpacity).toBe(fogOpacityFromLook(FOG_OPACITY));
    expect(bootOpacity).toBe(FOG_OPACITY);
    expect(bootOpacity).toBe(FOG_OPACITY_SPAWN);
    expect(bootOpacity).toBe(0.92);
    expect(bootOpacity).toBeCloseTo(0.8 * 1.15, 5);
    expect(bootOpacity).toBeLessThan(1);
    expect(bootOpacity).toBeGreaterThan(0.35);
    expect(fogOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.8;
    expect(fogOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(fogOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogOpacityFromLook(FOG_OPACITY)).toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; sync no escribe)", () => {
    const bootOpacity = fogOpacityAfterRestart();
    const liveOpacity = fogOpacityFromLook(FOG_OPACITY);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(fogOpacityAfterRestart());
    expect(liveOpacity).toBe(FOG_OPACITY_SPAWN);

    expect(fogOpacityFromLook(FOG_OPACITY)).toBe(bootOpacity);
    expect(fogOpacityFromLook(0.8)).not.toBe(bootOpacity);
  });
});

describe("fog mesh opacity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace opacity fresco; F9 no helper", () => {
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
    expect(fogSrc).toContain("fogOpacityAfterRestart(");
    expect(fogSrc).toContain("fogOpacityFromLook(");
    expect(fogSrc).toContain("FOG_OPACITY_SPAWN");
    expect(fogSrc).toMatch(
      /fogOpacityAfterRestart\([\s\S]{0,200}fogOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("fogOpacityAfterRestart(");
    expect(viewSrc).toContain("fogOpacityAfterRestart()");
    expect(viewSrc).not.toContain("fogOpacityFromLook(");
    expect(viewSrc).toContain("opacity: fogOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(/opacity:\s*FOG_OPACITY,/);
    expect(viewSrc).not.toMatch(/fogMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogOpacityAfterRestart(");
    expect(gameSrc).not.toContain("fogOpacityFromLook(");
    expect(saveSrc).not.toContain("fogOpacityAfterRestart");
    expect(saveSrc).not.toContain("fogOpacityFromLook");
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
