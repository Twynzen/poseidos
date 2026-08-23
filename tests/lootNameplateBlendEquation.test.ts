import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_EQUATION,
  LOOT_NAMEPLATE_BLEND_EQUATION_SPAWN,
  lootNameplateBlendEquationAfterRestart,
  lootNameplateBlendEquationFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendEquationAfterRestart (R / softReset)", () => {
  test("blendEquation fresco (idle THREE.AddEquation); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendEquation = lootNameplateBlendEquationAfterRestart();
    expect(bootBlendEquation).toBe(
      lootNameplateBlendEquationFromLook(LOOT_NAMEPLATE_BLEND_EQUATION),
    );
    expect(bootBlendEquation).toBe(LOOT_NAMEPLATE_BLEND_EQUATION);
    expect(bootBlendEquation).toBe(LOOT_NAMEPLATE_BLEND_EQUATION_SPAWN);
    expect(bootBlendEquation).toBe(THREE.AddEquation);
    expect(bootBlendEquation).toBe(100);
    expect(lootNameplateBlendEquationAfterRestart()).toBe(bootBlendEquation);

    const leftoverBlendEquation = THREE.SubtractEquation;
    expect(leftoverBlendEquation).not.toBe(THREE.AddEquation);
    expect(lootNameplateBlendEquationFromLook(leftoverBlendEquation)).toBe(
      leftoverBlendEquation,
    );
    expect(lootNameplateBlendEquationFromLook(leftoverBlendEquation)).not.toBe(
      bootBlendEquation,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendEquationFromLook(LOOT_NAMEPLATE_BLEND_EQUATION)).toBe(
      bootBlendEquation,
    );
  });

  test("vivo on no cambia blendEquation (ctor constant; sync no escribe)", () => {
    const bootBlendEquation = lootNameplateBlendEquationAfterRestart();
    const liveBlendEquation = lootNameplateBlendEquationFromLook(
      LOOT_NAMEPLATE_BLEND_EQUATION,
    );
    expect(liveBlendEquation).toBe(bootBlendEquation);
    expect(liveBlendEquation).toBe(lootNameplateBlendEquationAfterRestart());
    expect(liveBlendEquation).toBe(LOOT_NAMEPLATE_BLEND_EQUATION_SPAWN);

    expect(lootNameplateBlendEquationFromLook(LOOT_NAMEPLATE_BLEND_EQUATION)).toBe(
      bootBlendEquation,
    );
    expect(lootNameplateBlendEquationFromLook(THREE.SubtractEquation)).not.toBe(
      bootBlendEquation,
    );
  });
});

describe("loot nameplate sprite blendEquation recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendEquation fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendEquationAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendEquationFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_EQUATION_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendEquationAfterRestart\([\s\S]{0,200}lootNameplateBlendEquationFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendEquationAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendEquationAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendEquationFromLook(");
    expect(viewSrc).toContain(
      "blendEquation: lootNameplateBlendEquationAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3800}blendEquation:\s*THREE\.AddEquation/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendEquation\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendEquation\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendEquationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendEquationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendEquationAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendEquationAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendEquationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendEquationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendEquationAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendEquationAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendEquationAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendEquationFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendEquationAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendEquationFromLook");
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
