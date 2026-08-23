import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_DEPTH_TEST,
  LOOT_NAMEPLATE_DEPTH_TEST_SPAWN,
  lootNameplateDepthTestAfterRestart,
  lootNameplateDepthTestFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateDepthTestAfterRestart (R / softReset)", () => {
  test("depthTest fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthTest = lootNameplateDepthTestAfterRestart();
    expect(bootDepthTest).toBe(
      lootNameplateDepthTestFromLook(LOOT_NAMEPLATE_DEPTH_TEST),
    );
    expect(bootDepthTest).toBe(LOOT_NAMEPLATE_DEPTH_TEST);
    expect(bootDepthTest).toBe(LOOT_NAMEPLATE_DEPTH_TEST_SPAWN);
    expect(bootDepthTest).toBe(true);
    expect(lootNameplateDepthTestAfterRestart()).toBe(bootDepthTest);

    const leftoverDepthTest = false;
    expect(lootNameplateDepthTestFromLook(leftoverDepthTest)).toBe(
      leftoverDepthTest,
    );
    expect(lootNameplateDepthTestFromLook(leftoverDepthTest)).not.toBe(
      bootDepthTest,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateDepthTestFromLook(LOOT_NAMEPLATE_DEPTH_TEST)).toBe(
      bootDepthTest,
    );
  });

  test("vivo on no cambia depthTest (ctor constant; sync no escribe)", () => {
    const bootDepthTest = lootNameplateDepthTestAfterRestart();
    const liveDepthTest = lootNameplateDepthTestFromLook(
      LOOT_NAMEPLATE_DEPTH_TEST,
    );
    expect(liveDepthTest).toBe(bootDepthTest);
    expect(liveDepthTest).toBe(lootNameplateDepthTestAfterRestart());
    expect(liveDepthTest).toBe(LOOT_NAMEPLATE_DEPTH_TEST_SPAWN);

    expect(lootNameplateDepthTestFromLook(LOOT_NAMEPLATE_DEPTH_TEST)).toBe(
      bootDepthTest,
    );
    expect(lootNameplateDepthTestFromLook(false)).not.toBe(bootDepthTest);
  });
});

describe("loot nameplate sprite depthTest recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthTest fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateDepthTestAfterRestart(");
    expect(plateSrc).toContain("lootNameplateDepthTestFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_DEPTH_TEST_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateDepthTestAfterRestart\([\s\S]{0,200}lootNameplateDepthTestFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateDepthTestAfterRestart(");
    expect(viewSrc).toContain("lootNameplateDepthTestAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateDepthTestFromLook(");
    expect(viewSrc).toContain("depthTest: lootNameplateDepthTestAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}depthTest:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.depthTest\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.depthTest\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateDepthTestAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateDepthTestAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateDepthTestAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateDepthTestAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateDepthTestAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateDepthTestAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateDepthTestAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateDepthTestAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateDepthTestAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateDepthTestFromLook(");
    expect(saveSrc).not.toContain("lootNameplateDepthTestAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateDepthTestFromLook");
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
