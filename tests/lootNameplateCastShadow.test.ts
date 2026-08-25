import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CAST_SHADOW,
  LOOT_NAMEPLATE_CAST_SHADOW_SPAWN,
  lootNameplateCastShadowAfterRestart,
  lootNameplateCastShadowFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateCastShadowAfterRestart (R / softReset)", () => {
  test("castShadow fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootCastShadow = lootNameplateCastShadowAfterRestart();
    expect(bootCastShadow).toBe(
      lootNameplateCastShadowFromLook(LOOT_NAMEPLATE_CAST_SHADOW),
    );
    expect(bootCastShadow).toBe(LOOT_NAMEPLATE_CAST_SHADOW);
    expect(bootCastShadow).toBe(LOOT_NAMEPLATE_CAST_SHADOW_SPAWN);
    expect(bootCastShadow).toBe(false);
    expect(lootNameplateCastShadowAfterRestart()).toBe(bootCastShadow);

    const leftoverCastShadow = true;
    expect(leftoverCastShadow).not.toBe(false);
    expect(lootNameplateCastShadowFromLook(leftoverCastShadow)).toBe(
      leftoverCastShadow,
    );
    expect(lootNameplateCastShadowFromLook(leftoverCastShadow)).not.toBe(
      bootCastShadow,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateCastShadowFromLook(LOOT_NAMEPLATE_CAST_SHADOW)).toBe(
      bootCastShadow,
    );
  });

  test("vivo on no cambia castShadow (ctor constant; sync no escribe)", () => {
    const bootCastShadow = lootNameplateCastShadowAfterRestart();
    const liveCastShadow = lootNameplateCastShadowFromLook(
      LOOT_NAMEPLATE_CAST_SHADOW,
    );
    expect(liveCastShadow).toBe(bootCastShadow);
    expect(liveCastShadow).toBe(lootNameplateCastShadowAfterRestart());
    expect(liveCastShadow).toBe(LOOT_NAMEPLATE_CAST_SHADOW_SPAWN);

    expect(lootNameplateCastShadowFromLook(LOOT_NAMEPLATE_CAST_SHADOW)).toBe(
      bootCastShadow,
    );
    expect(lootNameplateCastShadowFromLook(true)).not.toBe(bootCastShadow);
  });
});

describe("loot nameplate sprite castShadow recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace castShadow fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateCastShadowAfterRestart(");
    expect(plateSrc).toContain("lootNameplateCastShadowFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CAST_SHADOW_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateCastShadowAfterRestart\([\s\S]{0,200}lootNameplateCastShadowFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateCastShadowAfterRestart(");
    expect(viewSrc).toContain("lootNameplateCastShadowAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateCastShadowFromLook(");
    expect(viewSrc).toContain(
      "sprite.castShadow = lootNameplateCastShadowAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.castShadow\s*=\s*false/);
    expect(viewSrc).not.toMatch(/plateMat\.castShadow\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.castShadow\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateCastShadowAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateCastShadowAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateCastShadowAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateCastShadowAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateCastShadowAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateCastShadowAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateCastShadowAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateCastShadowAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateCastShadowAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateCastShadowFromLook(");
    expect(saveSrc).not.toContain("lootNameplateCastShadowAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateCastShadowFromLook");
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
