import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ALPHA_TO_COVERAGE,
  LOOT_NAMEPLATE_ALPHA_TO_COVERAGE_SPAWN,
  lootNameplateAlphaToCoverageAfterRestart,
  lootNameplateAlphaToCoverageFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateAlphaToCoverageAfterRestart (R / softReset)", () => {
  test("alphaToCoverage fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAlphaToCoverage = lootNameplateAlphaToCoverageAfterRestart();
    expect(bootAlphaToCoverage).toBe(
      lootNameplateAlphaToCoverageFromLook(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE),
    );
    expect(bootAlphaToCoverage).toBe(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE);
    expect(bootAlphaToCoverage).toBe(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE_SPAWN);
    expect(bootAlphaToCoverage).toBe(false);
    expect(lootNameplateAlphaToCoverageAfterRestart()).toBe(bootAlphaToCoverage);

    const leftoverAlphaToCoverage = true;
    expect(lootNameplateAlphaToCoverageFromLook(leftoverAlphaToCoverage)).toBe(
      leftoverAlphaToCoverage,
    );
    expect(lootNameplateAlphaToCoverageFromLook(leftoverAlphaToCoverage)).not.toBe(
      bootAlphaToCoverage,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateAlphaToCoverageFromLook(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE)).toBe(
      bootAlphaToCoverage,
    );
  });

  test("vivo on no cambia alphaToCoverage (ctor constant; sync no escribe)", () => {
    const bootAlphaToCoverage = lootNameplateAlphaToCoverageAfterRestart();
    const liveAlphaToCoverage = lootNameplateAlphaToCoverageFromLook(
      LOOT_NAMEPLATE_ALPHA_TO_COVERAGE,
    );
    expect(liveAlphaToCoverage).toBe(bootAlphaToCoverage);
    expect(liveAlphaToCoverage).toBe(lootNameplateAlphaToCoverageAfterRestart());
    expect(liveAlphaToCoverage).toBe(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE_SPAWN);

    expect(lootNameplateAlphaToCoverageFromLook(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE)).toBe(
      bootAlphaToCoverage,
    );
    expect(lootNameplateAlphaToCoverageFromLook(true)).not.toBe(bootAlphaToCoverage);
  });
});

describe("loot nameplate sprite alphaToCoverage recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace alphaToCoverage fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateAlphaToCoverageAfterRestart(");
    expect(plateSrc).toContain("lootNameplateAlphaToCoverageFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ALPHA_TO_COVERAGE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateAlphaToCoverageAfterRestart\([\s\S]{0,200}lootNameplateAlphaToCoverageFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateAlphaToCoverageAfterRestart(");
    expect(viewSrc).toContain("lootNameplateAlphaToCoverageAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateAlphaToCoverageFromLook(");
    expect(viewSrc).toContain(
      "alphaToCoverage: lootNameplateAlphaToCoverageAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3200}alphaToCoverage:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.alphaToCoverage\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.alphaToCoverage\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateAlphaToCoverageAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateAlphaToCoverageAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateAlphaToCoverageAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateAlphaToCoverageFromLook(");
    expect(saveSrc).not.toContain("lootNameplateAlphaToCoverageAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateAlphaToCoverageFromLook");
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
