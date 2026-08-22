import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_HALF_WIDTH,
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_SPOT_ANGLE_SPAWN,
  flashlightSpotAngle,
  flashlightSpotAngleAfterRestart,
  flashlightSpotAngleFromLook,
} from "../src/render/flashlightCone";

describe("flashlightSpotAngleAfterRestart (R / softReset)", () => {
  test("angle fresco (idle flashlightSpotAngle()); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAngle = flashlightSpotAngleAfterRestart();
    expect(bootAngle).toBe(flashlightSpotAngleFromLook(flashlightSpotAngle()));
    expect(bootAngle).toBe(flashlightSpotAngle());
    expect(bootAngle).toBe(FLASHLIGHT_SPOT_ANGLE_SPAWN);
    expect(bootAngle).toBe(
      flashlightSpotAngle(FLASHLIGHT_CONE_LENGTH, FLASHLIGHT_CONE_HALF_WIDTH),
    );
    expect(flashlightSpotAngleAfterRestart()).toBe(bootAngle);

    const leftoverAngle = flashlightSpotAngle(
      FLASHLIGHT_CONE_LENGTH,
      FLASHLIGHT_CONE_HALF_WIDTH * 2,
    );
    expect(flashlightSpotAngleFromLook(leftoverAngle)).toBe(leftoverAngle);
    expect(flashlightSpotAngleFromLook(leftoverAngle)).not.toBe(bootAngle);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightSpotAngleFromLook(flashlightSpotAngle())).toBe(bootAngle);
  });

  test("vivo on no cambia angle (ctor constant; sync no escribe)", () => {
    const bootAngle = flashlightSpotAngleAfterRestart();
    const liveAngle = flashlightSpotAngleFromLook(flashlightSpotAngle());
    expect(liveAngle).toBe(bootAngle);
    expect(liveAngle).toBe(flashlightSpotAngleAfterRestart());
    expect(liveAngle).toBe(FLASHLIGHT_SPOT_ANGLE_SPAWN);

    expect(flashlightSpotAngleFromLook(flashlightSpotAngle())).toBe(bootAngle);
    expect(
      flashlightSpotAngleFromLook(
        flashlightSpotAngle(
          FLASHLIGHT_CONE_LENGTH,
          FLASHLIGHT_CONE_HALF_WIDTH * 2,
        ),
      ),
    ).not.toBe(bootAngle);
  });
});

describe("flashlight spot angle recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace angle fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightSpotAngleAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotAngleFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_ANGLE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightSpotAngleAfterRestart\([\s\S]{0,200}flashlightSpotAngleFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightSpotAngleAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotAngleAfterRestart()");
    expect(viewSrc).not.toContain("flashlightSpotAngleFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.SpotLight\(\s*FLASHLIGHT_SPOT_COLOR,\s*flashlightSpotIntensityAfterRestart\(\),\s*flashlightSpotDistanceAfterRestart\(\),\s*flashlightSpotAngle\(\)/,
    );
    expect(viewSrc).not.toMatch(/torchSpot\.angle\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightSpotAngleAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightSpotAngleAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightSpotAngleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightSpotAngleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightSpotAngleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightSpotAngleAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightSpotAngleAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotAngleFromLook(");
    expect(saveSrc).not.toContain("flashlightSpotAngleAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotAngleFromLook");
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
