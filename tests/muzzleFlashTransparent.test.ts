import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_FLASH_TRANSPARENT,
  MUZZLE_FLASH_TRANSPARENT_SPAWN,
  muzzleFlashTransparentAfterRestart,
  muzzleFlashTransparentFromLook,
} from "../src/render/muzzleFlash";

describe("muzzleFlashTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = muzzleFlashTransparentAfterRestart();
    expect(bootTransparent).toBe(
      muzzleFlashTransparentFromLook(MUZZLE_FLASH_TRANSPARENT),
    );
    expect(bootTransparent).toBe(MUZZLE_FLASH_TRANSPARENT);
    expect(bootTransparent).toBe(MUZZLE_FLASH_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(muzzleFlashTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(muzzleFlashTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(muzzleFlashTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(muzzleFlashTransparentFromLook(MUZZLE_FLASH_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = muzzleFlashTransparentAfterRestart();
    const liveTransparent = muzzleFlashTransparentFromLook(
      MUZZLE_FLASH_TRANSPARENT,
    );
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(muzzleFlashTransparentAfterRestart());
    expect(liveTransparent).toBe(MUZZLE_FLASH_TRANSPARENT_SPAWN);

    expect(muzzleFlashTransparentFromLook(MUZZLE_FLASH_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(muzzleFlashTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("muzzle flash mesh transparent recreate lock (R / softReset)", () => {
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
    const flashSrc = readFileSync(
      resolve(process.cwd(), "src/render/muzzleFlash.ts"),
      "utf8",
    );
    expect(flashSrc).toContain("muzzleFlashTransparentAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashTransparentFromLook(");
    expect(flashSrc).toContain("MUZZLE_FLASH_TRANSPARENT_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleFlashTransparentAfterRestart\([\s\S]{0,200}muzzleFlashTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleFlashTransparentAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashTransparentAfterRestart()");
    expect(viewSrc).not.toContain("muzzleFlashTransparentFromLook(");
    expect(viewSrc).toContain(
      "transparent: muzzleFlashTransparentAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const muzzleMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/muzzleMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleFlashTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleFlashTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyMuzzleFlashVisual\([\s\S]{0,240}muzzleFlashTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickMuzzle\([\s\S]{0,240}muzzleFlashTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleFlashTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleFlashTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleFlashTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleFlashTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleFlashTransparentAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashTransparentFromLook(");
    expect(saveSrc).not.toContain("muzzleFlashTransparentAfterRestart");
    expect(saveSrc).not.toContain("muzzleFlashTransparentFromLook");
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
