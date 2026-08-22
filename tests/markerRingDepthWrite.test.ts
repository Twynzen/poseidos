import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_RING_DEPTH_WRITE,
  MARKER_RING_DEPTH_WRITE_SPAWN,
  markerRingDepthWriteAfterRestart,
  markerRingDepthWriteFromLook,
} from "../src/render/markers";

describe("markerRingDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = markerRingDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      markerRingDepthWriteFromLook(MARKER_RING_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(MARKER_RING_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(MARKER_RING_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(markerRingDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(markerRingDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(markerRingDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(markerRingDepthWriteFromLook(MARKER_RING_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; attach no escribe)", () => {
    const bootDepthWrite = markerRingDepthWriteAfterRestart();
    const liveDepthWrite = markerRingDepthWriteFromLook(
      MARKER_RING_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(markerRingDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(MARKER_RING_DEPTH_WRITE_SPAWN);

    expect(markerRingDepthWriteFromLook(MARKER_RING_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(markerRingDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("marker-ring mesh depthWrite recreate lock (R / softReset)", () => {
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
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(ringSrc).toContain("markerRingDepthWriteAfterRestart(");
    expect(ringSrc).toContain("markerRingDepthWriteFromLook(");
    expect(ringSrc).toContain("MARKER_RING_DEPTH_WRITE_SPAWN");
    expect(ringSrc).toMatch(
      /markerRingDepthWriteAfterRestart\([\s\S]{0,200}markerRingDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("markerRingDepthWriteAfterRestart(");
    expect(viewSrc).toContain("markerRingDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("markerRingDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: markerRingDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const ringMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/ringMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerRingDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerRingDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerRingDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerRingDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("markerRingDepthWriteFromLook(");
    expect(saveSrc).not.toContain("markerRingDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("markerRingDepthWriteFromLook");
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
