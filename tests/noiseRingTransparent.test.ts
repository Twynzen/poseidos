import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  NOISE_RING_TRANSPARENT,
  NOISE_RING_TRANSPARENT_SPAWN,
  noiseRingTransparentAfterRestart,
  noiseRingTransparentFromLook,
} from "../src/render/noiseRings";

describe("noiseRingTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = noiseRingTransparentAfterRestart();
    expect(bootTransparent).toBe(noiseRingTransparentFromLook(NOISE_RING_TRANSPARENT));
    expect(bootTransparent).toBe(NOISE_RING_TRANSPARENT);
    expect(bootTransparent).toBe(NOISE_RING_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(noiseRingTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(noiseRingTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(noiseRingTransparentFromLook(leftoverTransparent)).not.toBe(
      bootTransparent,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(noiseRingTransparentFromLook(NOISE_RING_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = noiseRingTransparentAfterRestart();
    const liveTransparent = noiseRingTransparentFromLook(NOISE_RING_TRANSPARENT);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(noiseRingTransparentAfterRestart());
    expect(liveTransparent).toBe(NOISE_RING_TRANSPARENT_SPAWN);

    expect(noiseRingTransparentFromLook(NOISE_RING_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(noiseRingTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("noise-ring mesh transparent recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace transparent fresco; F9 no helper", () => {
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
    const ringSrc = readFileSync(
      resolve(process.cwd(), "src/render/noiseRings.ts"),
      "utf8",
    );
    expect(ringSrc).toContain("noiseRingTransparentAfterRestart(");
    expect(ringSrc).toContain("noiseRingTransparentFromLook(");
    expect(ringSrc).toContain("NOISE_RING_TRANSPARENT_SPAWN");
    expect(ringSrc).toMatch(
      /noiseRingTransparentAfterRestart\([\s\S]{0,200}noiseRingTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("noiseRingTransparentAfterRestart(");
    expect(viewSrc).toContain("noiseRingTransparentAfterRestart()");
    expect(viewSrc).not.toContain("noiseRingTransparentFromLook(");
    expect(viewSrc).toContain("transparent: noiseRingTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/slot\.mat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(/p\.mat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}noiseRingTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideNoiseRings\(\): void \{[\s\S]{0,200}noiseRingTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /hideNoiseRings: clearNoiseRings[\s\S]{0,80}noiseRingTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearNoiseRings\(\): void \{[\s\S]{0,200}noiseRingTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function spawnNoiseRing\([\s\S]{0,400}noiseRingTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickNoiseRings\([\s\S]{0,400}noiseRingTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}noiseRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}noiseRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}noiseRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}noiseRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("noiseRingTransparentAfterRestart(");
    expect(gameSrc).not.toContain("noiseRingTransparentFromLook(");
    expect(saveSrc).not.toContain("noiseRingTransparentAfterRestart");
    expect(saveSrc).not.toContain("noiseRingTransparentFromLook");
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
