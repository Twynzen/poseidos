import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_COLOR,
  LOOT_NAMEPLATE_COLOR_SPAWN,
  lootNameplateColorAfterRestart,
  lootNameplateColorFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle 0xffffff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = lootNameplateColorAfterRestart();
    expect(bootColor).toBe(lootNameplateColorFromLook(LOOT_NAMEPLATE_COLOR));
    expect(bootColor).toBe(LOOT_NAMEPLATE_COLOR);
    expect(bootColor).toBe(LOOT_NAMEPLATE_COLOR_SPAWN);
    expect(bootColor).toBe(0xffffff);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xff);
    expect(lootNameplateColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xff0000;
    expect(lootNameplateColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(lootNameplateColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateColorFromLook(LOOT_NAMEPLATE_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = lootNameplateColorAfterRestart();
    const liveColor = lootNameplateColorFromLook(LOOT_NAMEPLATE_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(lootNameplateColorAfterRestart());
    expect(liveColor).toBe(LOOT_NAMEPLATE_COLOR_SPAWN);

    expect(lootNameplateColorFromLook(LOOT_NAMEPLATE_COLOR)).toBe(bootColor);
    expect(lootNameplateColorFromLook(0xff0000)).not.toBe(bootColor);
  });
});

describe("loot nameplate sprite color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateColorAfterRestart(");
    expect(plateSrc).toContain("lootNameplateColorFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_COLOR_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateColorAfterRestart\([\s\S]{0,200}lootNameplateColorFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateColorAfterRestart(");
    expect(viewSrc).toContain("lootNameplateColorAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateColorFromLook(");
    expect(viewSrc).toContain("color: lootNameplateColorAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,240}color:\s*0xffffff/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.color\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.material[\s\S]{0,80}\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateColorAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateColorFromLook(");
    expect(saveSrc).not.toContain("lootNameplateColorAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateColorFromLook");
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
