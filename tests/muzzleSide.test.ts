import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_SIDE,
  MUZZLE_SIDE_SPAWN,
  muzzleSideAfterRestart,
  muzzleSideFromLook,
} from "../src/render/muzzleFlash";

describe("muzzleSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = muzzleSideAfterRestart();
    expect(bootSide).toBe(muzzleSideFromLook(MUZZLE_SIDE));
    expect(bootSide).toBe(MUZZLE_SIDE);
    expect(bootSide).toBe(MUZZLE_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(muzzleSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(muzzleSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(muzzleSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(muzzleSideFromLook(MUZZLE_SIDE)).toBe(bootSide);
    expect(muzzleSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = muzzleSideAfterRestart();
    const liveSide = muzzleSideFromLook(MUZZLE_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(muzzleSideAfterRestart());
    expect(liveSide).toBe(MUZZLE_SIDE_SPAWN);

    expect(muzzleSideFromLook(MUZZLE_SIDE)).toBe(bootSide);
    expect(muzzleSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("muzzle flash mesh side recreate lock (R / softReset)", () => {
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
    const flashSrc = readFileSync(
      resolve(process.cwd(), "src/render/muzzleFlash.ts"),
      "utf8",
    );
    expect(flashSrc).toContain("muzzleSideAfterRestart(");
    expect(flashSrc).toContain("muzzleSideFromLook(");
    expect(flashSrc).toContain("MUZZLE_SIDE_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleSideAfterRestart\([\s\S]{0,200}muzzleSideFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleSideAfterRestart(");
    expect(viewSrc).toContain("muzzleSideAfterRestart()");
    expect(viewSrc).not.toContain("muzzleSideFromLook(");
    expect(viewSrc).toContain("side: muzzleSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const muzzleMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const muzzleMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/muzzleMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyMuzzleFlashVisual\([\s\S]{0,240}muzzleSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickMuzzle\([\s\S]{0,240}muzzleSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}muzzleSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleSideAfterRestart(");
    expect(gameSrc).not.toContain("muzzleSideFromLook(");
    expect(saveSrc).not.toContain("muzzleSideAfterRestart");
    expect(saveSrc).not.toContain("muzzleSideFromLook");
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
