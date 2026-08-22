import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_COLOR,
  POSSESSED_COLOR_SPAWN,
  POSSESSED_MESH_COLOR,
  possessedColorAfterRestart,
  possessedColorFromLook,
} from "../src/render/worldView";

describe("possessedColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle POSSESSED_COLOR 0x68347b); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = possessedColorAfterRestart();
    expect(bootColor).toBe(possessedColorFromLook(POSSESSED_MESH_COLOR));
    expect(bootColor).toBe(POSSESSED_MESH_COLOR);
    expect(bootColor).toBe(POSSESSED_COLOR_SPAWN);
    expect(bootColor).toBe(POSSESSED_COLOR);
    expect(bootColor).toBe(0x68347b);
    expect((bootColor >> 16) & 0xff).toBe(0x68);
    expect((bootColor >> 8) & 0xff).toBe(0x34);
    expect(bootColor & 0xff).toBe(0x7b);
    expect(possessedColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xff0000;
    expect(possessedColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(possessedColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(possessedColorFromLook(POSSESSED_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; attach/tick no escriben)", () => {
    const bootColor = possessedColorAfterRestart();
    const liveColor = possessedColorFromLook(POSSESSED_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(possessedColorAfterRestart());
    expect(liveColor).toBe(POSSESSED_COLOR_SPAWN);

    expect(possessedColorFromLook(POSSESSED_COLOR)).toBe(bootColor);
    expect(possessedColorFromLook(0xff0000)).not.toBe(bootColor);
  });
});

describe("possessed mesh color recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedColorAfterRestart(");
    expect(viewSrc).toContain("possessedColorFromLook(");
    expect(viewSrc).toContain("POSSESSED_COLOR_SPAWN");
    expect(viewSrc).toMatch(
      /possessedColorAfterRestart\([\s\S]{0,200}possessedColorFromLook\(/,
    );
    expect(viewSrc).toContain("possessedColorAfterRestart()");
    expect(viewSrc).toContain("color: possessedColorAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,240}color:\s*POSSESSED_COLOR/,
    );
    expect(viewSrc).not.toMatch(/possessedMat\.color\s*=/);
    expect(viewSrc).not.toMatch(/possessedMat\.color\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedColorAfterRestart(");
    expect(gameSrc).not.toContain("possessedColorFromLook(");
    expect(saveSrc).not.toContain("possessedColorAfterRestart");
    expect(saveSrc).not.toContain("possessedColorFromLook");
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
