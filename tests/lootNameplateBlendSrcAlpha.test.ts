import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_SRC_ALPHA,
  LOOT_NAMEPLATE_BLEND_SRC_ALPHA_SPAWN,
  lootNameplateBlendSrcAlphaAfterRestart,
  lootNameplateBlendSrcAlphaFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendSrcAlphaAfterRestart (R / softReset)", () => {
  test("blendSrcAlpha fresco (idle null); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendSrcAlpha = lootNameplateBlendSrcAlphaAfterRestart();
    expect(bootBlendSrcAlpha).toBe(
      lootNameplateBlendSrcAlphaFromLook(LOOT_NAMEPLATE_BLEND_SRC_ALPHA),
    );
    expect(bootBlendSrcAlpha).toBe(LOOT_NAMEPLATE_BLEND_SRC_ALPHA);
    expect(bootBlendSrcAlpha).toBe(LOOT_NAMEPLATE_BLEND_SRC_ALPHA_SPAWN);
    expect(bootBlendSrcAlpha).toBe(null);
    expect(lootNameplateBlendSrcAlphaAfterRestart()).toBe(bootBlendSrcAlpha);

    const leftoverBlendSrcAlpha = THREE.OneFactor;
    expect(leftoverBlendSrcAlpha).not.toBe(null);
    expect(lootNameplateBlendSrcAlphaFromLook(leftoverBlendSrcAlpha)).toBe(
      leftoverBlendSrcAlpha,
    );
    expect(lootNameplateBlendSrcAlphaFromLook(leftoverBlendSrcAlpha)).not.toBe(
      bootBlendSrcAlpha,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendSrcAlphaFromLook(LOOT_NAMEPLATE_BLEND_SRC_ALPHA)).toBe(
      bootBlendSrcAlpha,
    );
  });

  test("vivo on no cambia blendSrcAlpha (ctor constant; sync no escribe)", () => {
    const bootBlendSrcAlpha = lootNameplateBlendSrcAlphaAfterRestart();
    const liveBlendSrcAlpha = lootNameplateBlendSrcAlphaFromLook(
      LOOT_NAMEPLATE_BLEND_SRC_ALPHA,
    );
    expect(liveBlendSrcAlpha).toBe(bootBlendSrcAlpha);
    expect(liveBlendSrcAlpha).toBe(lootNameplateBlendSrcAlphaAfterRestart());
    expect(liveBlendSrcAlpha).toBe(LOOT_NAMEPLATE_BLEND_SRC_ALPHA_SPAWN);

    expect(lootNameplateBlendSrcAlphaFromLook(LOOT_NAMEPLATE_BLEND_SRC_ALPHA)).toBe(
      bootBlendSrcAlpha,
    );
    expect(lootNameplateBlendSrcAlphaFromLook(THREE.OneFactor)).not.toBe(
      bootBlendSrcAlpha,
    );
  });
});

describe("loot nameplate sprite blendSrcAlpha recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendSrcAlpha fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendSrcAlphaAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendSrcAlphaFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_SRC_ALPHA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendSrcAlphaAfterRestart\([\s\S]{0,200}lootNameplateBlendSrcAlphaFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendSrcAlphaAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendSrcAlphaAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendSrcAlphaFromLook(");
    expect(viewSrc).toContain(
      "blendSrcAlpha: lootNameplateBlendSrcAlphaAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3800}blendSrcAlpha:\s*null/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendSrcAlpha\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendSrcAlpha\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendSrcAlphaAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendSrcAlphaAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendSrcAlphaAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendSrcAlphaFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendSrcAlphaAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendSrcAlphaFromLook");
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
