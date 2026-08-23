import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_Z_PASS,
  LOOT_NAMEPLATE_STENCIL_Z_PASS_SPAWN,
  lootNameplateStencilZPassAfterRestart,
  lootNameplateStencilZPassFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilZPassAfterRestart (R / softReset)", () => {
  test("stencilZPass fresco (idle THREE.KeepStencilOp); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilZPass = lootNameplateStencilZPassAfterRestart();
    expect(bootStencilZPass).toBe(
      lootNameplateStencilZPassFromLook(LOOT_NAMEPLATE_STENCIL_Z_PASS),
    );
    expect(bootStencilZPass).toBe(LOOT_NAMEPLATE_STENCIL_Z_PASS);
    expect(bootStencilZPass).toBe(LOOT_NAMEPLATE_STENCIL_Z_PASS_SPAWN);
    expect(bootStencilZPass).toBe(THREE.KeepStencilOp);
    expect(bootStencilZPass).toBe(7680);
    expect(lootNameplateStencilZPassAfterRestart()).toBe(bootStencilZPass);

    const leftoverStencilZPass = THREE.ReplaceStencilOp;
    expect(leftoverStencilZPass).not.toBe(THREE.KeepStencilOp);
    expect(lootNameplateStencilZPassFromLook(leftoverStencilZPass)).toBe(
      leftoverStencilZPass,
    );
    expect(lootNameplateStencilZPassFromLook(leftoverStencilZPass)).not.toBe(
      bootStencilZPass,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilZPassFromLook(LOOT_NAMEPLATE_STENCIL_Z_PASS)).toBe(
      bootStencilZPass,
    );
  });

  test("vivo on no cambia stencilZPass (ctor constant; sync no escribe)", () => {
    const bootStencilZPass = lootNameplateStencilZPassAfterRestart();
    const liveStencilZPass = lootNameplateStencilZPassFromLook(
      LOOT_NAMEPLATE_STENCIL_Z_PASS,
    );
    expect(liveStencilZPass).toBe(bootStencilZPass);
    expect(liveStencilZPass).toBe(lootNameplateStencilZPassAfterRestart());
    expect(liveStencilZPass).toBe(LOOT_NAMEPLATE_STENCIL_Z_PASS_SPAWN);

    expect(lootNameplateStencilZPassFromLook(LOOT_NAMEPLATE_STENCIL_Z_PASS)).toBe(
      bootStencilZPass,
    );
    expect(lootNameplateStencilZPassFromLook(THREE.ReplaceStencilOp)).not.toBe(
      bootStencilZPass,
    );
  });
});

describe("loot nameplate sprite stencilZPass recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilZPass fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilZPassAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilZPassFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_Z_PASS_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilZPassAfterRestart\([\s\S]{0,200}lootNameplateStencilZPassFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilZPassAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilZPassAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilZPassFromLook(");
    expect(viewSrc).toContain(
      "stencilZPass: lootNameplateStencilZPassAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,7600}stencilZPass:\s*THREE\.KeepStencilOp/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilZPass\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilZPass\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilZPassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilZPassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilZPassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilZPassAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilZPassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilZPassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilZPassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilZPassAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilZPassAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilZPassFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilZPassAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilZPassFromLook");
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
