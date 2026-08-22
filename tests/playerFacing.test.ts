import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  PLAYER_GLTF_YAW_OFFSET,
  PLAYER_POS_X_SPAWN,
  PLAYER_POS_Z_SPAWN,
  playerGltfYawFromMove,
  playerPosXAfterRestart,
  playerPosXFromLook,
  playerPosZAfterRestart,
  playerPosZFromLook,
} from "../src/render/playerFacing";

describe("PLAYER_GLTF_YAW_OFFSET", () => {
  test("π (Soldier walk mira −Z local; S/+Z no moonwalk)", () => {
    expect(PLAYER_GLTF_YAW_OFFSET).toBe(Math.PI);
  });
});

describe("playerGltfYawFromMove", () => {
  test("atan2 cardinales con offset default (π)", () => {
    expect(playerGltfYawFromMove(0, 1)).toBeCloseTo(Math.PI, 5);
    expect(playerGltfYawFromMove(1, 0)).toBeCloseTo(Math.PI / 2 + Math.PI, 5);
    expect(playerGltfYawFromMove(0, -1)).toBeCloseTo(Math.PI + Math.PI, 5);
    expect(playerGltfYawFromMove(-1, 0)).toBeCloseTo(-Math.PI / 2 + Math.PI, 5);
  });

  test("continuo diagonal (no snap cardinal)", () => {
    const yaw = playerGltfYawFromMove(1, -1);
    expect(yaw).not.toBeNull();
    expect(yaw!).toBeCloseTo(Math.atan2(1, -1) + Math.PI, 5);
    const wrapped = ((yaw! % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    expect(wrapped).not.toBeCloseTo(0, 5);
    expect(wrapped).not.toBeCloseTo(Math.PI / 2, 5);
    expect(wrapped).not.toBeCloseTo(Math.PI, 5);
  });

  test("offset explícito 0 (atan2 crudo, sin flip)", () => {
    expect(playerGltfYawFromMove(0, -1, 0)).toBeCloseTo(Math.PI, 5);
    expect(playerGltfYawFromMove(0, 1, 0)).toBeCloseTo(0, 5);
    expect(playerGltfYawFromMove(1, 0, 0)).toBeCloseTo(Math.PI / 2, 5);
  });

  test("null si ~0 move o no finito", () => {
    expect(playerGltfYawFromMove(0, 0)).toBeNull();
    expect(playerGltfYawFromMove(1e-12, 0)).toBeNull();
    expect(playerGltfYawFromMove(Number.NaN, 1)).toBeNull();
    expect(playerGltfYawFromMove(1, Number.POSITIVE_INFINITY)).toBeNull();
    expect(playerGltfYawFromMove(1, 0, Number.NaN)).toBeNull();
  });

  test("S (0,+1) con π: yaw π — walk clip alinea con sur", () => {
    expect(playerGltfYawFromMove(0, 1)).toBeCloseTo(Math.PI, 5);
  });
});

describe("playerPosAfterRestart (R / softReset)", () => {
  test("pos fresco (spawn 24.5, 15.5); leftover ctor origin 0,0 / far no filtra", () => {
    const barrio = createNeighborhood(48);
    const bootX = playerPosXAfterRestart();
    const bootZ = playerPosZAfterRestart();
    expect(bootX).toBe(playerPosXFromLook(24.5));
    expect(bootZ).toBe(playerPosZFromLook(15.5));
    expect(bootX).toBe(PLAYER_POS_X_SPAWN);
    expect(bootZ).toBe(PLAYER_POS_Z_SPAWN);
    expect(bootX).toBe(barrio.spawn.x);
    expect(bootZ).toBe(barrio.spawn.y);
    expect(playerPosXAfterRestart(24.5)).toBe(bootX);
    expect(playerPosZAfterRestart(15.5)).toBe(bootZ);
    expect(playerPosXAfterRestart(0)).toBe(playerPosXFromLook(0));
    expect(playerPosZAfterRestart(40)).toBe(playerPosZFromLook(40));

    const leftoverCtorX = 0;
    const leftoverCtorZ = 0;
    expect(leftoverCtorX).not.toBe(bootX);
    expect(leftoverCtorZ).not.toBe(bootZ);
    expect(playerPosXFromLook(0)).toBe(leftoverCtorX);
    expect(playerPosZFromLook(0)).toBe(leftoverCtorZ);
    expect(playerPosXFromLook(0)).not.toBe(bootX);
    expect(playerPosZFromLook(0)).not.toBe(bootZ);

    const leftoverFarX = playerPosXFromLook(40);
    const leftoverFarZ = playerPosZFromLook(30);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(leftoverFarX).not.toBe(bootX);
    expect(leftoverFarZ).not.toBe(bootZ);
    expect(leftoverFarX).not.toBe(playerPosXAfterRestart());
    expect(leftoverFarZ).not.toBe(playerPosZAfterRestart());

    expect(playerPosXFromLook(24.5)).toBe(bootX);
    expect(playerPosZFromLook(15.5)).toBe(bootZ);
  });

  test("vivo tick no usa el helper (pos avanza con player)", () => {
    const bootX = playerPosXAfterRestart();
    const bootZ = playerPosZAfterRestart();
    const liveX = playerPosXFromLook(40);
    const liveZ = playerPosZFromLook(30);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveX).not.toBe(playerPosXAfterRestart());
    expect(liveZ).not.toBe(playerPosZAfterRestart());
    expect(liveX).toBeGreaterThan(bootX);
    expect(liveZ).toBeGreaterThan(bootZ);

    expect(playerPosXFromLook(24.5)).toBe(bootX);
    expect(playerPosZFromLook(15.5)).toBe(bootZ);
    expect(playerPosXFromLook(0)).toBe(0);
    expect(playerPosZFromLook(0)).toBe(0);
  });
});

describe("player pos recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace player pos fresco; F9 no helper", () => {
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
    const facingSrc = readFileSync(
      resolve(process.cwd(), "src/render/playerFacing.ts"),
      "utf8",
    );
    expect(facingSrc).toContain("playerPosXAfterRestart(");
    expect(facingSrc).toContain("playerPosZAfterRestart(");
    expect(facingSrc).toContain("playerPosXFromLook(");
    expect(facingSrc).toContain("playerPosZFromLook(");
    expect(facingSrc).toContain("PLAYER_POS_X_SPAWN");
    expect(facingSrc).toContain("PLAYER_POS_Z_SPAWN");
    expect(facingSrc).toMatch(
      /playerPosXAfterRestart\([\s\S]{0,200}playerPosXFromLook\(/,
    );
    expect(facingSrc).toMatch(
      /playerPosZAfterRestart\([\s\S]{0,200}playerPosZFromLook\(/,
    );
    expect(viewSrc).toContain("playerPosXAfterRestart(");
    expect(viewSrc).toContain("playerPosZAfterRestart(");
    expect(viewSrc).toContain("playerPosXFromLook(");
    expect(viewSrc).toContain("playerPosZFromLook(");
    expect(viewSrc).toMatch(
      /playerMesh\.position\.set\(\s*playerPosXAfterRestart\(\),\s*0,\s*playerPosZAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /playerMesh\.position\.set\(\s*playerPosXFromLook\(x\),\s*0,\s*playerPosZFromLook\(y\)/,
    );
    expect(viewSrc).toMatch(
      /syncPlayer\(x, y\) \{[\s\S]{0,240}playerPosXFromLook\(x\)/,
    );
    expect(viewSrc).not.toMatch(/playerMesh\.position\.set\(\s*0,\s*0,\s*0\s*\)/);
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3700}this\.view\.syncPlayer\(\s*this\.player\.x,\s*this\.player\.y\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}playerPosXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}playerPosXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}playerPosXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}playerPosXAfterRestart/,
    );
    expect(gameSrc).not.toContain("playerPosXAfterRestart(");
    expect(gameSrc).not.toContain("playerPosZAfterRestart(");
    expect(gameSrc).not.toContain("playerPosXFromLook(");
    expect(gameSrc).not.toContain("playerPosZFromLook(");
    expect(saveSrc).not.toContain("playerPosXAfterRestart");
    expect(saveSrc).not.toContain("playerPosZAfterRestart");
    expect(saveSrc).not.toContain("playerPosXFromLook");
    expect(saveSrc).not.toContain("playerPosZFromLook");
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
