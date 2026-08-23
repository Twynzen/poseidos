import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CLIPPING_PLANES,
  LOOT_NAMEPLATE_CLIPPING_PLANES_SPAWN,
  lootNameplateClippingPlanesAfterRestart,
  lootNameplateClippingPlanesFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateClippingPlanesAfterRestart (R / softReset)", () => {
  test("clippingPlanes fresco (idle null); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootClippingPlanes = lootNameplateClippingPlanesAfterRestart();
    expect(bootClippingPlanes).toBe(
      lootNameplateClippingPlanesFromLook(LOOT_NAMEPLATE_CLIPPING_PLANES),
    );
    expect(bootClippingPlanes).toBe(LOOT_NAMEPLATE_CLIPPING_PLANES);
    expect(bootClippingPlanes).toBe(LOOT_NAMEPLATE_CLIPPING_PLANES_SPAWN);
    expect(bootClippingPlanes).toBe(null);
    expect(lootNameplateClippingPlanesAfterRestart()).toBe(bootClippingPlanes);

    const leftoverClippingPlanes: typeof LOOT_NAMEPLATE_CLIPPING_PLANES = [];
    expect(leftoverClippingPlanes).not.toBe(null);
    expect(leftoverClippingPlanes).not.toBe(bootClippingPlanes);
    expect(leftoverClippingPlanes).toEqual([]);
    expect(
      lootNameplateClippingPlanesFromLook(leftoverClippingPlanes),
    ).toBe(leftoverClippingPlanes);
    expect(
      lootNameplateClippingPlanesFromLook(leftoverClippingPlanes),
    ).not.toBe(bootClippingPlanes);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateClippingPlanesFromLook(LOOT_NAMEPLATE_CLIPPING_PLANES),
    ).toBe(bootClippingPlanes);
  });

  test("vivo on no cambia clippingPlanes (ctor constant; sync no escribe)", () => {
    const bootClippingPlanes = lootNameplateClippingPlanesAfterRestart();
    const liveClippingPlanes = lootNameplateClippingPlanesFromLook(
      LOOT_NAMEPLATE_CLIPPING_PLANES,
    );
    expect(liveClippingPlanes).toBe(bootClippingPlanes);
    expect(liveClippingPlanes).toBe(lootNameplateClippingPlanesAfterRestart());
    expect(liveClippingPlanes).toBe(LOOT_NAMEPLATE_CLIPPING_PLANES_SPAWN);

    expect(
      lootNameplateClippingPlanesFromLook(LOOT_NAMEPLATE_CLIPPING_PLANES),
    ).toBe(bootClippingPlanes);
    expect(lootNameplateClippingPlanesFromLook([])).not.toBe(
      bootClippingPlanes,
    );
  });
});

describe("loot nameplate sprite clippingPlanes recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace clippingPlanes fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateClippingPlanesAfterRestart(");
    expect(plateSrc).toContain("lootNameplateClippingPlanesFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CLIPPING_PLANES_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateClippingPlanesAfterRestart\([\s\S]{0,200}lootNameplateClippingPlanesFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateClippingPlanesAfterRestart(");
    expect(viewSrc).toContain("lootNameplateClippingPlanesAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateClippingPlanesFromLook(");
    expect(viewSrc).toContain(
      "clippingPlanes: lootNameplateClippingPlanesAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}clippingPlanes:\s*null/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.clippingPlanes\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.clippingPlanes\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateClippingPlanesAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateClippingPlanesAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateClippingPlanesAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateClippingPlanesFromLook(");
    expect(saveSrc).not.toContain("lootNameplateClippingPlanesAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateClippingPlanesFromLook");
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
