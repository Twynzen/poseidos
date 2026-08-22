import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_HEAD_EMISSIVE,
  PLAYER_HEAD_EMISSIVE_SPAWN,
  PLAYER_HEAD_MESH_EMISSIVE,
  playerHeadEmissiveAfterRestart,
  playerHeadEmissiveFromLook,
} from "../src/render/worldView";

describe("playerHeadEmissiveAfterRestart (R / softReset)", () => {
  test("emissive fresco (idle PLAYER_HEAD_EMISSIVE 0x122537); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootEmissive = playerHeadEmissiveAfterRestart();
    expect(bootEmissive).toBe(playerHeadEmissiveFromLook(PLAYER_HEAD_MESH_EMISSIVE));
    expect(bootEmissive).toBe(PLAYER_HEAD_MESH_EMISSIVE);
    expect(bootEmissive).toBe(PLAYER_HEAD_EMISSIVE_SPAWN);
    expect(bootEmissive).toBe(PLAYER_HEAD_EMISSIVE);
    expect(bootEmissive).toBe(0x122537);
    expect((bootEmissive >> 16) & 0xff).toBe(0x12);
    expect((bootEmissive >> 8) & 0xff).toBe(0x25);
    expect(bootEmissive & 0xff).toBe(0x37);
    expect(playerHeadEmissiveAfterRestart()).toBe(bootEmissive);

    const leftoverEmissive = 0xff0000;
    expect(playerHeadEmissiveFromLook(leftoverEmissive)).toBe(leftoverEmissive);
    expect(playerHeadEmissiveFromLook(leftoverEmissive)).not.toBe(bootEmissive);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerHeadEmissiveFromLook(PLAYER_HEAD_EMISSIVE)).toBe(bootEmissive);
  });

  test("vivo on no cambia emissive (ctor constant; attach/tick no escriben)", () => {
    const bootEmissive = playerHeadEmissiveAfterRestart();
    const liveEmissive = playerHeadEmissiveFromLook(PLAYER_HEAD_EMISSIVE);
    expect(liveEmissive).toBe(bootEmissive);
    expect(liveEmissive).toBe(playerHeadEmissiveAfterRestart());
    expect(liveEmissive).toBe(PLAYER_HEAD_EMISSIVE_SPAWN);

    expect(playerHeadEmissiveFromLook(PLAYER_HEAD_EMISSIVE)).toBe(bootEmissive);
    expect(playerHeadEmissiveFromLook(0xff0000)).not.toBe(bootEmissive);
  });
});

describe("player head mesh emissive recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("playerHeadEmissiveAfterRestart(");
    expect(viewSrc).toContain("playerHeadEmissiveFromLook(");
    expect(viewSrc).toContain("PLAYER_HEAD_EMISSIVE_SPAWN");
    expect(viewSrc).toMatch(
      /playerHeadEmissiveAfterRestart\([\s\S]{0,200}playerHeadEmissiveFromLook\(/,
    );
    expect(viewSrc).toContain("playerHeadEmissiveAfterRestart()");
    expect(viewSrc).toContain("emissive: playerHeadEmissiveAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,360}emissive:\s*PLAYER_HEAD_EMISSIVE/,
    );
    expect(viewSrc).not.toMatch(/playerHeadMat\.emissive\s*=/);
    expect(viewSrc).not.toMatch(/playerHeadMat\.emissive\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerHeadEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerHeadEmissiveAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerHeadEmissiveAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerHeadEmissiveAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerHeadEmissiveAfterRestart(");
    expect(gameSrc).not.toContain("playerHeadEmissiveFromLook(");
    expect(saveSrc).not.toContain("playerHeadEmissiveAfterRestart");
    expect(saveSrc).not.toContain("playerHeadEmissiveFromLook");
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
