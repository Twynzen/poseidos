import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE,
  LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE_SPAWN,
  lootNameplateMatrixAutoUpdateAfterRestart,
  lootNameplateMatrixAutoUpdateFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateMatrixAutoUpdateAfterRestart (R / softReset)", () => {
  test("matrixAutoUpdate fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMatrixAutoUpdate = lootNameplateMatrixAutoUpdateAfterRestart();
    expect(bootMatrixAutoUpdate).toBe(
      lootNameplateMatrixAutoUpdateFromLook(LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE),
    );
    expect(bootMatrixAutoUpdate).toBe(LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE);
    expect(bootMatrixAutoUpdate).toBe(LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE_SPAWN);
    expect(bootMatrixAutoUpdate).toBe(true);
    expect(lootNameplateMatrixAutoUpdateAfterRestart()).toBe(bootMatrixAutoUpdate);

    const leftoverMatrixAutoUpdate = false;
    expect(leftoverMatrixAutoUpdate).not.toBe(true);
    expect(lootNameplateMatrixAutoUpdateFromLook(leftoverMatrixAutoUpdate)).toBe(
      leftoverMatrixAutoUpdate,
    );
    expect(lootNameplateMatrixAutoUpdateFromLook(leftoverMatrixAutoUpdate)).not.toBe(
      bootMatrixAutoUpdate,
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
      lootNameplateMatrixAutoUpdateFromLook(LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE),
    ).toBe(bootMatrixAutoUpdate);
  });

  test("vivo on no cambia matrixAutoUpdate (ctor constant; sync no escribe)", () => {
    const bootMatrixAutoUpdate = lootNameplateMatrixAutoUpdateAfterRestart();
    const liveMatrixAutoUpdate = lootNameplateMatrixAutoUpdateFromLook(
      LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE,
    );
    expect(liveMatrixAutoUpdate).toBe(bootMatrixAutoUpdate);
    expect(liveMatrixAutoUpdate).toBe(lootNameplateMatrixAutoUpdateAfterRestart());
    expect(liveMatrixAutoUpdate).toBe(LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE_SPAWN);

    expect(
      lootNameplateMatrixAutoUpdateFromLook(LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE),
    ).toBe(bootMatrixAutoUpdate);
    expect(lootNameplateMatrixAutoUpdateFromLook(false)).not.toBe(
      bootMatrixAutoUpdate,
    );
  });
});

describe("loot nameplate sprite matrixAutoUpdate recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace matrixAutoUpdate fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateMatrixAutoUpdateAfterRestart(");
    expect(plateSrc).toContain("lootNameplateMatrixAutoUpdateFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateMatrixAutoUpdateAfterRestart\([\s\S]{0,200}lootNameplateMatrixAutoUpdateFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateMatrixAutoUpdateAfterRestart(");
    expect(viewSrc).toContain("lootNameplateMatrixAutoUpdateAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateMatrixAutoUpdateFromLook(");
    expect(viewSrc).toContain(
      "sprite.matrixAutoUpdate = lootNameplateMatrixAutoUpdateAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.matrixAutoUpdate\s*=\s*true/);
    expect(viewSrc).not.toMatch(/plateMat\.matrixAutoUpdate\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.matrixAutoUpdate\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateMatrixAutoUpdateAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateMatrixAutoUpdateAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateMatrixAutoUpdateAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateMatrixAutoUpdateFromLook(");
    expect(saveSrc).not.toContain("lootNameplateMatrixAutoUpdateAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateMatrixAutoUpdateFromLook");
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
