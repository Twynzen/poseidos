import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_DST_ALPHA,
  LOOT_NAMEPLATE_BLEND_DST_ALPHA_SPAWN,
  lootNameplateBlendDstAlphaAfterRestart,
  lootNameplateBlendDstAlphaFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendDstAlphaAfterRestart (R / softReset)", () => {
  test("blendDstAlpha fresco (idle null); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendDstAlpha = lootNameplateBlendDstAlphaAfterRestart();
    expect(bootBlendDstAlpha).toBe(
      lootNameplateBlendDstAlphaFromLook(LOOT_NAMEPLATE_BLEND_DST_ALPHA),
    );
    expect(bootBlendDstAlpha).toBe(LOOT_NAMEPLATE_BLEND_DST_ALPHA);
    expect(bootBlendDstAlpha).toBe(LOOT_NAMEPLATE_BLEND_DST_ALPHA_SPAWN);
    expect(bootBlendDstAlpha).toBe(null);
    expect(lootNameplateBlendDstAlphaAfterRestart()).toBe(bootBlendDstAlpha);

    const leftoverBlendDstAlpha = THREE.OneFactor;
    expect(leftoverBlendDstAlpha).not.toBe(null);
    expect(lootNameplateBlendDstAlphaFromLook(leftoverBlendDstAlpha)).toBe(
      leftoverBlendDstAlpha,
    );
    expect(lootNameplateBlendDstAlphaFromLook(leftoverBlendDstAlpha)).not.toBe(
      bootBlendDstAlpha,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendDstAlphaFromLook(LOOT_NAMEPLATE_BLEND_DST_ALPHA)).toBe(
      bootBlendDstAlpha,
    );
  });

  test("vivo on no cambia blendDstAlpha (ctor constant; sync no escribe)", () => {
    const bootBlendDstAlpha = lootNameplateBlendDstAlphaAfterRestart();
    const liveBlendDstAlpha = lootNameplateBlendDstAlphaFromLook(
      LOOT_NAMEPLATE_BLEND_DST_ALPHA,
    );
    expect(liveBlendDstAlpha).toBe(bootBlendDstAlpha);
    expect(liveBlendDstAlpha).toBe(lootNameplateBlendDstAlphaAfterRestart());
    expect(liveBlendDstAlpha).toBe(LOOT_NAMEPLATE_BLEND_DST_ALPHA_SPAWN);

    expect(lootNameplateBlendDstAlphaFromLook(LOOT_NAMEPLATE_BLEND_DST_ALPHA)).toBe(
      bootBlendDstAlpha,
    );
    expect(lootNameplateBlendDstAlphaFromLook(THREE.OneFactor)).not.toBe(
      bootBlendDstAlpha,
    );
  });
});

describe("loot nameplate sprite blendDstAlpha recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendDstAlpha fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendDstAlphaAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendDstAlphaFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_DST_ALPHA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendDstAlphaAfterRestart\([\s\S]{0,200}lootNameplateBlendDstAlphaFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendDstAlphaAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendDstAlphaAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendDstAlphaFromLook(");
    expect(viewSrc).toContain(
      "blendDstAlpha: lootNameplateBlendDstAlphaAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3800}blendDstAlpha:\s*null/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendDstAlpha\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendDstAlpha\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendDstAlphaAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendDstAlphaAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendDstAlphaAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendDstAlphaFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendDstAlphaAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendDstAlphaFromLook");
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
