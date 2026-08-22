import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_FILL_ORIGIN_X_SPAWN,
  FLASHLIGHT_FILL_ORIGIN_Z_SPAWN,
  FLASHLIGHT_FILL_VISIBLE_SPAWN,
  flashlightFillOriginXAfterRestart,
  flashlightFillOriginXFromLook,
  flashlightFillOriginZAfterRestart,
  flashlightFillOriginZFromLook,
  flashlightFillVisibleAfterRestart,
  flashlightFillVisibleFromLook,
} from "../src/render/flashlightCone";

describe("flashlightFillAfterRestart (R / softReset)", () => {
  test("fill fresco (idle origin 0,0 / visible false); leftover mid-life origin / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootX = flashlightFillOriginXAfterRestart();
    const bootZ = flashlightFillOriginZAfterRestart();
    const bootVisible = flashlightFillVisibleAfterRestart();
    expect(bootX).toBe(flashlightFillOriginXFromLook(0));
    expect(bootZ).toBe(flashlightFillOriginZFromLook(0));
    expect(bootVisible).toBe(flashlightFillVisibleFromLook(false));
    expect(bootX).toBe(0);
    expect(bootZ).toBe(0);
    expect(bootVisible).toBe(false);
    expect(bootX).toBe(FLASHLIGHT_FILL_ORIGIN_X_SPAWN);
    expect(bootZ).toBe(FLASHLIGHT_FILL_ORIGIN_Z_SPAWN);
    expect(bootVisible).toBe(FLASHLIGHT_FILL_VISIBLE_SPAWN);
    expect(flashlightFillOriginXAfterRestart()).toBe(bootX);
    expect(flashlightFillOriginZAfterRestart()).toBe(bootZ);
    expect(flashlightFillVisibleAfterRestart()).toBe(bootVisible);

    const leftoverX = 24.5;
    const leftoverZ = 15.5;
    expect(leftoverX).toBe(barrio.spawn.x);
    expect(leftoverZ).toBe(barrio.spawn.y);
    expect(flashlightFillOriginXFromLook(leftoverX)).toBe(leftoverX);
    expect(flashlightFillOriginXFromLook(leftoverX)).not.toBe(bootX);
    expect(flashlightFillOriginZFromLook(leftoverZ)).toBe(leftoverZ);
    expect(flashlightFillOriginZFromLook(leftoverZ)).not.toBe(bootZ);
    expect(flashlightFillVisibleFromLook(true)).not.toBe(bootVisible);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(flashlightFillOriginXFromLook(leftoverFarX)).toBe(leftoverFarX);
    expect(flashlightFillOriginXFromLook(leftoverFarX)).not.toBe(bootX);
    expect(flashlightFillOriginZFromLook(leftoverFarZ)).toBe(leftoverFarZ);
    expect(flashlightFillOriginZFromLook(leftoverFarZ)).not.toBe(bootZ);

    expect(flashlightFillOriginXFromLook(0)).toBe(bootX);
    expect(flashlightFillOriginZFromLook(0)).toBe(bootZ);
    expect(flashlightFillVisibleFromLook(false)).toBe(bootVisible);
  });

  test("vivo on no usa el helper (origin avanza con look)", () => {
    const bootX = flashlightFillOriginXAfterRestart();
    const bootZ = flashlightFillOriginZAfterRestart();
    const bootVisible = flashlightFillVisibleAfterRestart();
    const liveX = flashlightFillOriginXFromLook(40);
    const liveZ = flashlightFillOriginZFromLook(30);
    const liveVisible = flashlightFillVisibleFromLook(true);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveVisible).toBe(true);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveVisible).not.toBe(bootVisible);
    expect(liveX).not.toBe(flashlightFillOriginXAfterRestart());
    expect(liveZ).not.toBe(flashlightFillOriginZAfterRestart());
    expect(liveVisible).not.toBe(flashlightFillVisibleAfterRestart());

    expect(flashlightFillOriginXFromLook(0)).toBe(bootX);
    expect(flashlightFillOriginZFromLook(0)).toBe(bootZ);
    expect(flashlightFillVisibleFromLook(false)).toBe(bootVisible);
    expect(flashlightFillOriginXFromLook(24.5)).toBe(24.5);
    expect(flashlightFillOriginZFromLook(15.5)).toBe(15.5);
  });
});

describe("torch fill recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace fill fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightFillOriginXAfterRestart(");
    expect(coneSrc).toContain("flashlightFillOriginZAfterRestart(");
    expect(coneSrc).toContain("flashlightFillVisibleAfterRestart(");
    expect(coneSrc).toContain("flashlightFillDistanceAfterRestart(");
    expect(coneSrc).toContain("flashlightFillOriginXFromLook(");
    expect(coneSrc).toContain("flashlightFillOriginZFromLook(");
    expect(coneSrc).toContain("flashlightFillVisibleFromLook(");
    expect(coneSrc).toContain("flashlightFillDistanceFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_ORIGIN_X_SPAWN");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_ORIGIN_Z_SPAWN");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_VISIBLE_SPAWN");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_DISTANCE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightFillOriginXAfterRestart\([\s\S]{0,200}flashlightFillOriginXFromLook\(/,
    );
    expect(coneSrc).toMatch(
      /flashlightFillOriginZAfterRestart\([\s\S]{0,200}flashlightFillOriginZFromLook\(/,
    );
    expect(coneSrc).toMatch(
      /flashlightFillVisibleAfterRestart\([\s\S]{0,200}flashlightFillVisibleFromLook\(/,
    );
    expect(coneSrc).toMatch(
      /flashlightFillDistanceAfterRestart\([\s\S]{0,200}flashlightFillDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightFillOriginXAfterRestart(");
    expect(viewSrc).toContain("flashlightFillOriginZAfterRestart(");
    expect(viewSrc).toContain("flashlightFillVisibleAfterRestart(");
    expect(viewSrc).toContain("flashlightFillOriginXFromLook(");
    expect(viewSrc).toContain("flashlightFillOriginZFromLook(");
    expect(viewSrc).toContain("flashlightFillVisibleFromLook(");
    expect(viewSrc).toContain("flashlightFillDistanceAfterRestart(");
    expect(viewSrc).toContain("flashlightFillDistanceFromLook(");
    expect(viewSrc).toContain("flashlightFillOriginXAfterRestart()");
    expect(viewSrc).toContain("flashlightFillOriginZAfterRestart()");
    expect(viewSrc).toContain("flashlightFillVisibleAfterRestart()");
    expect(viewSrc).toContain("flashlightFillDistanceAfterRestart()");
    expect(viewSrc).toContain("flashlightFillOriginXFromLook(wx)");
    expect(viewSrc).toContain("flashlightFillOriginZFromLook(wy)");
    expect(viewSrc).toContain("flashlightFillVisibleFromLook(on)");
    expect(viewSrc).toContain(
      "flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_BASE + i * FLASHLIGHT_FILL_DISTANCE_GAIN)",
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightFillOriginXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightFillOriginXAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightFillOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightFillOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightFillOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightFillOriginXAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightFillOriginXAfterRestart(");
    expect(gameSrc).not.toContain("flashlightFillOriginZAfterRestart(");
    expect(gameSrc).not.toContain("flashlightFillVisibleAfterRestart(");
    expect(gameSrc).not.toContain("flashlightFillOriginXFromLook(");
    expect(gameSrc).not.toContain("flashlightFillOriginZFromLook(");
    expect(gameSrc).not.toContain("flashlightFillVisibleFromLook(");
    expect(saveSrc).not.toContain("flashlightFillOriginXAfterRestart");
    expect(saveSrc).not.toContain("flashlightFillOriginZAfterRestart");
    expect(saveSrc).not.toContain("flashlightFillOriginXFromLook");
    expect(saveSrc).not.toContain("flashlightFillOriginZFromLook");
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
