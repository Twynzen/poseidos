import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ALPHA_MAP,
  LOOT_NAMEPLATE_ALPHA_MAP_SPAWN,
  lootNameplateAlphaMapAfterRestart,
  lootNameplateAlphaMapFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateAlphaMapAfterRestart (R / softReset)", () => {
  test("alphaMap fresco (idle null); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAlphaMap = lootNameplateAlphaMapAfterRestart();
    expect(bootAlphaMap).toBe(
      lootNameplateAlphaMapFromLook(LOOT_NAMEPLATE_ALPHA_MAP),
    );
    expect(bootAlphaMap).toBe(LOOT_NAMEPLATE_ALPHA_MAP);
    expect(bootAlphaMap).toBe(LOOT_NAMEPLATE_ALPHA_MAP_SPAWN);
    expect(bootAlphaMap).toBe(null);
    expect(lootNameplateAlphaMapAfterRestart()).toBe(bootAlphaMap);

    const leftoverAlphaMap = new THREE.Texture();
    expect(leftoverAlphaMap).not.toBe(null);
    expect(lootNameplateAlphaMapFromLook(leftoverAlphaMap)).toBe(
      leftoverAlphaMap,
    );
    expect(lootNameplateAlphaMapFromLook(leftoverAlphaMap)).not.toBe(
      bootAlphaMap,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateAlphaMapFromLook(LOOT_NAMEPLATE_ALPHA_MAP)).toBe(
      bootAlphaMap,
    );
  });

  test("vivo on no cambia alphaMap (ctor constant; sync no escribe)", () => {
    const bootAlphaMap = lootNameplateAlphaMapAfterRestart();
    const liveAlphaMap = lootNameplateAlphaMapFromLook(
      LOOT_NAMEPLATE_ALPHA_MAP,
    );
    expect(liveAlphaMap).toBe(bootAlphaMap);
    expect(liveAlphaMap).toBe(lootNameplateAlphaMapAfterRestart());
    expect(liveAlphaMap).toBe(LOOT_NAMEPLATE_ALPHA_MAP_SPAWN);

    expect(lootNameplateAlphaMapFromLook(LOOT_NAMEPLATE_ALPHA_MAP)).toBe(
      bootAlphaMap,
    );
    expect(lootNameplateAlphaMapFromLook(new THREE.Texture())).not.toBe(
      bootAlphaMap,
    );
  });
});

describe("loot nameplate sprite alphaMap recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace alphaMap fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateAlphaMapAfterRestart(");
    expect(plateSrc).toContain("lootNameplateAlphaMapFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ALPHA_MAP_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateAlphaMapAfterRestart\([\s\S]{0,200}lootNameplateAlphaMapFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateAlphaMapAfterRestart(");
    expect(viewSrc).toContain("lootNameplateAlphaMapAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateAlphaMapFromLook(");
    expect(viewSrc).toContain(
      "alphaMap: lootNameplateAlphaMapAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}alphaMap:\s*null/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.alphaMap\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.alphaMap\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateAlphaMapAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateAlphaMapAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateAlphaMapAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateAlphaMapAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateAlphaMapAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateAlphaMapAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateAlphaMapAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateAlphaMapAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateAlphaMapAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateAlphaMapFromLook(");
    expect(saveSrc).not.toContain("lootNameplateAlphaMapAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateAlphaMapFromLook");
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
