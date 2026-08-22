import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BARRICADE_METALNESS,
  BARRICADE_METALNESS_SPAWN,
  barricadeMetalnessAfterRestart,
  barricadeMetalnessFromLook,
} from "../src/render/worldView";

describe("barricadeMetalnessAfterRestart (R / softReset)", () => {
  test("metalness fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMetalness = barricadeMetalnessAfterRestart();
    expect(bootMetalness).toBe(barricadeMetalnessFromLook(BARRICADE_METALNESS));
    expect(bootMetalness).toBe(BARRICADE_METALNESS);
    expect(bootMetalness).toBe(BARRICADE_METALNESS_SPAWN);
    expect(bootMetalness).toBe(0);
    expect(barricadeMetalnessAfterRestart()).toBe(bootMetalness);

    const leftoverMetalness = 0.99;
    expect(barricadeMetalnessFromLook(leftoverMetalness)).toBe(leftoverMetalness);
    expect(barricadeMetalnessFromLook(leftoverMetalness)).not.toBe(bootMetalness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(barricadeMetalnessFromLook(0)).toBe(bootMetalness);
    expect(barricadeMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });

  test("vivo on no cambia metalness (ctor constant; attach/tick no escriben)", () => {
    const bootMetalness = barricadeMetalnessAfterRestart();
    const liveMetalness = barricadeMetalnessFromLook(0);
    expect(liveMetalness).toBe(bootMetalness);
    expect(liveMetalness).toBe(barricadeMetalnessAfterRestart());
    expect(liveMetalness).toBe(BARRICADE_METALNESS_SPAWN);

    expect(barricadeMetalnessFromLook(0)).toBe(bootMetalness);
    expect(barricadeMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });
});

describe("barricade mesh metalness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("barricadeMetalnessAfterRestart(");
    expect(viewSrc).toContain("barricadeMetalnessFromLook(");
    expect(viewSrc).toContain("BARRICADE_METALNESS_SPAWN");
    expect(viewSrc).toMatch(
      /barricadeMetalnessAfterRestart\([\s\S]{0,200}barricadeMetalnessFromLook\(/,
    );
    expect(viewSrc).toContain("barricadeMetalnessAfterRestart()");
    expect(viewSrc).toContain("metalness: barricadeMetalnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const barricadeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}metalness:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(/barricadeMat\.metalness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}barricadeMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}barricadeMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}barricadeMetalnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}barricadeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}barricadeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}barricadeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}barricadeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("barricadeMetalnessAfterRestart(");
    expect(gameSrc).not.toContain("barricadeMetalnessFromLook(");
    expect(saveSrc).not.toContain("barricadeMetalnessAfterRestart");
    expect(saveSrc).not.toContain("barricadeMetalnessFromLook");
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
