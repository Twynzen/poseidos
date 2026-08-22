import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_FILL_INTENSITY_MUL,
  FLASHLIGHT_FILL_INTENSITY_SPAWN,
  flashlightFillIntensityAfterRestart,
  flashlightFillIntensityFromLook,
} from "../src/render/flashlightCone";

describe("flashlightFillIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 0); leftover mid-life intensity / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = flashlightFillIntensityAfterRestart();
    expect(bootIntensity).toBe(flashlightFillIntensityFromLook(0));
    expect(bootIntensity).toBe(0 * FLASHLIGHT_FILL_INTENSITY_MUL);
    expect(bootIntensity).toBe(0);
    expect(bootIntensity).toBe(FLASHLIGHT_FILL_INTENSITY_SPAWN);
    expect(flashlightFillIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = FLASHLIGHT_FILL_INTENSITY_MUL;
    expect(flashlightFillIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(flashlightFillIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(flashlightFillIntensityFromLook(0)).toBe(bootIntensity);
  });

  test("vivo on no usa el helper (intensity avanza con look)", () => {
    const bootIntensity = flashlightFillIntensityAfterRestart();
    const liveIntensity = flashlightFillIntensityFromLook(
      1 * FLASHLIGHT_FILL_INTENSITY_MUL,
    );
    expect(liveIntensity).toBe(FLASHLIGHT_FILL_INTENSITY_MUL);
    expect(liveIntensity).not.toBe(bootIntensity);
    expect(liveIntensity).not.toBe(flashlightFillIntensityAfterRestart());
    expect(liveIntensity).toBeGreaterThan(bootIntensity);

    expect(flashlightFillIntensityFromLook(0)).toBe(bootIntensity);
    expect(
      flashlightFillIntensityFromLook(1 * FLASHLIGHT_FILL_INTENSITY_MUL),
    ).toBe(liveIntensity);
  });
});

describe("flashlight fill intensity recreate lock (R / softReset)", () => {
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
    const coneSrc = readFileSync(
      resolve(process.cwd(), "src/render/flashlightCone.ts"),
      "utf8",
    );
    expect(coneSrc).toContain("flashlightFillIntensityAfterRestart(");
    expect(coneSrc).toContain("flashlightFillIntensityFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_INTENSITY_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightFillIntensityAfterRestart\([\s\S]{0,200}flashlightFillIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightFillIntensityAfterRestart(");
    expect(viewSrc).toContain("flashlightFillIntensityFromLook(");
    expect(viewSrc).toContain("flashlightFillIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "flashlightFillIntensityFromLook(i * FLASHLIGHT_FILL_INTENSITY_MUL)",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(FLASHLIGHT_FILL_COLOR, 0, flashlightFillDistanceAfterRestart\(\), FLASHLIGHT_FILL_DECAY\)/,
    );
    expect(viewSrc).not.toMatch(
      /torchLight\.intensity = i \* FLASHLIGHT_FILL_INTENSITY_MUL;/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightFillIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightFillIntensityAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3100}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightFillIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightFillIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightFillIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightFillIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightFillIntensityAfterRestart(");
    expect(gameSrc).not.toContain("flashlightFillIntensityFromLook(");
    expect(saveSrc).not.toContain("flashlightFillIntensityAfterRestart");
    expect(saveSrc).not.toContain("flashlightFillIntensityFromLook");
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
