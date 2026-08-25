import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE,
  LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE_SPAWN,
  lootNameplateMatrixWorldNeedsUpdateAfterRestart,
  lootNameplateMatrixWorldNeedsUpdateFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateMatrixWorldNeedsUpdateAfterRestart (R / softReset)", () => {
  test("matrixWorldNeedsUpdate fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMatrixWorldNeedsUpdate =
      lootNameplateMatrixWorldNeedsUpdateAfterRestart();
    expect(bootMatrixWorldNeedsUpdate).toBe(
      lootNameplateMatrixWorldNeedsUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE,
      ),
    );
    expect(bootMatrixWorldNeedsUpdate).toBe(
      LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE,
    );
    expect(bootMatrixWorldNeedsUpdate).toBe(
      LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE_SPAWN,
    );
    expect(bootMatrixWorldNeedsUpdate).toBe(false);
    expect(lootNameplateMatrixWorldNeedsUpdateAfterRestart()).toBe(
      bootMatrixWorldNeedsUpdate,
    );

    const leftoverMatrixWorldNeedsUpdate = true;
    expect(leftoverMatrixWorldNeedsUpdate).not.toBe(false);
    expect(
      lootNameplateMatrixWorldNeedsUpdateFromLook(
        leftoverMatrixWorldNeedsUpdate,
      ),
    ).toBe(leftoverMatrixWorldNeedsUpdate);
    expect(
      lootNameplateMatrixWorldNeedsUpdateFromLook(
        leftoverMatrixWorldNeedsUpdate,
      ),
    ).not.toBe(bootMatrixWorldNeedsUpdate);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateMatrixWorldNeedsUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE,
      ),
    ).toBe(bootMatrixWorldNeedsUpdate);
  });

  test("vivo on no cambia matrixWorldNeedsUpdate (ctor constant; sync no escribe)", () => {
    const bootMatrixWorldNeedsUpdate =
      lootNameplateMatrixWorldNeedsUpdateAfterRestart();
    const liveMatrixWorldNeedsUpdate =
      lootNameplateMatrixWorldNeedsUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE,
      );
    expect(liveMatrixWorldNeedsUpdate).toBe(bootMatrixWorldNeedsUpdate);
    expect(liveMatrixWorldNeedsUpdate).toBe(
      lootNameplateMatrixWorldNeedsUpdateAfterRestart(),
    );
    expect(liveMatrixWorldNeedsUpdate).toBe(
      LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE_SPAWN,
    );

    expect(
      lootNameplateMatrixWorldNeedsUpdateFromLook(
        LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE,
      ),
    ).toBe(bootMatrixWorldNeedsUpdate);
    expect(lootNameplateMatrixWorldNeedsUpdateFromLook(true)).not.toBe(
      bootMatrixWorldNeedsUpdate,
    );
  });
});

describe("loot nameplate sprite matrixWorldNeedsUpdate recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace matrixWorldNeedsUpdate fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain(
      "lootNameplateMatrixWorldNeedsUpdateAfterRestart(",
    );
    expect(plateSrc).toContain("lootNameplateMatrixWorldNeedsUpdateFromLook(");
    expect(plateSrc).toContain(
      "LOOT_NAMEPLATE_MATRIX_WORLD_NEEDS_UPDATE_SPAWN",
    );
    expect(plateSrc).toMatch(
      /lootNameplateMatrixWorldNeedsUpdateAfterRestart\([\s\S]{0,200}lootNameplateMatrixWorldNeedsUpdateFromLook\(/,
    );
    expect(viewSrc).toContain(
      "lootNameplateMatrixWorldNeedsUpdateAfterRestart(",
    );
    expect(viewSrc).toContain(
      "lootNameplateMatrixWorldNeedsUpdateAfterRestart()",
    );
    expect(viewSrc).not.toContain(
      "lootNameplateMatrixWorldNeedsUpdateFromLook(",
    );
    expect(viewSrc).toContain(
      "sprite.matrixWorldNeedsUpdate = lootNameplateMatrixWorldNeedsUpdateAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.matrixWorldNeedsUpdate\s*=\s*false/);
    expect(viewSrc).not.toMatch(/plateMat\.matrixWorldNeedsUpdate\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.matrixWorldNeedsUpdate\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateMatrixWorldNeedsUpdateAfterRestart/,
    );
    expect(gameSrc).not.toContain(
      "lootNameplateMatrixWorldNeedsUpdateAfterRestart(",
    );
    expect(gameSrc).not.toContain(
      "lootNameplateMatrixWorldNeedsUpdateFromLook(",
    );
    expect(saveSrc).not.toContain(
      "lootNameplateMatrixWorldNeedsUpdateAfterRestart",
    );
    expect(saveSrc).not.toContain(
      "lootNameplateMatrixWorldNeedsUpdateFromLook",
    );
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
