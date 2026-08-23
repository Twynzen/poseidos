import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_TONE_MAPPED,
  LOOT_NAMEPLATE_TONE_MAPPED_SPAWN,
  lootNameplateToneMappedAfterRestart,
  lootNameplateToneMappedFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateToneMappedAfterRestart (R / softReset)", () => {
  test("toneMapped fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootToneMapped = lootNameplateToneMappedAfterRestart();
    expect(bootToneMapped).toBe(
      lootNameplateToneMappedFromLook(LOOT_NAMEPLATE_TONE_MAPPED),
    );
    expect(bootToneMapped).toBe(LOOT_NAMEPLATE_TONE_MAPPED);
    expect(bootToneMapped).toBe(LOOT_NAMEPLATE_TONE_MAPPED_SPAWN);
    expect(bootToneMapped).toBe(true);
    expect(lootNameplateToneMappedAfterRestart()).toBe(bootToneMapped);

    const leftoverToneMapped = false;
    expect(lootNameplateToneMappedFromLook(leftoverToneMapped)).toBe(
      leftoverToneMapped,
    );
    expect(lootNameplateToneMappedFromLook(leftoverToneMapped)).not.toBe(
      bootToneMapped,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateToneMappedFromLook(LOOT_NAMEPLATE_TONE_MAPPED)).toBe(
      bootToneMapped,
    );
  });

  test("vivo on no cambia toneMapped (ctor constant; sync no escribe)", () => {
    const bootToneMapped = lootNameplateToneMappedAfterRestart();
    const liveToneMapped = lootNameplateToneMappedFromLook(
      LOOT_NAMEPLATE_TONE_MAPPED,
    );
    expect(liveToneMapped).toBe(bootToneMapped);
    expect(liveToneMapped).toBe(lootNameplateToneMappedAfterRestart());
    expect(liveToneMapped).toBe(LOOT_NAMEPLATE_TONE_MAPPED_SPAWN);

    expect(lootNameplateToneMappedFromLook(LOOT_NAMEPLATE_TONE_MAPPED)).toBe(
      bootToneMapped,
    );
    expect(lootNameplateToneMappedFromLook(false)).not.toBe(bootToneMapped);
  });
});

describe("loot nameplate sprite toneMapped recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace toneMapped fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateToneMappedAfterRestart(");
    expect(plateSrc).toContain("lootNameplateToneMappedFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_TONE_MAPPED_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateToneMappedAfterRestart\([\s\S]{0,200}lootNameplateToneMappedFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateToneMappedAfterRestart(");
    expect(viewSrc).toContain("lootNameplateToneMappedAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateToneMappedFromLook(");
    expect(viewSrc).toContain("toneMapped: lootNameplateToneMappedAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,2000}toneMapped:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.toneMapped\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.toneMapped\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateToneMappedAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateToneMappedAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateToneMappedAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateToneMappedAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateToneMappedAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateToneMappedAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateToneMappedAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateToneMappedAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateToneMappedAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateToneMappedFromLook(");
    expect(saveSrc).not.toContain("lootNameplateToneMappedAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateToneMappedFromLook");
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
