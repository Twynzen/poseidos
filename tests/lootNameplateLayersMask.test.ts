import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_LAYERS_MASK,
  LOOT_NAMEPLATE_LAYERS_MASK_SPAWN,
  lootNameplateLayersMaskAfterRestart,
  lootNameplateLayersMaskFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateLayersMaskAfterRestart (R / softReset)", () => {
  test("layers.mask fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootLayersMask = lootNameplateLayersMaskAfterRestart();
    expect(bootLayersMask).toBe(
      lootNameplateLayersMaskFromLook(LOOT_NAMEPLATE_LAYERS_MASK),
    );
    expect(bootLayersMask).toBe(LOOT_NAMEPLATE_LAYERS_MASK);
    expect(bootLayersMask).toBe(LOOT_NAMEPLATE_LAYERS_MASK_SPAWN);
    expect(bootLayersMask).toBe(1);
    expect(lootNameplateLayersMaskAfterRestart()).toBe(bootLayersMask);

    const leftoverLayersMask = 2;
    expect(leftoverLayersMask).not.toBe(1);
    expect(lootNameplateLayersMaskFromLook(leftoverLayersMask)).toBe(
      leftoverLayersMask,
    );
    expect(lootNameplateLayersMaskFromLook(leftoverLayersMask)).not.toBe(
      bootLayersMask,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateLayersMaskFromLook(LOOT_NAMEPLATE_LAYERS_MASK)).toBe(
      bootLayersMask,
    );
  });

  test("vivo on no cambia layers.mask (ctor constant; sync no escribe)", () => {
    const bootLayersMask = lootNameplateLayersMaskAfterRestart();
    const liveLayersMask = lootNameplateLayersMaskFromLook(
      LOOT_NAMEPLATE_LAYERS_MASK,
    );
    expect(liveLayersMask).toBe(bootLayersMask);
    expect(liveLayersMask).toBe(lootNameplateLayersMaskAfterRestart());
    expect(liveLayersMask).toBe(LOOT_NAMEPLATE_LAYERS_MASK_SPAWN);

    expect(lootNameplateLayersMaskFromLook(LOOT_NAMEPLATE_LAYERS_MASK)).toBe(
      bootLayersMask,
    );
    expect(lootNameplateLayersMaskFromLook(2)).not.toBe(bootLayersMask);
  });
});

describe("loot nameplate sprite layers.mask recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace layers.mask fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateLayersMaskAfterRestart(");
    expect(plateSrc).toContain("lootNameplateLayersMaskFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_LAYERS_MASK_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateLayersMaskAfterRestart\([\s\S]{0,200}lootNameplateLayersMaskFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateLayersMaskAfterRestart(");
    expect(viewSrc).toContain("lootNameplateLayersMaskAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateLayersMaskFromLook(");
    expect(viewSrc).toContain(
      "sprite.layers.mask = lootNameplateLayersMaskAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.layers\.mask\s*=\s*1/);
    expect(viewSrc).not.toMatch(/plateMat\.layers/);
    expect(viewSrc).not.toMatch(/nameplate\.layers\.mask\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateLayersMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateLayersMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateLayersMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateLayersMaskAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateLayersMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateLayersMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateLayersMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateLayersMaskAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateLayersMaskAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateLayersMaskFromLook(");
    expect(saveSrc).not.toContain("lootNameplateLayersMaskAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateLayersMaskFromLook");
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
