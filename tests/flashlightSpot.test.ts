import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_SPOT_ORIGIN_X_SPAWN,
  FLASHLIGHT_SPOT_ORIGIN_Z_SPAWN,
  FLASHLIGHT_SPOT_VISIBLE_SPAWN,
  flashlightSpotOriginXAfterRestart,
  flashlightSpotOriginXFromLook,
  flashlightSpotOriginZAfterRestart,
  flashlightSpotOriginZFromLook,
  flashlightSpotVisibleAfterRestart,
  flashlightSpotVisibleFromLook,
} from "../src/render/flashlightCone";

describe("flashlightSpotAfterRestart (R / softReset)", () => {
  test("spot fresco (idle origin 0,0 / visible false); leftover mid-life origin / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootX = flashlightSpotOriginXAfterRestart();
    const bootZ = flashlightSpotOriginZAfterRestart();
    const bootVisible = flashlightSpotVisibleAfterRestart();
    expect(bootX).toBe(flashlightSpotOriginXFromLook(0));
    expect(bootZ).toBe(flashlightSpotOriginZFromLook(0));
    expect(bootVisible).toBe(flashlightSpotVisibleFromLook(false));
    expect(bootX).toBe(0);
    expect(bootZ).toBe(0);
    expect(bootVisible).toBe(false);
    expect(bootX).toBe(FLASHLIGHT_SPOT_ORIGIN_X_SPAWN);
    expect(bootZ).toBe(FLASHLIGHT_SPOT_ORIGIN_Z_SPAWN);
    expect(bootVisible).toBe(FLASHLIGHT_SPOT_VISIBLE_SPAWN);
    expect(flashlightSpotOriginXAfterRestart()).toBe(bootX);
    expect(flashlightSpotOriginZAfterRestart()).toBe(bootZ);
    expect(flashlightSpotVisibleAfterRestart()).toBe(bootVisible);

    const leftoverX = 24.5;
    const leftoverZ = 15.5;
    expect(leftoverX).toBe(barrio.spawn.x);
    expect(leftoverZ).toBe(barrio.spawn.y);
    expect(flashlightSpotOriginXFromLook(leftoverX)).toBe(leftoverX);
    expect(flashlightSpotOriginXFromLook(leftoverX)).not.toBe(bootX);
    expect(flashlightSpotOriginZFromLook(leftoverZ)).toBe(leftoverZ);
    expect(flashlightSpotOriginZFromLook(leftoverZ)).not.toBe(bootZ);
    expect(flashlightSpotVisibleFromLook(true)).not.toBe(bootVisible);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(flashlightSpotOriginXFromLook(leftoverFarX)).toBe(leftoverFarX);
    expect(flashlightSpotOriginXFromLook(leftoverFarX)).not.toBe(bootX);
    expect(flashlightSpotOriginZFromLook(leftoverFarZ)).toBe(leftoverFarZ);
    expect(flashlightSpotOriginZFromLook(leftoverFarZ)).not.toBe(bootZ);

    expect(flashlightSpotOriginXFromLook(0)).toBe(bootX);
    expect(flashlightSpotOriginZFromLook(0)).toBe(bootZ);
    expect(flashlightSpotVisibleFromLook(false)).toBe(bootVisible);
  });

  test("vivo on no usa el helper (origin avanza con look)", () => {
    const bootX = flashlightSpotOriginXAfterRestart();
    const bootZ = flashlightSpotOriginZAfterRestart();
    const bootVisible = flashlightSpotVisibleAfterRestart();
    const liveX = flashlightSpotOriginXFromLook(40);
    const liveZ = flashlightSpotOriginZFromLook(30);
    const liveVisible = flashlightSpotVisibleFromLook(true);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveVisible).toBe(true);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveVisible).not.toBe(bootVisible);
    expect(liveX).not.toBe(flashlightSpotOriginXAfterRestart());
    expect(liveZ).not.toBe(flashlightSpotOriginZAfterRestart());
    expect(liveVisible).not.toBe(flashlightSpotVisibleAfterRestart());

    expect(flashlightSpotOriginXFromLook(0)).toBe(bootX);
    expect(flashlightSpotOriginZFromLook(0)).toBe(bootZ);
    expect(flashlightSpotVisibleFromLook(false)).toBe(bootVisible);
    expect(flashlightSpotOriginXFromLook(24.5)).toBe(24.5);
    expect(flashlightSpotOriginZFromLook(15.5)).toBe(15.5);
  });
});

describe("torch spot recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace spot fresco; F9 no helper", () => {
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
    const coneSrc = readFileSync(
      resolve(process.cwd(), "src/render/flashlightCone.ts"),
      "utf8",
    );
    expect(coneSrc).toContain("flashlightSpotOriginXAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotOriginZAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotVisibleAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotOriginXFromLook(");
    expect(coneSrc).toContain("flashlightSpotOriginZFromLook(");
    expect(coneSrc).toContain("flashlightSpotVisibleFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_ORIGIN_X_SPAWN");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_ORIGIN_Z_SPAWN");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_VISIBLE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightSpotOriginXAfterRestart\([\s\S]{0,200}flashlightSpotOriginXFromLook\(/,
    );
    expect(coneSrc).toMatch(
      /flashlightSpotOriginZAfterRestart\([\s\S]{0,200}flashlightSpotOriginZFromLook\(/,
    );
    expect(coneSrc).toMatch(
      /flashlightSpotVisibleAfterRestart\([\s\S]{0,200}flashlightSpotVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightSpotOriginXAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotOriginZAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotVisibleAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotOriginXFromLook(");
    expect(viewSrc).toContain("flashlightSpotOriginZFromLook(");
    expect(viewSrc).toContain("flashlightSpotVisibleFromLook(");
    expect(viewSrc).toContain("flashlightSpotOriginXAfterRestart()");
    expect(viewSrc).toContain("flashlightSpotOriginZAfterRestart()");
    expect(viewSrc).toContain("flashlightSpotVisibleAfterRestart()");
    expect(viewSrc).toContain("flashlightSpotOriginXFromLook(wx)");
    expect(viewSrc).toContain("flashlightSpotOriginZFromLook(wy)");
    expect(viewSrc).toContain("flashlightSpotVisibleFromLook(on)");
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightSpotOriginXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightSpotOriginXAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightSpotOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightSpotOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightSpotOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightSpotOriginXAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightSpotOriginXAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotOriginZAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotVisibleAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotOriginXFromLook(");
    expect(gameSrc).not.toContain("flashlightSpotOriginZFromLook(");
    expect(gameSrc).not.toContain("flashlightSpotVisibleFromLook(");
    expect(saveSrc).not.toContain("flashlightSpotOriginXAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotOriginZAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotOriginXFromLook");
    expect(saveSrc).not.toContain("flashlightSpotOriginZFromLook");
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
