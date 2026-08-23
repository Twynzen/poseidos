import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_DITHERING,
  LOOT_NAMEPLATE_DITHERING_SPAWN,
  lootNameplateDitheringAfterRestart,
  lootNameplateDitheringFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateDitheringAfterRestart (R / softReset)", () => {
  test("dithering fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDithering = lootNameplateDitheringAfterRestart();
    expect(bootDithering).toBe(
      lootNameplateDitheringFromLook(LOOT_NAMEPLATE_DITHERING),
    );
    expect(bootDithering).toBe(LOOT_NAMEPLATE_DITHERING);
    expect(bootDithering).toBe(LOOT_NAMEPLATE_DITHERING_SPAWN);
    expect(bootDithering).toBe(false);
    expect(lootNameplateDitheringAfterRestart()).toBe(bootDithering);

    const leftoverDithering = true;
    expect(lootNameplateDitheringFromLook(leftoverDithering)).toBe(
      leftoverDithering,
    );
    expect(lootNameplateDitheringFromLook(leftoverDithering)).not.toBe(
      bootDithering,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateDitheringFromLook(LOOT_NAMEPLATE_DITHERING)).toBe(
      bootDithering,
    );
  });

  test("vivo on no cambia dithering (ctor constant; sync no escribe)", () => {
    const bootDithering = lootNameplateDitheringAfterRestart();
    const liveDithering = lootNameplateDitheringFromLook(
      LOOT_NAMEPLATE_DITHERING,
    );
    expect(liveDithering).toBe(bootDithering);
    expect(liveDithering).toBe(lootNameplateDitheringAfterRestart());
    expect(liveDithering).toBe(LOOT_NAMEPLATE_DITHERING_SPAWN);

    expect(lootNameplateDitheringFromLook(LOOT_NAMEPLATE_DITHERING)).toBe(
      bootDithering,
    );
    expect(lootNameplateDitheringFromLook(true)).not.toBe(bootDithering);
  });
});

describe("loot nameplate sprite dithering recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace dithering fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateDitheringAfterRestart(");
    expect(plateSrc).toContain("lootNameplateDitheringFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_DITHERING_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateDitheringAfterRestart\([\s\S]{0,200}lootNameplateDitheringFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateDitheringAfterRestart(");
    expect(viewSrc).toContain("lootNameplateDitheringAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateDitheringFromLook(");
    expect(viewSrc).toContain("dithering: lootNameplateDitheringAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1800}dithering:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.dithering\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.dithering\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateDitheringAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateDitheringAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateDitheringAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateDitheringAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateDitheringAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateDitheringAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateDitheringAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateDitheringAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateDitheringAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateDitheringFromLook(");
    expect(saveSrc).not.toContain("lootNameplateDitheringAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateDitheringFromLook");
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
