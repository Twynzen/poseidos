import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  NOISE_RING_DEPTH_WRITE,
  NOISE_RING_DEPTH_WRITE_SPAWN,
  noiseRingDepthWriteAfterRestart,
  noiseRingDepthWriteFromLook,
} from "../src/render/noiseRings";

describe("noiseRingDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = noiseRingDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(noiseRingDepthWriteFromLook(NOISE_RING_DEPTH_WRITE));
    expect(bootDepthWrite).toBe(NOISE_RING_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(NOISE_RING_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(noiseRingDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(noiseRingDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(noiseRingDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(noiseRingDepthWriteFromLook(NOISE_RING_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; spawn/tick no escriben)", () => {
    const bootDepthWrite = noiseRingDepthWriteAfterRestart();
    const liveDepthWrite = noiseRingDepthWriteFromLook(NOISE_RING_DEPTH_WRITE);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(noiseRingDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(NOISE_RING_DEPTH_WRITE_SPAWN);

    expect(noiseRingDepthWriteFromLook(NOISE_RING_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(noiseRingDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("noise-ring mesh depthWrite recreate lock (R / softReset)", () => {
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
    const ringSrc = readFileSync(
      resolve(process.cwd(), "src/render/noiseRings.ts"),
      "utf8",
    );
    expect(ringSrc).toContain("noiseRingDepthWriteAfterRestart(");
    expect(ringSrc).toContain("noiseRingDepthWriteFromLook(");
    expect(ringSrc).toContain("NOISE_RING_DEPTH_WRITE_SPAWN");
    expect(ringSrc).toMatch(
      /noiseRingDepthWriteAfterRestart\([\s\S]{0,200}noiseRingDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("noiseRingDepthWriteAfterRestart(");
    expect(viewSrc).toContain("noiseRingDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("noiseRingDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: noiseRingDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/slot\.mat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(/p\.mat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}noiseRingDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideNoiseRings\(\): void \{[\s\S]{0,200}noiseRingDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /hideNoiseRings: clearNoiseRings[\s\S]{0,80}noiseRingDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearNoiseRings\(\): void \{[\s\S]{0,200}noiseRingDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function spawnNoiseRing\([\s\S]{0,400}noiseRingDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickNoiseRings\([\s\S]{0,400}noiseRingDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}noiseRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}noiseRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}noiseRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}noiseRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("noiseRingDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("noiseRingDepthWriteFromLook(");
    expect(saveSrc).not.toContain("noiseRingDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("noiseRingDepthWriteFromLook");
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
