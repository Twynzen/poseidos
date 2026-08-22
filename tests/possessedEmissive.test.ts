import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_EMISSIVE,
  POSSESSED_EMISSIVE_SPAWN,
  POSSESSED_MESH_EMISSIVE,
  possessedEmissiveAfterRestart,
  possessedEmissiveFromLook,
} from "../src/render/worldView";

describe("possessedEmissiveAfterRestart (R / softReset)", () => {
  test("emissive fresco (idle POSSESSED_EMISSIVE 0x1e0925); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootEmissive = possessedEmissiveAfterRestart();
    expect(bootEmissive).toBe(possessedEmissiveFromLook(POSSESSED_MESH_EMISSIVE));
    expect(bootEmissive).toBe(POSSESSED_MESH_EMISSIVE);
    expect(bootEmissive).toBe(POSSESSED_EMISSIVE_SPAWN);
    expect(bootEmissive).toBe(POSSESSED_EMISSIVE);
    expect(bootEmissive).toBe(0x1e0925);
    expect((bootEmissive >> 16) & 0xff).toBe(0x1e);
    expect((bootEmissive >> 8) & 0xff).toBe(0x09);
    expect(bootEmissive & 0xff).toBe(0x25);
    expect(possessedEmissiveAfterRestart()).toBe(bootEmissive);

    const leftoverEmissive = 0xff0000;
    expect(possessedEmissiveFromLook(leftoverEmissive)).toBe(leftoverEmissive);
    expect(possessedEmissiveFromLook(leftoverEmissive)).not.toBe(bootEmissive);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(possessedEmissiveFromLook(POSSESSED_EMISSIVE)).toBe(bootEmissive);
  });

  test("vivo on no cambia emissive (ctor constant; attach/tick no escriben)", () => {
    const bootEmissive = possessedEmissiveAfterRestart();
    const liveEmissive = possessedEmissiveFromLook(POSSESSED_EMISSIVE);
    expect(liveEmissive).toBe(bootEmissive);
    expect(liveEmissive).toBe(possessedEmissiveAfterRestart());
    expect(liveEmissive).toBe(POSSESSED_EMISSIVE_SPAWN);

    expect(possessedEmissiveFromLook(POSSESSED_EMISSIVE)).toBe(bootEmissive);
    expect(possessedEmissiveFromLook(0xff0000)).not.toBe(bootEmissive);
  });
});

describe("possessed mesh emissive recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedEmissiveAfterRestart(");
    expect(viewSrc).toContain("possessedEmissiveFromLook(");
    expect(viewSrc).toContain("POSSESSED_EMISSIVE_SPAWN");
    expect(viewSrc).toMatch(
      /possessedEmissiveAfterRestart\([\s\S]{0,200}possessedEmissiveFromLook\(/,
    );
    expect(viewSrc).toContain("possessedEmissiveAfterRestart()");
    expect(viewSrc).toContain("emissive: possessedEmissiveAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,360}emissive:\s*POSSESSED_EMISSIVE/,
    );
    expect(viewSrc).not.toMatch(/possessedMat\.emissive\s*=/);
    expect(viewSrc).not.toMatch(/possessedMat\.emissive\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedEmissiveAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedEmissiveAfterRestart(");
    expect(gameSrc).not.toContain("possessedEmissiveFromLook(");
    expect(saveSrc).not.toContain("possessedEmissiveAfterRestart");
    expect(saveSrc).not.toContain("possessedEmissiveFromLook");
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
