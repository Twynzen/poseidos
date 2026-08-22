import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WARM_LIGHT_DISTANCE_SPAWN,
  warmLightDistanceAfterRestart,
  warmLightDistanceFromLook,
} from "../src/world/indoor";
import {
  WARM_LIGHT_DISTANCE_BASE,
  WARM_LIGHT_DISTANCE_GAIN,
} from "../src/render/worldView";

const LEFTOVER_CTOR_DISTANCE = 7.5;

describe("warmLightDistanceAfterRestart (R / softReset)", () => {
  test("distance fresco (idle BASE 7.475); leftover mid-life distance / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDistance = warmLightDistanceAfterRestart();
    expect(bootDistance).toBe(
      warmLightDistanceFromLook(WARM_LIGHT_DISTANCE_BASE),
    );
    expect(bootDistance).toBe(
      WARM_LIGHT_DISTANCE_BASE + 0 * WARM_LIGHT_DISTANCE_GAIN,
    );
    expect(bootDistance).toBe(7.475);
    expect(bootDistance).toBe(WARM_LIGHT_DISTANCE_SPAWN);
    expect(bootDistance).not.toBe(LEFTOVER_CTOR_DISTANCE);
    expect(warmLightDistanceAfterRestart()).toBe(bootDistance);

    const leftoverDistance = LEFTOVER_CTOR_DISTANCE;
    expect(warmLightDistanceFromLook(leftoverDistance)).toBe(leftoverDistance);
    expect(warmLightDistanceFromLook(leftoverDistance)).not.toBe(bootDistance);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(warmLightDistanceFromLook(WARM_LIGHT_DISTANCE_BASE)).toBe(
      bootDistance,
    );
  });

  test("vivo on no usa el helper (distance avanza con look)", () => {
    const bootDistance = warmLightDistanceAfterRestart();
    const liveDistance = warmLightDistanceFromLook(
      WARM_LIGHT_DISTANCE_BASE + 1 * WARM_LIGHT_DISTANCE_GAIN,
    );
    expect(liveDistance).toBe(
      WARM_LIGHT_DISTANCE_BASE + WARM_LIGHT_DISTANCE_GAIN,
    );
    expect(liveDistance).not.toBe(bootDistance);
    expect(liveDistance).not.toBe(warmLightDistanceAfterRestart());
    expect(liveDistance).toBeGreaterThan(bootDistance);

    expect(warmLightDistanceFromLook(WARM_LIGHT_DISTANCE_BASE)).toBe(
      bootDistance,
    );
    expect(
      warmLightDistanceFromLook(
        WARM_LIGHT_DISTANCE_BASE + 1 * WARM_LIGHT_DISTANCE_GAIN,
      ),
    ).toBe(liveDistance);
  });
});

describe("warm light distance recreate lock (R / softReset)", () => {
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
    const indoorSrc = readFileSync(
      resolve(process.cwd(), "src/world/indoor.ts"),
      "utf8",
    );
    expect(indoorSrc).toContain("warmLightDistanceAfterRestart(");
    expect(indoorSrc).toContain("warmLightDistanceFromLook(");
    expect(indoorSrc).toContain("WARM_LIGHT_DISTANCE_SPAWN");
    expect(indoorSrc).toMatch(
      /warmLightDistanceAfterRestart\([\s\S]{0,200}warmLightDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("warmLightDistanceAfterRestart(");
    expect(viewSrc).toContain("warmLightDistanceFromLook(");
    expect(viewSrc).toContain("warmLightDistanceAfterRestart()");
    expect(viewSrc).toContain(
      "warmLightDistanceFromLook(WARM_LIGHT_DISTANCE_BASE + i * WARM_LIGHT_DISTANCE_GAIN)",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(WARM_LIGHT_COLOR, 0, 7\.5, WARM_LIGHT_DECAY\)/,
    );
    expect(viewSrc).not.toMatch(
      /warmLight\.distance = WARM_LIGHT_DISTANCE_BASE \+ i \* WARM_LIGHT_DISTANCE_GAIN;/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}warmLightDistanceAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}warmLightDistanceAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3400}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}warmLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toContain("warmLightDistanceAfterRestart(");
    expect(gameSrc).not.toContain("warmLightDistanceFromLook(");
    expect(saveSrc).not.toContain("warmLightDistanceAfterRestart");
    expect(saveSrc).not.toContain("warmLightDistanceFromLook");
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
