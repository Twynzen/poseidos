import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_RENDER_ORDER,
  LOOT_NAMEPLATE_RENDER_ORDER_SPAWN,
  lootNameplateRenderOrderAfterRestart,
  lootNameplateRenderOrderFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateRenderOrderAfterRestart (R / softReset)", () => {
  test("renderOrder fresco (idle 9); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRenderOrder = lootNameplateRenderOrderAfterRestart();
    expect(bootRenderOrder).toBe(
      lootNameplateRenderOrderFromLook(LOOT_NAMEPLATE_RENDER_ORDER),
    );
    expect(bootRenderOrder).toBe(LOOT_NAMEPLATE_RENDER_ORDER);
    expect(bootRenderOrder).toBe(LOOT_NAMEPLATE_RENDER_ORDER_SPAWN);
    expect(bootRenderOrder).toBe(9);
    expect(lootNameplateRenderOrderAfterRestart()).toBe(bootRenderOrder);

    const leftoverRenderOrder = 1;
    expect(lootNameplateRenderOrderFromLook(leftoverRenderOrder)).toBe(
      leftoverRenderOrder,
    );
    expect(lootNameplateRenderOrderFromLook(leftoverRenderOrder)).not.toBe(
      bootRenderOrder,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(lootNameplateRenderOrderFromLook(LOOT_NAMEPLATE_RENDER_ORDER)).toBe(
      bootRenderOrder,
    );
  });

  test("vivo on no cambia renderOrder (ctor constant; sync no escribe)", () => {
    const bootRenderOrder = lootNameplateRenderOrderAfterRestart();
    const liveRenderOrder = lootNameplateRenderOrderFromLook(
      LOOT_NAMEPLATE_RENDER_ORDER,
    );
    expect(liveRenderOrder).toBe(bootRenderOrder);
    expect(liveRenderOrder).toBe(lootNameplateRenderOrderAfterRestart());
    expect(liveRenderOrder).toBe(LOOT_NAMEPLATE_RENDER_ORDER_SPAWN);

    expect(lootNameplateRenderOrderFromLook(LOOT_NAMEPLATE_RENDER_ORDER)).toBe(
      bootRenderOrder,
    );
    expect(lootNameplateRenderOrderFromLook(1)).not.toBe(bootRenderOrder);
  });
});

describe("loot nameplate sprite renderOrder recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace renderOrder fresco; F9 no helper", () => {
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
    expect(plateSrc).toContain("lootNameplateRenderOrderAfterRestart(");
    expect(plateSrc).toContain("lootNameplateRenderOrderFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_RENDER_ORDER_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateRenderOrderAfterRestart\([\s\S]{0,200}lootNameplateRenderOrderFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateRenderOrderAfterRestart(");
    expect(viewSrc).toContain("lootNameplateRenderOrderAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateRenderOrderFromLook(");
    expect(viewSrc).toContain(
      "sprite.renderOrder = lootNameplateRenderOrderAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/sprite\.renderOrder\s*=\s*9/);
    expect(viewSrc).not.toMatch(/plateMat\.renderOrder\s*=/);
    expect(viewSrc).not.toMatch(/nameplate\.renderOrder\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateRenderOrderAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateRenderOrderAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateRenderOrderFromLook(");
    expect(saveSrc).not.toContain("lootNameplateRenderOrderAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateRenderOrderFromLook");
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
