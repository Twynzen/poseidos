import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BED_MESH_ROUGHNESS,
  BED_ROUGHNESS,
  BED_ROUGHNESS_SPAWN,
  bedRoughnessAfterRestart,
  bedRoughnessFromLook,
} from "../src/render/worldView";

describe("bedRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.85); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = bedRoughnessAfterRestart();
    expect(bootRoughness).toBe(bedRoughnessFromLook(BED_MESH_ROUGHNESS));
    expect(bootRoughness).toBe(BED_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(BED_ROUGHNESS);
    expect(bootRoughness).toBe(BED_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.85);
    expect(bedRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.99;
    expect(bedRoughnessFromLook(leftoverRoughness)).toBe(leftoverRoughness);
    expect(bedRoughnessFromLook(leftoverRoughness)).not.toBe(bootRoughness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(bedRoughnessFromLook(0.85)).toBe(bootRoughness);
    expect(bedRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = bedRoughnessAfterRestart();
    const liveRoughness = bedRoughnessFromLook(0.85);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(bedRoughnessAfterRestart());
    expect(liveRoughness).toBe(BED_ROUGHNESS_SPAWN);

    expect(bedRoughnessFromLook(0.85)).toBe(bootRoughness);
    expect(bedRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });
});

describe("bed mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("bedRoughnessAfterRestart(");
    expect(viewSrc).toContain("bedRoughnessFromLook(");
    expect(viewSrc).toContain("BED_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /bedRoughnessAfterRestart\([\s\S]{0,200}bedRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("bedRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: bedRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const bedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}roughness:\s*0\.85(?!\d)/,
    );
    expect(viewSrc).not.toMatch(/bedMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}bedRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}bedRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}bedRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}bedRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}bedRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}bedRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}bedRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("bedRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("bedRoughnessFromLook(");
    expect(saveSrc).not.toContain("bedRoughnessAfterRestart");
    expect(saveSrc).not.toContain("bedRoughnessFromLook");
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
