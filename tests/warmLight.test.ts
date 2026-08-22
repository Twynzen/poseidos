import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WARM_LIGHT_ORIGIN_X_SPAWN,
  WARM_LIGHT_ORIGIN_Z_SPAWN,
  WARM_LIGHT_VISIBLE_SPAWN,
  warmLightOriginXAfterRestart,
  warmLightOriginXFromLook,
  warmLightOriginZAfterRestart,
  warmLightOriginZFromLook,
  warmLightVisibleAfterRestart,
  warmLightVisibleFromLook,
} from "../src/world/indoor";

describe("warmLightOriginAfterRestart (R / softReset)", () => {
  test("warm fresco (idle origin 0,0 / visible false); leftover mid-life origin / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootX = warmLightOriginXAfterRestart();
    const bootZ = warmLightOriginZAfterRestart();
    const bootVisible = warmLightVisibleAfterRestart();
    expect(bootX).toBe(warmLightOriginXFromLook(0));
    expect(bootZ).toBe(warmLightOriginZFromLook(0));
    expect(bootVisible).toBe(warmLightVisibleFromLook(false));
    expect(bootX).toBe(0);
    expect(bootZ).toBe(0);
    expect(bootVisible).toBe(false);
    expect(bootX).toBe(WARM_LIGHT_ORIGIN_X_SPAWN);
    expect(bootZ).toBe(WARM_LIGHT_ORIGIN_Z_SPAWN);
    expect(bootVisible).toBe(WARM_LIGHT_VISIBLE_SPAWN);
    expect(warmLightOriginXAfterRestart()).toBe(bootX);
    expect(warmLightOriginZAfterRestart()).toBe(bootZ);
    expect(warmLightVisibleAfterRestart()).toBe(bootVisible);

    const leftoverX = 24.5;
    const leftoverZ = 15.5;
    expect(leftoverX).toBe(barrio.spawn.x);
    expect(leftoverZ).toBe(barrio.spawn.y);
    expect(warmLightOriginXFromLook(leftoverX)).toBe(leftoverX);
    expect(warmLightOriginXFromLook(leftoverX)).not.toBe(bootX);
    expect(warmLightOriginZFromLook(leftoverZ)).toBe(leftoverZ);
    expect(warmLightOriginZFromLook(leftoverZ)).not.toBe(bootZ);
    expect(warmLightVisibleFromLook(true)).not.toBe(bootVisible);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(warmLightOriginXFromLook(leftoverFarX)).toBe(leftoverFarX);
    expect(warmLightOriginXFromLook(leftoverFarX)).not.toBe(bootX);
    expect(warmLightOriginZFromLook(leftoverFarZ)).toBe(leftoverFarZ);
    expect(warmLightOriginZFromLook(leftoverFarZ)).not.toBe(bootZ);

    expect(warmLightOriginXFromLook(0)).toBe(bootX);
    expect(warmLightOriginZFromLook(0)).toBe(bootZ);
    expect(warmLightVisibleFromLook(false)).toBe(bootVisible);
  });

  test("vivo on no usa el helper (origin avanza con look)", () => {
    const bootX = warmLightOriginXAfterRestart();
    const bootZ = warmLightOriginZAfterRestart();
    const bootVisible = warmLightVisibleAfterRestart();
    const liveX = warmLightOriginXFromLook(40);
    const liveZ = warmLightOriginZFromLook(30);
    const liveVisible = warmLightVisibleFromLook(true);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveVisible).toBe(true);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveVisible).not.toBe(bootVisible);
    expect(liveX).not.toBe(warmLightOriginXAfterRestart());
    expect(liveZ).not.toBe(warmLightOriginZAfterRestart());
    expect(liveVisible).not.toBe(warmLightVisibleAfterRestart());

    expect(warmLightOriginXFromLook(0)).toBe(bootX);
    expect(warmLightOriginZFromLook(0)).toBe(bootZ);
    expect(warmLightVisibleFromLook(false)).toBe(bootVisible);
    expect(warmLightOriginXFromLook(24.5)).toBe(24.5);
    expect(warmLightOriginZFromLook(15.5)).toBe(15.5);
  });
});

describe("warm light recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace warm fresco; F9 no helper", () => {
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
    const indoorSrc = readFileSync(
      resolve(process.cwd(), "src/world/indoor.ts"),
      "utf8",
    );
    expect(indoorSrc).toContain("warmLightOriginXAfterRestart(");
    expect(indoorSrc).toContain("warmLightOriginZAfterRestart(");
    expect(indoorSrc).toContain("warmLightVisibleAfterRestart(");
    expect(indoorSrc).toContain("warmLightOriginXFromLook(");
    expect(indoorSrc).toContain("warmLightOriginZFromLook(");
    expect(indoorSrc).toContain("warmLightVisibleFromLook(");
    expect(indoorSrc).toContain("WARM_LIGHT_ORIGIN_X_SPAWN");
    expect(indoorSrc).toContain("WARM_LIGHT_ORIGIN_Z_SPAWN");
    expect(indoorSrc).toContain("WARM_LIGHT_VISIBLE_SPAWN");
    expect(indoorSrc).toMatch(
      /warmLightOriginXAfterRestart\([\s\S]{0,200}warmLightOriginXFromLook\(/,
    );
    expect(indoorSrc).toMatch(
      /warmLightOriginZAfterRestart\([\s\S]{0,200}warmLightOriginZFromLook\(/,
    );
    expect(indoorSrc).toMatch(
      /warmLightVisibleAfterRestart\([\s\S]{0,200}warmLightVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("warmLightOriginXAfterRestart(");
    expect(viewSrc).toContain("warmLightOriginZAfterRestart(");
    expect(viewSrc).toContain("warmLightVisibleAfterRestart(");
    expect(viewSrc).toContain("warmLightOriginXFromLook(");
    expect(viewSrc).toContain("warmLightOriginZFromLook(");
    expect(viewSrc).toContain("warmLightVisibleFromLook(");
    expect(viewSrc).toContain("warmLightOriginXAfterRestart()");
    expect(viewSrc).toContain("warmLightOriginZAfterRestart()");
    expect(viewSrc).toContain("warmLightVisibleAfterRestart()");
    expect(viewSrc).toContain("warmLightOriginXFromLook(wx)");
    expect(viewSrc).toContain("warmLightOriginZFromLook(wy)");
    expect(viewSrc).toContain(
      "warmLightVisibleFromLook(i > WARM_LIGHT_VISIBLE_EPS)",
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}warmLightOriginXAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}warmLightOriginXAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightOriginXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}warmLightOriginXAfterRestart/,
    );
    expect(gameSrc).not.toContain("warmLightOriginXAfterRestart(");
    expect(gameSrc).not.toContain("warmLightOriginZAfterRestart(");
    expect(gameSrc).not.toContain("warmLightVisibleAfterRestart(");
    expect(gameSrc).not.toContain("warmLightOriginXFromLook(");
    expect(gameSrc).not.toContain("warmLightOriginZFromLook(");
    expect(gameSrc).not.toContain("warmLightVisibleFromLook(");
    expect(saveSrc).not.toContain("warmLightOriginXAfterRestart");
    expect(saveSrc).not.toContain("warmLightOriginZAfterRestart");
    expect(saveSrc).not.toContain("warmLightOriginXFromLook");
    expect(saveSrc).not.toContain("warmLightOriginZFromLook");
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
