import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLOOR_DEPTH_WRITE,
  FLOOR_DEPTH_WRITE_SPAWN,
  floorDepthWriteAfterRestart,
  floorDepthWriteFromLook,
} from "../src/render/worldView";

describe("floorDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = floorDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      floorDepthWriteFromLook(FLOOR_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(FLOOR_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(FLOOR_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(floorDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(floorDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(floorDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(floorDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(floorDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = floorDepthWriteAfterRestart();
    const liveDepthWrite = floorDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(floorDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(FLOOR_DEPTH_WRITE_SPAWN);

    expect(floorDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(floorDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("floor mesh depthWrite recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("floorDepthWriteAfterRestart(");
    expect(viewSrc).toContain("floorDepthWriteFromLook(");
    expect(viewSrc).toContain("FLOOR_DEPTH_WRITE_SPAWN");
    expect(viewSrc).toMatch(
      /floorDepthWriteAfterRestart\([\s\S]{0,200}floorDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("floorDepthWriteAfterRestart()");
    expect(viewSrc).toContain("depthWrite: floorDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /function matForFloorColor\(color: number\): THREE\.MeshStandardMaterial \{[\s\S]{0,1200}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/floorMatByColor[\s\S]{0,800}depthWrite:\s*true/);
    expect(viewSrc).not.toMatch(/floorMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function matForFloorColor[\s\S]{0,900}m\.depthWrite\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}floorDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}floorDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}floorDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}floorDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}floorDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}floorDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}floorDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("floorDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("floorDepthWriteFromLook(");
    expect(saveSrc).not.toContain("floorDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("floorDepthWriteFromLook");
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
