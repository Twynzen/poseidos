import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WALL_BASE_MESH_ROUGHNESS,
  WALL_BASE_ROUGHNESS,
  WALL_BASE_ROUGHNESS_SPAWN,
  wallBaseRoughnessAfterRestart,
  wallBaseRoughnessFromLook,
} from "../src/render/worldView";

describe("wallBaseRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = wallBaseRoughnessAfterRestart();
    expect(bootRoughness).toBe(wallBaseRoughnessFromLook(WALL_BASE_MESH_ROUGHNESS));
    expect(bootRoughness).toBe(WALL_BASE_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(WALL_BASE_ROUGHNESS);
    expect(bootRoughness).toBe(WALL_BASE_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(1);
    expect(wallBaseRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.1;
    expect(wallBaseRoughnessFromLook(leftoverRoughness)).toBe(leftoverRoughness);
    expect(wallBaseRoughnessFromLook(leftoverRoughness)).not.toBe(bootRoughness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(wallBaseRoughnessFromLook(1)).toBe(bootRoughness);
    expect(wallBaseRoughnessFromLook(0.1)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = wallBaseRoughnessAfterRestart();
    const liveRoughness = wallBaseRoughnessFromLook(1);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(wallBaseRoughnessAfterRestart());
    expect(liveRoughness).toBe(WALL_BASE_ROUGHNESS_SPAWN);

    expect(wallBaseRoughnessFromLook(1)).toBe(bootRoughness);
    expect(wallBaseRoughnessFromLook(0.1)).not.toBe(bootRoughness);
  });
});

describe("wall-base mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("wallBaseRoughnessAfterRestart(");
    expect(viewSrc).toContain("wallBaseRoughnessFromLook(");
    expect(viewSrc).toContain("WALL_BASE_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /wallBaseRoughnessAfterRestart\([\s\S]{0,200}wallBaseRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("wallBaseRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: wallBaseRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const wallBaseMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,280}roughness:\s*1(?!\d)/,
    );
    expect(viewSrc).not.toMatch(/wallBaseMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}wallBaseRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}wallBaseRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}wallBaseRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}wallBaseRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}wallBaseRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}wallBaseRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}wallBaseRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("wallBaseRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("wallBaseRoughnessFromLook(");
    expect(saveSrc).not.toContain("wallBaseRoughnessAfterRestart");
    expect(saveSrc).not.toContain("wallBaseRoughnessFromLook");
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
