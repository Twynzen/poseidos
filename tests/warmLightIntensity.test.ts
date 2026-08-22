import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WARM_LIGHT_INTENSITY_SPAWN,
  warmLightIntensityAfterRestart,
  warmLightIntensityFromLook,
} from "../src/world/indoor";
import { WARM_LIGHT_INTENSITY_MUL } from "../src/render/worldView";

describe("warmLightIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 0); leftover mid-life intensity / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = warmLightIntensityAfterRestart();
    expect(bootIntensity).toBe(warmLightIntensityFromLook(0));
    expect(bootIntensity).toBe(0 * WARM_LIGHT_INTENSITY_MUL);
    expect(bootIntensity).toBe(0);
    expect(bootIntensity).toBe(WARM_LIGHT_INTENSITY_SPAWN);
    expect(warmLightIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = WARM_LIGHT_INTENSITY_MUL;
    expect(warmLightIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(warmLightIntensityFromLook(leftoverIntensity)).not.toBe(
      bootIntensity,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(warmLightIntensityFromLook(0)).toBe(bootIntensity);
  });

  test("vivo on no usa el helper (intensity avanza con look)", () => {
    const bootIntensity = warmLightIntensityAfterRestart();
    const liveIntensity = warmLightIntensityFromLook(
      1 * WARM_LIGHT_INTENSITY_MUL,
    );
    expect(liveIntensity).toBe(WARM_LIGHT_INTENSITY_MUL);
    expect(liveIntensity).not.toBe(bootIntensity);
    expect(liveIntensity).not.toBe(warmLightIntensityAfterRestart());
    expect(liveIntensity).toBeGreaterThan(bootIntensity);

    expect(warmLightIntensityFromLook(0)).toBe(bootIntensity);
    expect(
      warmLightIntensityFromLook(1 * WARM_LIGHT_INTENSITY_MUL),
    ).toBe(liveIntensity);
  });
});

describe("warm light intensity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace intensity fresco; F9 no helper", () => {
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
    expect(indoorSrc).toContain("warmLightIntensityAfterRestart(");
    expect(indoorSrc).toContain("warmLightIntensityFromLook(");
    expect(indoorSrc).toContain("WARM_LIGHT_INTENSITY_SPAWN");
    expect(indoorSrc).toMatch(
      /warmLightIntensityAfterRestart\([\s\S]{0,200}warmLightIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("warmLightIntensityAfterRestart(");
    expect(viewSrc).toContain("warmLightIntensityFromLook(");
    expect(viewSrc).toContain("warmLightIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "warmLightIntensityFromLook(i * WARM_LIGHT_INTENSITY_MUL)",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(WARM_LIGHT_COLOR, 0, warmLightDistanceAfterRestart\(\), WARM_LIGHT_DECAY\)/,
    );
    expect(viewSrc).not.toMatch(
      /warmLight\.intensity = i \* WARM_LIGHT_INTENSITY_MUL;/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}warmLightIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}warmLightIntensityAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3600}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}warmLightIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("warmLightIntensityAfterRestart(");
    expect(gameSrc).not.toContain("warmLightIntensityFromLook(");
    expect(saveSrc).not.toContain("warmLightIntensityAfterRestart");
    expect(saveSrc).not.toContain("warmLightIntensityFromLook");
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
