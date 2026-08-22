import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_TRANSPARENT,
  LOOT_NAMEPLATE_TRANSPARENT_SPAWN,
  lootNameplateTransparentAfterRestart,
  lootNameplateTransparentFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = lootNameplateTransparentAfterRestart();
    expect(bootTransparent).toBe(
      lootNameplateTransparentFromLook(LOOT_NAMEPLATE_TRANSPARENT),
    );
    expect(bootTransparent).toBe(LOOT_NAMEPLATE_TRANSPARENT);
    expect(bootTransparent).toBe(LOOT_NAMEPLATE_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(lootNameplateTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(lootNameplateTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(lootNameplateTransparentFromLook(leftoverTransparent)).not.toBe(
      bootTransparent,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateTransparentFromLook(LOOT_NAMEPLATE_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = lootNameplateTransparentAfterRestart();
    const liveTransparent = lootNameplateTransparentFromLook(
      LOOT_NAMEPLATE_TRANSPARENT,
    );
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(lootNameplateTransparentAfterRestart());
    expect(liveTransparent).toBe(LOOT_NAMEPLATE_TRANSPARENT_SPAWN);

    expect(lootNameplateTransparentFromLook(LOOT_NAMEPLATE_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(lootNameplateTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("loot nameplate sprite transparent recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace transparent fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateTransparentAfterRestart(");
    expect(plateSrc).toContain("lootNameplateTransparentFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_TRANSPARENT_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateTransparentAfterRestart\([\s\S]{0,200}lootNameplateTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateTransparentAfterRestart(");
    expect(viewSrc).toContain("lootNameplateTransparentAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateTransparentFromLook(");
    expect(viewSrc).toContain(
      "transparent: lootNameplateTransparentAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,240}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.material[\s\S]{0,80}\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateTransparentAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3600}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateTransparentAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateTransparentFromLook(");
    expect(saveSrc).not.toContain("lootNameplateTransparentAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateTransparentFromLook");
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
