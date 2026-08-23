import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_PASS,
  LOOT_NAMEPLATE_STENCIL_PASS_SPAWN,
  lootNameplateStencilPassAfterRestart,
  lootNameplateStencilPassFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilPassAfterRestart (R / softReset)", () => {
  test("stencilPass fresco (idle THREE.KeepStencilOp); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilPass = lootNameplateStencilPassAfterRestart();
    expect(bootStencilPass).toBe(
      lootNameplateStencilPassFromLook(LOOT_NAMEPLATE_STENCIL_PASS),
    );
    expect(bootStencilPass).toBe(LOOT_NAMEPLATE_STENCIL_PASS);
    expect(bootStencilPass).toBe(LOOT_NAMEPLATE_STENCIL_PASS_SPAWN);
    expect(bootStencilPass).toBe(THREE.KeepStencilOp);
    expect(bootStencilPass).toBe(7680);
    expect(lootNameplateStencilPassAfterRestart()).toBe(bootStencilPass);

    const leftoverStencilPass = THREE.ReplaceStencilOp;
    expect(leftoverStencilPass).not.toBe(THREE.KeepStencilOp);
    expect(lootNameplateStencilPassFromLook(leftoverStencilPass)).toBe(
      leftoverStencilPass,
    );
    expect(lootNameplateStencilPassFromLook(leftoverStencilPass)).not.toBe(
      bootStencilPass,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilPassFromLook(LOOT_NAMEPLATE_STENCIL_PASS)).toBe(
      bootStencilPass,
    );
  });

  test("vivo on no cambia stencilPass (ctor constant; sync no escribe)", () => {
    const bootStencilPass = lootNameplateStencilPassAfterRestart();
    const liveStencilPass = lootNameplateStencilPassFromLook(
      LOOT_NAMEPLATE_STENCIL_PASS,
    );
    expect(liveStencilPass).toBe(bootStencilPass);
    expect(liveStencilPass).toBe(lootNameplateStencilPassAfterRestart());
    expect(liveStencilPass).toBe(LOOT_NAMEPLATE_STENCIL_PASS_SPAWN);

    expect(lootNameplateStencilPassFromLook(LOOT_NAMEPLATE_STENCIL_PASS)).toBe(
      bootStencilPass,
    );
    expect(lootNameplateStencilPassFromLook(THREE.ReplaceStencilOp)).not.toBe(
      bootStencilPass,
    );
  });
});

describe("loot nameplate sprite stencilPass recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilPass fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilPassAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilPassFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_PASS_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilPassAfterRestart\([\s\S]{0,200}lootNameplateStencilPassFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilPassAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilPassAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilPassFromLook(");
    expect(viewSrc).toContain(
      "stencilPass: lootNameplateStencilPassAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,7600}stencilPass:\s*THREE\.KeepStencilOp/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilPass\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilPass\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilPassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilPassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilPassAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilPassAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilPassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilPassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilPassAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilPassAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilPassAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilPassFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilPassAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilPassFromLook");
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
