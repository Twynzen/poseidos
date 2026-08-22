import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLOOR_EMISSIVE_INTENSITY,
  FLOOR_EMISSIVE_INTENSITY_SPAWN,
  floorEmissiveIntensityAfterRestart,
  floorEmissiveIntensityFromLook,
} from "../src/render/worldView";

describe("floorEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = floorEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      floorEmissiveIntensityFromLook(FLOOR_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(FLOOR_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(FLOOR_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(1);
    expect(floorEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 0.42;
    expect(floorEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(floorEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(floorEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(floorEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = floorEmissiveIntensityAfterRestart();
    const liveIntensity = floorEmissiveIntensityFromLook(1);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(floorEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(FLOOR_EMISSIVE_INTENSITY_SPAWN);

    expect(floorEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(floorEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });
});

describe("floor mesh emissiveIntensity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("floorEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("floorEmissiveIntensityFromLook(");
    expect(viewSrc).toContain("FLOOR_EMISSIVE_INTENSITY_SPAWN");
    expect(viewSrc).toMatch(
      /floorEmissiveIntensityAfterRestart\([\s\S]{0,200}floorEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("floorEmissiveIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "emissiveIntensity: floorEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /function matForFloorColor\(color: number\): THREE\.MeshStandardMaterial \{[\s\S]{0,720}emissiveIntensity:\s*1/,
    );
    expect(viewSrc).not.toMatch(
      /floorMatByColor[\s\S]{0,800}emissiveIntensity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/floorMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function matForFloorColor[\s\S]{0,900}m\.emissiveIntensity\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}floorEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}floorEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}floorEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}floorEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}floorEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}floorEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}floorEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("floorEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("floorEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("floorEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("floorEmissiveIntensityFromLook");
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
