import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLOOR_OPACITY,
  FLOOR_OPACITY_SPAWN,
  floorOpacityAfterRestart,
  floorOpacityFromLook,
} from "../src/render/worldView";

describe("floorOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = floorOpacityAfterRestart();
    expect(bootOpacity).toBe(floorOpacityFromLook(FLOOR_OPACITY));
    expect(bootOpacity).toBe(FLOOR_OPACITY);
    expect(bootOpacity).toBe(FLOOR_OPACITY_SPAWN);
    expect(bootOpacity).toBe(1);
    expect(floorOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.42;
    expect(floorOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(floorOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(floorOpacityFromLook(1)).toBe(bootOpacity);
    expect(floorOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; attach/tick no escriben)", () => {
    const bootOpacity = floorOpacityAfterRestart();
    const liveOpacity = floorOpacityFromLook(1);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(floorOpacityAfterRestart());
    expect(liveOpacity).toBe(FLOOR_OPACITY_SPAWN);

    expect(floorOpacityFromLook(1)).toBe(bootOpacity);
    expect(floorOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });
});

describe("floor mesh opacity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("floorOpacityAfterRestart(");
    expect(viewSrc).toContain("floorOpacityFromLook(");
    expect(viewSrc).toContain("FLOOR_OPACITY_SPAWN");
    expect(viewSrc).toMatch(
      /floorOpacityAfterRestart\([\s\S]{0,200}floorOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("floorOpacityAfterRestart()");
    expect(viewSrc).toContain("opacity: floorOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(
      /function matForFloorColor\(color: number\): THREE\.MeshStandardMaterial \{[\s\S]{0,720}opacity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/floorMatByColor[\s\S]{0,800}opacity:\s*1/);
    expect(viewSrc).not.toMatch(/floorMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function matForFloorColor[\s\S]{0,900}m\.opacity\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}floorOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}floorOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}floorOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}floorOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}floorOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}floorOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}floorOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("floorOpacityAfterRestart(");
    expect(gameSrc).not.toContain("floorOpacityFromLook(");
    expect(saveSrc).not.toContain("floorOpacityAfterRestart");
    expect(saveSrc).not.toContain("floorOpacityFromLook");
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
