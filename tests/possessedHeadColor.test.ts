import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_HEAD_COLOR,
  POSSESSED_HEAD_COLOR_SPAWN,
  POSSESSED_HEAD_MESH_COLOR,
  possessedHeadColorAfterRestart,
  possessedHeadColorFromLook,
} from "../src/render/worldView";

describe("possessedHeadColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle POSSESSED_HEAD_COLOR 0x8c469f); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = possessedHeadColorAfterRestart();
    expect(bootColor).toBe(possessedHeadColorFromLook(POSSESSED_HEAD_MESH_COLOR));
    expect(bootColor).toBe(POSSESSED_HEAD_MESH_COLOR);
    expect(bootColor).toBe(POSSESSED_HEAD_COLOR_SPAWN);
    expect(bootColor).toBe(POSSESSED_HEAD_COLOR);
    expect(bootColor).toBe(0x8c469f);
    expect((bootColor >> 16) & 0xff).toBe(0x8c);
    expect((bootColor >> 8) & 0xff).toBe(0x46);
    expect(bootColor & 0xff).toBe(0x9f);
    expect(possessedHeadColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xff0000;
    expect(possessedHeadColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(possessedHeadColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(possessedHeadColorFromLook(POSSESSED_HEAD_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; attach/tick no escriben)", () => {
    const bootColor = possessedHeadColorAfterRestart();
    const liveColor = possessedHeadColorFromLook(POSSESSED_HEAD_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(possessedHeadColorAfterRestart());
    expect(liveColor).toBe(POSSESSED_HEAD_COLOR_SPAWN);

    expect(possessedHeadColorFromLook(POSSESSED_HEAD_COLOR)).toBe(bootColor);
    expect(possessedHeadColorFromLook(0xff0000)).not.toBe(bootColor);
  });
});

describe("possessed head mesh color recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedHeadColorAfterRestart(");
    expect(viewSrc).toContain("possessedHeadColorFromLook(");
    expect(viewSrc).toContain("POSSESSED_HEAD_COLOR_SPAWN");
    expect(viewSrc).toMatch(
      /possessedHeadColorAfterRestart\([\s\S]{0,200}possessedHeadColorFromLook\(/,
    );
    expect(viewSrc).toContain("possessedHeadColorAfterRestart()");
    expect(viewSrc).toContain("color: possessedHeadColorAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,240}color:\s*POSSESSED_HEAD_COLOR/,
    );
    expect(viewSrc).not.toMatch(/possessedHeadMat\.color\s*=/);
    expect(viewSrc).not.toMatch(/possessedHeadMat\.color\.setHex/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedHeadColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedHeadColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedHeadColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedHeadColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedHeadColorAfterRestart(");
    expect(gameSrc).not.toContain("possessedHeadColorFromLook(");
    expect(saveSrc).not.toContain("possessedHeadColorAfterRestart");
    expect(saveSrc).not.toContain("possessedHeadColorFromLook");
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
