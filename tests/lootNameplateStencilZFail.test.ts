import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_Z_FAIL,
  LOOT_NAMEPLATE_STENCIL_Z_FAIL_SPAWN,
  lootNameplateStencilZFailAfterRestart,
  lootNameplateStencilZFailFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilZFailAfterRestart (R / softReset)", () => {
  test("stencilZFail fresco (idle THREE.KeepStencilOp); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilZFail = lootNameplateStencilZFailAfterRestart();
    expect(bootStencilZFail).toBe(
      lootNameplateStencilZFailFromLook(LOOT_NAMEPLATE_STENCIL_Z_FAIL),
    );
    expect(bootStencilZFail).toBe(LOOT_NAMEPLATE_STENCIL_Z_FAIL);
    expect(bootStencilZFail).toBe(LOOT_NAMEPLATE_STENCIL_Z_FAIL_SPAWN);
    expect(bootStencilZFail).toBe(THREE.KeepStencilOp);
    expect(bootStencilZFail).toBe(7680);
    expect(lootNameplateStencilZFailAfterRestart()).toBe(bootStencilZFail);

    const leftoverStencilZFail = THREE.ReplaceStencilOp;
    expect(leftoverStencilZFail).not.toBe(THREE.KeepStencilOp);
    expect(lootNameplateStencilZFailFromLook(leftoverStencilZFail)).toBe(
      leftoverStencilZFail,
    );
    expect(lootNameplateStencilZFailFromLook(leftoverStencilZFail)).not.toBe(
      bootStencilZFail,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilZFailFromLook(LOOT_NAMEPLATE_STENCIL_Z_FAIL)).toBe(
      bootStencilZFail,
    );
  });

  test("vivo on no cambia stencilZFail (ctor constant; sync no escribe)", () => {
    const bootStencilZFail = lootNameplateStencilZFailAfterRestart();
    const liveStencilZFail = lootNameplateStencilZFailFromLook(
      LOOT_NAMEPLATE_STENCIL_Z_FAIL,
    );
    expect(liveStencilZFail).toBe(bootStencilZFail);
    expect(liveStencilZFail).toBe(lootNameplateStencilZFailAfterRestart());
    expect(liveStencilZFail).toBe(LOOT_NAMEPLATE_STENCIL_Z_FAIL_SPAWN);

    expect(lootNameplateStencilZFailFromLook(LOOT_NAMEPLATE_STENCIL_Z_FAIL)).toBe(
      bootStencilZFail,
    );
    expect(lootNameplateStencilZFailFromLook(THREE.ReplaceStencilOp)).not.toBe(
      bootStencilZFail,
    );
  });
});

describe("loot nameplate sprite stencilZFail recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilZFail fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilZFailAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilZFailFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_Z_FAIL_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilZFailAfterRestart\([\s\S]{0,200}lootNameplateStencilZFailFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilZFailAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilZFailAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilZFailFromLook(");
    expect(viewSrc).toContain(
      "stencilZFail: lootNameplateStencilZFailAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,7600}stencilZFail:\s*THREE\.KeepStencilOp/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilZFail\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilZFail\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilZFailAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilZFailAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilZFailAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilZFailAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilZFailAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilZFailAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilZFailAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilZFailAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilZFailAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilZFailFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilZFailAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilZFailFromLook");
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
