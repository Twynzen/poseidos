import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_DEPTH_FUNC,
  LOOT_NAMEPLATE_DEPTH_FUNC_SPAWN,
  lootNameplateDepthFuncAfterRestart,
  lootNameplateDepthFuncFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateDepthFuncAfterRestart (R / softReset)", () => {
  test("depthFunc fresco (idle THREE.LessEqualDepth); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthFunc = lootNameplateDepthFuncAfterRestart();
    expect(bootDepthFunc).toBe(
      lootNameplateDepthFuncFromLook(LOOT_NAMEPLATE_DEPTH_FUNC),
    );
    expect(bootDepthFunc).toBe(LOOT_NAMEPLATE_DEPTH_FUNC);
    expect(bootDepthFunc).toBe(LOOT_NAMEPLATE_DEPTH_FUNC_SPAWN);
    expect(bootDepthFunc).toBe(THREE.LessEqualDepth);
    expect(bootDepthFunc).toBe(515);
    expect(lootNameplateDepthFuncAfterRestart()).toBe(bootDepthFunc);

    const leftoverDepthFunc = THREE.AlwaysDepth;
    expect(leftoverDepthFunc).not.toBe(THREE.LessEqualDepth);
    expect(lootNameplateDepthFuncFromLook(leftoverDepthFunc)).toBe(
      leftoverDepthFunc,
    );
    expect(lootNameplateDepthFuncFromLook(leftoverDepthFunc)).not.toBe(
      bootDepthFunc,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateDepthFuncFromLook(LOOT_NAMEPLATE_DEPTH_FUNC)).toBe(
      bootDepthFunc,
    );
  });

  test("vivo on no cambia depthFunc (ctor constant; sync no escribe)", () => {
    const bootDepthFunc = lootNameplateDepthFuncAfterRestart();
    const liveDepthFunc = lootNameplateDepthFuncFromLook(
      LOOT_NAMEPLATE_DEPTH_FUNC,
    );
    expect(liveDepthFunc).toBe(bootDepthFunc);
    expect(liveDepthFunc).toBe(lootNameplateDepthFuncAfterRestart());
    expect(liveDepthFunc).toBe(LOOT_NAMEPLATE_DEPTH_FUNC_SPAWN);

    expect(lootNameplateDepthFuncFromLook(LOOT_NAMEPLATE_DEPTH_FUNC)).toBe(
      bootDepthFunc,
    );
    expect(lootNameplateDepthFuncFromLook(THREE.AlwaysDepth)).not.toBe(
      bootDepthFunc,
    );
  });
});

describe("loot nameplate sprite depthFunc recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthFunc fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateDepthFuncAfterRestart(");
    expect(plateSrc).toContain("lootNameplateDepthFuncFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_DEPTH_FUNC_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateDepthFuncAfterRestart\([\s\S]{0,200}lootNameplateDepthFuncFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateDepthFuncAfterRestart(");
    expect(viewSrc).toContain("lootNameplateDepthFuncAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateDepthFuncFromLook(");
    expect(viewSrc).toContain(
      "depthFunc: lootNameplateDepthFuncAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,5200}depthFunc:\s*THREE\.LessEqualDepth/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.depthFunc\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.depthFunc\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateDepthFuncAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateDepthFuncAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateDepthFuncAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateDepthFuncAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateDepthFuncAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateDepthFuncAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateDepthFuncAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateDepthFuncAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateDepthFuncAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateDepthFuncFromLook(");
    expect(saveSrc).not.toContain("lootNameplateDepthFuncAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateDepthFuncFromLook");
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
