import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL,
  LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL_SPAWN,
  lootNameplateCustomDepthMaterialAfterRestart,
  lootNameplateCustomDepthMaterialFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateCustomDepthMaterialAfterRestart (R / softReset)", () => {
  test("customDepthMaterial fresco (idle undefined); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootCustomDepthMaterial =
      lootNameplateCustomDepthMaterialAfterRestart();
    expect(bootCustomDepthMaterial).toBe(
      lootNameplateCustomDepthMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL,
      ),
    );
    expect(bootCustomDepthMaterial).toBe(LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL);
    expect(bootCustomDepthMaterial).toBe(
      LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL_SPAWN,
    );
    expect(bootCustomDepthMaterial).toBe(undefined);
    expect(lootNameplateCustomDepthMaterialAfterRestart()).toBe(
      bootCustomDepthMaterial,
    );

    const leftoverCustomDepthMaterial = new THREE.Material();
    expect(leftoverCustomDepthMaterial).not.toBe(undefined);
    expect(
      lootNameplateCustomDepthMaterialFromLook(leftoverCustomDepthMaterial),
    ).toBe(leftoverCustomDepthMaterial);
    expect(
      lootNameplateCustomDepthMaterialFromLook(leftoverCustomDepthMaterial),
    ).not.toBe(bootCustomDepthMaterial);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateCustomDepthMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL,
      ),
    ).toBe(bootCustomDepthMaterial);
  });

  test("vivo on no cambia customDepthMaterial (ctor constant; sync no escribe)", () => {
    const bootCustomDepthMaterial =
      lootNameplateCustomDepthMaterialAfterRestart();
    const liveCustomDepthMaterial = lootNameplateCustomDepthMaterialFromLook(
      LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL,
    );
    expect(liveCustomDepthMaterial).toBe(bootCustomDepthMaterial);
    expect(liveCustomDepthMaterial).toBe(
      lootNameplateCustomDepthMaterialAfterRestart(),
    );
    expect(liveCustomDepthMaterial).toBe(
      LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL_SPAWN,
    );

    expect(
      lootNameplateCustomDepthMaterialFromLook(
        LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL,
      ),
    ).toBe(bootCustomDepthMaterial);
    expect(
      lootNameplateCustomDepthMaterialFromLook(new THREE.Material()),
    ).not.toBe(bootCustomDepthMaterial);
  });
});

describe("loot nameplate sprite customDepthMaterial recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace customDepthMaterial fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateCustomDepthMaterialAfterRestart(");
    expect(plateSrc).toContain("lootNameplateCustomDepthMaterialFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CUSTOM_DEPTH_MATERIAL_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateCustomDepthMaterialAfterRestart\([\s\S]{0,200}lootNameplateCustomDepthMaterialFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateCustomDepthMaterialAfterRestart(");
    expect(viewSrc).toContain("lootNameplateCustomDepthMaterialAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateCustomDepthMaterialFromLook(");
    expect(viewSrc).toContain(
      "sprite.customDepthMaterial = lootNameplateCustomDepthMaterialAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /sprite\.customDepthMaterial\s*=\s*undefined/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.customDepthMaterial\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.customDepthMaterial\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateCustomDepthMaterialAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateCustomDepthMaterialAfterRestart/,
    );
    expect(gameSrc).not.toContain(
      "lootNameplateCustomDepthMaterialAfterRestart(",
    );
    expect(gameSrc).not.toContain("lootNameplateCustomDepthMaterialFromLook(");
    expect(saveSrc).not.toContain(
      "lootNameplateCustomDepthMaterialAfterRestart",
    );
    expect(saveSrc).not.toContain("lootNameplateCustomDepthMaterialFromLook");
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
