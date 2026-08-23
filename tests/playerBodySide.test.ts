import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_BODY_SIDE,
  PLAYER_BODY_SIDE_SPAWN,
  playerBodySideAfterRestart,
  playerBodySideFromLook,
} from "../src/render/worldView";

describe("playerBodySideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = playerBodySideAfterRestart();
    expect(bootSide).toBe(playerBodySideFromLook(PLAYER_BODY_SIDE));
    expect(bootSide).toBe(PLAYER_BODY_SIDE);
    expect(bootSide).toBe(PLAYER_BODY_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(playerBodySideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(playerBodySideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(playerBodySideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerBodySideFromLook(PLAYER_BODY_SIDE)).toBe(bootSide);
    expect(playerBodySideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = playerBodySideAfterRestart();
    const liveSide = playerBodySideFromLook(PLAYER_BODY_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(playerBodySideAfterRestart());
    expect(liveSide).toBe(PLAYER_BODY_SIDE_SPAWN);

    expect(playerBodySideFromLook(PLAYER_BODY_SIDE)).toBe(bootSide);
    expect(playerBodySideFromLook(2)).not.toBe(bootSide);
  });
});

describe("player-body mesh side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("playerBodySideAfterRestart(");
    expect(viewSrc).toContain("playerBodySideFromLook(");
    expect(viewSrc).toContain("PLAYER_BODY_SIDE_SPAWN");
    expect(viewSrc).toMatch(
      /playerBodySideAfterRestart\([\s\S]{0,200}playerBodySideFromLook\(/,
    );
    expect(viewSrc).toContain("playerBodySideAfterRestart()");
    expect(viewSrc).toContain("side: playerBodySideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerBodyMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const playerBodyMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/playerBodyMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerBodySideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerBodySideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerBodySideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerBodySideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerBodySideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerBodySideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerBodySideAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerBodySideAfterRestart(");
    expect(gameSrc).not.toContain("playerBodySideFromLook(");
    expect(saveSrc).not.toContain("playerBodySideAfterRestart");
    expect(saveSrc).not.toContain("playerBodySideFromLook");
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
