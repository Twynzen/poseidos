import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_FLASH_COLOR_SPAWN,
  muzzleFlashColorAfterRestart,
  muzzleFlashColorFromLook,
} from "../src/render/muzzleFlash";
import { MUZZLE_FLASH_COLOR } from "../src/render/worldView";

describe("muzzleFlashColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle MUZZLE_FLASH_COLOR 0xffffdd); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = muzzleFlashColorAfterRestart();
    expect(bootColor).toBe(muzzleFlashColorFromLook(MUZZLE_FLASH_COLOR));
    expect(bootColor).toBe(MUZZLE_FLASH_COLOR);
    expect(bootColor).toBe(MUZZLE_FLASH_COLOR_SPAWN);
    expect(bootColor).toBe(0xffffdd);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xdd);
    expect(muzzleFlashColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xffe0aa;
    expect(muzzleFlashColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(muzzleFlashColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(muzzleFlashColorFromLook(MUZZLE_FLASH_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = muzzleFlashColorAfterRestart();
    const liveColor = muzzleFlashColorFromLook(MUZZLE_FLASH_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(muzzleFlashColorAfterRestart());
    expect(liveColor).toBe(MUZZLE_FLASH_COLOR_SPAWN);

    expect(muzzleFlashColorFromLook(MUZZLE_FLASH_COLOR)).toBe(bootColor);
    expect(muzzleFlashColorFromLook(0xffe0aa)).not.toBe(bootColor);
  });
});

describe("muzzle flash mesh color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(flashSrc).toContain("muzzleFlashColorAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashColorFromLook(");
    expect(flashSrc).toContain("MUZZLE_FLASH_COLOR_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleFlashColorAfterRestart\([\s\S]{0,200}muzzleFlashColorFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleFlashColorAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashColorAfterRestart()");
    expect(viewSrc).not.toContain("muzzleFlashColorFromLook(");
    expect(viewSrc).toContain("color: muzzleFlashColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*MUZZLE_FLASH_COLOR,/);
    expect(viewSrc).not.toMatch(/muzzleMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleFlashColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleFlashColorAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleFlashColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleFlashColorAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashColorFromLook(");
    expect(saveSrc).not.toContain("muzzleFlashColorAfterRestart");
    expect(saveSrc).not.toContain("muzzleFlashColorFromLook");
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
