import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_FLASH_DEPTH_WRITE,
  MUZZLE_FLASH_DEPTH_WRITE_SPAWN,
  muzzleFlashDepthWriteAfterRestart,
  muzzleFlashDepthWriteFromLook,
} from "../src/render/muzzleFlash";

describe("muzzleFlashDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = muzzleFlashDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      muzzleFlashDepthWriteFromLook(MUZZLE_FLASH_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(MUZZLE_FLASH_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(MUZZLE_FLASH_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(muzzleFlashDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(muzzleFlashDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(muzzleFlashDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(muzzleFlashDepthWriteFromLook(MUZZLE_FLASH_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = muzzleFlashDepthWriteAfterRestart();
    const liveDepthWrite = muzzleFlashDepthWriteFromLook(
      MUZZLE_FLASH_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(muzzleFlashDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(MUZZLE_FLASH_DEPTH_WRITE_SPAWN);

    expect(muzzleFlashDepthWriteFromLook(MUZZLE_FLASH_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(muzzleFlashDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("muzzle flash mesh depthWrite recreate lock (R / softReset)", () => {
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
    const flashSrc = readFileSync(
      resolve(process.cwd(), "src/render/muzzleFlash.ts"),
      "utf8",
    );
    expect(flashSrc).toContain("muzzleFlashDepthWriteAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashDepthWriteFromLook(");
    expect(flashSrc).toContain("MUZZLE_FLASH_DEPTH_WRITE_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleFlashDepthWriteAfterRestart\([\s\S]{0,200}muzzleFlashDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleFlashDepthWriteAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("muzzleFlashDepthWriteFromLook(");
    expect(viewSrc).toContain(
      "depthWrite: muzzleFlashDepthWriteAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const muzzleMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/muzzleMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyMuzzleFlashVisual\([\s\S]{0,240}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickMuzzle\([\s\S]{0,240}muzzleFlashDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleFlashDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleFlashDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashDepthWriteFromLook(");
    expect(saveSrc).not.toContain("muzzleFlashDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("muzzleFlashDepthWriteFromLook");
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
