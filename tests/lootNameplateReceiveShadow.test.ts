import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_RECEIVE_SHADOW,
  LOOT_NAMEPLATE_RECEIVE_SHADOW_SPAWN,
  lootNameplateReceiveShadowAfterRestart,
  lootNameplateReceiveShadowFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateReceiveShadowAfterRestart (R / softReset)", () => {
  test("receiveShadow fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootReceiveShadow = lootNameplateReceiveShadowAfterRestart();
    expect(bootReceiveShadow).toBe(
      lootNameplateReceiveShadowFromLook(LOOT_NAMEPLATE_RECEIVE_SHADOW),
    );
    expect(bootReceiveShadow).toBe(LOOT_NAMEPLATE_RECEIVE_SHADOW);
    expect(bootReceiveShadow).toBe(LOOT_NAMEPLATE_RECEIVE_SHADOW_SPAWN);
    expect(bootReceiveShadow).toBe(false);
    expect(lootNameplateReceiveShadowAfterRestart()).toBe(bootReceiveShadow);

    const leftoverReceiveShadow = true;
    expect(leftoverReceiveShadow).not.toBe(false);
    expect(lootNameplateReceiveShadowFromLook(leftoverReceiveShadow)).toBe(
      leftoverReceiveShadow,
    );
    expect(lootNameplateReceiveShadowFromLook(leftoverReceiveShadow)).not.toBe(
      bootReceiveShadow,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateReceiveShadowFromLook(LOOT_NAMEPLATE_RECEIVE_SHADOW)).toBe(
      bootReceiveShadow,
    );
  });

  test("vivo on no cambia receiveShadow (ctor constant; sync no escribe)", () => {
    const bootReceiveShadow = lootNameplateReceiveShadowAfterRestart();
    const liveReceiveShadow = lootNameplateReceiveShadowFromLook(
      LOOT_NAMEPLATE_RECEIVE_SHADOW,
    );
    expect(liveReceiveShadow).toBe(bootReceiveShadow);
    expect(liveReceiveShadow).toBe(lootNameplateReceiveShadowAfterRestart());
    expect(liveReceiveShadow).toBe(LOOT_NAMEPLATE_RECEIVE_SHADOW_SPAWN);

    expect(lootNameplateReceiveShadowFromLook(LOOT_NAMEPLATE_RECEIVE_SHADOW)).toBe(
      bootReceiveShadow,
    );
    expect(lootNameplateReceiveShadowFromLook(true)).not.toBe(bootReceiveShadow);
  });
});

describe("loot nameplate sprite receiveShadow recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace receiveShadow fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateReceiveShadowAfterRestart(");
    expect(plateSrc).toContain("lootNameplateReceiveShadowFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_RECEIVE_SHADOW_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateReceiveShadowAfterRestart\([\s\S]{0,200}lootNameplateReceiveShadowFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateReceiveShadowAfterRestart(");
    expect(viewSrc).toContain("lootNameplateReceiveShadowAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateReceiveShadowFromLook(");
    expect(viewSrc).toContain(
      "sprite.receiveShadow = lootNameplateReceiveShadowAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.receiveShadow\s*=\s*false/);
    expect(viewSrc).not.toMatch(/plateMat\.receiveShadow\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.receiveShadow\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateReceiveShadowAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateReceiveShadowAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateReceiveShadowAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateReceiveShadowFromLook(");
    expect(saveSrc).not.toContain("lootNameplateReceiveShadowAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateReceiveShadowFromLook");
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
