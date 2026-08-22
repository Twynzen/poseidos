import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FURNITURE_MESH_ROUGHNESS,
  FURNITURE_ROUGHNESS,
  FURNITURE_ROUGHNESS_SPAWN,
  furnitureRoughnessAfterRestart,
  furnitureRoughnessFromLook,
} from "../src/render/worldView";

describe("furnitureRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.8); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = furnitureRoughnessAfterRestart();
    expect(bootRoughness).toBe(
      furnitureRoughnessFromLook(FURNITURE_MESH_ROUGHNESS),
    );
    expect(bootRoughness).toBe(FURNITURE_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(FURNITURE_ROUGHNESS);
    expect(bootRoughness).toBe(FURNITURE_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.8);
    expect(furnitureRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.99;
    expect(furnitureRoughnessFromLook(leftoverRoughness)).toBe(
      leftoverRoughness,
    );
    expect(furnitureRoughnessFromLook(leftoverRoughness)).not.toBe(
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

    expect(furnitureRoughnessFromLook(0.8)).toBe(bootRoughness);
    expect(furnitureRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = furnitureRoughnessAfterRestart();
    const liveRoughness = furnitureRoughnessFromLook(0.8);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(furnitureRoughnessAfterRestart());
    expect(liveRoughness).toBe(FURNITURE_ROUGHNESS_SPAWN);

    expect(furnitureRoughnessFromLook(0.8)).toBe(bootRoughness);
    expect(furnitureRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });
});

describe("furniture mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("furnitureRoughnessAfterRestart(");
    expect(viewSrc).toContain("furnitureRoughnessFromLook(");
    expect(viewSrc).toContain("FURNITURE_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /furnitureRoughnessAfterRestart\([\s\S]{0,200}furnitureRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("furnitureRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: furnitureRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const furnitureMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}roughness:\s*0\.8(?!\d)/,
    );
    expect(viewSrc).not.toMatch(/furnitureMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}furnitureRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}furnitureRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}furnitureRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}furnitureRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}furnitureRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}furnitureRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}furnitureRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("furnitureRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("furnitureRoughnessFromLook(");
    expect(saveSrc).not.toContain("furnitureRoughnessAfterRestart");
    expect(saveSrc).not.toContain("furnitureRoughnessFromLook");
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
