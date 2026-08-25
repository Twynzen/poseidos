import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_FRUSTUM_CULLED,
  LOOT_NAMEPLATE_FRUSTUM_CULLED_SPAWN,
  lootNameplateFrustumCulledAfterRestart,
  lootNameplateFrustumCulledFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateFrustumCulledAfterRestart (R / softReset)", () => {
  test("frustumCulled fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootFrustumCulled = lootNameplateFrustumCulledAfterRestart();
    expect(bootFrustumCulled).toBe(
      lootNameplateFrustumCulledFromLook(LOOT_NAMEPLATE_FRUSTUM_CULLED),
    );
    expect(bootFrustumCulled).toBe(LOOT_NAMEPLATE_FRUSTUM_CULLED);
    expect(bootFrustumCulled).toBe(LOOT_NAMEPLATE_FRUSTUM_CULLED_SPAWN);
    expect(bootFrustumCulled).toBe(true);
    expect(lootNameplateFrustumCulledAfterRestart()).toBe(bootFrustumCulled);

    const leftoverFrustumCulled = false;
    expect(leftoverFrustumCulled).not.toBe(true);
    expect(lootNameplateFrustumCulledFromLook(leftoverFrustumCulled)).toBe(
      leftoverFrustumCulled,
    );
    expect(lootNameplateFrustumCulledFromLook(leftoverFrustumCulled)).not.toBe(
      bootFrustumCulled,
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
      lootNameplateFrustumCulledFromLook(LOOT_NAMEPLATE_FRUSTUM_CULLED),
    ).toBe(bootFrustumCulled);
  });

  test("vivo on no cambia frustumCulled (ctor constant; sync no escribe)", () => {
    const bootFrustumCulled = lootNameplateFrustumCulledAfterRestart();
    const liveFrustumCulled = lootNameplateFrustumCulledFromLook(
      LOOT_NAMEPLATE_FRUSTUM_CULLED,
    );
    expect(liveFrustumCulled).toBe(bootFrustumCulled);
    expect(liveFrustumCulled).toBe(lootNameplateFrustumCulledAfterRestart());
    expect(liveFrustumCulled).toBe(LOOT_NAMEPLATE_FRUSTUM_CULLED_SPAWN);

    expect(
      lootNameplateFrustumCulledFromLook(LOOT_NAMEPLATE_FRUSTUM_CULLED),
    ).toBe(bootFrustumCulled);
    expect(lootNameplateFrustumCulledFromLook(false)).not.toBe(
      bootFrustumCulled,
    );
  });
});

describe("loot nameplate sprite frustumCulled recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace frustumCulled fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateFrustumCulledAfterRestart(");
    expect(plateSrc).toContain("lootNameplateFrustumCulledFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_FRUSTUM_CULLED_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateFrustumCulledAfterRestart\([\s\S]{0,200}lootNameplateFrustumCulledFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateFrustumCulledAfterRestart(");
    expect(viewSrc).toContain("lootNameplateFrustumCulledAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateFrustumCulledFromLook(");
    expect(viewSrc).toContain(
      "sprite.frustumCulled = lootNameplateFrustumCulledAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.frustumCulled\s*=\s*true/);
    expect(viewSrc).not.toMatch(/plateMat\.frustumCulled\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.frustumCulled\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateFrustumCulledAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateFrustumCulledAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateFrustumCulledAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateFrustumCulledFromLook(");
    expect(saveSrc).not.toContain("lootNameplateFrustumCulledAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateFrustumCulledFromLook");
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
