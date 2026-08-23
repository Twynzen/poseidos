import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_COLOR_WRITE,
  LOOT_NAMEPLATE_COLOR_WRITE_SPAWN,
  lootNameplateColorWriteAfterRestart,
  lootNameplateColorWriteFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateColorWriteAfterRestart (R / softReset)", () => {
  test("colorWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColorWrite = lootNameplateColorWriteAfterRestart();
    expect(bootColorWrite).toBe(
      lootNameplateColorWriteFromLook(LOOT_NAMEPLATE_COLOR_WRITE),
    );
    expect(bootColorWrite).toBe(LOOT_NAMEPLATE_COLOR_WRITE);
    expect(bootColorWrite).toBe(LOOT_NAMEPLATE_COLOR_WRITE_SPAWN);
    expect(bootColorWrite).toBe(true);
    expect(lootNameplateColorWriteAfterRestart()).toBe(bootColorWrite);

    const leftoverColorWrite = false;
    expect(lootNameplateColorWriteFromLook(leftoverColorWrite)).toBe(
      leftoverColorWrite,
    );
    expect(lootNameplateColorWriteFromLook(leftoverColorWrite)).not.toBe(
      bootColorWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateColorWriteFromLook(LOOT_NAMEPLATE_COLOR_WRITE)).toBe(
      bootColorWrite,
    );
  });

  test("vivo on no cambia colorWrite (ctor constant; sync no escribe)", () => {
    const bootColorWrite = lootNameplateColorWriteAfterRestart();
    const liveColorWrite = lootNameplateColorWriteFromLook(
      LOOT_NAMEPLATE_COLOR_WRITE,
    );
    expect(liveColorWrite).toBe(bootColorWrite);
    expect(liveColorWrite).toBe(lootNameplateColorWriteAfterRestart());
    expect(liveColorWrite).toBe(LOOT_NAMEPLATE_COLOR_WRITE_SPAWN);

    expect(lootNameplateColorWriteFromLook(LOOT_NAMEPLATE_COLOR_WRITE)).toBe(
      bootColorWrite,
    );
    expect(lootNameplateColorWriteFromLook(false)).not.toBe(bootColorWrite);
  });
});

describe("loot nameplate sprite colorWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace colorWrite fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateColorWriteAfterRestart(");
    expect(plateSrc).toContain("lootNameplateColorWriteFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_COLOR_WRITE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateColorWriteAfterRestart\([\s\S]{0,200}lootNameplateColorWriteFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateColorWriteAfterRestart(");
    expect(viewSrc).toContain("lootNameplateColorWriteAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateColorWriteFromLook(");
    expect(viewSrc).toContain("colorWrite: lootNameplateColorWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}colorWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.colorWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.colorWrite\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateColorWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateColorWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateColorWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateColorWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateColorWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateColorWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateColorWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateColorWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateColorWriteAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateColorWriteFromLook(");
    expect(saveSrc).not.toContain("lootNameplateColorWriteAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateColorWriteFromLook");
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
