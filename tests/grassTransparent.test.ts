import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  GRASS_TRANSPARENT,
  GRASS_TRANSPARENT_SPAWN,
  grassTransparentAfterRestart,
  grassTransparentFromLook,
} from "../src/render/windGrass";

describe("grassTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = grassTransparentAfterRestart();
    expect(bootTransparent).toBe(
      grassTransparentFromLook(GRASS_TRANSPARENT),
    );
    expect(bootTransparent).toBe(GRASS_TRANSPARENT);
    expect(bootTransparent).toBe(GRASS_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(false);
    expect(grassTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = true;
    expect(grassTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(grassTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(grassTransparentFromLook(false)).toBe(bootTransparent);
    expect(grassTransparentFromLook(true)).not.toBe(bootTransparent);
  });

  test("vivo on no cambia transparent (ctor constant; attach/tick no escriben)", () => {
    const bootTransparent = grassTransparentAfterRestart();
    const liveTransparent = grassTransparentFromLook(false);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(grassTransparentAfterRestart());
    expect(liveTransparent).toBe(GRASS_TRANSPARENT_SPAWN);

    expect(grassTransparentFromLook(false)).toBe(bootTransparent);
    expect(grassTransparentFromLook(true)).not.toBe(bootTransparent);
  });
});

describe("grass mesh transparent recreate lock (R / softReset)", () => {
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
    const grassSrc = readFileSync(
      resolve(process.cwd(), "src/render/windGrass.ts"),
      "utf8",
    );
    expect(grassSrc).toContain("grassTransparentAfterRestart(");
    expect(grassSrc).toContain("grassTransparentFromLook(");
    expect(grassSrc).toContain("GRASS_TRANSPARENT_SPAWN");
    expect(grassSrc).toMatch(
      /grassTransparentAfterRestart\([\s\S]{0,200}grassTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("grassTransparentAfterRestart(");
    expect(viewSrc).toContain("grassTransparentAfterRestart()");
    expect(viewSrc).not.toContain("grassTransparentFromLook(");
    expect(viewSrc).toContain("transparent: grassTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}transparent:\s*false/,
    );
    expect(viewSrc).not.toMatch(/grassMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyGrassPoses\(\): void \{[\s\S]{0,400}grassTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}grassTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}grassTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}grassTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}grassTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassTransparentAfterRestart(");
    expect(gameSrc).not.toContain("grassTransparentFromLook(");
    expect(saveSrc).not.toContain("grassTransparentAfterRestart");
    expect(saveSrc).not.toContain("grassTransparentFromLook");
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
