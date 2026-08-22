import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_BODY_COLOR,
  PLAYER_BODY_COLOR_SPAWN,
  PLAYER_COLOR,
  playerBodyColorAfterRestart,
  playerBodyColorFromLook,
} from "../src/render/worldView";

describe("playerBodyColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle PLAYER_COLOR 0x55a4f4); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = playerBodyColorAfterRestart();
    expect(bootColor).toBe(playerBodyColorFromLook(PLAYER_BODY_COLOR));
    expect(bootColor).toBe(PLAYER_BODY_COLOR);
    expect(bootColor).toBe(PLAYER_BODY_COLOR_SPAWN);
    expect(bootColor).toBe(PLAYER_COLOR);
    expect(bootColor).toBe(0x55a4f4);
    expect((bootColor >> 16) & 0xff).toBe(0x55);
    expect((bootColor >> 8) & 0xff).toBe(0xa4);
    expect(bootColor & 0xff).toBe(0xf4);
    expect(playerBodyColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xff0000;
    expect(playerBodyColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(playerBodyColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerBodyColorFromLook(PLAYER_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; attach/tick no escriben)", () => {
    const bootColor = playerBodyColorAfterRestart();
    const liveColor = playerBodyColorFromLook(PLAYER_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(playerBodyColorAfterRestart());
    expect(liveColor).toBe(PLAYER_BODY_COLOR_SPAWN);

    expect(playerBodyColorFromLook(PLAYER_COLOR)).toBe(bootColor);
    expect(playerBodyColorFromLook(0xff0000)).not.toBe(bootColor);
  });
});

describe("player body mesh color recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("playerBodyColorAfterRestart(");
    expect(viewSrc).toContain("playerBodyColorFromLook(");
    expect(viewSrc).toContain("PLAYER_BODY_COLOR_SPAWN");
    expect(viewSrc).toMatch(
      /playerBodyColorAfterRestart\([\s\S]{0,200}playerBodyColorFromLook\(/,
    );
    expect(viewSrc).toContain("playerBodyColorAfterRestart()");
    expect(viewSrc).toContain("color: playerBodyColorAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerBodyMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,240}color:\s*PLAYER_COLOR/,
    );
    expect(viewSrc).not.toMatch(/playerBodyMat\.color\s*=/);
    expect(viewSrc).not.toMatch(/playerBodyMat\.color\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerBodyColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerBodyColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerBodyColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerBodyColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerBodyColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerBodyColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerBodyColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerBodyColorAfterRestart(");
    expect(gameSrc).not.toContain("playerBodyColorFromLook(");
    expect(saveSrc).not.toContain("playerBodyColorAfterRestart");
    expect(saveSrc).not.toContain("playerBodyColorFromLook");
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
