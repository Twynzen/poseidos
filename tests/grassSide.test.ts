import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  GRASS_SIDE,
  GRASS_SIDE_SPAWN,
  grassSideAfterRestart,
  grassSideFromLook,
} from "../src/render/windGrass";

describe("grassSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = grassSideAfterRestart();
    expect(bootSide).toBe(grassSideFromLook(GRASS_SIDE));
    expect(bootSide).toBe(GRASS_SIDE);
    expect(bootSide).toBe(GRASS_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(grassSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(grassSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(grassSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(grassSideFromLook(GRASS_SIDE)).toBe(bootSide);
    expect(grassSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = grassSideAfterRestart();
    const liveSide = grassSideFromLook(GRASS_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(grassSideAfterRestart());
    expect(liveSide).toBe(GRASS_SIDE_SPAWN);

    expect(grassSideFromLook(GRASS_SIDE)).toBe(bootSide);
    expect(grassSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("grass mesh side recreate lock (R / softReset)", () => {
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
    const grassSrc = readFileSync(
      resolve(process.cwd(), "src/render/windGrass.ts"),
      "utf8",
    );
    expect(grassSrc).toContain("grassSideAfterRestart(");
    expect(grassSrc).toContain("grassSideFromLook(");
    expect(grassSrc).toContain("GRASS_SIDE_SPAWN");
    expect(grassSrc).toMatch(
      /grassSideAfterRestart\([\s\S]{0,200}grassSideFromLook\(/,
    );
    expect(viewSrc).toContain("grassSideAfterRestart(");
    expect(viewSrc).toContain("grassSideAfterRestart()");
    expect(viewSrc).not.toContain("grassSideFromLook(");
    expect(viewSrc).toContain("side: grassSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/grassMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyGrassPoses\(\): void \{[\s\S]{0,400}grassSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}grassSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}grassSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}grassSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}grassSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassSideAfterRestart(");
    expect(gameSrc).not.toContain("grassSideFromLook(");
    expect(saveSrc).not.toContain("grassSideAfterRestart");
    expect(saveSrc).not.toContain("grassSideFromLook");
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
