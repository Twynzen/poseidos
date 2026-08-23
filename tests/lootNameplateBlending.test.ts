import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLENDING,
  LOOT_NAMEPLATE_BLENDING_SPAWN,
  lootNameplateBlendingAfterRestart,
  lootNameplateBlendingFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendingAfterRestart (R / softReset)", () => {
  test("blending fresco (idle THREE.NormalBlending); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlending = lootNameplateBlendingAfterRestart();
    expect(bootBlending).toBe(
      lootNameplateBlendingFromLook(LOOT_NAMEPLATE_BLENDING),
    );
    expect(bootBlending).toBe(LOOT_NAMEPLATE_BLENDING);
    expect(bootBlending).toBe(LOOT_NAMEPLATE_BLENDING_SPAWN);
    expect(bootBlending).toBe(THREE.NormalBlending);
    expect(bootBlending).toBe(1);
    expect(lootNameplateBlendingAfterRestart()).toBe(bootBlending);

    const leftoverBlending = THREE.AdditiveBlending;
    expect(leftoverBlending).not.toBe(THREE.NormalBlending);
    expect(lootNameplateBlendingFromLook(leftoverBlending)).toBe(
      leftoverBlending,
    );
    expect(lootNameplateBlendingFromLook(leftoverBlending)).not.toBe(
      bootBlending,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendingFromLook(LOOT_NAMEPLATE_BLENDING)).toBe(
      bootBlending,
    );
  });

  test("vivo on no cambia blending (ctor constant; sync no escribe)", () => {
    const bootBlending = lootNameplateBlendingAfterRestart();
    const liveBlending = lootNameplateBlendingFromLook(LOOT_NAMEPLATE_BLENDING);
    expect(liveBlending).toBe(bootBlending);
    expect(liveBlending).toBe(lootNameplateBlendingAfterRestart());
    expect(liveBlending).toBe(LOOT_NAMEPLATE_BLENDING_SPAWN);

    expect(lootNameplateBlendingFromLook(LOOT_NAMEPLATE_BLENDING)).toBe(
      bootBlending,
    );
    expect(lootNameplateBlendingFromLook(THREE.AdditiveBlending)).not.toBe(
      bootBlending,
    );
  });
});

describe("loot nameplate sprite blending recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blending fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendingAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendingFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLENDING_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendingAfterRestart\([\s\S]{0,200}lootNameplateBlendingFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendingAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendingAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendingFromLook(");
    expect(viewSrc).toContain("blending: lootNameplateBlendingAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3600}blending:\s*THREE\.NormalBlending/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blending\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blending\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendingAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendingAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendingAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendingFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendingAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendingFromLook");
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
