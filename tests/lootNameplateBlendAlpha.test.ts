import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_BLEND_ALPHA,
  LOOT_NAMEPLATE_BLEND_ALPHA_SPAWN,
  lootNameplateBlendAlphaAfterRestart,
  lootNameplateBlendAlphaFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateBlendAlphaAfterRestart (R / softReset)", () => {
  test("blendAlpha fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlendAlpha = lootNameplateBlendAlphaAfterRestart();
    expect(bootBlendAlpha).toBe(
      lootNameplateBlendAlphaFromLook(LOOT_NAMEPLATE_BLEND_ALPHA),
    );
    expect(bootBlendAlpha).toBe(LOOT_NAMEPLATE_BLEND_ALPHA);
    expect(bootBlendAlpha).toBe(LOOT_NAMEPLATE_BLEND_ALPHA_SPAWN);
    expect(bootBlendAlpha).toBe(0);
    expect(lootNameplateBlendAlphaAfterRestart()).toBe(bootBlendAlpha);

    const leftoverBlendAlpha = 1;
    expect(leftoverBlendAlpha).not.toBe(0);
    expect(lootNameplateBlendAlphaFromLook(leftoverBlendAlpha)).toBe(
      leftoverBlendAlpha,
    );
    expect(lootNameplateBlendAlphaFromLook(leftoverBlendAlpha)).not.toBe(
      bootBlendAlpha,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateBlendAlphaFromLook(LOOT_NAMEPLATE_BLEND_ALPHA)).toBe(
      bootBlendAlpha,
    );
  });

  test("vivo on no cambia blendAlpha (ctor constant; sync no escribe)", () => {
    const bootBlendAlpha = lootNameplateBlendAlphaAfterRestart();
    const liveBlendAlpha = lootNameplateBlendAlphaFromLook(
      LOOT_NAMEPLATE_BLEND_ALPHA,
    );
    expect(liveBlendAlpha).toBe(bootBlendAlpha);
    expect(liveBlendAlpha).toBe(lootNameplateBlendAlphaAfterRestart());
    expect(liveBlendAlpha).toBe(LOOT_NAMEPLATE_BLEND_ALPHA_SPAWN);

    expect(lootNameplateBlendAlphaFromLook(LOOT_NAMEPLATE_BLEND_ALPHA)).toBe(
      bootBlendAlpha,
    );
    expect(lootNameplateBlendAlphaFromLook(1)).not.toBe(
      bootBlendAlpha,
    );
  });
});

describe("loot nameplate sprite blendAlpha recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blendAlpha fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateBlendAlphaAfterRestart(");
    expect(plateSrc).toContain("lootNameplateBlendAlphaFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_BLEND_ALPHA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateBlendAlphaAfterRestart\([\s\S]{0,200}lootNameplateBlendAlphaFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateBlendAlphaAfterRestart(");
    expect(viewSrc).toContain("lootNameplateBlendAlphaAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateBlendAlphaFromLook(");
    expect(viewSrc).toContain(
      "blendAlpha: lootNameplateBlendAlphaAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,4600}blendAlpha:\s*0/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.blendAlpha\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.blendAlpha\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateBlendAlphaAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateBlendAlphaAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateBlendAlphaAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateBlendAlphaFromLook(");
    expect(saveSrc).not.toContain("lootNameplateBlendAlphaAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateBlendAlphaFromLook");
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
