import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_COLOR,
  LOOT_NAMEPLATE_BLEND_COLOR_SPAWN,
  lootNameplateBlendColorAfterRestart,
  lootNameplateBlendColorFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendColorAfterRestart (R / softReset)", () => {
  test("blendColor fresco (idle 0x000000); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendColor = lootNameplateBlendColorAfterRestart();
    expect(bootBlendColor).toBe(
      lootNameplateBlendColorFromLook(LOOT_NAMEPLATE_BLEND_COLOR),
    );
    expect(bootBlendColor).toBe(LOOT_NAMEPLATE_BLEND_COLOR);
    expect(bootBlendColor).toBe(LOOT_NAMEPLATE_BLEND_COLOR_SPAWN);
    expect(bootBlendColor).toBe(0x000000);
    expect(lootNameplateBlendColorAfterRestart()).toBe(bootBlendColor);

    const leftoverBlendColor = 0xffffff;
    expect(leftoverBlendColor).not.toBe(0x000000);
    expect(lootNameplateBlendColorFromLook(leftoverBlendColor)).toBe(
      leftoverBlendColor,
    );
    expect(lootNameplateBlendColorFromLook(leftoverBlendColor)).not.toBe(
      bootBlendColor,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendColorFromLook(LOOT_NAMEPLATE_BLEND_COLOR)).toBe(
      bootBlendColor,
    );
  });

  test("vivo on no cambia blendColor (ctor constant; sync no escribe)", () => {
    const bootBlendColor = lootNameplateBlendColorAfterRestart();
    const liveBlendColor = lootNameplateBlendColorFromLook(
      LOOT_NAMEPLATE_BLEND_COLOR,
    );
    expect(liveBlendColor).toBe(bootBlendColor);
    expect(liveBlendColor).toBe(lootNameplateBlendColorAfterRestart());
    expect(liveBlendColor).toBe(LOOT_NAMEPLATE_BLEND_COLOR_SPAWN);

    expect(lootNameplateBlendColorFromLook(LOOT_NAMEPLATE_BLEND_COLOR)).toBe(
      bootBlendColor,
    );
    expect(lootNameplateBlendColorFromLook(0xffffff)).not.toBe(
      bootBlendColor,
    );
  });
});

describe("loot nameplate sprite blendColor recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendColor fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendColorAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendColorFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_COLOR_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendColorAfterRestart\([\s\S]{0,200}lootNameplateBlendColorFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendColorAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendColorAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendColorFromLook(");
    expect(viewSrc).toContain(
      "blendColor: lootNameplateBlendColorAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,4600}blendColor:\s*0x000000/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendColor\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendColor\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendColorAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendColorFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendColorAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendColorFromLook");
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
