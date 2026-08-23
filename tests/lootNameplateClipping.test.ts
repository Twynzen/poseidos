import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CLIPPING,
  LOOT_NAMEPLATE_CLIPPING_SPAWN,
  lootNameplateClippingAfterRestart,
  lootNameplateClippingFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateClippingAfterRestart (R / softReset)", () => {
  test("clipping fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootClipping = lootNameplateClippingAfterRestart();
    expect(bootClipping).toBe(
      lootNameplateClippingFromLook(LOOT_NAMEPLATE_CLIPPING),
    );
    expect(bootClipping).toBe(LOOT_NAMEPLATE_CLIPPING);
    expect(bootClipping).toBe(LOOT_NAMEPLATE_CLIPPING_SPAWN);
    expect(bootClipping).toBe(false);
    expect(lootNameplateClippingAfterRestart()).toBe(bootClipping);

    const leftoverClipping = true;
    expect(leftoverClipping).not.toBe(false);
    expect(lootNameplateClippingFromLook(leftoverClipping)).toBe(
      leftoverClipping,
    );
    expect(lootNameplateClippingFromLook(leftoverClipping)).not.toBe(
      bootClipping,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateClippingFromLook(LOOT_NAMEPLATE_CLIPPING)).toBe(
      bootClipping,
    );
  });

  test("vivo on no cambia clipping (ctor constant; sync no escribe)", () => {
    const bootClipping = lootNameplateClippingAfterRestart();
    const liveClipping = lootNameplateClippingFromLook(LOOT_NAMEPLATE_CLIPPING);
    expect(liveClipping).toBe(bootClipping);
    expect(liveClipping).toBe(lootNameplateClippingAfterRestart());
    expect(liveClipping).toBe(LOOT_NAMEPLATE_CLIPPING_SPAWN);

    expect(lootNameplateClippingFromLook(LOOT_NAMEPLATE_CLIPPING)).toBe(
      bootClipping,
    );
    expect(lootNameplateClippingFromLook(true)).not.toBe(bootClipping);
  });
});

describe("loot nameplate sprite clipping recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace clipping fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateClippingAfterRestart(");
    expect(plateSrc).toContain("lootNameplateClippingFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CLIPPING_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateClippingAfterRestart\([\s\S]{0,200}lootNameplateClippingFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateClippingAfterRestart(");
    expect(viewSrc).toContain("lootNameplateClippingAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateClippingFromLook(");
    expect(viewSrc).toContain("clipping: lootNameplateClippingAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}clipping:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.clipping\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.clipping\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateClippingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateClippingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateClippingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateClippingAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateClippingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateClippingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateClippingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateClippingAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateClippingAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateClippingFromLook(");
    expect(saveSrc).not.toContain("lootNameplateClippingAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateClippingFromLook");
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
