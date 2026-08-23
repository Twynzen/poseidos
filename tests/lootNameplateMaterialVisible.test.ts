import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_MATERIAL_VISIBLE,
  LOOT_NAMEPLATE_MATERIAL_VISIBLE_SPAWN,
  lootNameplateMaterialVisibleAfterRestart,
  lootNameplateMaterialVisibleFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateMaterialVisibleAfterRestart (R / softReset)", () => {
  test("Material.visible fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMaterialVisible = lootNameplateMaterialVisibleAfterRestart();
    expect(bootMaterialVisible).toBe(
      lootNameplateMaterialVisibleFromLook(LOOT_NAMEPLATE_MATERIAL_VISIBLE),
    );
    expect(bootMaterialVisible).toBe(LOOT_NAMEPLATE_MATERIAL_VISIBLE);
    expect(bootMaterialVisible).toBe(LOOT_NAMEPLATE_MATERIAL_VISIBLE_SPAWN);
    expect(bootMaterialVisible).toBe(true);
    expect(lootNameplateMaterialVisibleAfterRestart()).toBe(bootMaterialVisible);

    const leftoverMaterialVisible = false;
    expect(leftoverMaterialVisible).not.toBe(true);
    expect(lootNameplateMaterialVisibleFromLook(leftoverMaterialVisible)).toBe(
      leftoverMaterialVisible,
    );
    expect(lootNameplateMaterialVisibleFromLook(leftoverMaterialVisible)).not.toBe(
      bootMaterialVisible,
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
      lootNameplateMaterialVisibleFromLook(LOOT_NAMEPLATE_MATERIAL_VISIBLE),
    ).toBe(bootMaterialVisible);
  });

  test("vivo on no cambia Material.visible (ctor constant; sync no escribe)", () => {
    const bootMaterialVisible = lootNameplateMaterialVisibleAfterRestart();
    const liveMaterialVisible = lootNameplateMaterialVisibleFromLook(
      LOOT_NAMEPLATE_MATERIAL_VISIBLE,
    );
    expect(liveMaterialVisible).toBe(bootMaterialVisible);
    expect(liveMaterialVisible).toBe(lootNameplateMaterialVisibleAfterRestart());
    expect(liveMaterialVisible).toBe(LOOT_NAMEPLATE_MATERIAL_VISIBLE_SPAWN);

    expect(
      lootNameplateMaterialVisibleFromLook(LOOT_NAMEPLATE_MATERIAL_VISIBLE),
    ).toBe(bootMaterialVisible);
    expect(lootNameplateMaterialVisibleFromLook(false)).not.toBe(
      bootMaterialVisible,
    );
  });
});

describe("loot nameplate sprite Material.visible recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace Material.visible fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateMaterialVisibleAfterRestart(");
    expect(plateSrc).toContain("lootNameplateMaterialVisibleFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_MATERIAL_VISIBLE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateMaterialVisibleAfterRestart\([\s\S]{0,200}lootNameplateMaterialVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateMaterialVisibleAfterRestart(");
    expect(viewSrc).toContain("lootNameplateMaterialVisibleAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateMaterialVisibleFromLook(");
    expect(viewSrc).toContain(
      "visible: lootNameplateMaterialVisibleAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}visible:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.visible\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.visible\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateMaterialVisibleAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateMaterialVisibleAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateMaterialVisibleAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateMaterialVisibleFromLook(");
    expect(saveSrc).not.toContain("lootNameplateMaterialVisibleAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateMaterialVisibleFromLook");
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
