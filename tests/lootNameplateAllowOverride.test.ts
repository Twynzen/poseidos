import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ALLOW_OVERRIDE,
  LOOT_NAMEPLATE_ALLOW_OVERRIDE_SPAWN,
  lootNameplateAllowOverrideAfterRestart,
  lootNameplateAllowOverrideFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateAllowOverrideAfterRestart (R / softReset)", () => {
  test("allowOverride fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAllowOverride = lootNameplateAllowOverrideAfterRestart();
    expect(bootAllowOverride).toBe(
      lootNameplateAllowOverrideFromLook(LOOT_NAMEPLATE_ALLOW_OVERRIDE),
    );
    expect(bootAllowOverride).toBe(LOOT_NAMEPLATE_ALLOW_OVERRIDE);
    expect(bootAllowOverride).toBe(LOOT_NAMEPLATE_ALLOW_OVERRIDE_SPAWN);
    expect(bootAllowOverride).toBe(true);
    expect(lootNameplateAllowOverrideAfterRestart()).toBe(bootAllowOverride);

    const leftoverAllowOverride = false;
    expect(leftoverAllowOverride).not.toBe(true);
    expect(lootNameplateAllowOverrideFromLook(leftoverAllowOverride)).toBe(
      leftoverAllowOverride,
    );
    expect(lootNameplateAllowOverrideFromLook(leftoverAllowOverride)).not.toBe(
      bootAllowOverride,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateAllowOverrideFromLook(LOOT_NAMEPLATE_ALLOW_OVERRIDE),
    ).toBe(bootAllowOverride);
  });

  test("vivo on no cambia allowOverride (ctor constant; sync no escribe)", () => {
    const bootAllowOverride = lootNameplateAllowOverrideAfterRestart();
    const liveAllowOverride = lootNameplateAllowOverrideFromLook(
      LOOT_NAMEPLATE_ALLOW_OVERRIDE,
    );
    expect(liveAllowOverride).toBe(bootAllowOverride);
    expect(liveAllowOverride).toBe(lootNameplateAllowOverrideAfterRestart());
    expect(liveAllowOverride).toBe(LOOT_NAMEPLATE_ALLOW_OVERRIDE_SPAWN);

    expect(
      lootNameplateAllowOverrideFromLook(LOOT_NAMEPLATE_ALLOW_OVERRIDE),
    ).toBe(bootAllowOverride);
    expect(lootNameplateAllowOverrideFromLook(false)).not.toBe(
      bootAllowOverride,
    );
  });
});

describe("loot nameplate sprite allowOverride recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace allowOverride fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateAllowOverrideAfterRestart(");
    expect(plateSrc).toContain("lootNameplateAllowOverrideFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ALLOW_OVERRIDE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateAllowOverrideAfterRestart\([\s\S]{0,200}lootNameplateAllowOverrideFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateAllowOverrideAfterRestart(");
    expect(viewSrc).toContain("lootNameplateAllowOverrideAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateAllowOverrideFromLook(");
    expect(viewSrc).toContain(
      "allowOverride: lootNameplateAllowOverrideAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}allowOverride:\s*true/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.allowOverride\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.allowOverride\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateAllowOverrideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateAllowOverrideAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateAllowOverrideAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateAllowOverrideFromLook(");
    expect(saveSrc).not.toContain("lootNameplateAllowOverrideAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateAllowOverrideFromLook");
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
