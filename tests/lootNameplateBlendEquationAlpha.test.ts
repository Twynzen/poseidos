import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA,
  LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA_SPAWN,
  lootNameplateBlendEquationAlphaAfterRestart,
  lootNameplateBlendEquationAlphaFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendEquationAlphaAfterRestart (R / softReset)", () => {
  test("blendEquationAlpha fresco (idle null); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendEquationAlpha = lootNameplateBlendEquationAlphaAfterRestart();
    expect(bootBlendEquationAlpha).toBe(
      lootNameplateBlendEquationAlphaFromLook(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA),
    );
    expect(bootBlendEquationAlpha).toBe(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA);
    expect(bootBlendEquationAlpha).toBe(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA_SPAWN);
    expect(bootBlendEquationAlpha).toBe(null);
    expect(lootNameplateBlendEquationAlphaAfterRestart()).toBe(bootBlendEquationAlpha);

    const leftoverBlendEquationAlpha = THREE.SubtractEquation;
    expect(leftoverBlendEquationAlpha).not.toBe(null);
    expect(lootNameplateBlendEquationAlphaFromLook(leftoverBlendEquationAlpha)).toBe(
      leftoverBlendEquationAlpha,
    );
    expect(lootNameplateBlendEquationAlphaFromLook(leftoverBlendEquationAlpha)).not.toBe(
      bootBlendEquationAlpha,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendEquationAlphaFromLook(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA)).toBe(
      bootBlendEquationAlpha,
    );
  });

  test("vivo on no cambia blendEquationAlpha (ctor constant; sync no escribe)", () => {
    const bootBlendEquationAlpha = lootNameplateBlendEquationAlphaAfterRestart();
    const liveBlendEquationAlpha = lootNameplateBlendEquationAlphaFromLook(
      LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA,
    );
    expect(liveBlendEquationAlpha).toBe(bootBlendEquationAlpha);
    expect(liveBlendEquationAlpha).toBe(lootNameplateBlendEquationAlphaAfterRestart());
    expect(liveBlendEquationAlpha).toBe(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA_SPAWN);

    expect(lootNameplateBlendEquationAlphaFromLook(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA)).toBe(
      bootBlendEquationAlpha,
    );
    expect(lootNameplateBlendEquationAlphaFromLook(THREE.SubtractEquation)).not.toBe(
      bootBlendEquationAlpha,
    );
  });
});

describe("loot nameplate sprite blendEquationAlpha recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendEquationAlpha fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendEquationAlphaAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendEquationAlphaFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendEquationAlphaAfterRestart\([\s\S]{0,200}lootNameplateBlendEquationAlphaFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendEquationAlphaAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendEquationAlphaAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendEquationAlphaFromLook(");
    expect(viewSrc).toContain(
      "blendEquationAlpha: lootNameplateBlendEquationAlphaAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3800}blendEquationAlpha:\s*null/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendEquationAlpha\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendEquationAlpha\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendEquationAlphaAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendEquationAlphaAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendEquationAlphaAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendEquationAlphaFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendEquationAlphaAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendEquationAlphaFromLook");
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
