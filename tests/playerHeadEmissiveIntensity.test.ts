import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_HEAD_EMISSIVE_INTENSITY_SPAWN,
  PLAYER_HEAD_MESH_EMISSIVE_INTENSITY,
  playerHeadEmissiveIntensityAfterRestart,
  playerHeadEmissiveIntensityFromLook,
} from "../src/render/worldView";

describe("playerHeadEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 0.22); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = playerHeadEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      playerHeadEmissiveIntensityFromLook(PLAYER_HEAD_MESH_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(PLAYER_HEAD_MESH_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(PLAYER_HEAD_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(0.22);
    expect(playerHeadEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 9;
    expect(playerHeadEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(playerHeadEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
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

    expect(playerHeadEmissiveIntensityFromLook(0.22)).toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = playerHeadEmissiveIntensityAfterRestart();
    const liveIntensity = playerHeadEmissiveIntensityFromLook(0.22);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(playerHeadEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(PLAYER_HEAD_EMISSIVE_INTENSITY_SPAWN);

    expect(playerHeadEmissiveIntensityFromLook(0.22)).toBe(bootIntensity);
    expect(playerHeadEmissiveIntensityFromLook(9)).not.toBe(bootIntensity);
  });
});

describe("player head mesh emissiveIntensity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("playerHeadEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("playerHeadEmissiveIntensityFromLook(");
    expect(viewSrc).toContain("PLAYER_HEAD_EMISSIVE_INTENSITY_SPAWN");
    expect(viewSrc).toMatch(
      /playerHeadEmissiveIntensityAfterRestart\([\s\S]{0,200}playerHeadEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("playerHeadEmissiveIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "emissiveIntensity: playerHeadEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const playerHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}emissiveIntensity:\s*0\.22/,
    );
    expect(viewSrc).not.toMatch(/playerHeadMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerHeadEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerHeadEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerHeadEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerHeadEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerHeadEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("playerHeadEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("playerHeadEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("playerHeadEmissiveIntensityFromLook");
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
