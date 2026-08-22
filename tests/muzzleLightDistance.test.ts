import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_LIGHT_DISTANCE_SPAWN,
  muzzleLightDistanceAfterRestart,
  muzzleLightDistanceFromLook,
} from "../src/render/muzzleFlash";
import { MUZZLE_LIGHT_DISTANCE } from "../src/render/worldView";

describe("muzzleLightDistanceAfterRestart (R / softReset)", () => {
  test("distance fresco (idle MUZZLE_LIGHT_DISTANCE); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDistance = muzzleLightDistanceAfterRestart();
    expect(bootDistance).toBe(muzzleLightDistanceFromLook(MUZZLE_LIGHT_DISTANCE));
    expect(bootDistance).toBe(MUZZLE_LIGHT_DISTANCE);
    expect(bootDistance).toBe(MUZZLE_LIGHT_DISTANCE_SPAWN);
    expect(bootDistance).toBe(2.6);
    expect(muzzleLightDistanceAfterRestart()).toBe(bootDistance);

    const leftoverDistance = MUZZLE_LIGHT_DISTANCE * 2;
    expect(muzzleLightDistanceFromLook(leftoverDistance)).toBe(leftoverDistance);
    expect(muzzleLightDistanceFromLook(leftoverDistance)).not.toBe(bootDistance);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(muzzleLightDistanceFromLook(MUZZLE_LIGHT_DISTANCE)).toBe(
      bootDistance,
    );
  });

  test("vivo on no cambia distance (ctor constant; sync no escribe)", () => {
    const bootDistance = muzzleLightDistanceAfterRestart();
    const liveDistance = muzzleLightDistanceFromLook(MUZZLE_LIGHT_DISTANCE);
    expect(liveDistance).toBe(bootDistance);
    expect(liveDistance).toBe(muzzleLightDistanceAfterRestart());
    expect(liveDistance).toBe(MUZZLE_LIGHT_DISTANCE_SPAWN);

    expect(muzzleLightDistanceFromLook(MUZZLE_LIGHT_DISTANCE)).toBe(
      bootDistance,
    );
    expect(muzzleLightDistanceFromLook(MUZZLE_LIGHT_DISTANCE * 2)).not.toBe(
      bootDistance,
    );
  });
});

describe("muzzle light distance recreate lock (R / softReset)", () => {
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
    const flashSrc = readFileSync(
      resolve(process.cwd(), "src/render/muzzleFlash.ts"),
      "utf8",
    );
    expect(flashSrc).toContain("muzzleLightDistanceAfterRestart(");
    expect(flashSrc).toContain("muzzleLightDistanceFromLook(");
    expect(flashSrc).toContain("MUZZLE_LIGHT_DISTANCE_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleLightDistanceAfterRestart\([\s\S]{0,200}muzzleLightDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleLightDistanceAfterRestart(");
    expect(viewSrc).toContain("muzzleLightDistanceAfterRestart()");
    expect(viewSrc).not.toContain("muzzleLightDistanceFromLook(");
    expect(viewSrc).toContain(
      "muzzleLightDistanceAfterRestart(),\n    muzzleLightDecayAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*muzzleLightColorAfterRestart\(\),\s*0,\s*MUZZLE_LIGHT_DISTANCE,\s*muzzleLightDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(/muzzleLight\.distance\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleLightDistanceAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleLightDistanceAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleLightDistanceAfterRestart(");
    expect(gameSrc).not.toContain("muzzleLightDistanceFromLook(");
    expect(saveSrc).not.toContain("muzzleLightDistanceAfterRestart");
    expect(saveSrc).not.toContain("muzzleLightDistanceFromLook");
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
