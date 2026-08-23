import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_MATERIAL_NAME,
  LOOT_NAMEPLATE_MATERIAL_NAME_SPAWN,
  lootNameplateMaterialNameAfterRestart,
  lootNameplateMaterialNameFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateMaterialNameAfterRestart (R / softReset)", () => {
  test("Material.name fresco (idle ''); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMaterialName = lootNameplateMaterialNameAfterRestart();
    expect(bootMaterialName).toBe(
      lootNameplateMaterialNameFromLook(LOOT_NAMEPLATE_MATERIAL_NAME),
    );
    expect(bootMaterialName).toBe(LOOT_NAMEPLATE_MATERIAL_NAME);
    expect(bootMaterialName).toBe(LOOT_NAMEPLATE_MATERIAL_NAME_SPAWN);
    expect(bootMaterialName).toBe("");
    expect(lootNameplateMaterialNameAfterRestart()).toBe(bootMaterialName);

    const leftoverMaterialName = "leftover";
    expect(leftoverMaterialName).not.toBe("");
    expect(lootNameplateMaterialNameFromLook(leftoverMaterialName)).toBe(
      leftoverMaterialName,
    );
    expect(lootNameplateMaterialNameFromLook(leftoverMaterialName)).not.toBe(
      bootMaterialName,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateMaterialNameFromLook(LOOT_NAMEPLATE_MATERIAL_NAME),
    ).toBe(bootMaterialName);
  });

  test("vivo on no cambia Material.name (ctor constant; sync no escribe)", () => {
    const bootMaterialName = lootNameplateMaterialNameAfterRestart();
    const liveMaterialName = lootNameplateMaterialNameFromLook(
      LOOT_NAMEPLATE_MATERIAL_NAME,
    );
    expect(liveMaterialName).toBe(bootMaterialName);
    expect(liveMaterialName).toBe(lootNameplateMaterialNameAfterRestart());
    expect(liveMaterialName).toBe(LOOT_NAMEPLATE_MATERIAL_NAME_SPAWN);

    expect(
      lootNameplateMaterialNameFromLook(LOOT_NAMEPLATE_MATERIAL_NAME),
    ).toBe(bootMaterialName);
    expect(lootNameplateMaterialNameFromLook("leftover")).not.toBe(
      bootMaterialName,
    );
  });
});

describe("loot nameplate sprite Material.name recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace Material.name fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateMaterialNameAfterRestart(");
    expect(plateSrc).toContain("lootNameplateMaterialNameFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_MATERIAL_NAME_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateMaterialNameAfterRestart\([\s\S]{0,200}lootNameplateMaterialNameFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateMaterialNameAfterRestart(");
    expect(viewSrc).toContain("lootNameplateMaterialNameAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateMaterialNameFromLook(");
    expect(viewSrc).toContain(
      "name: lootNameplateMaterialNameAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}name:\s*(?:''|"")/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.name\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.name\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateMaterialNameAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateMaterialNameAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateMaterialNameAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateMaterialNameAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateMaterialNameAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateMaterialNameAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateMaterialNameAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateMaterialNameAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateMaterialNameAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateMaterialNameFromLook(");
    expect(saveSrc).not.toContain("lootNameplateMaterialNameAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateMaterialNameFromLook");
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
