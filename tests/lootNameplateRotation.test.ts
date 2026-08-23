import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ROTATION,
  LOOT_NAMEPLATE_ROTATION_SPAWN,
  lootNameplateRotationAfterRestart,
  lootNameplateRotationFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateRotationAfterRestart (R / softReset)", () => {
  test("rotation fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRotation = lootNameplateRotationAfterRestart();
    expect(bootRotation).toBe(
      lootNameplateRotationFromLook(LOOT_NAMEPLATE_ROTATION),
    );
    expect(bootRotation).toBe(LOOT_NAMEPLATE_ROTATION);
    expect(bootRotation).toBe(LOOT_NAMEPLATE_ROTATION_SPAWN);
    expect(bootRotation).toBe(0);
    expect(lootNameplateRotationAfterRestart()).toBe(bootRotation);

    const leftoverRotation = 1.57;
    expect(lootNameplateRotationFromLook(leftoverRotation)).toBe(
      leftoverRotation,
    );
    expect(lootNameplateRotationFromLook(leftoverRotation)).not.toBe(
      bootRotation,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateRotationFromLook(LOOT_NAMEPLATE_ROTATION)).toBe(
      bootRotation,
    );
  });

  test("vivo on no cambia rotation (ctor constant; sync no escribe)", () => {
    const bootRotation = lootNameplateRotationAfterRestart();
    const liveRotation = lootNameplateRotationFromLook(LOOT_NAMEPLATE_ROTATION);
    expect(liveRotation).toBe(bootRotation);
    expect(liveRotation).toBe(lootNameplateRotationAfterRestart());
    expect(liveRotation).toBe(LOOT_NAMEPLATE_ROTATION_SPAWN);

    expect(lootNameplateRotationFromLook(LOOT_NAMEPLATE_ROTATION)).toBe(
      bootRotation,
    );
    expect(lootNameplateRotationFromLook(1.57)).not.toBe(bootRotation);
  });
});

describe("loot nameplate sprite rotation recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rotation fresco; F9 no helper", () => {
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
    const plateSrc = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(plateSrc).toContain("lootNameplateRotationAfterRestart(");
    expect(plateSrc).toContain("lootNameplateRotationFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ROTATION_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateRotationAfterRestart\([\s\S]{0,200}lootNameplateRotationFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateRotationAfterRestart(");
    expect(viewSrc).toContain("lootNameplateRotationAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateRotationFromLook(");
    expect(viewSrc).toContain("rotation: lootNameplateRotationAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}rotation:\s*0/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.rotation\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.rotation\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateRotationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateRotationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateRotationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateRotationAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateRotationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateRotationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateRotationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateRotationAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateRotationAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateRotationFromLook(");
    expect(saveSrc).not.toContain("lootNameplateRotationAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateRotationFromLook");
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
