import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_HEAD_METALNESS,
  POSSESSED_HEAD_METALNESS_SPAWN,
  possessedHeadMetalnessAfterRestart,
  possessedHeadMetalnessFromLook,
} from "../src/render/worldView";

describe("possessedHeadMetalnessAfterRestart (R / softReset)", () => {
  test("metalness fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMetalness = possessedHeadMetalnessAfterRestart();
    expect(bootMetalness).toBe(
      possessedHeadMetalnessFromLook(POSSESSED_HEAD_METALNESS),
    );
    expect(bootMetalness).toBe(POSSESSED_HEAD_METALNESS);
    expect(bootMetalness).toBe(POSSESSED_HEAD_METALNESS_SPAWN);
    expect(bootMetalness).toBe(0);
    expect(possessedHeadMetalnessAfterRestart()).toBe(bootMetalness);

    const leftoverMetalness = 0.99;
    expect(possessedHeadMetalnessFromLook(leftoverMetalness)).toBe(
      leftoverMetalness,
    );
    expect(possessedHeadMetalnessFromLook(leftoverMetalness)).not.toBe(
      bootMetalness,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(possessedHeadMetalnessFromLook(0)).toBe(bootMetalness);
    expect(possessedHeadMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });

  test("vivo on no cambia metalness (ctor constant; attach/tick no escriben)", () => {
    const bootMetalness = possessedHeadMetalnessAfterRestart();
    const liveMetalness = possessedHeadMetalnessFromLook(0);
    expect(liveMetalness).toBe(bootMetalness);
    expect(liveMetalness).toBe(possessedHeadMetalnessAfterRestart());
    expect(liveMetalness).toBe(POSSESSED_HEAD_METALNESS_SPAWN);

    expect(possessedHeadMetalnessFromLook(0)).toBe(bootMetalness);
    expect(possessedHeadMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });
});

describe("possessed head mesh metalness recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace metalness fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("possessedHeadMetalnessAfterRestart(");
    expect(viewSrc).toContain("possessedHeadMetalnessFromLook(");
    expect(viewSrc).toContain("POSSESSED_HEAD_METALNESS_SPAWN");
    expect(viewSrc).toMatch(
      /possessedHeadMetalnessAfterRestart\([\s\S]{0,200}possessedHeadMetalnessFromLook\(/,
    );
    expect(viewSrc).toContain("possessedHeadMetalnessAfterRestart()");
    expect(viewSrc).toContain("metalness: possessedHeadMetalnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedHeadMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}metalness:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(/possessedHeadMat\.metalness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedHeadMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedHeadMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedHeadMetalnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedHeadMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedHeadMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedHeadMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedHeadMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedHeadMetalnessAfterRestart(");
    expect(gameSrc).not.toContain("possessedHeadMetalnessFromLook(");
    expect(saveSrc).not.toContain("possessedHeadMetalnessAfterRestart");
    expect(saveSrc).not.toContain("possessedHeadMetalnessFromLook");
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
