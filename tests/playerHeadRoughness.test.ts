import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_HEAD_MESH_ROUGHNESS,
  PLAYER_HEAD_ROUGHNESS_SPAWN,
  playerHeadRoughnessAfterRestart,
  playerHeadRoughnessFromLook,
} from "../src/render/worldView";

describe("playerHeadRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.4); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = playerHeadRoughnessAfterRestart();
    expect(bootRoughness).toBe(
      playerHeadRoughnessFromLook(PLAYER_HEAD_MESH_ROUGHNESS),
    );
    expect(bootRoughness).toBe(PLAYER_HEAD_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(PLAYER_HEAD_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.4);
    expect(playerHeadRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 9;
    expect(playerHeadRoughnessFromLook(leftoverRoughness)).toBe(
      leftoverRoughness,
    );
    expect(playerHeadRoughnessFromLook(leftoverRoughness)).not.toBe(
      bootRoughness,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerHeadRoughnessFromLook(0.4)).toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = playerHeadRoughnessAfterRestart();
    const liveRoughness = playerHeadRoughnessFromLook(0.4);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(playerHeadRoughnessAfterRestart());
    expect(liveRoughness).toBe(PLAYER_HEAD_ROUGHNESS_SPAWN);

    expect(playerHeadRoughnessFromLook(0.4)).toBe(bootRoughness);
    expect(playerHeadRoughnessFromLook(9)).not.toBe(bootRoughness);
  });
});

describe("player head mesh roughness recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace roughness fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("playerHeadRoughnessAfterRestart(");
    expect(viewSrc).toContain("playerHeadRoughnessFromLook(");
    expect(viewSrc).toContain("PLAYER_HEAD_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /playerHeadRoughnessAfterRestart\([\s\S]{0,200}playerHeadRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("playerHeadRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: playerHeadRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,400}roughness:\s*0\.4/,
    );
    expect(viewSrc).not.toMatch(/playerHeadMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerHeadRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerHeadRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerHeadRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerHeadRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("playerHeadRoughnessFromLook(");
    expect(saveSrc).not.toContain("playerHeadRoughnessAfterRestart");
    expect(saveSrc).not.toContain("playerHeadRoughnessFromLook");
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
