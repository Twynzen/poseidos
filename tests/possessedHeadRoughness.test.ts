import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_HEAD_MESH_ROUGHNESS,
  POSSESSED_HEAD_ROUGHNESS,
  POSSESSED_HEAD_ROUGHNESS_SPAWN,
  possessedHeadRoughnessAfterRestart,
  possessedHeadRoughnessFromLook,
} from "../src/render/worldView";

describe("possessedHeadRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.45); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = possessedHeadRoughnessAfterRestart();
    expect(bootRoughness).toBe(
      possessedHeadRoughnessFromLook(POSSESSED_HEAD_MESH_ROUGHNESS),
    );
    expect(bootRoughness).toBe(POSSESSED_HEAD_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(POSSESSED_HEAD_ROUGHNESS);
    expect(bootRoughness).toBe(POSSESSED_HEAD_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.45);
    expect(possessedHeadRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.99;
    expect(possessedHeadRoughnessFromLook(leftoverRoughness)).toBe(
      leftoverRoughness,
    );
    expect(possessedHeadRoughnessFromLook(leftoverRoughness)).not.toBe(
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

    expect(possessedHeadRoughnessFromLook(0.45)).toBe(bootRoughness);
    expect(possessedHeadRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = possessedHeadRoughnessAfterRestart();
    const liveRoughness = possessedHeadRoughnessFromLook(0.45);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(possessedHeadRoughnessAfterRestart());
    expect(liveRoughness).toBe(POSSESSED_HEAD_ROUGHNESS_SPAWN);

    expect(possessedHeadRoughnessFromLook(0.45)).toBe(bootRoughness);
    expect(possessedHeadRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });
});

describe("possessed head mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedHeadRoughnessAfterRestart(");
    expect(viewSrc).toContain("possessedHeadRoughnessFromLook(");
    expect(viewSrc).toContain("POSSESSED_HEAD_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /possessedHeadRoughnessAfterRestart\([\s\S]{0,200}possessedHeadRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("possessedHeadRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: possessedHeadRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}roughness:\s*0\.45/,
    );
    expect(viewSrc).not.toMatch(/possessedHeadMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedHeadRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedHeadRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedHeadRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedHeadRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedHeadRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("possessedHeadRoughnessFromLook(");
    expect(saveSrc).not.toContain("possessedHeadRoughnessAfterRestart");
    expect(saveSrc).not.toContain("possessedHeadRoughnessFromLook");
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
