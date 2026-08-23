import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_SIDE,
  LOOT_NAMEPLATE_SIDE_SPAWN,
  lootNameplateSideAfterRestart,
  lootNameplateSideFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = lootNameplateSideAfterRestart();
    expect(bootSide).toBe(lootNameplateSideFromLook(LOOT_NAMEPLATE_SIDE));
    expect(bootSide).toBe(LOOT_NAMEPLATE_SIDE);
    expect(bootSide).toBe(LOOT_NAMEPLATE_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(lootNameplateSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(lootNameplateSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(lootNameplateSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateSideFromLook(LOOT_NAMEPLATE_SIDE)).toBe(bootSide);
    expect(lootNameplateSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; sync no escribe)", () => {
    const bootSide = lootNameplateSideAfterRestart();
    const liveSide = lootNameplateSideFromLook(LOOT_NAMEPLATE_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(lootNameplateSideAfterRestart());
    expect(liveSide).toBe(LOOT_NAMEPLATE_SIDE_SPAWN);

    expect(lootNameplateSideFromLook(LOOT_NAMEPLATE_SIDE)).toBe(bootSide);
    expect(lootNameplateSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("loot nameplate sprite side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateSideAfterRestart(");
    expect(plateSrc).toContain("lootNameplateSideFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_SIDE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateSideAfterRestart\([\s\S]{0,200}lootNameplateSideFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateSideAfterRestart(");
    expect(viewSrc).toContain("lootNameplateSideAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateSideFromLook(");
    expect(viewSrc).toContain("side: lootNameplateSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.side\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.material[\s\S]{0,80}\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateSideAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateSideFromLook(");
    expect(saveSrc).not.toContain("lootNameplateSideAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateSideFromLook");
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
