import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FACING_CHEVRON_SIDE,
  FACING_CHEVRON_SIDE_SPAWN,
  facingChevronSideAfterRestart,
  facingChevronSideFromLook,
} from "../src/render/facingChevron";

describe("facingChevronSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.DoubleSide / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = facingChevronSideAfterRestart();
    expect(bootSide).toBe(facingChevronSideFromLook(FACING_CHEVRON_SIDE));
    expect(bootSide).toBe(FACING_CHEVRON_SIDE);
    expect(bootSide).toBe(FACING_CHEVRON_SIDE_SPAWN);
    expect(bootSide).toBe(2);
    expect(facingChevronSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 0;
    expect(facingChevronSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(facingChevronSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(facingChevronSideFromLook(FACING_CHEVRON_SIDE)).toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; place/tick no escriben)", () => {
    const bootSide = facingChevronSideAfterRestart();
    const liveSide = facingChevronSideFromLook(FACING_CHEVRON_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(facingChevronSideAfterRestart());
    expect(liveSide).toBe(FACING_CHEVRON_SIDE_SPAWN);

    expect(facingChevronSideFromLook(FACING_CHEVRON_SIDE)).toBe(bootSide);
    expect(facingChevronSideFromLook(0)).not.toBe(bootSide);
  });
});

describe("facing chevron mesh side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(chevronSrc).toContain("facingChevronSideAfterRestart(");
    expect(chevronSrc).toContain("facingChevronSideFromLook(");
    expect(chevronSrc).toContain("FACING_CHEVRON_SIDE_SPAWN");
    expect(chevronSrc).toMatch(
      /facingChevronSideAfterRestart\([\s\S]{0,200}facingChevronSideFromLook\(/,
    );
    expect(viewSrc).toContain("facingChevronSideAfterRestart(");
    expect(viewSrc).toContain("facingChevronSideAfterRestart()");
    expect(viewSrc).not.toContain("facingChevronSideFromLook(");
    expect(viewSrc).toContain("side: facingChevronSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const chevronMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,720}side:\s*THREE\.DoubleSide/,
    );
    expect(viewSrc).not.toMatch(/chevronMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hideFacingChevron\(\): void \{[\s\S]{0,200}facingChevronSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyFacingChevronVisible\([\s\S]{0,200}facingChevronSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}facingChevronSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}facingChevronSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}facingChevronSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}facingChevronSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}facingChevronSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}facingChevronSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}facingChevronSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("facingChevronSideAfterRestart(");
    expect(gameSrc).not.toContain("facingChevronSideFromLook(");
    expect(saveSrc).not.toContain("facingChevronSideAfterRestart");
    expect(saveSrc).not.toContain("facingChevronSideFromLook");
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
