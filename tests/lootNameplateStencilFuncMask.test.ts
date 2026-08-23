import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_FUNC_MASK,
  LOOT_NAMEPLATE_STENCIL_FUNC_MASK_SPAWN,
  lootNameplateStencilFuncMaskAfterRestart,
  lootNameplateStencilFuncMaskFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilFuncMaskAfterRestart (R / softReset)", () => {
  test("stencilFuncMask fresco (idle 0xff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilFuncMask = lootNameplateStencilFuncMaskAfterRestart();
    expect(bootStencilFuncMask).toBe(
      lootNameplateStencilFuncMaskFromLook(LOOT_NAMEPLATE_STENCIL_FUNC_MASK),
    );
    expect(bootStencilFuncMask).toBe(LOOT_NAMEPLATE_STENCIL_FUNC_MASK);
    expect(bootStencilFuncMask).toBe(LOOT_NAMEPLATE_STENCIL_FUNC_MASK_SPAWN);
    expect(bootStencilFuncMask).toBe(0xff);
    expect(lootNameplateStencilFuncMaskAfterRestart()).toBe(bootStencilFuncMask);

    const leftoverStencilFuncMask = 0;
    expect(leftoverStencilFuncMask).not.toBe(0xff);
    expect(lootNameplateStencilFuncMaskFromLook(leftoverStencilFuncMask)).toBe(
      leftoverStencilFuncMask,
    );
    expect(lootNameplateStencilFuncMaskFromLook(leftoverStencilFuncMask)).not.toBe(
      bootStencilFuncMask,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilFuncMaskFromLook(LOOT_NAMEPLATE_STENCIL_FUNC_MASK)).toBe(
      bootStencilFuncMask,
    );
  });

  test("vivo on no cambia stencilFuncMask (ctor constant; sync no escribe)", () => {
    const bootStencilFuncMask = lootNameplateStencilFuncMaskAfterRestart();
    const liveStencilFuncMask = lootNameplateStencilFuncMaskFromLook(
      LOOT_NAMEPLATE_STENCIL_FUNC_MASK,
    );
    expect(liveStencilFuncMask).toBe(bootStencilFuncMask);
    expect(liveStencilFuncMask).toBe(lootNameplateStencilFuncMaskAfterRestart());
    expect(liveStencilFuncMask).toBe(LOOT_NAMEPLATE_STENCIL_FUNC_MASK_SPAWN);

    expect(lootNameplateStencilFuncMaskFromLook(LOOT_NAMEPLATE_STENCIL_FUNC_MASK)).toBe(
      bootStencilFuncMask,
    );
    expect(lootNameplateStencilFuncMaskFromLook(0)).not.toBe(bootStencilFuncMask);
  });
});

describe("loot nameplate sprite stencilFuncMask recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilFuncMask fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilFuncMaskAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilFuncMaskFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_FUNC_MASK_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilFuncMaskAfterRestart\([\s\S]{0,200}lootNameplateStencilFuncMaskFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilFuncMaskAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilFuncMaskAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilFuncMaskFromLook(");
    expect(viewSrc).toContain(
      "stencilFuncMask: lootNameplateStencilFuncMaskAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,7200}stencilFuncMask:\s*0xff/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilFuncMask\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilFuncMask\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilFuncMaskAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilFuncMaskAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilFuncMaskAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilFuncMaskFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilFuncMaskAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilFuncMaskFromLook");
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
