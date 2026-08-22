import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_HEAD_EMISSIVE,
  POSSESSED_HEAD_EMISSIVE_SPAWN,
  POSSESSED_HEAD_MESH_EMISSIVE,
  possessedHeadEmissiveAfterRestart,
  possessedHeadEmissiveFromLook,
} from "../src/render/worldView";

describe("possessedHeadEmissiveAfterRestart (R / softReset)", () => {
  test("emissive fresco (idle POSSESSED_HEAD_EMISSIVE 0x30124a); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootEmissive = possessedHeadEmissiveAfterRestart();
    expect(bootEmissive).toBe(possessedHeadEmissiveFromLook(POSSESSED_HEAD_MESH_EMISSIVE));
    expect(bootEmissive).toBe(POSSESSED_HEAD_MESH_EMISSIVE);
    expect(bootEmissive).toBe(POSSESSED_HEAD_EMISSIVE_SPAWN);
    expect(bootEmissive).toBe(POSSESSED_HEAD_EMISSIVE);
    expect(bootEmissive).toBe(0x30124a);
    expect((bootEmissive >> 16) & 0xff).toBe(0x30);
    expect((bootEmissive >> 8) & 0xff).toBe(0x12);
    expect(bootEmissive & 0xff).toBe(0x4a);
    expect(possessedHeadEmissiveAfterRestart()).toBe(bootEmissive);

    const leftoverEmissive = 0xff0000;
    expect(possessedHeadEmissiveFromLook(leftoverEmissive)).toBe(leftoverEmissive);
    expect(possessedHeadEmissiveFromLook(leftoverEmissive)).not.toBe(bootEmissive);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(possessedHeadEmissiveFromLook(POSSESSED_HEAD_EMISSIVE)).toBe(bootEmissive);
  });

  test("vivo on no cambia emissive (ctor constant; attach/tick no escriben)", () => {
    const bootEmissive = possessedHeadEmissiveAfterRestart();
    const liveEmissive = possessedHeadEmissiveFromLook(POSSESSED_HEAD_EMISSIVE);
    expect(liveEmissive).toBe(bootEmissive);
    expect(liveEmissive).toBe(possessedHeadEmissiveAfterRestart());
    expect(liveEmissive).toBe(POSSESSED_HEAD_EMISSIVE_SPAWN);

    expect(possessedHeadEmissiveFromLook(POSSESSED_HEAD_EMISSIVE)).toBe(bootEmissive);
    expect(possessedHeadEmissiveFromLook(0xff0000)).not.toBe(bootEmissive);
  });
});

describe("possessed head mesh emissive recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedHeadEmissiveAfterRestart(");
    expect(viewSrc).toContain("possessedHeadEmissiveFromLook(");
    expect(viewSrc).toContain("POSSESSED_HEAD_EMISSIVE_SPAWN");
    expect(viewSrc).toMatch(
      /possessedHeadEmissiveAfterRestart\([\s\S]{0,200}possessedHeadEmissiveFromLook\(/,
    );
    expect(viewSrc).toContain("possessedHeadEmissiveAfterRestart()");
    expect(viewSrc).toContain("emissive: possessedHeadEmissiveAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,360}emissive:\s*POSSESSED_HEAD_EMISSIVE/,
    );
    expect(viewSrc).not.toMatch(/possessedHeadMat\.emissive\s*=/);
    expect(viewSrc).not.toMatch(/possessedHeadMat\.emissive\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedHeadEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedHeadEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedHeadEmissiveAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedHeadEmissiveAfterRestart(");
    expect(gameSrc).not.toContain("possessedHeadEmissiveFromLook(");
    expect(saveSrc).not.toContain("possessedHeadEmissiveAfterRestart");
    expect(saveSrc).not.toContain("possessedHeadEmissiveFromLook");
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
