import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_SHADOW_SIDE,
  LOOT_NAMEPLATE_SHADOW_SIDE_SPAWN,
  lootNameplateShadowSideAfterRestart,
  lootNameplateShadowSideFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateShadowSideAfterRestart (R / softReset)", () => {
  test("shadowSide fresco (idle null); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootShadowSide = lootNameplateShadowSideAfterRestart();
    expect(bootShadowSide).toBe(
      lootNameplateShadowSideFromLook(LOOT_NAMEPLATE_SHADOW_SIDE),
    );
    expect(bootShadowSide).toBe(LOOT_NAMEPLATE_SHADOW_SIDE);
    expect(bootShadowSide).toBe(LOOT_NAMEPLATE_SHADOW_SIDE_SPAWN);
    expect(bootShadowSide).toBe(null);
    expect(lootNameplateShadowSideAfterRestart()).toBe(bootShadowSide);

    const leftoverShadowSide = THREE.BackSide;
    expect(leftoverShadowSide).not.toBe(null);
    expect(lootNameplateShadowSideFromLook(leftoverShadowSide)).toBe(
      leftoverShadowSide,
    );
    expect(lootNameplateShadowSideFromLook(leftoverShadowSide)).not.toBe(
      bootShadowSide,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateShadowSideFromLook(LOOT_NAMEPLATE_SHADOW_SIDE)).toBe(
      bootShadowSide,
    );
  });

  test("vivo on no cambia shadowSide (ctor constant; sync no escribe)", () => {
    const bootShadowSide = lootNameplateShadowSideAfterRestart();
    const liveShadowSide = lootNameplateShadowSideFromLook(
      LOOT_NAMEPLATE_SHADOW_SIDE,
    );
    expect(liveShadowSide).toBe(bootShadowSide);
    expect(liveShadowSide).toBe(lootNameplateShadowSideAfterRestart());
    expect(liveShadowSide).toBe(LOOT_NAMEPLATE_SHADOW_SIDE_SPAWN);

    expect(lootNameplateShadowSideFromLook(LOOT_NAMEPLATE_SHADOW_SIDE)).toBe(
      bootShadowSide,
    );
    expect(lootNameplateShadowSideFromLook(THREE.BackSide)).not.toBe(
      bootShadowSide,
    );
  });
});

describe("loot nameplate sprite shadowSide recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace shadowSide fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateShadowSideAfterRestart(");
    expect(plateSrc).toContain("lootNameplateShadowSideFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_SHADOW_SIDE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateShadowSideAfterRestart\([\s\S]{0,200}lootNameplateShadowSideFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateShadowSideAfterRestart(");
    expect(viewSrc).toContain("lootNameplateShadowSideAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateShadowSideFromLook(");
    expect(viewSrc).toContain(
      "shadowSide: lootNameplateShadowSideAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}shadowSide:\s*null/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.shadowSide\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.shadowSide\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateShadowSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateShadowSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateShadowSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateShadowSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateShadowSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateShadowSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateShadowSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateShadowSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateShadowSideAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateShadowSideFromLook(");
    expect(saveSrc).not.toContain("lootNameplateShadowSideAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateShadowSideFromLook");
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
