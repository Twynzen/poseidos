import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_SIZE_ATTENUATION,
  LOOT_NAMEPLATE_SIZE_ATTENUATION_SPAWN,
  lootNameplateSizeAttenuationAfterRestart,
  lootNameplateSizeAttenuationFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateSizeAttenuationAfterRestart (R / softReset)", () => {
  test("sizeAttenuation fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSizeAttenuation = lootNameplateSizeAttenuationAfterRestart();
    expect(bootSizeAttenuation).toBe(
      lootNameplateSizeAttenuationFromLook(LOOT_NAMEPLATE_SIZE_ATTENUATION),
    );
    expect(bootSizeAttenuation).toBe(LOOT_NAMEPLATE_SIZE_ATTENUATION);
    expect(bootSizeAttenuation).toBe(LOOT_NAMEPLATE_SIZE_ATTENUATION_SPAWN);
    expect(bootSizeAttenuation).toBe(true);
    expect(lootNameplateSizeAttenuationAfterRestart()).toBe(bootSizeAttenuation);

    const leftoverSizeAttenuation = false;
    expect(
      lootNameplateSizeAttenuationFromLook(leftoverSizeAttenuation),
    ).toBe(leftoverSizeAttenuation);
    expect(
      lootNameplateSizeAttenuationFromLook(leftoverSizeAttenuation),
    ).not.toBe(bootSizeAttenuation);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateSizeAttenuationFromLook(LOOT_NAMEPLATE_SIZE_ATTENUATION),
    ).toBe(bootSizeAttenuation);
  });

  test("vivo on no cambia sizeAttenuation (ctor constant; sync no escribe)", () => {
    const bootSizeAttenuation = lootNameplateSizeAttenuationAfterRestart();
    const liveSizeAttenuation = lootNameplateSizeAttenuationFromLook(
      LOOT_NAMEPLATE_SIZE_ATTENUATION,
    );
    expect(liveSizeAttenuation).toBe(bootSizeAttenuation);
    expect(liveSizeAttenuation).toBe(
      lootNameplateSizeAttenuationAfterRestart(),
    );
    expect(liveSizeAttenuation).toBe(LOOT_NAMEPLATE_SIZE_ATTENUATION_SPAWN);

    expect(
      lootNameplateSizeAttenuationFromLook(LOOT_NAMEPLATE_SIZE_ATTENUATION),
    ).toBe(bootSizeAttenuation);
    expect(lootNameplateSizeAttenuationFromLook(false)).not.toBe(
      bootSizeAttenuation,
    );
  });
});

describe("loot nameplate sprite sizeAttenuation recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace sizeAttenuation fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateSizeAttenuationAfterRestart(");
    expect(plateSrc).toContain("lootNameplateSizeAttenuationFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_SIZE_ATTENUATION_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateSizeAttenuationAfterRestart\([\s\S]{0,200}lootNameplateSizeAttenuationFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateSizeAttenuationAfterRestart(");
    expect(viewSrc).toContain("lootNameplateSizeAttenuationAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateSizeAttenuationFromLook(");
    expect(viewSrc).toContain(
      "sizeAttenuation: lootNameplateSizeAttenuationAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}sizeAttenuation:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.sizeAttenuation\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.sizeAttenuation\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateSizeAttenuationAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateSizeAttenuationAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateSizeAttenuationAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateSizeAttenuationFromLook(");
    expect(saveSrc).not.toContain("lootNameplateSizeAttenuationAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateSizeAttenuationFromLook");
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
