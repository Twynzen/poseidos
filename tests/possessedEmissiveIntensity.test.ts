import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_EMISSIVE_INTENSITY_SPAWN,
  POSSESSED_MESH_EMISSIVE_INTENSITY,
  possessedEmissiveIntensityAfterRestart,
  possessedEmissiveIntensityFromLook,
} from "../src/render/worldView";

describe("possessedEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 0.55); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = possessedEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      possessedEmissiveIntensityFromLook(POSSESSED_MESH_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(POSSESSED_MESH_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(POSSESSED_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(0.55);
    expect(possessedEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 9;
    expect(possessedEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(possessedEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(possessedEmissiveIntensityFromLook(0.55)).toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = possessedEmissiveIntensityAfterRestart();
    const liveIntensity = possessedEmissiveIntensityFromLook(0.55);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(possessedEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(POSSESSED_EMISSIVE_INTENSITY_SPAWN);

    expect(possessedEmissiveIntensityFromLook(0.55)).toBe(bootIntensity);
    expect(possessedEmissiveIntensityFromLook(9)).not.toBe(bootIntensity);
  });
});

describe("possessed mesh emissiveIntensity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("possessedEmissiveIntensityFromLook(");
    expect(viewSrc).toContain("POSSESSED_EMISSIVE_INTENSITY_SPAWN");
    expect(viewSrc).toMatch(
      /possessedEmissiveIntensityAfterRestart\([\s\S]{0,200}possessedEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("possessedEmissiveIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "emissiveIntensity: possessedEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const possessedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}emissiveIntensity:\s*0\.55/,
    );
    expect(viewSrc).not.toMatch(/possessedMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("possessedEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("possessedEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("possessedEmissiveIntensityFromLook");
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
