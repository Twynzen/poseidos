import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_SPOT_DISTANCE_SPAWN,
  flashlightSpotDistanceAfterRestart,
  flashlightSpotDistanceFromLook,
} from "../src/render/flashlightCone";
import {
  FLASHLIGHT_SPOT_DISTANCE_EXTRA,
  FLASHLIGHT_SPOT_DISTANCE_GAIN,
} from "../src/render/worldView";

const LEFTOVER_CTOR_DISTANCE = FLASHLIGHT_CONE_LENGTH + 2.4;

describe("flashlightSpotDistanceAfterRestart (R / softReset)", () => {
  test("distance fresco (idle LENGTH+EXTRA 8.227675); leftover mid-life distance / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDistance = flashlightSpotDistanceAfterRestart();
    expect(bootDistance).toBe(
      flashlightSpotDistanceFromLook(
        FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA,
      ),
    );
    expect(bootDistance).toBe(
      FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA + 0 * FLASHLIGHT_SPOT_DISTANCE_GAIN,
    );
    expect(bootDistance).toBe(8.227675);
    expect(bootDistance).toBe(FLASHLIGHT_SPOT_DISTANCE_SPAWN);
    expect(bootDistance).not.toBe(LEFTOVER_CTOR_DISTANCE);
    expect(flashlightSpotDistanceAfterRestart()).toBe(bootDistance);

    const leftoverDistance = LEFTOVER_CTOR_DISTANCE;
    expect(flashlightSpotDistanceFromLook(leftoverDistance)).toBe(
      leftoverDistance,
    );
    expect(flashlightSpotDistanceFromLook(leftoverDistance)).not.toBe(
      bootDistance,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      flashlightSpotDistanceFromLook(
        FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA,
      ),
    ).toBe(bootDistance);
  });

  test("vivo on no usa el helper (distance avanza con look)", () => {
    const bootDistance = flashlightSpotDistanceAfterRestart();
    const liveDistance = flashlightSpotDistanceFromLook(
      FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA + 1 * FLASHLIGHT_SPOT_DISTANCE_GAIN,
    );
    expect(liveDistance).toBe(
      FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA + FLASHLIGHT_SPOT_DISTANCE_GAIN,
    );
    expect(liveDistance).not.toBe(bootDistance);
    expect(liveDistance).not.toBe(flashlightSpotDistanceAfterRestart());
    expect(liveDistance).toBeGreaterThan(bootDistance);

    expect(
      flashlightSpotDistanceFromLook(
        FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA,
      ),
    ).toBe(bootDistance);
    expect(
      flashlightSpotDistanceFromLook(
        FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA + 1 * FLASHLIGHT_SPOT_DISTANCE_GAIN,
      ),
    ).toBe(liveDistance);
  });
});

describe("flashlight spot distance recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace distance fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightSpotDistanceAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotDistanceFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_DISTANCE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightSpotDistanceAfterRestart\([\s\S]{0,200}flashlightSpotDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightSpotDistanceAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotDistanceFromLook(");
    expect(viewSrc).toContain("flashlightSpotDistanceAfterRestart()");
    expect(viewSrc).toContain(
      "flashlightSpotDistanceFromLook(FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA + i * FLASHLIGHT_SPOT_DISTANCE_GAIN)",
    );
    expect(viewSrc).not.toMatch(
      /FLASHLIGHT_CONE_LENGTH \+ 2\.4/,
    );
    expect(viewSrc).not.toMatch(
      /torchSpot\.distance = FLASHLIGHT_CONE_LENGTH \+ FLASHLIGHT_SPOT_DISTANCE_EXTRA \+ i \* FLASHLIGHT_SPOT_DISTANCE_GAIN;/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightSpotDistanceAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightSpotDistanceAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2900}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightSpotDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightSpotDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightSpotDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightSpotDistanceAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightSpotDistanceAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotDistanceFromLook(");
    expect(saveSrc).not.toContain("flashlightSpotDistanceAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotDistanceFromLook");
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
