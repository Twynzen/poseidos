import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLOOR_EMISSIVE,
  FLOOR_EMISSIVE_SPAWN,
  floorEmissiveAfterRestart,
  floorEmissiveFromLook,
} from "../src/render/worldView";

describe("floorEmissiveAfterRestart (R / softReset)", () => {
  test("emissive fresco (idle 0x000000); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootEmissive = floorEmissiveAfterRestart();
    expect(bootEmissive).toBe(floorEmissiveFromLook(FLOOR_EMISSIVE));
    expect(bootEmissive).toBe(FLOOR_EMISSIVE);
    expect(bootEmissive).toBe(FLOOR_EMISSIVE_SPAWN);
    expect(bootEmissive).toBe(0x000000);
    expect(bootEmissive).toBe(0);
    expect((bootEmissive >> 16) & 0xff).toBe(0x00);
    expect((bootEmissive >> 8) & 0xff).toBe(0x00);
    expect(bootEmissive & 0xff).toBe(0x00);
    expect(floorEmissiveAfterRestart()).toBe(bootEmissive);

    const leftoverEmissive = 0xff00aa;
    expect(floorEmissiveFromLook(leftoverEmissive)).toBe(leftoverEmissive);
    expect(floorEmissiveFromLook(leftoverEmissive)).not.toBe(bootEmissive);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(floorEmissiveFromLook(0x000000)).toBe(bootEmissive);
    expect(floorEmissiveFromLook(0xff00aa)).not.toBe(bootEmissive);
  });

  test("vivo on no cambia emissive (ctor constant; attach/tick no escriben)", () => {
    const bootEmissive = floorEmissiveAfterRestart();
    const liveEmissive = floorEmissiveFromLook(0x000000);
    expect(liveEmissive).toBe(bootEmissive);
    expect(liveEmissive).toBe(floorEmissiveAfterRestart());
    expect(liveEmissive).toBe(FLOOR_EMISSIVE_SPAWN);

    expect(floorEmissiveFromLook(0x000000)).toBe(bootEmissive);
    expect(floorEmissiveFromLook(0xff00aa)).not.toBe(bootEmissive);
  });
});

describe("floor mesh emissive recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("floorEmissiveAfterRestart(");
    expect(viewSrc).toContain("floorEmissiveFromLook(");
    expect(viewSrc).toContain("FLOOR_EMISSIVE_SPAWN");
    expect(viewSrc).toMatch(
      /floorEmissiveAfterRestart\([\s\S]{0,200}floorEmissiveFromLook\(/,
    );
    expect(viewSrc).toContain("floorEmissiveAfterRestart()");
    expect(viewSrc).toContain("emissive: floorEmissiveAfterRestart()");
    expect(viewSrc).not.toMatch(
      /function matForFloorColor\(color: number\): THREE\.MeshStandardMaterial \{[\s\S]{0,720}emissive:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(
      /function matForFloorColor\(color: number\): THREE\.MeshStandardMaterial \{[\s\S]{0,720}emissive:\s*0x000000/,
    );
    expect(viewSrc).not.toMatch(
      /floorMatByColor[\s\S]{0,800}emissive:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(
      /floorMatByColor[\s\S]{0,800}emissive:\s*0x000000/,
    );
    expect(viewSrc).not.toMatch(/floorMat\.emissive\s*=/);
    expect(viewSrc).not.toMatch(/floorMat\.emissive\.setHex/);
    expect(viewSrc).not.toMatch(
      /function matForFloorColor[\s\S]{0,900}m\.emissive\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function matForFloorColor[\s\S]{0,900}m\.emissive\.setHex/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}floorEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}floorEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}floorEmissiveAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}floorEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}floorEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}floorEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}floorEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toContain("floorEmissiveAfterRestart(");
    expect(gameSrc).not.toContain("floorEmissiveFromLook(");
    expect(saveSrc).not.toContain("floorEmissiveAfterRestart");
    expect(saveSrc).not.toContain("floorEmissiveFromLook");
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
