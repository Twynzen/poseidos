import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_HEAD_COLOR,
  PLAYER_HEAD_COLOR_SPAWN,
  PLAYER_HEAD_MESH_COLOR,
  playerHeadColorAfterRestart,
  playerHeadColorFromLook,
} from "../src/render/worldView";

describe("playerHeadColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle PLAYER_HEAD_COLOR 0x91d1ff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = playerHeadColorAfterRestart();
    expect(bootColor).toBe(playerHeadColorFromLook(PLAYER_HEAD_MESH_COLOR));
    expect(bootColor).toBe(PLAYER_HEAD_MESH_COLOR);
    expect(bootColor).toBe(PLAYER_HEAD_COLOR_SPAWN);
    expect(bootColor).toBe(PLAYER_HEAD_COLOR);
    expect(bootColor).toBe(0x91d1ff);
    expect((bootColor >> 16) & 0xff).toBe(0x91);
    expect((bootColor >> 8) & 0xff).toBe(0xd1);
    expect(bootColor & 0xff).toBe(0xff);
    expect(playerHeadColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xff0000;
    expect(playerHeadColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(playerHeadColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerHeadColorFromLook(PLAYER_HEAD_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; attach/tick no escriben)", () => {
    const bootColor = playerHeadColorAfterRestart();
    const liveColor = playerHeadColorFromLook(PLAYER_HEAD_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(playerHeadColorAfterRestart());
    expect(liveColor).toBe(PLAYER_HEAD_COLOR_SPAWN);

    expect(playerHeadColorFromLook(PLAYER_HEAD_COLOR)).toBe(bootColor);
    expect(playerHeadColorFromLook(0xff0000)).not.toBe(bootColor);
  });
});

describe("player head mesh color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("playerHeadColorAfterRestart(");
    expect(viewSrc).toContain("playerHeadColorFromLook(");
    expect(viewSrc).toContain("PLAYER_HEAD_COLOR_SPAWN");
    expect(viewSrc).toMatch(
      /playerHeadColorAfterRestart\([\s\S]{0,200}playerHeadColorFromLook\(/,
    );
    expect(viewSrc).toContain("playerHeadColorAfterRestart()");
    expect(viewSrc).toContain("color: playerHeadColorAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,240}color:\s*PLAYER_HEAD_COLOR/,
    );
    expect(viewSrc).not.toMatch(/playerHeadMat\.color\s*=/);
    expect(viewSrc).not.toMatch(/playerHeadMat\.color\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerHeadColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerHeadColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerHeadColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerHeadColorAfterRestart(");
    expect(gameSrc).not.toContain("playerHeadColorFromLook(");
    expect(saveSrc).not.toContain("playerHeadColorAfterRestart");
    expect(saveSrc).not.toContain("playerHeadColorFromLook");
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
