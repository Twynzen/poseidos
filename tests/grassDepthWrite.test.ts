import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  GRASS_DEPTH_WRITE,
  GRASS_DEPTH_WRITE_SPAWN,
  grassDepthWriteAfterRestart,
  grassDepthWriteFromLook,
} from "../src/render/windGrass";

describe("grassDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = grassDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      grassDepthWriteFromLook(GRASS_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(GRASS_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(GRASS_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(grassDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(grassDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(grassDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(grassDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(grassDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = grassDepthWriteAfterRestart();
    const liveDepthWrite = grassDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(grassDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(GRASS_DEPTH_WRITE_SPAWN);

    expect(grassDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(grassDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("grass mesh depthWrite recreate lock (R / softReset)", () => {
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
    const grassSrc = readFileSync(
      resolve(process.cwd(), "src/render/windGrass.ts"),
      "utf8",
    );
    expect(grassSrc).toContain("grassDepthWriteAfterRestart(");
    expect(grassSrc).toContain("grassDepthWriteFromLook(");
    expect(grassSrc).toContain("GRASS_DEPTH_WRITE_SPAWN");
    expect(grassSrc).toMatch(
      /grassDepthWriteAfterRestart\([\s\S]{0,200}grassDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("grassDepthWriteAfterRestart(");
    expect(viewSrc).toContain("grassDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("grassDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: grassDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const grassMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/grassMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function applyGrassPoses\(\): void \{[\s\S]{0,400}grassDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}grassDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}grassDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}grassDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}grassDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("grassDepthWriteFromLook(");
    expect(saveSrc).not.toContain("grassDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("grassDepthWriteFromLook");
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
