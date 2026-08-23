import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_FAIL,
  LOOT_NAMEPLATE_STENCIL_FAIL_SPAWN,
  lootNameplateStencilFailAfterRestart,
  lootNameplateStencilFailFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilFailAfterRestart (R / softReset)", () => {
  test("stencilFail fresco (idle THREE.KeepStencilOp); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilFail = lootNameplateStencilFailAfterRestart();
    expect(bootStencilFail).toBe(
      lootNameplateStencilFailFromLook(LOOT_NAMEPLATE_STENCIL_FAIL),
    );
    expect(bootStencilFail).toBe(LOOT_NAMEPLATE_STENCIL_FAIL);
    expect(bootStencilFail).toBe(LOOT_NAMEPLATE_STENCIL_FAIL_SPAWN);
    expect(bootStencilFail).toBe(THREE.KeepStencilOp);
    expect(bootStencilFail).toBe(7680);
    expect(lootNameplateStencilFailAfterRestart()).toBe(bootStencilFail);

    const leftoverStencilFail = THREE.ReplaceStencilOp;
    expect(leftoverStencilFail).not.toBe(THREE.KeepStencilOp);
    expect(lootNameplateStencilFailFromLook(leftoverStencilFail)).toBe(
      leftoverStencilFail,
    );
    expect(lootNameplateStencilFailFromLook(leftoverStencilFail)).not.toBe(
      bootStencilFail,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilFailFromLook(LOOT_NAMEPLATE_STENCIL_FAIL)).toBe(
      bootStencilFail,
    );
  });

  test("vivo on no cambia stencilFail (ctor constant; sync no escribe)", () => {
    const bootStencilFail = lootNameplateStencilFailAfterRestart();
    const liveStencilFail = lootNameplateStencilFailFromLook(
      LOOT_NAMEPLATE_STENCIL_FAIL,
    );
    expect(liveStencilFail).toBe(bootStencilFail);
    expect(liveStencilFail).toBe(lootNameplateStencilFailAfterRestart());
    expect(liveStencilFail).toBe(LOOT_NAMEPLATE_STENCIL_FAIL_SPAWN);

    expect(lootNameplateStencilFailFromLook(LOOT_NAMEPLATE_STENCIL_FAIL)).toBe(
      bootStencilFail,
    );
    expect(lootNameplateStencilFailFromLook(THREE.ReplaceStencilOp)).not.toBe(
      bootStencilFail,
    );
  });
});

describe("loot nameplate sprite stencilFail recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilFail fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilFailAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilFailFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_FAIL_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilFailAfterRestart\([\s\S]{0,200}lootNameplateStencilFailFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilFailAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilFailAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilFailFromLook(");
    expect(viewSrc).toContain(
      "stencilFail: lootNameplateStencilFailAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,7600}stencilFail:\s*THREE\.KeepStencilOp/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilFail\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilFail\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilFailAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilFailAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilFailAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilFailAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilFailAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilFailAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilFailAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilFailAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilFailAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilFailFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilFailAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilFailFromLook");
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
