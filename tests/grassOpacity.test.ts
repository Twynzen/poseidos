import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  GRASS_OPACITY,
  GRASS_OPACITY_SPAWN,
  grassOpacityAfterRestart,
  grassOpacityFromLook,
} from "../src/render/windGrass";

describe("grassOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = grassOpacityAfterRestart();
    expect(bootOpacity).toBe(grassOpacityFromLook(GRASS_OPACITY));
    expect(bootOpacity).toBe(GRASS_OPACITY);
    expect(bootOpacity).toBe(GRASS_OPACITY_SPAWN);
    expect(bootOpacity).toBe(1);
    expect(grassOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.42;
    expect(grassOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(grassOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(grassOpacityFromLook(1)).toBe(bootOpacity);
    expect(grassOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; attach/tick no escriben)", () => {
    const bootOpacity = grassOpacityAfterRestart();
    const liveOpacity = grassOpacityFromLook(1);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(grassOpacityAfterRestart());
    expect(liveOpacity).toBe(GRASS_OPACITY_SPAWN);

    expect(grassOpacityFromLook(1)).toBe(bootOpacity);
    expect(grassOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });
});

describe("grass mesh opacity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace opacity fresco; F9 no helper", () => {
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
    expect(grassSrc).toContain("grassOpacityAfterRestart(");
    expect(grassSrc).toContain("grassOpacityFromLook(");
    expect(grassSrc).toContain("GRASS_OPACITY_SPAWN");
    expect(grassSrc).toMatch(
      /grassOpacityAfterRestart\([\s\S]{0,200}grassOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("grassOpacityAfterRestart(");
    expect(viewSrc).toContain("grassOpacityAfterRestart()");
    expect(viewSrc).not.toContain("grassOpacityFromLook(");
    expect(viewSrc).toContain("opacity: grassOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}opacity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/grassMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyGrassPoses\(\): void \{[\s\S]{0,400}grassOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}grassOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}grassOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}grassOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}grassOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassOpacityAfterRestart(");
    expect(gameSrc).not.toContain("grassOpacityFromLook(");
    expect(saveSrc).not.toContain("grassOpacityAfterRestart");
    expect(saveSrc).not.toContain("grassOpacityFromLook");
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
