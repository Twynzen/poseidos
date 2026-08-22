import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FACING_CHEVRON_TRANSPARENT,
  FACING_CHEVRON_TRANSPARENT_SPAWN,
  facingChevronTransparentAfterRestart,
  facingChevronTransparentFromLook,
} from "../src/render/facingChevron";

describe("facingChevronTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = facingChevronTransparentAfterRestart();
    expect(bootTransparent).toBe(
      facingChevronTransparentFromLook(FACING_CHEVRON_TRANSPARENT),
    );
    expect(bootTransparent).toBe(FACING_CHEVRON_TRANSPARENT);
    expect(bootTransparent).toBe(FACING_CHEVRON_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(facingChevronTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(facingChevronTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(facingChevronTransparentFromLook(leftoverTransparent)).not.toBe(
      bootTransparent,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(facingChevronTransparentFromLook(FACING_CHEVRON_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = facingChevronTransparentAfterRestart();
    const liveTransparent = facingChevronTransparentFromLook(
      FACING_CHEVRON_TRANSPARENT,
    );
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(facingChevronTransparentAfterRestart());
    expect(liveTransparent).toBe(FACING_CHEVRON_TRANSPARENT_SPAWN);

    expect(facingChevronTransparentFromLook(FACING_CHEVRON_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(facingChevronTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("facing chevron mesh transparent recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace transparent fresco; F9 no helper", () => {
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
    expect(chevronSrc).toContain("facingChevronTransparentAfterRestart(");
    expect(chevronSrc).toContain("facingChevronTransparentFromLook(");
    expect(chevronSrc).toContain("FACING_CHEVRON_TRANSPARENT_SPAWN");
    expect(chevronSrc).toMatch(
      /facingChevronTransparentAfterRestart\([\s\S]{0,200}facingChevronTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("facingChevronTransparentAfterRestart(");
    expect(viewSrc).toContain("facingChevronTransparentAfterRestart()");
    expect(viewSrc).not.toContain("facingChevronTransparentFromLook(");
    expect(viewSrc).toContain(
      "transparent: facingChevronTransparentAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const chevronMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,240}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/chevronMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hideFacingChevron\(\): void \{[\s\S]{0,200}facingChevronTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyFacingChevronVisible\([\s\S]{0,200}facingChevronTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}facingChevronTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}facingChevronTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}facingChevronTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}facingChevronTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}facingChevronTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("facingChevronTransparentAfterRestart(");
    expect(gameSrc).not.toContain("facingChevronTransparentFromLook(");
    expect(saveSrc).not.toContain("facingChevronTransparentAfterRestart");
    expect(saveSrc).not.toContain("facingChevronTransparentFromLook");
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
