import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  GRASS_EMISSIVE,
  GRASS_EMISSIVE_SPAWN,
  grassEmissiveAfterRestart,
  grassEmissiveFromLook,
} from "../src/render/windGrass";

describe("grassEmissiveAfterRestart (R / softReset)", () => {
  test("emissive fresco (idle 0x000000); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootEmissive = grassEmissiveAfterRestart();
    expect(bootEmissive).toBe(grassEmissiveFromLook(GRASS_EMISSIVE));
    expect(bootEmissive).toBe(GRASS_EMISSIVE);
    expect(bootEmissive).toBe(GRASS_EMISSIVE_SPAWN);
    expect(bootEmissive).toBe(0x000000);
    expect(bootEmissive).toBe(0);
    expect((bootEmissive >> 16) & 0xff).toBe(0x00);
    expect((bootEmissive >> 8) & 0xff).toBe(0x00);
    expect(bootEmissive & 0xff).toBe(0x00);
    expect(grassEmissiveAfterRestart()).toBe(bootEmissive);

    const leftoverEmissive = 0xff00aa;
    expect(grassEmissiveFromLook(leftoverEmissive)).toBe(leftoverEmissive);
    expect(grassEmissiveFromLook(leftoverEmissive)).not.toBe(bootEmissive);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(grassEmissiveFromLook(0x000000)).toBe(bootEmissive);
    expect(grassEmissiveFromLook(0xff00aa)).not.toBe(bootEmissive);
  });

  test("vivo on no cambia emissive (ctor constant; attach/tick no escriben)", () => {
    const bootEmissive = grassEmissiveAfterRestart();
    const liveEmissive = grassEmissiveFromLook(0x000000);
    expect(liveEmissive).toBe(bootEmissive);
    expect(liveEmissive).toBe(grassEmissiveAfterRestart());
    expect(liveEmissive).toBe(GRASS_EMISSIVE_SPAWN);

    expect(grassEmissiveFromLook(0x000000)).toBe(bootEmissive);
    expect(grassEmissiveFromLook(0xff00aa)).not.toBe(bootEmissive);
  });
});

describe("grass mesh emissive recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace emissive fresco; F9 no helper", () => {
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
    expect(grassSrc).toContain("grassEmissiveAfterRestart(");
    expect(grassSrc).toContain("grassEmissiveFromLook(");
    expect(grassSrc).toContain("GRASS_EMISSIVE_SPAWN");
    expect(grassSrc).toMatch(
      /grassEmissiveAfterRestart\([\s\S]{0,200}grassEmissiveFromLook\(/,
    );
    expect(viewSrc).toContain("grassEmissiveAfterRestart(");
    expect(viewSrc).toContain("grassEmissiveAfterRestart()");
    expect(viewSrc).not.toContain("grassEmissiveFromLook(");
    expect(viewSrc).toContain("emissive: grassEmissiveAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,560}emissive:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,560}emissive:\s*0x000000/,
    );
    expect(viewSrc).not.toMatch(/grassMat\.emissive\s*=/);
    expect(viewSrc).not.toMatch(/grassMat\.emissive\.setHex/);
    expect(viewSrc).not.toMatch(
      /function applyGrassPoses\(\): void \{[\s\S]{0,400}grassEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}grassEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}grassEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}grassEmissiveAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassEmissiveAfterRestart(");
    expect(gameSrc).not.toContain("grassEmissiveFromLook(");
    expect(saveSrc).not.toContain("grassEmissiveAfterRestart");
    expect(saveSrc).not.toContain("grassEmissiveFromLook");
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
