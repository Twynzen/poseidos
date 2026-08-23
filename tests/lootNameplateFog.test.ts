import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_FOG,
  LOOT_NAMEPLATE_FOG_SPAWN,
  lootNameplateFogAfterRestart,
  lootNameplateFogFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateFogAfterRestart (R / softReset)", () => {
  test("fog fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootFog = lootNameplateFogAfterRestart();
    expect(bootFog).toBe(lootNameplateFogFromLook(LOOT_NAMEPLATE_FOG));
    expect(bootFog).toBe(LOOT_NAMEPLATE_FOG);
    expect(bootFog).toBe(LOOT_NAMEPLATE_FOG_SPAWN);
    expect(bootFog).toBe(true);
    expect(lootNameplateFogAfterRestart()).toBe(bootFog);

    const leftoverFog = false;
    expect(lootNameplateFogFromLook(leftoverFog)).toBe(leftoverFog);
    expect(lootNameplateFogFromLook(leftoverFog)).not.toBe(bootFog);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateFogFromLook(LOOT_NAMEPLATE_FOG)).toBe(bootFog);
  });

  test("vivo on no cambia fog (ctor constant; sync no escribe)", () => {
    const bootFog = lootNameplateFogAfterRestart();
    const liveFog = lootNameplateFogFromLook(LOOT_NAMEPLATE_FOG);
    expect(liveFog).toBe(bootFog);
    expect(liveFog).toBe(lootNameplateFogAfterRestart());
    expect(liveFog).toBe(LOOT_NAMEPLATE_FOG_SPAWN);

    expect(lootNameplateFogFromLook(LOOT_NAMEPLATE_FOG)).toBe(bootFog);
    expect(lootNameplateFogFromLook(false)).not.toBe(bootFog);
  });
});

describe("loot nameplate sprite fog recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace fog fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateFogAfterRestart(");
    expect(plateSrc).toContain("lootNameplateFogFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_FOG_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateFogAfterRestart\([\s\S]{0,200}lootNameplateFogFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateFogAfterRestart(");
    expect(viewSrc).toContain("lootNameplateFogAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateFogFromLook(");
    expect(viewSrc).toContain("fog: lootNameplateFogAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}fog:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.fog\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.material[\s\S]{0,80}\.fog\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateFogAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateFogAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateFogAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateFogAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateFogAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateFogAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateFogAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateFogAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateFogAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateFogFromLook(");
    expect(saveSrc).not.toContain("lootNameplateFogAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateFogFromLook");
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
