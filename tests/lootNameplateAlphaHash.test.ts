import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ALPHA_HASH,
  LOOT_NAMEPLATE_ALPHA_HASH_SPAWN,
  lootNameplateAlphaHashAfterRestart,
  lootNameplateAlphaHashFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateAlphaHashAfterRestart (R / softReset)", () => {
  test("alphaHash fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAlphaHash = lootNameplateAlphaHashAfterRestart();
    expect(bootAlphaHash).toBe(
      lootNameplateAlphaHashFromLook(LOOT_NAMEPLATE_ALPHA_HASH),
    );
    expect(bootAlphaHash).toBe(LOOT_NAMEPLATE_ALPHA_HASH);
    expect(bootAlphaHash).toBe(LOOT_NAMEPLATE_ALPHA_HASH_SPAWN);
    expect(bootAlphaHash).toBe(false);
    expect(lootNameplateAlphaHashAfterRestart()).toBe(bootAlphaHash);

    const leftoverAlphaHash = true;
    expect(lootNameplateAlphaHashFromLook(leftoverAlphaHash)).toBe(
      leftoverAlphaHash,
    );
    expect(lootNameplateAlphaHashFromLook(leftoverAlphaHash)).not.toBe(
      bootAlphaHash,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateAlphaHashFromLook(LOOT_NAMEPLATE_ALPHA_HASH)).toBe(
      bootAlphaHash,
    );
  });

  test("vivo on no cambia alphaHash (ctor constant; sync no escribe)", () => {
    const bootAlphaHash = lootNameplateAlphaHashAfterRestart();
    const liveAlphaHash = lootNameplateAlphaHashFromLook(
      LOOT_NAMEPLATE_ALPHA_HASH,
    );
    expect(liveAlphaHash).toBe(bootAlphaHash);
    expect(liveAlphaHash).toBe(lootNameplateAlphaHashAfterRestart());
    expect(liveAlphaHash).toBe(LOOT_NAMEPLATE_ALPHA_HASH_SPAWN);

    expect(lootNameplateAlphaHashFromLook(LOOT_NAMEPLATE_ALPHA_HASH)).toBe(
      bootAlphaHash,
    );
    expect(lootNameplateAlphaHashFromLook(true)).not.toBe(bootAlphaHash);
  });
});

describe("loot nameplate sprite alphaHash recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace alphaHash fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateAlphaHashAfterRestart(");
    expect(plateSrc).toContain("lootNameplateAlphaHashFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ALPHA_HASH_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateAlphaHashAfterRestart\([\s\S]{0,200}lootNameplateAlphaHashFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateAlphaHashAfterRestart(");
    expect(viewSrc).toContain("lootNameplateAlphaHashAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateAlphaHashFromLook(");
    expect(viewSrc).toContain(
      "alphaHash: lootNameplateAlphaHashAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,2800}alphaHash:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.alphaHash\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.alphaHash\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateAlphaHashAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateAlphaHashAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateAlphaHashAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateAlphaHashAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateAlphaHashAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateAlphaHashAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateAlphaHashAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateAlphaHashAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateAlphaHashAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateAlphaHashFromLook(");
    expect(saveSrc).not.toContain("lootNameplateAlphaHashAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateAlphaHashFromLook");
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
