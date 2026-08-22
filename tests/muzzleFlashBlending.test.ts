import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_FLASH_BLENDING,
  MUZZLE_FLASH_BLENDING_SPAWN,
  muzzleFlashBlendingAfterRestart,
  muzzleFlashBlendingFromLook,
} from "../src/render/muzzleFlash";

describe("muzzleFlashBlendingAfterRestart (R / softReset)", () => {
  test("blending fresco (idle THREE.AdditiveBlending / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlending = muzzleFlashBlendingAfterRestart();
    expect(bootBlending).toBe(muzzleFlashBlendingFromLook(MUZZLE_FLASH_BLENDING));
    expect(bootBlending).toBe(MUZZLE_FLASH_BLENDING);
    expect(bootBlending).toBe(MUZZLE_FLASH_BLENDING_SPAWN);
    expect(bootBlending).toBe(2);
    expect(muzzleFlashBlendingAfterRestart()).toBe(bootBlending);

    const leftoverBlending = 1;
    expect(muzzleFlashBlendingFromLook(leftoverBlending)).toBe(leftoverBlending);
    expect(muzzleFlashBlendingFromLook(leftoverBlending)).not.toBe(bootBlending);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(muzzleFlashBlendingFromLook(MUZZLE_FLASH_BLENDING)).toBe(bootBlending);
  });

  test("vivo on no cambia blending (ctor constant; place/tick no escriben)", () => {
    const bootBlending = muzzleFlashBlendingAfterRestart();
    const liveBlending = muzzleFlashBlendingFromLook(MUZZLE_FLASH_BLENDING);
    expect(liveBlending).toBe(bootBlending);
    expect(liveBlending).toBe(muzzleFlashBlendingAfterRestart());
    expect(liveBlending).toBe(MUZZLE_FLASH_BLENDING_SPAWN);

    expect(muzzleFlashBlendingFromLook(MUZZLE_FLASH_BLENDING)).toBe(bootBlending);
    expect(muzzleFlashBlendingFromLook(1)).not.toBe(bootBlending);
  });
});

describe("muzzle flash mesh blending recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blending fresco; F9 no helper", () => {
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
    expect(flashSrc).toContain("muzzleFlashBlendingAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashBlendingFromLook(");
    expect(flashSrc).toContain("MUZZLE_FLASH_BLENDING_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleFlashBlendingAfterRestart\([\s\S]{0,200}muzzleFlashBlendingFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleFlashBlendingAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashBlendingAfterRestart()");
    expect(viewSrc).not.toContain("muzzleFlashBlendingFromLook(");
    expect(viewSrc).toContain("blending: muzzleFlashBlendingAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const muzzleMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,720}blending:\s*THREE\.AdditiveBlending/,
    );
    expect(viewSrc).not.toMatch(/muzzleMat\.blending\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleFlashBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleFlashBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyMuzzleFlashVisual\([\s\S]{0,240}muzzleFlashBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickMuzzle\([\s\S]{0,240}muzzleFlashBlendingAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleFlashBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleFlashBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleFlashBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleFlashBlendingAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleFlashBlendingAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashBlendingFromLook(");
    expect(saveSrc).not.toContain("muzzleFlashBlendingAfterRestart");
    expect(saveSrc).not.toContain("muzzleFlashBlendingFromLook");
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
