import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_DST,
  LOOT_NAMEPLATE_BLEND_DST_SPAWN,
  lootNameplateBlendDstAfterRestart,
  lootNameplateBlendDstFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendDstAfterRestart (R / softReset)", () => {
  test("blendDst fresco (idle THREE.OneMinusSrcAlphaFactor); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendDst = lootNameplateBlendDstAfterRestart();
    expect(bootBlendDst).toBe(
      lootNameplateBlendDstFromLook(LOOT_NAMEPLATE_BLEND_DST),
    );
    expect(bootBlendDst).toBe(LOOT_NAMEPLATE_BLEND_DST);
    expect(bootBlendDst).toBe(LOOT_NAMEPLATE_BLEND_DST_SPAWN);
    expect(bootBlendDst).toBe(THREE.OneMinusSrcAlphaFactor);
    expect(bootBlendDst).toBe(205);
    expect(lootNameplateBlendDstAfterRestart()).toBe(bootBlendDst);

    const leftoverBlendDst = THREE.ZeroFactor;
    expect(leftoverBlendDst).not.toBe(THREE.OneMinusSrcAlphaFactor);
    expect(lootNameplateBlendDstFromLook(leftoverBlendDst)).toBe(
      leftoverBlendDst,
    );
    expect(lootNameplateBlendDstFromLook(leftoverBlendDst)).not.toBe(
      bootBlendDst,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendDstFromLook(LOOT_NAMEPLATE_BLEND_DST)).toBe(
      bootBlendDst,
    );
  });

  test("vivo on no cambia blendDst (ctor constant; sync no escribe)", () => {
    const bootBlendDst = lootNameplateBlendDstAfterRestart();
    const liveBlendDst = lootNameplateBlendDstFromLook(LOOT_NAMEPLATE_BLEND_DST);
    expect(liveBlendDst).toBe(bootBlendDst);
    expect(liveBlendDst).toBe(lootNameplateBlendDstAfterRestart());
    expect(liveBlendDst).toBe(LOOT_NAMEPLATE_BLEND_DST_SPAWN);

    expect(lootNameplateBlendDstFromLook(LOOT_NAMEPLATE_BLEND_DST)).toBe(
      bootBlendDst,
    );
    expect(lootNameplateBlendDstFromLook(THREE.ZeroFactor)).not.toBe(
      bootBlendDst,
    );
  });
});

describe("loot nameplate sprite blendDst recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendDst fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendDstAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendDstFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_DST_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendDstAfterRestart\([\s\S]{0,200}lootNameplateBlendDstFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendDstAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendDstAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendDstFromLook(");
    expect(viewSrc).toContain("blendDst: lootNameplateBlendDstAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,3800}blendDst:\s*THREE\.OneMinusSrcAlphaFactor/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendDst\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendDst\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendDstAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendDstAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendDstAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendDstAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendDstAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendDstAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendDstAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendDstAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendDstAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendDstFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendDstAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendDstFromLook");
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
