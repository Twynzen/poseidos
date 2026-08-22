import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DOOR_CLOSED_METALNESS,
  DOOR_CLOSED_METALNESS_SPAWN,
  doorClosedMetalnessAfterRestart,
  doorClosedMetalnessFromLook,
} from "../src/render/worldView";

describe("doorClosedMetalnessAfterRestart (R / softReset)", () => {
  test("metalness fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMetalness = doorClosedMetalnessAfterRestart();
    expect(bootMetalness).toBe(doorClosedMetalnessFromLook(DOOR_CLOSED_METALNESS));
    expect(bootMetalness).toBe(DOOR_CLOSED_METALNESS);
    expect(bootMetalness).toBe(DOOR_CLOSED_METALNESS_SPAWN);
    expect(bootMetalness).toBe(0);
    expect(doorClosedMetalnessAfterRestart()).toBe(bootMetalness);

    const leftoverMetalness = 0.99;
    expect(doorClosedMetalnessFromLook(leftoverMetalness)).toBe(leftoverMetalness);
    expect(doorClosedMetalnessFromLook(leftoverMetalness)).not.toBe(bootMetalness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(doorClosedMetalnessFromLook(0)).toBe(bootMetalness);
    expect(doorClosedMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });

  test("vivo on no cambia metalness (ctor constant; attach/tick no escriben)", () => {
    const bootMetalness = doorClosedMetalnessAfterRestart();
    const liveMetalness = doorClosedMetalnessFromLook(0);
    expect(liveMetalness).toBe(bootMetalness);
    expect(liveMetalness).toBe(doorClosedMetalnessAfterRestart());
    expect(liveMetalness).toBe(DOOR_CLOSED_METALNESS_SPAWN);

    expect(doorClosedMetalnessFromLook(0)).toBe(bootMetalness);
    expect(doorClosedMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });
});

describe("door-closed mesh metalness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("doorClosedMetalnessAfterRestart(");
    expect(viewSrc).toContain("doorClosedMetalnessFromLook(");
    expect(viewSrc).toContain("DOOR_CLOSED_METALNESS_SPAWN");
    expect(viewSrc).toMatch(
      /doorClosedMetalnessAfterRestart\([\s\S]{0,200}doorClosedMetalnessFromLook\(/,
    );
    expect(viewSrc).toContain("doorClosedMetalnessAfterRestart()");
    expect(viewSrc).toContain("metalness: doorClosedMetalnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const doorClosedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,520}metalness:\s*0(?:\s*,|\s*\})/,
    );
    expect(viewSrc).not.toMatch(/doorClosedMat\.metalness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}doorClosedMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}doorClosedMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}doorClosedMetalnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}doorClosedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}doorClosedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}doorClosedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}doorClosedMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("doorClosedMetalnessAfterRestart(");
    expect(gameSrc).not.toContain("doorClosedMetalnessFromLook(");
    expect(saveSrc).not.toContain("doorClosedMetalnessAfterRestart");
    expect(saveSrc).not.toContain("doorClosedMetalnessFromLook");
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
