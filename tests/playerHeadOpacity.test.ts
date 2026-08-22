import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_HEAD_OPACITY,
  PLAYER_HEAD_OPACITY_SPAWN,
  playerHeadOpacityAfterRestart,
  playerHeadOpacityFromLook,
} from "../src/render/worldView";

describe("playerHeadOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = playerHeadOpacityAfterRestart();
    expect(bootOpacity).toBe(playerHeadOpacityFromLook(PLAYER_HEAD_OPACITY));
    expect(bootOpacity).toBe(PLAYER_HEAD_OPACITY);
    expect(bootOpacity).toBe(PLAYER_HEAD_OPACITY_SPAWN);
    expect(bootOpacity).toBe(1);
    expect(playerHeadOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.42;
    expect(playerHeadOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(playerHeadOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerHeadOpacityFromLook(1)).toBe(bootOpacity);
    expect(playerHeadOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; attach/tick no escriben)", () => {
    const bootOpacity = playerHeadOpacityAfterRestart();
    const liveOpacity = playerHeadOpacityFromLook(1);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(playerHeadOpacityAfterRestart());
    expect(liveOpacity).toBe(PLAYER_HEAD_OPACITY_SPAWN);

    expect(playerHeadOpacityFromLook(1)).toBe(bootOpacity);
    expect(playerHeadOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });
});

describe("player-head mesh opacity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("playerHeadOpacityAfterRestart(");
    expect(viewSrc).toContain("playerHeadOpacityFromLook(");
    expect(viewSrc).toContain("PLAYER_HEAD_OPACITY_SPAWN");
    expect(viewSrc).toMatch(
      /playerHeadOpacityAfterRestart\([\s\S]{0,200}playerHeadOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("playerHeadOpacityAfterRestart()");
    expect(viewSrc).toContain("opacity: playerHeadOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}opacity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/playerHeadMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerHeadOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerHeadOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerHeadOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerHeadOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerHeadOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerHeadOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerHeadOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerHeadOpacityAfterRestart(");
    expect(gameSrc).not.toContain("playerHeadOpacityFromLook(");
    expect(saveSrc).not.toContain("playerHeadOpacityAfterRestart");
    expect(saveSrc).not.toContain("playerHeadOpacityFromLook");
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
