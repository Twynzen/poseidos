import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_BODY_OPACITY,
  PLAYER_BODY_OPACITY_SPAWN,
  playerBodyOpacityAfterRestart,
  playerBodyOpacityFromLook,
} from "../src/render/worldView";

describe("playerBodyOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = playerBodyOpacityAfterRestart();
    expect(bootOpacity).toBe(playerBodyOpacityFromLook(PLAYER_BODY_OPACITY));
    expect(bootOpacity).toBe(PLAYER_BODY_OPACITY);
    expect(bootOpacity).toBe(PLAYER_BODY_OPACITY_SPAWN);
    expect(bootOpacity).toBe(1);
    expect(playerBodyOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.42;
    expect(playerBodyOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(playerBodyOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerBodyOpacityFromLook(1)).toBe(bootOpacity);
    expect(playerBodyOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; attach/tick no escriben)", () => {
    const bootOpacity = playerBodyOpacityAfterRestart();
    const liveOpacity = playerBodyOpacityFromLook(1);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(playerBodyOpacityAfterRestart());
    expect(liveOpacity).toBe(PLAYER_BODY_OPACITY_SPAWN);

    expect(playerBodyOpacityFromLook(1)).toBe(bootOpacity);
    expect(playerBodyOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });
});

describe("player-body mesh opacity recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("playerBodyOpacityAfterRestart(");
    expect(viewSrc).toContain("playerBodyOpacityFromLook(");
    expect(viewSrc).toContain("PLAYER_BODY_OPACITY_SPAWN");
    expect(viewSrc).toMatch(
      /playerBodyOpacityAfterRestart\([\s\S]{0,200}playerBodyOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("playerBodyOpacityAfterRestart()");
    expect(viewSrc).toContain("opacity: playerBodyOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerBodyMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}opacity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/playerBodyMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerBodyOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerBodyOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerBodyOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerBodyOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerBodyOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerBodyOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerBodyOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerBodyOpacityAfterRestart(");
    expect(gameSrc).not.toContain("playerBodyOpacityFromLook(");
    expect(saveSrc).not.toContain("playerBodyOpacityAfterRestart");
    expect(saveSrc).not.toContain("playerBodyOpacityFromLook");
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
