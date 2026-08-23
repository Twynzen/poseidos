import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_MATERIAL_USER_DATA,
  LOOT_NAMEPLATE_MATERIAL_USER_DATA_SPAWN,
  lootNameplateMaterialUserDataAfterRestart,
  lootNameplateMaterialUserDataFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateMaterialUserDataAfterRestart (R / softReset)", () => {
  test("Material.userData fresco (idle {}); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMaterialUserData = lootNameplateMaterialUserDataAfterRestart();
    expect(bootMaterialUserData).toEqual(
      lootNameplateMaterialUserDataFromLook(LOOT_NAMEPLATE_MATERIAL_USER_DATA),
    );
    expect(bootMaterialUserData).toEqual(LOOT_NAMEPLATE_MATERIAL_USER_DATA);
    expect(bootMaterialUserData).toEqual(LOOT_NAMEPLATE_MATERIAL_USER_DATA_SPAWN);
    expect(bootMaterialUserData).toEqual({});
    expect(Object.keys(bootMaterialUserData)).toEqual([]);
    expect(lootNameplateMaterialUserDataAfterRestart()).toEqual(
      bootMaterialUserData,
    );
    expect(lootNameplateMaterialUserDataAfterRestart()).not.toBe(
      bootMaterialUserData,
    );

    const leftoverMaterialUserData = { leftover: true };
    expect(leftoverMaterialUserData).not.toEqual({});
    expect(lootNameplateMaterialUserDataFromLook(leftoverMaterialUserData)).toBe(
      leftoverMaterialUserData,
    );
    expect(
      lootNameplateMaterialUserDataFromLook(leftoverMaterialUserData),
    ).not.toEqual(bootMaterialUserData);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateMaterialUserDataFromLook(LOOT_NAMEPLATE_MATERIAL_USER_DATA),
    ).toEqual(bootMaterialUserData);
  });

  test("vivo on no cambia Material.userData (ctor constant; sync no escribe)", () => {
    const bootMaterialUserData = lootNameplateMaterialUserDataAfterRestart();
    const liveMaterialUserData = lootNameplateMaterialUserDataFromLook(
      LOOT_NAMEPLATE_MATERIAL_USER_DATA,
    );
    expect(liveMaterialUserData).toEqual(bootMaterialUserData);
    expect(liveMaterialUserData).toEqual(
      lootNameplateMaterialUserDataAfterRestart(),
    );
    expect(liveMaterialUserData).toEqual(LOOT_NAMEPLATE_MATERIAL_USER_DATA_SPAWN);

    expect(
      lootNameplateMaterialUserDataFromLook(LOOT_NAMEPLATE_MATERIAL_USER_DATA),
    ).toEqual(bootMaterialUserData);
    expect(
      lootNameplateMaterialUserDataFromLook({ leftover: true }),
    ).not.toEqual(bootMaterialUserData);
  });
});

describe("loot nameplate sprite Material.userData recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace Material.userData fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateMaterialUserDataAfterRestart(");
    expect(plateSrc).toContain("lootNameplateMaterialUserDataFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_MATERIAL_USER_DATA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateMaterialUserDataAfterRestart\([\s\S]{0,200}lootNameplateMaterialUserDataFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateMaterialUserDataAfterRestart(");
    expect(viewSrc).toContain("lootNameplateMaterialUserDataAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateMaterialUserDataFromLook(");
    expect(viewSrc).toContain(
      "userData: lootNameplateMaterialUserDataAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}userData:\s*\{\s*\}/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.userData\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.userData\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateMaterialUserDataAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateMaterialUserDataAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateMaterialUserDataAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateMaterialUserDataFromLook(");
    expect(saveSrc).not.toContain("lootNameplateMaterialUserDataAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateMaterialUserDataFromLook");
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
