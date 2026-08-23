import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CLIP_SHADOWS,
  LOOT_NAMEPLATE_CLIP_SHADOWS_SPAWN,
  lootNameplateClipShadowsAfterRestart,
  lootNameplateClipShadowsFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateClipShadowsAfterRestart (R / softReset)", () => {
  test("clipShadows fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootClipShadows = lootNameplateClipShadowsAfterRestart();
    expect(bootClipShadows).toBe(
      lootNameplateClipShadowsFromLook(LOOT_NAMEPLATE_CLIP_SHADOWS),
    );
    expect(bootClipShadows).toBe(LOOT_NAMEPLATE_CLIP_SHADOWS);
    expect(bootClipShadows).toBe(LOOT_NAMEPLATE_CLIP_SHADOWS_SPAWN);
    expect(bootClipShadows).toBe(false);
    expect(lootNameplateClipShadowsAfterRestart()).toBe(bootClipShadows);

    const leftoverClipShadows = true;
    expect(leftoverClipShadows).not.toBe(false);
    expect(lootNameplateClipShadowsFromLook(leftoverClipShadows)).toBe(
      leftoverClipShadows,
    );
    expect(lootNameplateClipShadowsFromLook(leftoverClipShadows)).not.toBe(
      bootClipShadows,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateClipShadowsFromLook(LOOT_NAMEPLATE_CLIP_SHADOWS)).toBe(
      bootClipShadows,
    );
  });

  test("vivo on no cambia clipShadows (ctor constant; sync no escribe)", () => {
    const bootClipShadows = lootNameplateClipShadowsAfterRestart();
    const liveClipShadows = lootNameplateClipShadowsFromLook(
      LOOT_NAMEPLATE_CLIP_SHADOWS,
    );
    expect(liveClipShadows).toBe(bootClipShadows);
    expect(liveClipShadows).toBe(lootNameplateClipShadowsAfterRestart());
    expect(liveClipShadows).toBe(LOOT_NAMEPLATE_CLIP_SHADOWS_SPAWN);

    expect(lootNameplateClipShadowsFromLook(LOOT_NAMEPLATE_CLIP_SHADOWS)).toBe(
      bootClipShadows,
    );
    expect(lootNameplateClipShadowsFromLook(true)).not.toBe(bootClipShadows);
  });
});

describe("loot nameplate sprite clipShadows recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace clipShadows fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateClipShadowsAfterRestart(");
    expect(plateSrc).toContain("lootNameplateClipShadowsFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CLIP_SHADOWS_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateClipShadowsAfterRestart\([\s\S]{0,200}lootNameplateClipShadowsFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateClipShadowsAfterRestart(");
    expect(viewSrc).toContain("lootNameplateClipShadowsAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateClipShadowsFromLook(");
    expect(viewSrc).toContain(
      "clipShadows: lootNameplateClipShadowsAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}clipShadows:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.clipShadows\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.clipShadows\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateClipShadowsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateClipShadowsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateClipShadowsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateClipShadowsAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateClipShadowsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateClipShadowsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateClipShadowsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateClipShadowsAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateClipShadowsAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateClipShadowsFromLook(");
    expect(saveSrc).not.toContain("lootNameplateClipShadowsAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateClipShadowsFromLook");
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
