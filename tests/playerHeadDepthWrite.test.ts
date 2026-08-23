import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_HEAD_DEPTH_WRITE,
  PLAYER_HEAD_DEPTH_WRITE_SPAWN,
  playerHeadDepthWriteAfterRestart,
  playerHeadDepthWriteFromLook,
} from "../src/render/worldView";

describe("playerHeadDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = playerHeadDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      playerHeadDepthWriteFromLook(PLAYER_HEAD_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(PLAYER_HEAD_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(PLAYER_HEAD_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(playerHeadDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(playerHeadDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(playerHeadDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
      bootDepthWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(playerHeadDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(playerHeadDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = playerHeadDepthWriteAfterRestart();
    const liveDepthWrite = playerHeadDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(playerHeadDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(PLAYER_HEAD_DEPTH_WRITE_SPAWN);

    expect(playerHeadDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(playerHeadDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("player-head mesh depthWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthWrite fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("playerHeadDepthWriteAfterRestart(");
    expect(viewSrc).toContain("playerHeadDepthWriteFromLook(");
    expect(viewSrc).toContain("PLAYER_HEAD_DEPTH_WRITE_SPAWN");
    expect(viewSrc).toMatch(
      /playerHeadDepthWriteAfterRestart\([\s\S]{0,200}playerHeadDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("playerHeadDepthWriteAfterRestart()");
    expect(viewSrc).toContain("depthWrite: playerHeadDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const playerHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/playerHeadMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}playerHeadDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncPlayer\([\s\S]{0,240}playerHeadDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}playerHeadDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerHeadDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerHeadDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerHeadDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerHeadDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerHeadDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("playerHeadDepthWriteFromLook(");
    expect(saveSrc).not.toContain("playerHeadDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("playerHeadDepthWriteFromLook");
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
