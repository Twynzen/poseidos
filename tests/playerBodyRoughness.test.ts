import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_BODY_MESH_ROUGHNESS,
  PLAYER_BODY_ROUGHNESS_SPAWN,
  playerBodyRoughnessAfterRestart,
  playerBodyRoughnessFromLook,
} from "../src/render/worldView";

describe("playerBodyRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.45); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = playerBodyRoughnessAfterRestart();
    expect(bootRoughness).toBe(
      playerBodyRoughnessFromLook(PLAYER_BODY_MESH_ROUGHNESS),
    );
    expect(bootRoughness).toBe(PLAYER_BODY_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(PLAYER_BODY_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.45);
    expect(playerBodyRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 9;
    expect(playerBodyRoughnessFromLook(leftoverRoughness)).toBe(
      leftoverRoughness,
    );
    expect(playerBodyRoughnessFromLook(leftoverRoughness)).not.toBe(
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

    expect(playerBodyRoughnessFromLook(0.45)).toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = playerBodyRoughnessAfterRestart();
    const liveRoughness = playerBodyRoughnessFromLook(0.45);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(playerBodyRoughnessAfterRestart());
    expect(liveRoughness).toBe(PLAYER_BODY_ROUGHNESS_SPAWN);

    expect(playerBodyRoughnessFromLook(0.45)).toBe(bootRoughness);
    expect(playerBodyRoughnessFromLook(9)).not.toBe(bootRoughness);
  });
});

describe("player body mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("playerBodyRoughnessAfterRestart(");
    expect(viewSrc).toContain("playerBodyRoughnessFromLook(");
    expect(viewSrc).toContain("PLAYER_BODY_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /playerBodyRoughnessAfterRestart\([\s\S]{0,200}playerBodyRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("playerBodyRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: playerBodyRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerBodyMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,400}roughness:\s*0\.45/,
    );
    expect(viewSrc).not.toMatch(/playerBodyMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerBodyRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerBodyRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerBodyRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerBodyRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerBodyRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerBodyRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerBodyRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerBodyRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("playerBodyRoughnessFromLook(");
    expect(saveSrc).not.toContain("playerBodyRoughnessAfterRestart");
    expect(saveSrc).not.toContain("playerBodyRoughnessFromLook");
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
