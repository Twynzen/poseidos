import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_OBJECT_USER_DATA,
  LOOT_NAMEPLATE_OBJECT_USER_DATA_SPAWN,
  lootNameplateObjectUserDataAfterRestart,
  lootNameplateObjectUserDataFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateObjectUserDataAfterRestart (R / softReset)", () => {
  test("Object3D.userData fresco (idle {}); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootObjectUserData = lootNameplateObjectUserDataAfterRestart();
    expect(bootObjectUserData).toEqual(
      lootNameplateObjectUserDataFromLook(LOOT_NAMEPLATE_OBJECT_USER_DATA),
    );
    expect(bootObjectUserData).toEqual(LOOT_NAMEPLATE_OBJECT_USER_DATA);
    expect(bootObjectUserData).toEqual(LOOT_NAMEPLATE_OBJECT_USER_DATA_SPAWN);
    expect(bootObjectUserData).toEqual({});
    expect(Object.keys(bootObjectUserData)).toEqual([]);
    expect(lootNameplateObjectUserDataAfterRestart()).toEqual(
      bootObjectUserData,
    );
    expect(lootNameplateObjectUserDataAfterRestart()).not.toBe(
      bootObjectUserData,
    );

    const leftoverObjectUserData = { leftover: true };
    expect(leftoverObjectUserData).not.toEqual({});
    expect(lootNameplateObjectUserDataFromLook(leftoverObjectUserData)).toBe(
      leftoverObjectUserData,
    );
    expect(
      lootNameplateObjectUserDataFromLook(leftoverObjectUserData),
    ).not.toEqual(bootObjectUserData);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(
      lootNameplateObjectUserDataFromLook(LOOT_NAMEPLATE_OBJECT_USER_DATA),
    ).toEqual(bootObjectUserData);
  });

  test("vivo on no cambia Object3D.userData (ctor constant; sync no escribe)", () => {
    const bootObjectUserData = lootNameplateObjectUserDataAfterRestart();
    const liveObjectUserData = lootNameplateObjectUserDataFromLook(
      LOOT_NAMEPLATE_OBJECT_USER_DATA,
    );
    expect(liveObjectUserData).toEqual(bootObjectUserData);
    expect(liveObjectUserData).toEqual(
      lootNameplateObjectUserDataAfterRestart(),
    );
    expect(liveObjectUserData).toEqual(LOOT_NAMEPLATE_OBJECT_USER_DATA_SPAWN);

    expect(
      lootNameplateObjectUserDataFromLook(LOOT_NAMEPLATE_OBJECT_USER_DATA),
    ).toEqual(bootObjectUserData);
    expect(
      lootNameplateObjectUserDataFromLook({ leftover: true }),
    ).not.toEqual(bootObjectUserData);
  });
});

describe("loot nameplate sprite Object3D.userData recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace Object3D.userData fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateObjectUserDataAfterRestart(");
    expect(plateSrc).toContain("lootNameplateObjectUserDataFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_OBJECT_USER_DATA_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateObjectUserDataAfterRestart\([\s\S]{0,200}lootNameplateObjectUserDataFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateObjectUserDataAfterRestart(");
    expect(viewSrc).toContain("lootNameplateObjectUserDataAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateObjectUserDataFromLook(");
    expect(viewSrc).toContain(
      "sprite.userData = lootNameplateObjectUserDataAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.userData\s*=\s*\{\s*\}/);
    expect(viewSrc).not.toMatch(/nameplate\.userData\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateObjectUserDataAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateObjectUserDataAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateObjectUserDataAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateObjectUserDataFromLook(");
    expect(saveSrc).not.toContain("lootNameplateObjectUserDataAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateObjectUserDataFromLook");
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
