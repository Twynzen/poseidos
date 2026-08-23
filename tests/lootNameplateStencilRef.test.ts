import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_STENCIL_REF,
  LOOT_NAMEPLATE_STENCIL_REF_SPAWN,
  lootNameplateStencilRefAfterRestart,
  lootNameplateStencilRefFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateStencilRefAfterRestart (R / softReset)", () => {
  test("stencilRef fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootStencilRef = lootNameplateStencilRefAfterRestart();
    expect(bootStencilRef).toBe(
      lootNameplateStencilRefFromLook(LOOT_NAMEPLATE_STENCIL_REF),
    );
    expect(bootStencilRef).toBe(LOOT_NAMEPLATE_STENCIL_REF);
    expect(bootStencilRef).toBe(LOOT_NAMEPLATE_STENCIL_REF_SPAWN);
    expect(bootStencilRef).toBe(0);
    expect(lootNameplateStencilRefAfterRestart()).toBe(bootStencilRef);

    const leftoverStencilRef = 1;
    expect(leftoverStencilRef).not.toBe(0);
    expect(lootNameplateStencilRefFromLook(leftoverStencilRef)).toBe(
      leftoverStencilRef,
    );
    expect(lootNameplateStencilRefFromLook(leftoverStencilRef)).not.toBe(
      bootStencilRef,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateStencilRefFromLook(LOOT_NAMEPLATE_STENCIL_REF)).toBe(
      bootStencilRef,
    );
  });

  test("vivo on no cambia stencilRef (ctor constant; sync no escribe)", () => {
    const bootStencilRef = lootNameplateStencilRefAfterRestart();
    const liveStencilRef = lootNameplateStencilRefFromLook(
      LOOT_NAMEPLATE_STENCIL_REF,
    );
    expect(liveStencilRef).toBe(bootStencilRef);
    expect(liveStencilRef).toBe(lootNameplateStencilRefAfterRestart());
    expect(liveStencilRef).toBe(LOOT_NAMEPLATE_STENCIL_REF_SPAWN);

    expect(lootNameplateStencilRefFromLook(LOOT_NAMEPLATE_STENCIL_REF)).toBe(
      bootStencilRef,
    );
    expect(lootNameplateStencilRefFromLook(1)).not.toBe(bootStencilRef);
  });
});

describe("loot nameplate sprite stencilRef recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace stencilRef fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateStencilRefAfterRestart(");
    expect(plateSrc).toContain("lootNameplateStencilRefFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_STENCIL_REF_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateStencilRefAfterRestart\([\s\S]{0,200}lootNameplateStencilRefFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateStencilRefAfterRestart(");
    expect(viewSrc).toContain("lootNameplateStencilRefAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateStencilRefFromLook(");
    expect(viewSrc).toContain(
      "stencilRef: lootNameplateStencilRefAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,6400}stencilRef:\s*0/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.stencilRef\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.stencilRef\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateStencilRefAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateStencilRefAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateStencilRefAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateStencilRefAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateStencilRefAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateStencilRefAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateStencilRefAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateStencilRefAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateStencilRefAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateStencilRefFromLook(");
    expect(saveSrc).not.toContain("lootNameplateStencilRefAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateStencilRefFromLook");
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
