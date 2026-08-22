import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_FILL_DISTANCE_SPAWN,
  flashlightFillDistanceAfterRestart,
  flashlightFillDistanceFromLook,
} from "../src/render/flashlightCone";
import {
  FLASHLIGHT_FILL_DISTANCE_BASE,
  FLASHLIGHT_FILL_DISTANCE_GAIN,
} from "../src/render/worldView";

const LEFTOVER_CTOR_DISTANCE = 10;

describe("flashlightFillDistanceAfterRestart (R / softReset)", () => {
  test("distance fresco (idle BASE 8.05); leftover mid-life distance / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDistance = flashlightFillDistanceAfterRestart();
    expect(bootDistance).toBe(
      flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_BASE),
    );
    expect(bootDistance).toBe(
      FLASHLIGHT_FILL_DISTANCE_BASE + 0 * FLASHLIGHT_FILL_DISTANCE_GAIN,
    );
    expect(bootDistance).toBe(8.05);
    expect(bootDistance).toBe(FLASHLIGHT_FILL_DISTANCE_SPAWN);
    expect(bootDistance).not.toBe(LEFTOVER_CTOR_DISTANCE);
    expect(flashlightFillDistanceAfterRestart()).toBe(bootDistance);

    const leftoverDistance = LEFTOVER_CTOR_DISTANCE;
    expect(flashlightFillDistanceFromLook(leftoverDistance)).toBe(
      leftoverDistance,
    );
    expect(flashlightFillDistanceFromLook(leftoverDistance)).not.toBe(
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
      flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_BASE),
    ).toBe(bootDistance);
  });

  test("vivo on no usa el helper (distance avanza con look)", () => {
    const bootDistance = flashlightFillDistanceAfterRestart();
    const liveDistance = flashlightFillDistanceFromLook(
      FLASHLIGHT_FILL_DISTANCE_BASE + 1 * FLASHLIGHT_FILL_DISTANCE_GAIN,
    );
    expect(liveDistance).toBe(
      FLASHLIGHT_FILL_DISTANCE_BASE + FLASHLIGHT_FILL_DISTANCE_GAIN,
    );
    expect(liveDistance).not.toBe(bootDistance);
    expect(liveDistance).not.toBe(flashlightFillDistanceAfterRestart());
    expect(liveDistance).toBeGreaterThan(bootDistance);

    expect(
      flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_BASE),
    ).toBe(bootDistance);
    expect(
      flashlightFillDistanceFromLook(
        FLASHLIGHT_FILL_DISTANCE_BASE + 1 * FLASHLIGHT_FILL_DISTANCE_GAIN,
      ),
    ).toBe(liveDistance);
  });
});

describe("flashlight fill distance recreate lock (R / softReset)", () => {
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
    expect(coneSrc).toContain("flashlightFillDistanceAfterRestart(");
    expect(coneSrc).toContain("flashlightFillDistanceFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_DISTANCE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightFillDistanceAfterRestart\([\s\S]{0,200}flashlightFillDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightFillDistanceAfterRestart(");
    expect(viewSrc).toContain("flashlightFillDistanceFromLook(");
    expect(viewSrc).toContain("flashlightFillDistanceAfterRestart()");
    expect(viewSrc).toContain(
      "flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_BASE + i * FLASHLIGHT_FILL_DISTANCE_GAIN)",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(FLASHLIGHT_FILL_COLOR, 0, 10, FLASHLIGHT_FILL_DECAY\)/,
    );
    expect(viewSrc).not.toMatch(
      /torchLight\.distance = FLASHLIGHT_FILL_DISTANCE_BASE \+ i \* FLASHLIGHT_FILL_DISTANCE_GAIN;/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightFillDistanceAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightFillDistanceAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightFillDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightFillDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightFillDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightFillDistanceAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightFillDistanceAfterRestart(");
    expect(gameSrc).not.toContain("flashlightFillDistanceFromLook(");
    expect(saveSrc).not.toContain("flashlightFillDistanceAfterRestart");
    expect(saveSrc).not.toContain("flashlightFillDistanceFromLook");
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
