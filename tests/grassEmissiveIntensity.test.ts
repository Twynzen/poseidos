import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  GRASS_EMISSIVE_INTENSITY,
  GRASS_EMISSIVE_INTENSITY_SPAWN,
  grassEmissiveIntensityAfterRestart,
  grassEmissiveIntensityFromLook,
} from "../src/render/windGrass";

describe("grassEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = grassEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      grassEmissiveIntensityFromLook(GRASS_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(GRASS_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(GRASS_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(1);
    expect(grassEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 0.42;
    expect(grassEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(grassEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(grassEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(grassEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = grassEmissiveIntensityAfterRestart();
    const liveIntensity = grassEmissiveIntensityFromLook(1);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(grassEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(GRASS_EMISSIVE_INTENSITY_SPAWN);

    expect(grassEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(grassEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });
});

describe("grass mesh emissiveIntensity recreate lock (R / softReset)", () => {
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
    const grassSrc = readFileSync(
      resolve(process.cwd(), "src/render/windGrass.ts"),
      "utf8",
    );
    expect(grassSrc).toContain("grassEmissiveIntensityAfterRestart(");
    expect(grassSrc).toContain("grassEmissiveIntensityFromLook(");
    expect(grassSrc).toContain("GRASS_EMISSIVE_INTENSITY_SPAWN");
    expect(grassSrc).toMatch(
      /grassEmissiveIntensityAfterRestart\([\s\S]{0,200}grassEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("grassEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("grassEmissiveIntensityAfterRestart()");
    expect(viewSrc).not.toContain("grassEmissiveIntensityFromLook(");
    expect(viewSrc).toContain(
      "emissiveIntensity: grassEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}emissiveIntensity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/grassMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyGrassPoses\(\): void \{[\s\S]{0,400}grassEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}grassEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}grassEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}grassEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}grassEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("grassEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("grassEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("grassEmissiveIntensityFromLook");
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
