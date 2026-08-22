import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BED_EMISSIVE,
  BED_EMISSIVE_SPAWN,
  bedEmissiveAfterRestart,
  bedEmissiveFromLook,
} from "../src/render/worldView";

describe("bedEmissiveAfterRestart (R / softReset)", () => {
  test("emissive fresco (idle 0x000000); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootEmissive = bedEmissiveAfterRestart();
    expect(bootEmissive).toBe(bedEmissiveFromLook(BED_EMISSIVE));
    expect(bootEmissive).toBe(BED_EMISSIVE);
    expect(bootEmissive).toBe(BED_EMISSIVE_SPAWN);
    expect(bootEmissive).toBe(0x000000);
    expect(bootEmissive).toBe(0);
    expect((bootEmissive >> 16) & 0xff).toBe(0x00);
    expect((bootEmissive >> 8) & 0xff).toBe(0x00);
    expect(bootEmissive & 0xff).toBe(0x00);
    expect(bedEmissiveAfterRestart()).toBe(bootEmissive);

    const leftoverEmissive = 0xff00aa;
    expect(bedEmissiveFromLook(leftoverEmissive)).toBe(leftoverEmissive);
    expect(bedEmissiveFromLook(leftoverEmissive)).not.toBe(bootEmissive);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(bedEmissiveFromLook(0x000000)).toBe(bootEmissive);
    expect(bedEmissiveFromLook(0xff00aa)).not.toBe(bootEmissive);
  });

  test("vivo on no cambia emissive (ctor constant; attach/tick no escriben)", () => {
    const bootEmissive = bedEmissiveAfterRestart();
    const liveEmissive = bedEmissiveFromLook(0x000000);
    expect(liveEmissive).toBe(bootEmissive);
    expect(liveEmissive).toBe(bedEmissiveAfterRestart());
    expect(liveEmissive).toBe(BED_EMISSIVE_SPAWN);

    expect(bedEmissiveFromLook(0x000000)).toBe(bootEmissive);
    expect(bedEmissiveFromLook(0xff00aa)).not.toBe(bootEmissive);
  });
});

describe("bed mesh emissive recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("bedEmissiveAfterRestart(");
    expect(viewSrc).toContain("bedEmissiveFromLook(");
    expect(viewSrc).toContain("BED_EMISSIVE_SPAWN");
    expect(viewSrc).toMatch(
      /bedEmissiveAfterRestart\([\s\S]{0,200}bedEmissiveFromLook\(/,
    );
    expect(viewSrc).toContain("bedEmissiveAfterRestart()");
    expect(viewSrc).toContain("emissive: bedEmissiveAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const bedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,560}emissive:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(
      /const bedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,560}emissive:\s*0x000000/,
    );
    expect(viewSrc).not.toMatch(/bedMat\.emissive\s*=/);
    expect(viewSrc).not.toMatch(/bedMat\.emissive\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}bedEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}bedEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}bedEmissiveAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}bedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}bedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}bedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}bedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toContain("bedEmissiveAfterRestart(");
    expect(gameSrc).not.toContain("bedEmissiveFromLook(");
    expect(saveSrc).not.toContain("bedEmissiveAfterRestart");
    expect(saveSrc).not.toContain("bedEmissiveFromLook");
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
