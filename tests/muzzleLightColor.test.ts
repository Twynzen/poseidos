import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_LIGHT_COLOR_SPAWN,
  muzzleLightColorAfterRestart,
  muzzleLightColorFromLook,
} from "../src/render/muzzleFlash";
import { MUZZLE_LIGHT_COLOR } from "../src/render/worldView";

describe("muzzleLightColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle MUZZLE_LIGHT_COLOR 0xffffb8); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = muzzleLightColorAfterRestart();
    expect(bootColor).toBe(muzzleLightColorFromLook(MUZZLE_LIGHT_COLOR));
    expect(bootColor).toBe(MUZZLE_LIGHT_COLOR);
    expect(bootColor).toBe(MUZZLE_LIGHT_COLOR_SPAWN);
    expect(bootColor).toBe(0xffffb8);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xb8);
    expect(muzzleLightColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xffe8a0;
    expect(muzzleLightColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(muzzleLightColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(muzzleLightColorFromLook(MUZZLE_LIGHT_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = muzzleLightColorAfterRestart();
    const liveColor = muzzleLightColorFromLook(MUZZLE_LIGHT_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(muzzleLightColorAfterRestart());
    expect(liveColor).toBe(MUZZLE_LIGHT_COLOR_SPAWN);

    expect(muzzleLightColorFromLook(MUZZLE_LIGHT_COLOR)).toBe(bootColor);
    expect(muzzleLightColorFromLook(0xffe8a0)).not.toBe(bootColor);
  });
});

describe("muzzle light color recreate lock (R / softReset)", () => {
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
    expect(flashSrc).toContain("muzzleLightColorAfterRestart(");
    expect(flashSrc).toContain("muzzleLightColorFromLook(");
    expect(flashSrc).toContain("MUZZLE_LIGHT_COLOR_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleLightColorAfterRestart\([\s\S]{0,200}muzzleLightColorFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleLightColorAfterRestart(");
    expect(viewSrc).toContain("muzzleLightColorAfterRestart()");
    expect(viewSrc).not.toContain("muzzleLightColorFromLook(");
    expect(viewSrc).toContain(
      "new THREE.PointLight(\n    muzzleLightColorAfterRestart(),",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*MUZZLE_LIGHT_COLOR,\s*0,\s*MUZZLE_LIGHT_DISTANCE,\s*muzzleLightDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(/muzzleLight\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleLightColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleLightColorAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3300}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleLightColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleLightColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleLightColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleLightColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleLightColorAfterRestart(");
    expect(gameSrc).not.toContain("muzzleLightColorFromLook(");
    expect(saveSrc).not.toContain("muzzleLightColorAfterRestart");
    expect(saveSrc).not.toContain("muzzleLightColorFromLook");
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
