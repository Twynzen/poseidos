import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA,
  LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA_SPAWN,
  lootNameplatePremultipliedAlphaAfterRestart,
  lootNameplatePremultipliedAlphaFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplatePremultipliedAlphaAfterRestart (R / softReset)", () => {
  test("premultipliedAlpha fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootPremultipliedAlpha = lootNameplatePremultipliedAlphaAfterRestart();
    expect(bootPremultipliedAlpha).toBe(
      lootNameplatePremultipliedAlphaFromLook(LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA),
    );
    expect(bootPremultipliedAlpha).toBe(LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA);
    expect(bootPremultipliedAlpha).toBe(LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA_SPAWN);
    expect(bootPremultipliedAlpha).toBe(false);
    expect(lootNameplatePremultipliedAlphaAfterRestart()).toBe(
      bootPremultipliedAlpha,
    );

    const leftoverPremultipliedAlpha = true;
    expect(
      lootNameplatePremultipliedAlphaFromLook(leftoverPremultipliedAlpha),
    ).toBe(leftoverPremultipliedAlpha);
    expect(
      lootNameplatePremultipliedAlphaFromLook(leftoverPremultipliedAlpha),
    ).not.toBe(bootPremultipliedAlpha);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplatePremultipliedAlphaFromLook(LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA),
    ).toBe(bootPremultipliedAlpha);
  });

  test("vivo on no cambia premultipliedAlpha (ctor constant; sync no escribe)", () => {
    const bootPremultipliedAlpha = lootNameplatePremultipliedAlphaAfterRestart();
    const livePremultipliedAlpha = lootNameplatePremultipliedAlphaFromLook(
      LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA,
    );
    expect(livePremultipliedAlpha).toBe(bootPremultipliedAlpha);
    expect(livePremultipliedAlpha).toBe(
      lootNameplatePremultipliedAlphaAfterRestart(),
    );
    expect(livePremultipliedAlpha).toBe(
      LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA_SPAWN,
    );

    expect(
      lootNameplatePremultipliedAlphaFromLook(LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA),
    ).toBe(bootPremultipliedAlpha);
    expect(lootNameplatePremultipliedAlphaFromLook(true)).not.toBe(
      bootPremultipliedAlpha,
    );
  });
});

describe("loot nameplate sprite premultipliedAlpha recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace premultipliedAlpha fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplatePremultipliedAlphaAfterRestart(");
    expect(plateSrc).toContain("lootNameplatePremultipliedAlphaFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplatePremultipliedAlphaAfterRestart\([\s\S]{0,200}lootNameplatePremultipliedAlphaFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplatePremultipliedAlphaAfterRestart(");
    expect(viewSrc).toContain("lootNameplatePremultipliedAlphaAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplatePremultipliedAlphaFromLook(");
    expect(viewSrc).toContain(
      "premultipliedAlpha: lootNameplatePremultipliedAlphaAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,1800}premultipliedAlpha:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.premultipliedAlpha\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.premultipliedAlpha\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplatePremultipliedAlphaAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplatePremultipliedAlphaAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplatePremultipliedAlphaAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplatePremultipliedAlphaFromLook(");
    expect(saveSrc).not.toContain("lootNameplatePremultipliedAlphaAfterRestart");
    expect(saveSrc).not.toContain("lootNameplatePremultipliedAlphaFromLook");
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
