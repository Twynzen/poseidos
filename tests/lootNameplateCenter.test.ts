import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_CENTER_SPAWN_X,
  LOOT_NAMEPLATE_CENTER_SPAWN_Y,
  LOOT_NAMEPLATE_CENTER_X,
  LOOT_NAMEPLATE_CENTER_Y,
  lootNameplateCenterAfterRestart,
  lootNameplateCenterFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateCenterAfterRestart (R / softReset)", () => {
  test("center fresco (idle 0.5, 0.5); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootCenter = lootNameplateCenterAfterRestart();
    expect(bootCenter).toEqual(
      lootNameplateCenterFromLook(
        new THREE.Vector2(LOOT_NAMEPLATE_CENTER_X, LOOT_NAMEPLATE_CENTER_Y),
      ),
    );
    expect(bootCenter.x).toBe(LOOT_NAMEPLATE_CENTER_X);
    expect(bootCenter.y).toBe(LOOT_NAMEPLATE_CENTER_Y);
    expect(bootCenter.x).toBe(LOOT_NAMEPLATE_CENTER_SPAWN_X);
    expect(bootCenter.y).toBe(LOOT_NAMEPLATE_CENTER_SPAWN_Y);
    expect(bootCenter).toEqual(new THREE.Vector2(0.5, 0.5));
    expect(lootNameplateCenterAfterRestart()).toEqual(bootCenter);
    expect(lootNameplateCenterAfterRestart()).not.toBe(bootCenter);

    const leftoverCenter = new THREE.Vector2(0, 0);
    expect(leftoverCenter).not.toEqual(new THREE.Vector2(0.5, 0.5));
    expect(leftoverCenter.x).not.toBe(0.5);
    expect(leftoverCenter.y).not.toBe(0.5);
    expect(lootNameplateCenterFromLook(leftoverCenter)).toBe(leftoverCenter);
    expect(lootNameplateCenterFromLook(leftoverCenter)).not.toEqual(
      bootCenter,
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
      lootNameplateCenterFromLook(
        new THREE.Vector2(LOOT_NAMEPLATE_CENTER_X, LOOT_NAMEPLATE_CENTER_Y),
      ),
    ).toEqual(bootCenter);
  });

  test("vivo on no cambia center (ctor constant; sync no escribe)", () => {
    const bootCenter = lootNameplateCenterAfterRestart();
    const liveCenter = lootNameplateCenterFromLook(
      new THREE.Vector2(LOOT_NAMEPLATE_CENTER_X, LOOT_NAMEPLATE_CENTER_Y),
    );
    expect(liveCenter).toEqual(bootCenter);
    expect(liveCenter).toEqual(lootNameplateCenterAfterRestart());
    expect(liveCenter.x).toBe(LOOT_NAMEPLATE_CENTER_SPAWN_X);
    expect(liveCenter.y).toBe(LOOT_NAMEPLATE_CENTER_SPAWN_Y);

    expect(
      lootNameplateCenterFromLook(
        new THREE.Vector2(LOOT_NAMEPLATE_CENTER_X, LOOT_NAMEPLATE_CENTER_Y),
      ),
    ).toEqual(bootCenter);
    expect(
      lootNameplateCenterFromLook(new THREE.Vector2(0, 0)),
    ).not.toEqual(bootCenter);
  });
});

describe("loot nameplate sprite center recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace center fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateCenterAfterRestart(");
    expect(plateSrc).toContain("lootNameplateCenterFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_CENTER_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateCenterAfterRestart\([\s\S]{0,200}lootNameplateCenterFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateCenterAfterRestart(");
    expect(viewSrc).toContain("lootNameplateCenterAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateCenterFromLook(");
    expect(viewSrc).toContain("center: lootNameplateCenterAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,8000}center:\s*new THREE\.Vector2\(0\.5,\s*0\.5\)/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.center\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.material[\s\S]{0,80}\.center\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateCenterAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateCenterAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateCenterAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateCenterAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateCenterAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateCenterAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateCenterAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateCenterAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateCenterAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateCenterFromLook(");
    expect(saveSrc).not.toContain("lootNameplateCenterAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateCenterFromLook");
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
