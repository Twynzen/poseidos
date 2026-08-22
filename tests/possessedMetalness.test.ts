import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  POSSESSED_METALNESS,
  POSSESSED_METALNESS_SPAWN,
  possessedMetalnessAfterRestart,
  possessedMetalnessFromLook,
} from "../src/render/worldView";

describe("possessedMetalnessAfterRestart (R / softReset)", () => {
  test("metalness fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMetalness = possessedMetalnessAfterRestart();
    expect(bootMetalness).toBe(possessedMetalnessFromLook(POSSESSED_METALNESS));
    expect(bootMetalness).toBe(POSSESSED_METALNESS);
    expect(bootMetalness).toBe(POSSESSED_METALNESS_SPAWN);
    expect(bootMetalness).toBe(0);
    expect(possessedMetalnessAfterRestart()).toBe(bootMetalness);

    const leftoverMetalness = 0.99;
    expect(possessedMetalnessFromLook(leftoverMetalness)).toBe(leftoverMetalness);
    expect(possessedMetalnessFromLook(leftoverMetalness)).not.toBe(bootMetalness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(possessedMetalnessFromLook(0)).toBe(bootMetalness);
    expect(possessedMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });

  test("vivo on no cambia metalness (ctor constant; attach/tick no escriben)", () => {
    const bootMetalness = possessedMetalnessAfterRestart();
    const liveMetalness = possessedMetalnessFromLook(0);
    expect(liveMetalness).toBe(bootMetalness);
    expect(liveMetalness).toBe(possessedMetalnessAfterRestart());
    expect(liveMetalness).toBe(POSSESSED_METALNESS_SPAWN);

    expect(possessedMetalnessFromLook(0)).toBe(bootMetalness);
    expect(possessedMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });
});

describe("possessed mesh metalness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("possessedMetalnessAfterRestart(");
    expect(viewSrc).toContain("possessedMetalnessFromLook(");
    expect(viewSrc).toContain("POSSESSED_METALNESS_SPAWN");
    expect(viewSrc).toMatch(
      /possessedMetalnessAfterRestart\([\s\S]{0,200}possessedMetalnessFromLook\(/,
    );
    expect(viewSrc).toContain("possessedMetalnessAfterRestart()");
    expect(viewSrc).toContain("metalness: possessedMetalnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const possessedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}metalness:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(/possessedMat\.metalness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}possessedMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}possessedMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}possessedMetalnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}possessedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}possessedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}possessedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}possessedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("possessedMetalnessAfterRestart(");
    expect(gameSrc).not.toContain("possessedMetalnessFromLook(");
    expect(saveSrc).not.toContain("possessedMetalnessAfterRestart");
    expect(saveSrc).not.toContain("possessedMetalnessFromLook");
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
