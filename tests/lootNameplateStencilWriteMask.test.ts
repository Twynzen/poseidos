import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_WRITE_MASK,
  LOOT_NAMEPLATE_STENCIL_WRITE_MASK_SPAWN,
  lootNameplateStencilWriteMaskAfterRestart,
  lootNameplateStencilWriteMaskFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilWriteMaskAfterRestart (R / softReset)", () => {
  test("stencilWriteMask fresco (idle 0xff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilWriteMask = lootNameplateStencilWriteMaskAfterRestart();
    expect(bootStencilWriteMask).toBe(
      lootNameplateStencilWriteMaskFromLook(LOOT_NAMEPLATE_STENCIL_WRITE_MASK),
    );
    expect(bootStencilWriteMask).toBe(LOOT_NAMEPLATE_STENCIL_WRITE_MASK);
    expect(bootStencilWriteMask).toBe(LOOT_NAMEPLATE_STENCIL_WRITE_MASK_SPAWN);
    expect(bootStencilWriteMask).toBe(0xff);
    expect(lootNameplateStencilWriteMaskAfterRestart()).toBe(bootStencilWriteMask);

    const leftoverStencilWriteMask = 0;
    expect(leftoverStencilWriteMask).not.toBe(0xff);
    expect(lootNameplateStencilWriteMaskFromLook(leftoverStencilWriteMask)).toBe(
      leftoverStencilWriteMask,
    );
    expect(lootNameplateStencilWriteMaskFromLook(leftoverStencilWriteMask)).not.toBe(
      bootStencilWriteMask,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilWriteMaskFromLook(LOOT_NAMEPLATE_STENCIL_WRITE_MASK)).toBe(
      bootStencilWriteMask,
    );
  });

  test("vivo on no cambia stencilWriteMask (ctor constant; sync no escribe)", () => {
    const bootStencilWriteMask = lootNameplateStencilWriteMaskAfterRestart();
    const liveStencilWriteMask = lootNameplateStencilWriteMaskFromLook(
      LOOT_NAMEPLATE_STENCIL_WRITE_MASK,
    );
    expect(liveStencilWriteMask).toBe(bootStencilWriteMask);
    expect(liveStencilWriteMask).toBe(lootNameplateStencilWriteMaskAfterRestart());
    expect(liveStencilWriteMask).toBe(LOOT_NAMEPLATE_STENCIL_WRITE_MASK_SPAWN);

    expect(lootNameplateStencilWriteMaskFromLook(LOOT_NAMEPLATE_STENCIL_WRITE_MASK)).toBe(
      bootStencilWriteMask,
    );
    expect(lootNameplateStencilWriteMaskFromLook(0)).not.toBe(bootStencilWriteMask);
  });
});

describe("loot nameplate sprite stencilWriteMask recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilWriteMask fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilWriteMaskAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilWriteMaskFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_WRITE_MASK_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilWriteMaskAfterRestart\([\s\S]{0,200}lootNameplateStencilWriteMaskFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilWriteMaskAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilWriteMaskAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilWriteMaskFromLook(");
    expect(viewSrc).toContain(
      "stencilWriteMask: lootNameplateStencilWriteMaskAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,6400}stencilWriteMask:\s*0xff/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilWriteMask\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilWriteMask\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilWriteMaskAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilWriteMaskAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilWriteMaskAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilWriteMaskFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilWriteMaskAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilWriteMaskFromLook");
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
