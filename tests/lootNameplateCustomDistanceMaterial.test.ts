import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL,
  LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL_SPAWN,
  lootNameplateCustomDistanceMaterialAfterRestart,
  lootNameplateCustomDistanceMaterialFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateCustomDistanceMaterialAfterRestart (R / softReset)", () => {
  test("customDistanceMaterial fresco (idle undefined); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootCustomDistanceMaterial =
      lootNameplateCustomDistanceMaterialAfterRestart();
    expect(bootCustomDistanceMaterial).toBe(
      lootNameplateCustomDistanceMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL,
      ),
    );
    expect(bootCustomDistanceMaterial).toBe(
      LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL,
    );
    expect(bootCustomDistanceMaterial).toBe(
      LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL_SPAWN,
    );
    expect(bootCustomDistanceMaterial).toBe(undefined);
    expect(lootNameplateCustomDistanceMaterialAfterRestart()).toBe(
      bootCustomDistanceMaterial,
    );

    const leftoverCustomDistanceMaterial = new THREE.Material();
    expect(leftoverCustomDistanceMaterial).not.toBe(undefined);
    expect(
      lootNameplateCustomDistanceMaterialFromLook(
        leftoverCustomDistanceMaterial,
      ),
    ).toBe(leftoverCustomDistanceMaterial);
    expect(
      lootNameplateCustomDistanceMaterialFromLook(
        leftoverCustomDistanceMaterial,
      ),
    ).not.toBe(bootCustomDistanceMaterial);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateCustomDistanceMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL,
      ),
    ).toBe(bootCustomDistanceMaterial);
  });

  test("vivo on no cambia customDistanceMaterial (ctor constant; sync no escribe)", () => {
    const bootCustomDistanceMaterial =
      lootNameplateCustomDistanceMaterialAfterRestart();
    const liveCustomDistanceMaterial =
      lootNameplateCustomDistanceMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL,
      );
    expect(liveCustomDistanceMaterial).toBe(bootCustomDistanceMaterial);
    expect(liveCustomDistanceMaterial).toBe(
      lootNameplateCustomDistanceMaterialAfterRestart(),
    );
    expect(liveCustomDistanceMaterial).toBe(
      LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL_SPAWN,
    );

    expect(
      lootNameplateCustomDistanceMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL,
      ),
    ).toBe(bootCustomDistanceMaterial);
    expect(
      lootNameplateCustomDistanceMaterialFromLook(new THREE.Material()),
    ).not.toBe(bootCustomDistanceMaterial);
  });
});

describe("loot nameplate sprite customDistanceMaterial recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace customDistanceMaterial fresco; F9 no helper", () => {
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
      "lootNameplateCustomDistanceMaterialAfterRestart(",
    );
    expect(plateSrc).toContain("lootNameplateCustomDistanceMaterialFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CUSTOM_DISTANCE_MATERIAL_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateCustomDistanceMaterialAfterRestart\([\s\S]{0,200}lootNameplateCustomDistanceMaterialFromLook\(/,
    );
    expect(viewSrc).toContain(
      "lootNameplateCustomDistanceMaterialAfterRestart(",
    );
    expect(viewSrc).toContain(
      "lootNameplateCustomDistanceMaterialAfterRestart()",
    );
    expect(viewSrc).not.toContain(
      "lootNameplateCustomDistanceMaterialFromLook(",
    );
    expect(viewSrc).toContain(
      "sprite.customDistanceMaterial = lootNameplateCustomDistanceMaterialAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /sprite\.customDistanceMaterial\s*=\s*undefined/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.customDistanceMaterial\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.customDistanceMaterial\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateCustomDistanceMaterialAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateCustomDistanceMaterialAfterRestart/,
    );
    expect(gameSrc).not.toContain(
      "lootNameplateCustomDistanceMaterialAfterRestart(",
    );
    expect(gameSrc).not.toContain(
      "lootNameplateCustomDistanceMaterialFromLook(",
    );
    expect(saveSrc).not.toContain(
      "lootNameplateCustomDistanceMaterialAfterRestart",
    );
    expect(saveSrc).not.toContain("lootNameplateCustomDistanceMaterialFromLook");
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
