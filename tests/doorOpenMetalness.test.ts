import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DOOR_OPEN_METALNESS,
  DOOR_OPEN_METALNESS_SPAWN,
  doorOpenMetalnessAfterRestart,
  doorOpenMetalnessFromLook,
} from "../src/render/worldView";

describe("doorOpenMetalnessAfterRestart (R / softReset)", () => {
  test("metalness fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMetalness = doorOpenMetalnessAfterRestart();
    expect(bootMetalness).toBe(doorOpenMetalnessFromLook(DOOR_OPEN_METALNESS));
    expect(bootMetalness).toBe(DOOR_OPEN_METALNESS);
    expect(bootMetalness).toBe(DOOR_OPEN_METALNESS_SPAWN);
    expect(bootMetalness).toBe(0);
    expect(doorOpenMetalnessAfterRestart()).toBe(bootMetalness);

    const leftoverMetalness = 0.99;
    expect(doorOpenMetalnessFromLook(leftoverMetalness)).toBe(leftoverMetalness);
    expect(doorOpenMetalnessFromLook(leftoverMetalness)).not.toBe(bootMetalness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(doorOpenMetalnessFromLook(0)).toBe(bootMetalness);
    expect(doorOpenMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });

  test("vivo on no cambia metalness (ctor constant; attach/tick no escriben)", () => {
    const bootMetalness = doorOpenMetalnessAfterRestart();
    const liveMetalness = doorOpenMetalnessFromLook(0);
    expect(liveMetalness).toBe(bootMetalness);
    expect(liveMetalness).toBe(doorOpenMetalnessAfterRestart());
    expect(liveMetalness).toBe(DOOR_OPEN_METALNESS_SPAWN);

    expect(doorOpenMetalnessFromLook(0)).toBe(bootMetalness);
    expect(doorOpenMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });
});

describe("door-open mesh metalness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("doorOpenMetalnessAfterRestart(");
    expect(viewSrc).toContain("doorOpenMetalnessFromLook(");
    expect(viewSrc).toContain("DOOR_OPEN_METALNESS_SPAWN");
    expect(viewSrc).toMatch(
      /doorOpenMetalnessAfterRestart\([\s\S]{0,200}doorOpenMetalnessFromLook\(/,
    );
    expect(viewSrc).toContain("doorOpenMetalnessAfterRestart()");
    expect(viewSrc).toContain("metalness: doorOpenMetalnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const doorOpenMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}metalness:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(/doorOpenMat\.metalness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}doorOpenMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}doorOpenMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}doorOpenMetalnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}doorOpenMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}doorOpenMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}doorOpenMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}doorOpenMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("doorOpenMetalnessAfterRestart(");
    expect(gameSrc).not.toContain("doorOpenMetalnessFromLook(");
    expect(saveSrc).not.toContain("doorOpenMetalnessAfterRestart");
    expect(saveSrc).not.toContain("doorOpenMetalnessFromLook");
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
