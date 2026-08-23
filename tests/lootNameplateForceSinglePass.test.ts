import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_FORCE_SINGLE_PASS,
  LOOT_NAMEPLATE_FORCE_SINGLE_PASS_SPAWN,
  lootNameplateForceSinglePassAfterRestart,
  lootNameplateForceSinglePassFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateForceSinglePassAfterRestart (R / softReset)", () => {
  test("forceSinglePass fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootForceSinglePass = lootNameplateForceSinglePassAfterRestart();
    expect(bootForceSinglePass).toBe(
      lootNameplateForceSinglePassFromLook(LOOT_NAMEPLATE_FORCE_SINGLE_PASS),
    );
    expect(bootForceSinglePass).toBe(LOOT_NAMEPLATE_FORCE_SINGLE_PASS);
    expect(bootForceSinglePass).toBe(LOOT_NAMEPLATE_FORCE_SINGLE_PASS_SPAWN);
    expect(bootForceSinglePass).toBe(false);
    expect(lootNameplateForceSinglePassAfterRestart()).toBe(bootForceSinglePass);

    const leftoverForceSinglePass = true;
    expect(lootNameplateForceSinglePassFromLook(leftoverForceSinglePass)).toBe(
      leftoverForceSinglePass,
    );
    expect(lootNameplateForceSinglePassFromLook(leftoverForceSinglePass)).not.toBe(
      bootForceSinglePass,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateForceSinglePassFromLook(LOOT_NAMEPLATE_FORCE_SINGLE_PASS)).toBe(
      bootForceSinglePass,
    );
  });

  test("vivo on no cambia forceSinglePass (ctor constant; sync no escribe)", () => {
    const bootForceSinglePass = lootNameplateForceSinglePassAfterRestart();
    const liveForceSinglePass = lootNameplateForceSinglePassFromLook(
      LOOT_NAMEPLATE_FORCE_SINGLE_PASS,
    );
    expect(liveForceSinglePass).toBe(bootForceSinglePass);
    expect(liveForceSinglePass).toBe(lootNameplateForceSinglePassAfterRestart());
    expect(liveForceSinglePass).toBe(LOOT_NAMEPLATE_FORCE_SINGLE_PASS_SPAWN);

    expect(lootNameplateForceSinglePassFromLook(LOOT_NAMEPLATE_FORCE_SINGLE_PASS)).toBe(
      bootForceSinglePass,
    );
    expect(lootNameplateForceSinglePassFromLook(true)).not.toBe(bootForceSinglePass);
  });
});

describe("loot nameplate sprite forceSinglePass recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace forceSinglePass fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateForceSinglePassAfterRestart(");
    expect(plateSrc).toContain("lootNameplateForceSinglePassFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_FORCE_SINGLE_PASS_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateForceSinglePassAfterRestart\([\s\S]{0,200}lootNameplateForceSinglePassFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateForceSinglePassAfterRestart(");
    expect(viewSrc).toContain("lootNameplateForceSinglePassAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateForceSinglePassFromLook(");
    expect(viewSrc).toContain(
      "forceSinglePass: lootNameplateForceSinglePassAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3200}forceSinglePass:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.forceSinglePass\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.forceSinglePass\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateForceSinglePassAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateForceSinglePassAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateForceSinglePassAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateForceSinglePassFromLook(");
    expect(saveSrc).not.toContain("lootNameplateForceSinglePassAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateForceSinglePassFromLook");
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
