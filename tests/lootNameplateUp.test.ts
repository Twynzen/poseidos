import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_UP,
  LOOT_NAMEPLATE_UP_SPAWN,
  lootNameplateUpAfterRestart,
  lootNameplateUpFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateUpAfterRestart (R / softReset)", () => {
  test("up fresco (idle Vector3(0, 1, 0)); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootUp = lootNameplateUpAfterRestart();
    expect(bootUp).toEqual(lootNameplateUpFromLook(LOOT_NAMEPLATE_UP));
    expect(bootUp).toEqual(LOOT_NAMEPLATE_UP);
    expect(bootUp).toEqual(LOOT_NAMEPLATE_UP_SPAWN);
    expect(bootUp).toEqual(new THREE.Vector3(0, 1, 0));
    expect(bootUp.x).toBe(0);
    expect(bootUp.y).toBe(1);
    expect(bootUp.z).toBe(0);
    expect(lootNameplateUpAfterRestart()).toEqual(bootUp);
    expect(lootNameplateUpAfterRestart()).not.toBe(bootUp);

    const leftoverUp = new THREE.Vector3(0, 0, 1);
    expect(leftoverUp).not.toEqual(new THREE.Vector3(0, 1, 0));
    expect(leftoverUp.y).not.toBe(1);
    expect(leftoverUp.z).not.toBe(0);
    expect(leftoverUp).not.toEqual(LOOT_NAMEPLATE_UP);
    expect(lootNameplateUpFromLook(leftoverUp)).toBe(leftoverUp);
    expect(lootNameplateUpFromLook(leftoverUp)).not.toEqual(bootUp);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateUpFromLook(LOOT_NAMEPLATE_UP)).toEqual(bootUp);
  });

  test("vivo on no cambia up (ctor constant; sync no escribe)", () => {
    const bootUp = lootNameplateUpAfterRestart();
    const liveUp = lootNameplateUpFromLook(LOOT_NAMEPLATE_UP);
    expect(liveUp).toEqual(bootUp);
    expect(liveUp).toEqual(lootNameplateUpAfterRestart());
    expect(liveUp).toEqual(LOOT_NAMEPLATE_UP_SPAWN);
    expect(liveUp.x).toBe(0);
    expect(liveUp.y).toBe(1);
    expect(liveUp.z).toBe(0);

    expect(lootNameplateUpFromLook(LOOT_NAMEPLATE_UP)).toEqual(bootUp);
    expect(lootNameplateUpFromLook(new THREE.Vector3(0, 0, 1))).not.toEqual(
      bootUp,
    );
  });
});

describe("loot nameplate sprite up recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace up fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateUpAfterRestart(");
    expect(plateSrc).toContain("lootNameplateUpFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_UP_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateUpAfterRestart\([\s\S]{0,200}lootNameplateUpFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateUpAfterRestart(");
    expect(viewSrc).toContain("lootNameplateUpAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateUpFromLook(");
    expect(viewSrc).toContain("sprite.up.copy(lootNameplateUpAfterRestart())");
    expect(viewSrc).not.toMatch(
      /sprite\.up\s*=\s*new THREE\.Vector3\(\s*0,\s*1,\s*0\s*\)/,
    );
    expect(viewSrc).not.toMatch(/sprite\.up\.set\(\s*0,\s*1,\s*0\s*\)/);
    expect(viewSrc).not.toMatch(
      /sprite\.up\.copy\(\s*new THREE\.Vector3\(\s*0,\s*1,\s*0\s*\)/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.up\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.up\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.up\.copy\(/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateUpAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateUpAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateUpAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateUpAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateUpAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateUpAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateUpAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateUpAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateUpAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateUpFromLook(");
    expect(saveSrc).not.toContain("lootNameplateUpAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateUpFromLook");
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
