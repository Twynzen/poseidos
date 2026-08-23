import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_FUNC,
  LOOT_NAMEPLATE_STENCIL_FUNC_SPAWN,
  lootNameplateStencilFuncAfterRestart,
  lootNameplateStencilFuncFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilFuncAfterRestart (R / softReset)", () => {
  test("stencilFunc fresco (idle THREE.AlwaysStencilFunc); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilFunc = lootNameplateStencilFuncAfterRestart();
    expect(bootStencilFunc).toBe(
      lootNameplateStencilFuncFromLook(LOOT_NAMEPLATE_STENCIL_FUNC),
    );
    expect(bootStencilFunc).toBe(LOOT_NAMEPLATE_STENCIL_FUNC);
    expect(bootStencilFunc).toBe(LOOT_NAMEPLATE_STENCIL_FUNC_SPAWN);
    expect(bootStencilFunc).toBe(THREE.AlwaysStencilFunc);
    expect(bootStencilFunc).toBe(519);
    expect(lootNameplateStencilFuncAfterRestart()).toBe(bootStencilFunc);

    const leftoverStencilFunc = THREE.NeverStencilFunc;
    expect(leftoverStencilFunc).not.toBe(THREE.AlwaysStencilFunc);
    expect(lootNameplateStencilFuncFromLook(leftoverStencilFunc)).toBe(
      leftoverStencilFunc,
    );
    expect(lootNameplateStencilFuncFromLook(leftoverStencilFunc)).not.toBe(
      bootStencilFunc,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilFuncFromLook(LOOT_NAMEPLATE_STENCIL_FUNC)).toBe(
      bootStencilFunc,
    );
  });

  test("vivo on no cambia stencilFunc (ctor constant; sync no escribe)", () => {
    const bootStencilFunc = lootNameplateStencilFuncAfterRestart();
    const liveStencilFunc = lootNameplateStencilFuncFromLook(
      LOOT_NAMEPLATE_STENCIL_FUNC,
    );
    expect(liveStencilFunc).toBe(bootStencilFunc);
    expect(liveStencilFunc).toBe(lootNameplateStencilFuncAfterRestart());
    expect(liveStencilFunc).toBe(LOOT_NAMEPLATE_STENCIL_FUNC_SPAWN);

    expect(lootNameplateStencilFuncFromLook(LOOT_NAMEPLATE_STENCIL_FUNC)).toBe(
      bootStencilFunc,
    );
    expect(lootNameplateStencilFuncFromLook(THREE.NeverStencilFunc)).not.toBe(
      bootStencilFunc,
    );
  });
});

describe("loot nameplate sprite stencilFunc recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilFunc fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilFuncAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilFuncFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_FUNC_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilFuncAfterRestart\([\s\S]{0,200}lootNameplateStencilFuncFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilFuncAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilFuncAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilFuncFromLook(");
    expect(viewSrc).toContain(
      "stencilFunc: lootNameplateStencilFuncAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,6000}stencilFunc:\s*THREE\.AlwaysStencilFunc/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilFunc\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilFunc\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilFuncAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilFuncAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilFuncAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilFuncAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilFuncAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilFuncAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilFuncAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilFuncAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilFuncAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilFuncFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilFuncAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilFuncFromLook");
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
