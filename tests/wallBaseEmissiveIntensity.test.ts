import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WALL_BASE_EMISSIVE_INTENSITY,
  WALL_BASE_EMISSIVE_INTENSITY_SPAWN,
  wallBaseEmissiveIntensityAfterRestart,
  wallBaseEmissiveIntensityFromLook,
} from "../src/render/worldView";

describe("wallBaseEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = wallBaseEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      wallBaseEmissiveIntensityFromLook(WALL_BASE_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(WALL_BASE_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(WALL_BASE_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(1);
    expect(wallBaseEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 0.42;
    expect(wallBaseEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(wallBaseEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(wallBaseEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(wallBaseEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = wallBaseEmissiveIntensityAfterRestart();
    const liveIntensity = wallBaseEmissiveIntensityFromLook(1);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(wallBaseEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(WALL_BASE_EMISSIVE_INTENSITY_SPAWN);

    expect(wallBaseEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(wallBaseEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });
});

describe("wall-base mesh emissiveIntensity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("wallBaseEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("wallBaseEmissiveIntensityFromLook(");
    expect(viewSrc).toContain("WALL_BASE_EMISSIVE_INTENSITY_SPAWN");
    expect(viewSrc).toMatch(
      /wallBaseEmissiveIntensityAfterRestart\([\s\S]{0,200}wallBaseEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("wallBaseEmissiveIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "emissiveIntensity: wallBaseEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const wallBaseMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}emissiveIntensity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/wallBaseMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}wallBaseEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}wallBaseEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}wallBaseEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}wallBaseEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}wallBaseEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}wallBaseEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}wallBaseEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("wallBaseEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("wallBaseEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("wallBaseEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("wallBaseEmissiveIntensityFromLook");
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
