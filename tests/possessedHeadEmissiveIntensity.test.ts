import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_HEAD_EMISSIVE_INTENSITY_SPAWN,
  POSSESSED_HEAD_MESH_EMISSIVE_INTENSITY,
  possessedHeadEmissiveIntensityAfterRestart,
  possessedHeadEmissiveIntensityFromLook,
} from "../src/render/worldView";

describe("possessedHeadEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 0.7); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = possessedHeadEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      possessedHeadEmissiveIntensityFromLook(POSSESSED_HEAD_MESH_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(POSSESSED_HEAD_MESH_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(POSSESSED_HEAD_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(0.7);
    expect(possessedHeadEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 9;
    expect(possessedHeadEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(possessedHeadEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(possessedHeadEmissiveIntensityFromLook(0.7)).toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = possessedHeadEmissiveIntensityAfterRestart();
    const liveIntensity = possessedHeadEmissiveIntensityFromLook(0.7);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(possessedHeadEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(POSSESSED_HEAD_EMISSIVE_INTENSITY_SPAWN);

    expect(possessedHeadEmissiveIntensityFromLook(0.7)).toBe(bootIntensity);
    expect(possessedHeadEmissiveIntensityFromLook(9)).not.toBe(bootIntensity);
  });
});

describe("possessed head mesh emissiveIntensity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedHeadEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("possessedHeadEmissiveIntensityFromLook(");
    expect(viewSrc).toContain("POSSESSED_HEAD_EMISSIVE_INTENSITY_SPAWN");
    expect(viewSrc).toMatch(
      /possessedHeadEmissiveIntensityAfterRestart\([\s\S]{0,200}possessedHeadEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("possessedHeadEmissiveIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "emissiveIntensity: possessedHeadEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const possessedHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}emissiveIntensity:\s*0\.7/,
    );
    expect(viewSrc).not.toMatch(/possessedHeadMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedHeadEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedHeadEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedHeadEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedHeadEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("possessedHeadEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("possessedHeadEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("possessedHeadEmissiveIntensityFromLook");
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
