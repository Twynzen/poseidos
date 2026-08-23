import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_WRITE,
  LOOT_NAMEPLATE_STENCIL_WRITE_SPAWN,
  lootNameplateStencilWriteAfterRestart,
  lootNameplateStencilWriteFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilWriteAfterRestart (R / softReset)", () => {
  test("stencilWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilWrite = lootNameplateStencilWriteAfterRestart();
    expect(bootStencilWrite).toBe(
      lootNameplateStencilWriteFromLook(LOOT_NAMEPLATE_STENCIL_WRITE),
    );
    expect(bootStencilWrite).toBe(LOOT_NAMEPLATE_STENCIL_WRITE);
    expect(bootStencilWrite).toBe(LOOT_NAMEPLATE_STENCIL_WRITE_SPAWN);
    expect(bootStencilWrite).toBe(false);
    expect(lootNameplateStencilWriteAfterRestart()).toBe(bootStencilWrite);

    const leftoverStencilWrite = true;
    expect(leftoverStencilWrite).not.toBe(false);
    expect(lootNameplateStencilWriteFromLook(leftoverStencilWrite)).toBe(
      leftoverStencilWrite,
    );
    expect(lootNameplateStencilWriteFromLook(leftoverStencilWrite)).not.toBe(
      bootStencilWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilWriteFromLook(LOOT_NAMEPLATE_STENCIL_WRITE)).toBe(
      bootStencilWrite,
    );
  });

  test("vivo on no cambia stencilWrite (ctor constant; sync no escribe)", () => {
    const bootStencilWrite = lootNameplateStencilWriteAfterRestart();
    const liveStencilWrite = lootNameplateStencilWriteFromLook(
      LOOT_NAMEPLATE_STENCIL_WRITE,
    );
    expect(liveStencilWrite).toBe(bootStencilWrite);
    expect(liveStencilWrite).toBe(lootNameplateStencilWriteAfterRestart());
    expect(liveStencilWrite).toBe(LOOT_NAMEPLATE_STENCIL_WRITE_SPAWN);

    expect(lootNameplateStencilWriteFromLook(LOOT_NAMEPLATE_STENCIL_WRITE)).toBe(
      bootStencilWrite,
    );
    expect(lootNameplateStencilWriteFromLook(true)).not.toBe(bootStencilWrite);
  });
});

describe("loot nameplate sprite stencilWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilWrite fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilWriteAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilWriteFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_WRITE_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilWriteAfterRestart\([\s\S]{0,200}lootNameplateStencilWriteFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilWriteAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilWriteAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilWriteFromLook(");
    expect(viewSrc).toContain(
      "stencilWrite: lootNameplateStencilWriteAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,5600}stencilWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilWrite\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilWriteAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilWriteFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilWriteAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilWriteFromLook");
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
