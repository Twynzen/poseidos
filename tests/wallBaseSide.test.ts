import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WALL_BASE_SIDE,
  WALL_BASE_SIDE_SPAWN,
  wallBaseSideAfterRestart,
  wallBaseSideFromLook,
} from "../src/render/worldView";

describe("wallBaseSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = wallBaseSideAfterRestart();
    expect(bootSide).toBe(wallBaseSideFromLook(WALL_BASE_SIDE));
    expect(bootSide).toBe(WALL_BASE_SIDE);
    expect(bootSide).toBe(WALL_BASE_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(wallBaseSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(wallBaseSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(wallBaseSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(wallBaseSideFromLook(WALL_BASE_SIDE)).toBe(bootSide);
    expect(wallBaseSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = wallBaseSideAfterRestart();
    const liveSide = wallBaseSideFromLook(WALL_BASE_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(wallBaseSideAfterRestart());
    expect(liveSide).toBe(WALL_BASE_SIDE_SPAWN);

    expect(wallBaseSideFromLook(WALL_BASE_SIDE)).toBe(bootSide);
    expect(wallBaseSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("wall-base mesh side recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("wallBaseSideAfterRestart(");
    expect(viewSrc).toContain("wallBaseSideFromLook(");
    expect(viewSrc).toContain("WALL_BASE_SIDE_SPAWN");
    expect(viewSrc).toMatch(
      /wallBaseSideAfterRestart\([\s\S]{0,200}wallBaseSideFromLook\(/,
    );
    expect(viewSrc).toContain("wallBaseSideAfterRestart()");
    expect(viewSrc).toContain("side: wallBaseSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const wallBaseMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const wallBaseMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/wallBaseMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}wallBaseSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}wallBaseSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}wallBaseSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}wallBaseSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}wallBaseSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}wallBaseSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}wallBaseSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("wallBaseSideAfterRestart(");
    expect(gameSrc).not.toContain("wallBaseSideFromLook(");
    expect(saveSrc).not.toContain("wallBaseSideAfterRestart");
    expect(saveSrc).not.toContain("wallBaseSideFromLook");
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
