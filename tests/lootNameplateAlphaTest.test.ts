import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ALPHA_TEST,
  LOOT_NAMEPLATE_ALPHA_TEST_SPAWN,
  lootNameplateAlphaTestAfterRestart,
  lootNameplateAlphaTestFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateAlphaTestAfterRestart (R / softReset)", () => {
  test("alphaTest fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAlphaTest = lootNameplateAlphaTestAfterRestart();
    expect(bootAlphaTest).toBe(
      lootNameplateAlphaTestFromLook(LOOT_NAMEPLATE_ALPHA_TEST),
    );
    expect(bootAlphaTest).toBe(LOOT_NAMEPLATE_ALPHA_TEST);
    expect(bootAlphaTest).toBe(LOOT_NAMEPLATE_ALPHA_TEST_SPAWN);
    expect(bootAlphaTest).toBe(0);
    expect(lootNameplateAlphaTestAfterRestart()).toBe(bootAlphaTest);

    const leftoverAlphaTest = 0.5;
    expect(lootNameplateAlphaTestFromLook(leftoverAlphaTest)).toBe(
      leftoverAlphaTest,
    );
    expect(lootNameplateAlphaTestFromLook(leftoverAlphaTest)).not.toBe(
      bootAlphaTest,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateAlphaTestFromLook(LOOT_NAMEPLATE_ALPHA_TEST)).toBe(
      bootAlphaTest,
    );
  });

  test("vivo on no cambia alphaTest (ctor constant; sync no escribe)", () => {
    const bootAlphaTest = lootNameplateAlphaTestAfterRestart();
    const liveAlphaTest = lootNameplateAlphaTestFromLook(
      LOOT_NAMEPLATE_ALPHA_TEST,
    );
    expect(liveAlphaTest).toBe(bootAlphaTest);
    expect(liveAlphaTest).toBe(lootNameplateAlphaTestAfterRestart());
    expect(liveAlphaTest).toBe(LOOT_NAMEPLATE_ALPHA_TEST_SPAWN);

    expect(lootNameplateAlphaTestFromLook(LOOT_NAMEPLATE_ALPHA_TEST)).toBe(
      bootAlphaTest,
    );
    expect(lootNameplateAlphaTestFromLook(0.5)).not.toBe(bootAlphaTest);
  });
});

describe("loot nameplate sprite alphaTest recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace alphaTest fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateAlphaTestAfterRestart(");
    expect(plateSrc).toContain("lootNameplateAlphaTestFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ALPHA_TEST_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateAlphaTestAfterRestart\([\s\S]{0,200}lootNameplateAlphaTestFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateAlphaTestAfterRestart(");
    expect(viewSrc).toContain("lootNameplateAlphaTestAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateAlphaTestFromLook(");
    expect(viewSrc).toContain(
      "alphaTest: lootNameplateAlphaTestAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,2600}alphaTest:\s*0/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.alphaTest\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.alphaTest\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateAlphaTestAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateAlphaTestAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateAlphaTestAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateAlphaTestAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateAlphaTestAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateAlphaTestAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateAlphaTestAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateAlphaTestAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateAlphaTestAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateAlphaTestFromLook(");
    expect(saveSrc).not.toContain("lootNameplateAlphaTestAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateAlphaTestFromLook");
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
