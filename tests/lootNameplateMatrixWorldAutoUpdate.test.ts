import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE,
  LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE_SPAWN,
  lootNameplateMatrixWorldAutoUpdateAfterRestart,
  lootNameplateMatrixWorldAutoUpdateFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateMatrixWorldAutoUpdateAfterRestart (R / softReset)", () => {
  test("matrixWorldAutoUpdate fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMatrixWorldAutoUpdate =
      lootNameplateMatrixWorldAutoUpdateAfterRestart();
    expect(bootMatrixWorldAutoUpdate).toBe(
      lootNameplateMatrixWorldAutoUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE,
      ),
    );
    expect(bootMatrixWorldAutoUpdate).toBe(
      LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE,
    );
    expect(bootMatrixWorldAutoUpdate).toBe(
      LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE_SPAWN,
    );
    expect(bootMatrixWorldAutoUpdate).toBe(true);
    expect(lootNameplateMatrixWorldAutoUpdateAfterRestart()).toBe(
      bootMatrixWorldAutoUpdate,
    );

    const leftoverMatrixWorldAutoUpdate = false;
    expect(leftoverMatrixWorldAutoUpdate).not.toBe(true);
    expect(
      lootNameplateMatrixWorldAutoUpdateFromLook(leftoverMatrixWorldAutoUpdate),
    ).toBe(leftoverMatrixWorldAutoUpdate);
    expect(
      lootNameplateMatrixWorldAutoUpdateFromLook(leftoverMatrixWorldAutoUpdate),
    ).not.toBe(bootMatrixWorldAutoUpdate);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateMatrixWorldAutoUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE,
      ),
    ).toBe(bootMatrixWorldAutoUpdate);
  });

  test("vivo on no cambia matrixWorldAutoUpdate (ctor constant; sync no escribe)", () => {
    const bootMatrixWorldAutoUpdate =
      lootNameplateMatrixWorldAutoUpdateAfterRestart();
    const liveMatrixWorldAutoUpdate = lootNameplateMatrixWorldAutoUpdateFromLook(
      LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE,
    );
    expect(liveMatrixWorldAutoUpdate).toBe(bootMatrixWorldAutoUpdate);
    expect(liveMatrixWorldAutoUpdate).toBe(
      lootNameplateMatrixWorldAutoUpdateAfterRestart(),
    );
    expect(liveMatrixWorldAutoUpdate).toBe(
      LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE_SPAWN,
    );

    expect(
      lootNameplateMatrixWorldAutoUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE,
      ),
    ).toBe(bootMatrixWorldAutoUpdate);
    expect(lootNameplateMatrixWorldAutoUpdateFromLook(false)).not.toBe(
      bootMatrixWorldAutoUpdate,
    );
  });
});

describe("loot nameplate sprite matrixWorldAutoUpdate recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace matrixWorldAutoUpdate fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateMatrixWorldAutoUpdateAfterRestart(");
    expect(plateSrc).toContain("lootNameplateMatrixWorldAutoUpdateFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_MATRIX_WORLD_AUTO_UPDATE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateMatrixWorldAutoUpdateAfterRestart\([\s\S]{0,200}lootNameplateMatrixWorldAutoUpdateFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateMatrixWorldAutoUpdateAfterRestart(");
    expect(viewSrc).toContain("lootNameplateMatrixWorldAutoUpdateAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateMatrixWorldAutoUpdateFromLook(");
    expect(viewSrc).toContain(
      "sprite.matrixWorldAutoUpdate = lootNameplateMatrixWorldAutoUpdateAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.matrixWorldAutoUpdate\s*=\s*true/);
    expect(viewSrc).not.toMatch(/plateMat\.matrixWorldAutoUpdate\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.matrixWorldAutoUpdate\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateMatrixWorldAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toContain(
      "lootNameplateMatrixWorldAutoUpdateAfterRestart(",
    );
    expect(gameSrc).not.toContain("lootNameplateMatrixWorldAutoUpdateFromLook(");
    expect(saveSrc).not.toContain(
      "lootNameplateMatrixWorldAutoUpdateAfterRestart",
    );
    expect(saveSrc).not.toContain("lootNameplateMatrixWorldAutoUpdateFromLook");
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
