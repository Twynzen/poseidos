import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FACING_CHEVRON_DEPTH_WRITE,
  FACING_CHEVRON_DEPTH_WRITE_SPAWN,
  facingChevronDepthWriteAfterRestart,
  facingChevronDepthWriteFromLook,
} from "../src/render/facingChevron";

describe("facingChevronDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = facingChevronDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      facingChevronDepthWriteFromLook(FACING_CHEVRON_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(FACING_CHEVRON_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(FACING_CHEVRON_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(facingChevronDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(facingChevronDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(facingChevronDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(facingChevronDepthWriteFromLook(FACING_CHEVRON_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = facingChevronDepthWriteAfterRestart();
    const liveDepthWrite = facingChevronDepthWriteFromLook(
      FACING_CHEVRON_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(facingChevronDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(FACING_CHEVRON_DEPTH_WRITE_SPAWN);

    expect(facingChevronDepthWriteFromLook(FACING_CHEVRON_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(facingChevronDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("facing chevron mesh depthWrite recreate lock (R / softReset)", () => {
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
    const chevronSrc = readFileSync(
      resolve(process.cwd(), "src/render/facingChevron.ts"),
      "utf8",
    );
    expect(chevronSrc).toContain("facingChevronDepthWriteAfterRestart(");
    expect(chevronSrc).toContain("facingChevronDepthWriteFromLook(");
    expect(chevronSrc).toContain("FACING_CHEVRON_DEPTH_WRITE_SPAWN");
    expect(chevronSrc).toMatch(
      /facingChevronDepthWriteAfterRestart\([\s\S]{0,200}facingChevronDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("facingChevronDepthWriteAfterRestart(");
    expect(viewSrc).toContain("facingChevronDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("facingChevronDepthWriteFromLook(");
    expect(viewSrc).toContain(
      "depthWrite: facingChevronDepthWriteAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const chevronMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/chevronMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hideFacingChevron\(\): void \{[\s\S]{0,200}facingChevronDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyFacingChevronVisible\([\s\S]{0,200}facingChevronDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}facingChevronDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}facingChevronDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}facingChevronDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}facingChevronDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}facingChevronDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("facingChevronDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("facingChevronDepthWriteFromLook(");
    expect(saveSrc).not.toContain("facingChevronDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("facingChevronDepthWriteFromLook");
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
