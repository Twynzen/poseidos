import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CLIP_INTERSECTION,
  LOOT_NAMEPLATE_CLIP_INTERSECTION_SPAWN,
  lootNameplateClipIntersectionAfterRestart,
  lootNameplateClipIntersectionFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateClipIntersectionAfterRestart (R / softReset)", () => {
  test("clipIntersection fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootClipIntersection = lootNameplateClipIntersectionAfterRestart();
    expect(bootClipIntersection).toBe(
      lootNameplateClipIntersectionFromLook(LOOT_NAMEPLATE_CLIP_INTERSECTION),
    );
    expect(bootClipIntersection).toBe(LOOT_NAMEPLATE_CLIP_INTERSECTION);
    expect(bootClipIntersection).toBe(LOOT_NAMEPLATE_CLIP_INTERSECTION_SPAWN);
    expect(bootClipIntersection).toBe(false);
    expect(lootNameplateClipIntersectionAfterRestart()).toBe(
      bootClipIntersection,
    );

    const leftoverClipIntersection = true;
    expect(leftoverClipIntersection).not.toBe(false);
    expect(
      lootNameplateClipIntersectionFromLook(leftoverClipIntersection),
    ).toBe(leftoverClipIntersection);
    expect(
      lootNameplateClipIntersectionFromLook(leftoverClipIntersection),
    ).not.toBe(bootClipIntersection);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateClipIntersectionFromLook(LOOT_NAMEPLATE_CLIP_INTERSECTION),
    ).toBe(bootClipIntersection);
  });

  test("vivo on no cambia clipIntersection (ctor constant; sync no escribe)", () => {
    const bootClipIntersection = lootNameplateClipIntersectionAfterRestart();
    const liveClipIntersection = lootNameplateClipIntersectionFromLook(
      LOOT_NAMEPLATE_CLIP_INTERSECTION,
    );
    expect(liveClipIntersection).toBe(bootClipIntersection);
    expect(liveClipIntersection).toBe(
      lootNameplateClipIntersectionAfterRestart(),
    );
    expect(liveClipIntersection).toBe(LOOT_NAMEPLATE_CLIP_INTERSECTION_SPAWN);

    expect(
      lootNameplateClipIntersectionFromLook(LOOT_NAMEPLATE_CLIP_INTERSECTION),
    ).toBe(bootClipIntersection);
    expect(lootNameplateClipIntersectionFromLook(true)).not.toBe(
      bootClipIntersection,
    );
  });
});

describe("loot nameplate sprite clipIntersection recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace clipIntersection fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateClipIntersectionAfterRestart(");
    expect(plateSrc).toContain("lootNameplateClipIntersectionFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CLIP_INTERSECTION_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateClipIntersectionAfterRestart\([\s\S]{0,200}lootNameplateClipIntersectionFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateClipIntersectionAfterRestart(");
    expect(viewSrc).toContain("lootNameplateClipIntersectionAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateClipIntersectionFromLook(");
    expect(viewSrc).toContain(
      "clipIntersection: lootNameplateClipIntersectionAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}clipIntersection:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.clipIntersection\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.clipIntersection\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateClipIntersectionAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateClipIntersectionAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateClipIntersectionAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateClipIntersectionFromLook(");
    expect(saveSrc).not.toContain("lootNameplateClipIntersectionAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateClipIntersectionFromLook");
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
