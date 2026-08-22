import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLOOR_MESH_ROUGHNESS,
  FLOOR_ROUGHNESS,
  FLOOR_ROUGHNESS_SPAWN,
  floorRoughnessAfterRestart,
  floorRoughnessFromLook,
} from "../src/render/worldView";

describe("floorRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.95); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = floorRoughnessAfterRestart();
    expect(bootRoughness).toBe(floorRoughnessFromLook(FLOOR_MESH_ROUGHNESS));
    expect(bootRoughness).toBe(FLOOR_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(FLOOR_ROUGHNESS);
    expect(bootRoughness).toBe(FLOOR_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.95);
    expect(floorRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.1;
    expect(floorRoughnessFromLook(leftoverRoughness)).toBe(leftoverRoughness);
    expect(floorRoughnessFromLook(leftoverRoughness)).not.toBe(bootRoughness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(floorRoughnessFromLook(0.95)).toBe(bootRoughness);
    expect(floorRoughnessFromLook(0.1)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = floorRoughnessAfterRestart();
    const liveRoughness = floorRoughnessFromLook(0.95);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(floorRoughnessAfterRestart());
    expect(liveRoughness).toBe(FLOOR_ROUGHNESS_SPAWN);

    expect(floorRoughnessFromLook(0.95)).toBe(bootRoughness);
    expect(floorRoughnessFromLook(0.1)).not.toBe(bootRoughness);
  });
});

describe("floor mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("floorRoughnessAfterRestart(");
    expect(viewSrc).toContain("floorRoughnessFromLook(");
    expect(viewSrc).toContain("FLOOR_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /floorRoughnessAfterRestart\([\s\S]{0,200}floorRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("floorRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: floorRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /function matForFloorColor\(color: number\): THREE\.MeshStandardMaterial \{[\s\S]{0,400}roughness:\s*0\.95(?!\d)/,
    );
    expect(viewSrc).not.toMatch(
      /floorMatByColor[\s\S]{0,400}roughness:\s*0\.95(?!\d)/,
    );
    expect(viewSrc).not.toMatch(/floorMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function matForFloorColor[\s\S]{0,800}m\.roughness\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}floorRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}floorRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}floorRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}floorRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}floorRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}floorRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}floorRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("floorRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("floorRoughnessFromLook(");
    expect(saveSrc).not.toContain("floorRoughnessAfterRestart");
    expect(saveSrc).not.toContain("floorRoughnessFromLook");
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
