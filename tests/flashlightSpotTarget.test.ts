import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_SPOT_TARGET_X_SPAWN,
  FLASHLIGHT_SPOT_TARGET_Z_SPAWN,
  flashlightConeOffsetXAfterRestart,
  flashlightConeOffsetZAfterRestart,
  flashlightSpotOriginXAfterRestart,
  flashlightSpotOriginZAfterRestart,
  flashlightSpotTargetXAfterRestart,
  flashlightSpotTargetXFromLook,
  flashlightSpotTargetZAfterRestart,
  flashlightSpotTargetZFromLook,
} from "../src/render/flashlightCone";

describe("flashlightSpotTargetAfterRestart (R / softReset)", () => {
  test("target fresco (idle origin 0 + tip +Z); leftover mid-life target / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootX = flashlightSpotTargetXAfterRestart();
    const bootZ = flashlightSpotTargetZAfterRestart();
    expect(bootX).toBe(flashlightSpotTargetXFromLook(0));
    expect(bootZ).toBe(flashlightSpotTargetZFromLook(FLASHLIGHT_CONE_LENGTH));
    expect(bootX).toBe(0);
    expect(bootZ).toBe(FLASHLIGHT_CONE_LENGTH);
    expect(bootX).toBe(FLASHLIGHT_SPOT_TARGET_X_SPAWN);
    expect(bootZ).toBe(FLASHLIGHT_SPOT_TARGET_Z_SPAWN);
    expect(bootX).toBe(
      flashlightSpotOriginXAfterRestart() + flashlightConeOffsetXAfterRestart(),
    );
    expect(bootZ).toBe(
      flashlightSpotOriginZAfterRestart() + flashlightConeOffsetZAfterRestart(),
    );
    expect(flashlightSpotTargetXAfterRestart()).toBe(bootX);
    expect(flashlightSpotTargetZAfterRestart()).toBe(bootZ);

    const leftoverX = 24.5;
    const leftoverZ = 15.5;
    expect(leftoverX).toBe(barrio.spawn.x);
    expect(leftoverZ).toBe(barrio.spawn.y);
    expect(flashlightSpotTargetXFromLook(leftoverX)).toBe(leftoverX);
    expect(flashlightSpotTargetXFromLook(leftoverX)).not.toBe(bootX);
    expect(flashlightSpotTargetZFromLook(leftoverZ)).toBe(leftoverZ);
    expect(flashlightSpotTargetZFromLook(leftoverZ)).not.toBe(bootZ);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(flashlightSpotTargetXFromLook(leftoverFarX)).toBe(leftoverFarX);
    expect(flashlightSpotTargetXFromLook(leftoverFarX)).not.toBe(bootX);
    expect(flashlightSpotTargetZFromLook(leftoverFarZ)).toBe(leftoverFarZ);
    expect(flashlightSpotTargetZFromLook(leftoverFarZ)).not.toBe(bootZ);

    expect(flashlightSpotTargetXFromLook(0)).toBe(bootX);
    expect(flashlightSpotTargetZFromLook(FLASHLIGHT_CONE_LENGTH)).toBe(bootZ);
  });

  test("vivo on no usa el helper (target avanza con look)", () => {
    const bootX = flashlightSpotTargetXAfterRestart();
    const bootZ = flashlightSpotTargetZAfterRestart();
    const liveX = flashlightSpotTargetXFromLook(40);
    const liveZ = flashlightSpotTargetZFromLook(30);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveX).not.toBe(flashlightSpotTargetXAfterRestart());
    expect(liveZ).not.toBe(flashlightSpotTargetZAfterRestart());

    expect(flashlightSpotTargetXFromLook(0)).toBe(bootX);
    expect(flashlightSpotTargetZFromLook(FLASHLIGHT_CONE_LENGTH)).toBe(bootZ);
    expect(flashlightSpotTargetXFromLook(24.5)).toBe(24.5);
    expect(flashlightSpotTargetZFromLook(15.5)).toBe(15.5);
  });
});

describe("torch spot target recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace target fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightSpotTargetXAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotTargetZAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotTargetXFromLook(");
    expect(coneSrc).toContain("flashlightSpotTargetZFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_TARGET_X_SPAWN");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_TARGET_Z_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightSpotTargetXAfterRestart\([\s\S]{0,200}flashlightSpotTargetXFromLook\(/,
    );
    expect(coneSrc).toMatch(
      /flashlightSpotTargetZAfterRestart\([\s\S]{0,200}flashlightSpotTargetZFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightSpotTargetXAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotTargetZAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotTargetXFromLook(");
    expect(viewSrc).toContain("flashlightSpotTargetZFromLook(");
    expect(viewSrc).toContain("flashlightSpotTargetXAfterRestart()");
    expect(viewSrc).toContain("flashlightSpotTargetZAfterRestart()");
    expect(viewSrc).toContain("flashlightSpotTargetXFromLook(wx + tip.x)");
    expect(viewSrc).toContain("flashlightSpotTargetZFromLook(wy + tip.z)");
    expect(viewSrc).not.toMatch(
      /torchSpot\.target\.position\.set\(wx \+ tip\.x, FLASHLIGHT_SPOT_TARGET_Y, wy \+ tip\.z\)/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightSpotTargetXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightSpotTargetXAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3300}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightSpotTargetXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightSpotTargetXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightSpotTargetXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightSpotTargetXAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightSpotTargetXAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotTargetZAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotTargetXFromLook(");
    expect(gameSrc).not.toContain("flashlightSpotTargetZFromLook(");
    expect(saveSrc).not.toContain("flashlightSpotTargetXAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotTargetZAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotTargetXFromLook");
    expect(saveSrc).not.toContain("flashlightSpotTargetZFromLook");
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
