import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_DEPTH_WRITE,
  LOOT_NAMEPLATE_DEPTH_WRITE_SPAWN,
  lootNameplateDepthWriteAfterRestart,
  lootNameplateDepthWriteFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = lootNameplateDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      lootNameplateDepthWriteFromLook(LOOT_NAMEPLATE_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(LOOT_NAMEPLATE_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(LOOT_NAMEPLATE_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(lootNameplateDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(lootNameplateDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(lootNameplateDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
      bootDepthWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateDepthWriteFromLook(LOOT_NAMEPLATE_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = lootNameplateDepthWriteAfterRestart();
    const liveDepthWrite = lootNameplateDepthWriteFromLook(
      LOOT_NAMEPLATE_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(lootNameplateDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(LOOT_NAMEPLATE_DEPTH_WRITE_SPAWN);

    expect(lootNameplateDepthWriteFromLook(LOOT_NAMEPLATE_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(lootNameplateDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("loot nameplate sprite depthWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthWrite fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateDepthWriteAfterRestart(");
    expect(plateSrc).toContain("lootNameplateDepthWriteFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_DEPTH_WRITE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateDepthWriteAfterRestart\([\s\S]{0,200}lootNameplateDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateDepthWriteAfterRestart(");
    expect(viewSrc).toContain("lootNameplateDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateDepthWriteFromLook(");
    expect(viewSrc).toContain(
      "depthWrite: lootNameplateDepthWriteAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,240}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.material[\s\S]{0,80}\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateDepthWriteFromLook(");
    expect(saveSrc).not.toContain("lootNameplateDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateDepthWriteFromLook");
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
