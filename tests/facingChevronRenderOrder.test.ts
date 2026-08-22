import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FACING_CHEVRON_RENDER_ORDER,
  FACING_CHEVRON_RENDER_ORDER_SPAWN,
  facingChevronRenderOrderAfterRestart,
  facingChevronRenderOrderFromLook,
} from "../src/render/facingChevron";

describe("facingChevronRenderOrderAfterRestart (R / softReset)", () => {
  test("renderOrder fresco (idle 8); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRenderOrder = facingChevronRenderOrderAfterRestart();
    expect(bootRenderOrder).toBe(
      facingChevronRenderOrderFromLook(FACING_CHEVRON_RENDER_ORDER),
    );
    expect(bootRenderOrder).toBe(FACING_CHEVRON_RENDER_ORDER);
    expect(bootRenderOrder).toBe(FACING_CHEVRON_RENDER_ORDER_SPAWN);
    expect(bootRenderOrder).toBe(8);
    expect(facingChevronRenderOrderAfterRestart()).toBe(bootRenderOrder);

    const leftoverRenderOrder = 1;
    expect(facingChevronRenderOrderFromLook(leftoverRenderOrder)).toBe(
      leftoverRenderOrder,
    );
    expect(facingChevronRenderOrderFromLook(leftoverRenderOrder)).not.toBe(
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

    expect(facingChevronRenderOrderFromLook(FACING_CHEVRON_RENDER_ORDER)).toBe(
      bootRenderOrder,
    );
  });

  test("vivo on no cambia renderOrder (ctor constant; sync no escribe)", () => {
    const bootRenderOrder = facingChevronRenderOrderAfterRestart();
    const liveRenderOrder = facingChevronRenderOrderFromLook(
      FACING_CHEVRON_RENDER_ORDER,
    );
    expect(liveRenderOrder).toBe(bootRenderOrder);
    expect(liveRenderOrder).toBe(facingChevronRenderOrderAfterRestart());
    expect(liveRenderOrder).toBe(FACING_CHEVRON_RENDER_ORDER_SPAWN);

    expect(facingChevronRenderOrderFromLook(FACING_CHEVRON_RENDER_ORDER)).toBe(
      bootRenderOrder,
    );
    expect(facingChevronRenderOrderFromLook(1)).not.toBe(bootRenderOrder);
  });
});

describe("facing chevron mesh renderOrder recreate lock (R / softReset)", () => {
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
    const chevronSrc = readFileSync(
      resolve(process.cwd(), "src/render/facingChevron.ts"),
      "utf8",
    );
    expect(chevronSrc).toContain("facingChevronRenderOrderAfterRestart(");
    expect(chevronSrc).toContain("facingChevronRenderOrderFromLook(");
    expect(chevronSrc).toContain("FACING_CHEVRON_RENDER_ORDER_SPAWN");
    expect(chevronSrc).toMatch(
      /facingChevronRenderOrderAfterRestart\([\s\S]{0,200}facingChevronRenderOrderFromLook\(/,
    );
    expect(viewSrc).toContain("facingChevronRenderOrderAfterRestart(");
    expect(viewSrc).toContain("facingChevronRenderOrderAfterRestart()");
    expect(viewSrc).not.toContain("facingChevronRenderOrderFromLook(");
    expect(viewSrc).toContain(
      "chevronMesh.renderOrder = facingChevronRenderOrderAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/chevronMesh\.renderOrder\s*=\s*8/);
    expect(viewSrc).not.toMatch(/chevronMat\.renderOrder\s*=/);
    expect(viewSrc).not.toMatch(
      /function hideFacingChevron\(\): void \{[\s\S]{0,200}facingChevronRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyFacingChevronVisible\([\s\S]{0,200}facingChevronRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}facingChevronRenderOrderAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}facingChevronRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}facingChevronRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}facingChevronRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}facingChevronRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toContain("facingChevronRenderOrderAfterRestart(");
    expect(gameSrc).not.toContain("facingChevronRenderOrderFromLook(");
    expect(saveSrc).not.toContain("facingChevronRenderOrderAfterRestart");
    expect(saveSrc).not.toContain("facingChevronRenderOrderFromLook");
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
