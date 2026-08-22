import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FACING_CHEVRON_OPACITY,
  FACING_CHEVRON_OPACITY_SPAWN,
  facingChevronOpacityAfterRestart,
  facingChevronOpacityFromLook,
} from "../src/render/facingChevron";

describe("facingChevronOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle FACING_CHEVRON_OPACITY 0.991875); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = facingChevronOpacityAfterRestart();
    expect(bootOpacity).toBe(facingChevronOpacityFromLook(FACING_CHEVRON_OPACITY));
    expect(bootOpacity).toBe(FACING_CHEVRON_OPACITY);
    expect(bootOpacity).toBe(FACING_CHEVRON_OPACITY_SPAWN);
    expect(bootOpacity).toBe(0.991875);
    expect(bootOpacity).toBeCloseTo(0.8625 * 1.15, 5);
    expect(bootOpacity).toBeLessThan(1);
    expect(bootOpacity).toBeGreaterThan(0.35);
    expect(facingChevronOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.8625;
    expect(facingChevronOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(facingChevronOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(facingChevronOpacityFromLook(FACING_CHEVRON_OPACITY)).toBe(
      bootOpacity,
    );
  });

  test("vivo on no cambia opacity (ctor constant; sync no escribe)", () => {
    const bootOpacity = facingChevronOpacityAfterRestart();
    const liveOpacity = facingChevronOpacityFromLook(FACING_CHEVRON_OPACITY);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(facingChevronOpacityAfterRestart());
    expect(liveOpacity).toBe(FACING_CHEVRON_OPACITY_SPAWN);

    expect(facingChevronOpacityFromLook(FACING_CHEVRON_OPACITY)).toBe(
      bootOpacity,
    );
    expect(facingChevronOpacityFromLook(0.8625)).not.toBe(bootOpacity);
  });
});

describe("facing chevron mesh opacity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace opacity fresco; F9 no helper", () => {
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
    expect(chevronSrc).toContain("facingChevronOpacityAfterRestart(");
    expect(chevronSrc).toContain("facingChevronOpacityFromLook(");
    expect(chevronSrc).toContain("FACING_CHEVRON_OPACITY_SPAWN");
    expect(chevronSrc).toMatch(
      /facingChevronOpacityAfterRestart\([\s\S]{0,200}facingChevronOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("facingChevronOpacityAfterRestart(");
    expect(viewSrc).toContain("facingChevronOpacityAfterRestart()");
    expect(viewSrc).not.toContain("facingChevronOpacityFromLook(");
    expect(viewSrc).toContain("opacity: facingChevronOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(/opacity:\s*FACING_CHEVRON_OPACITY,/);
    expect(viewSrc).not.toMatch(/chevronMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hideFacingChevron\(\): void \{[\s\S]{0,200}facingChevronOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyFacingChevronVisible\([\s\S]{0,200}facingChevronOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}facingChevronOpacityAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3400}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}facingChevronOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}facingChevronOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}facingChevronOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}facingChevronOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("facingChevronOpacityAfterRestart(");
    expect(gameSrc).not.toContain("facingChevronOpacityFromLook(");
    expect(saveSrc).not.toContain("facingChevronOpacityAfterRestart");
    expect(saveSrc).not.toContain("facingChevronOpacityFromLook");
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
