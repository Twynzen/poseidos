import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_SRC,
  LOOT_NAMEPLATE_BLEND_SRC_SPAWN,
  lootNameplateBlendSrcAfterRestart,
  lootNameplateBlendSrcFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendSrcAfterRestart (R / softReset)", () => {
  test("blendSrc fresco (idle THREE.SrcAlphaFactor); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendSrc = lootNameplateBlendSrcAfterRestart();
    expect(bootBlendSrc).toBe(
      lootNameplateBlendSrcFromLook(LOOT_NAMEPLATE_BLEND_SRC),
    );
    expect(bootBlendSrc).toBe(LOOT_NAMEPLATE_BLEND_SRC);
    expect(bootBlendSrc).toBe(LOOT_NAMEPLATE_BLEND_SRC_SPAWN);
    expect(bootBlendSrc).toBe(THREE.SrcAlphaFactor);
    expect(bootBlendSrc).toBe(204);
    expect(lootNameplateBlendSrcAfterRestart()).toBe(bootBlendSrc);

    const leftoverBlendSrc = THREE.OneFactor;
    expect(leftoverBlendSrc).not.toBe(THREE.SrcAlphaFactor);
    expect(lootNameplateBlendSrcFromLook(leftoverBlendSrc)).toBe(
      leftoverBlendSrc,
    );
    expect(lootNameplateBlendSrcFromLook(leftoverBlendSrc)).not.toBe(
      bootBlendSrc,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendSrcFromLook(LOOT_NAMEPLATE_BLEND_SRC)).toBe(
      bootBlendSrc,
    );
  });

  test("vivo on no cambia blendSrc (ctor constant; sync no escribe)", () => {
    const bootBlendSrc = lootNameplateBlendSrcAfterRestart();
    const liveBlendSrc = lootNameplateBlendSrcFromLook(LOOT_NAMEPLATE_BLEND_SRC);
    expect(liveBlendSrc).toBe(bootBlendSrc);
    expect(liveBlendSrc).toBe(lootNameplateBlendSrcAfterRestart());
    expect(liveBlendSrc).toBe(LOOT_NAMEPLATE_BLEND_SRC_SPAWN);

    expect(lootNameplateBlendSrcFromLook(LOOT_NAMEPLATE_BLEND_SRC)).toBe(
      bootBlendSrc,
    );
    expect(lootNameplateBlendSrcFromLook(THREE.OneFactor)).not.toBe(
      bootBlendSrc,
    );
  });
});

describe("loot nameplate sprite blendSrc recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendSrc fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendSrcAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendSrcFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_SRC_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendSrcAfterRestart\([\s\S]{0,200}lootNameplateBlendSrcFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendSrcAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendSrcAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendSrcFromLook(");
    expect(viewSrc).toContain("blendSrc: lootNameplateBlendSrcAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3800}blendSrc:\s*THREE\.SrcAlphaFactor/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendSrc\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendSrc\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendSrcAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendSrcAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendSrcAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendSrcAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendSrcAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendSrcAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendSrcAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendSrcAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendSrcAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendSrcFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendSrcAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendSrcFromLook");
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
