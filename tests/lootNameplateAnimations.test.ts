import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_ANIMATIONS,
  LOOT_NAMEPLATE_ANIMATIONS_SPAWN,
  lootNameplateAnimationsAfterRestart,
  lootNameplateAnimationsFromLook,
} from "../src/render/lootNameplate";
import type { AnimationClip } from "three";

describe("lootNameplateAnimationsAfterRestart (R / softReset)", () => {
  test("animations fresco (idle []); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootAnimations = lootNameplateAnimationsAfterRestart();
    expect(bootAnimations).toEqual(
      lootNameplateAnimationsFromLook(LOOT_NAMEPLATE_ANIMATIONS),
    );
    expect(bootAnimations).toEqual(LOOT_NAMEPLATE_ANIMATIONS);
    expect(bootAnimations).toEqual(LOOT_NAMEPLATE_ANIMATIONS_SPAWN);
    expect(bootAnimations).toEqual([]);
    expect(bootAnimations).toHaveLength(0);
    expect(lootNameplateAnimationsAfterRestart()).toEqual(bootAnimations);
    expect(lootNameplateAnimationsAfterRestart()).not.toBe(bootAnimations);

    const leftoverAnimations = [null] as unknown as AnimationClip[];
    expect(leftoverAnimations).not.toEqual([]);
    expect(leftoverAnimations).not.toEqual(bootAnimations);
    expect(leftoverAnimations).toHaveLength(1);
    expect(lootNameplateAnimationsFromLook(leftoverAnimations)).toBe(
      leftoverAnimations,
    );
    expect(
      lootNameplateAnimationsFromLook(leftoverAnimations),
    ).not.toEqual(bootAnimations);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateAnimationsFromLook(LOOT_NAMEPLATE_ANIMATIONS),
    ).toEqual(bootAnimations);
  });

  test("vivo on no cambia animations (ctor constant; sync no escribe)", () => {
    const bootAnimations = lootNameplateAnimationsAfterRestart();
    const liveAnimations = lootNameplateAnimationsFromLook(
      LOOT_NAMEPLATE_ANIMATIONS,
    );
    expect(liveAnimations).toEqual(bootAnimations);
    expect(liveAnimations).toEqual(lootNameplateAnimationsAfterRestart());
    expect(liveAnimations).toEqual(LOOT_NAMEPLATE_ANIMATIONS_SPAWN);

    expect(
      lootNameplateAnimationsFromLook(LOOT_NAMEPLATE_ANIMATIONS),
    ).toEqual(bootAnimations);
    expect(
      lootNameplateAnimationsFromLook(
        [null] as unknown as AnimationClip[],
      ),
    ).not.toEqual(bootAnimations);
  });
});

describe("loot nameplate sprite animations recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace animations fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateAnimationsAfterRestart(");
    expect(plateSrc).toContain("lootNameplateAnimationsFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_ANIMATIONS_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateAnimationsAfterRestart\([\s\S]{0,200}lootNameplateAnimationsFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateAnimationsAfterRestart(");
    expect(viewSrc).toContain("lootNameplateAnimationsAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateAnimationsFromLook(");
    expect(viewSrc).toContain(
      "sprite.animations = lootNameplateAnimationsAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.animations\s*=\s*\[\s*\]/);
    expect(viewSrc).not.toMatch(/plateMat\.animations\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.animations\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateAnimationsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateAnimationsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateAnimationsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateAnimationsAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateAnimationsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateAnimationsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateAnimationsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateAnimationsAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateAnimationsAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateAnimationsFromLook(");
    expect(saveSrc).not.toContain("lootNameplateAnimationsAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateAnimationsFromLook");
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
