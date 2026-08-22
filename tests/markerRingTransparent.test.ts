import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_RING_TRANSPARENT,
  MARKER_RING_TRANSPARENT_SPAWN,
  markerRingTransparentAfterRestart,
  markerRingTransparentFromLook,
} from "../src/render/markers";

describe("markerRingTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = markerRingTransparentAfterRestart();
    expect(bootTransparent).toBe(
      markerRingTransparentFromLook(MARKER_RING_TRANSPARENT),
    );
    expect(bootTransparent).toBe(MARKER_RING_TRANSPARENT);
    expect(bootTransparent).toBe(MARKER_RING_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(markerRingTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(markerRingTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(markerRingTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(markerRingTransparentFromLook(MARKER_RING_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; attach no escribe)", () => {
    const bootTransparent = markerRingTransparentAfterRestart();
    const liveTransparent = markerRingTransparentFromLook(
      MARKER_RING_TRANSPARENT,
    );
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(markerRingTransparentAfterRestart());
    expect(liveTransparent).toBe(MARKER_RING_TRANSPARENT_SPAWN);

    expect(markerRingTransparentFromLook(MARKER_RING_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(markerRingTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("marker-ring mesh transparent recreate lock (R / softReset)", () => {
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
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(ringSrc).toContain("markerRingTransparentAfterRestart(");
    expect(ringSrc).toContain("markerRingTransparentFromLook(");
    expect(ringSrc).toContain("MARKER_RING_TRANSPARENT_SPAWN");
    expect(ringSrc).toMatch(
      /markerRingTransparentAfterRestart\([\s\S]{0,200}markerRingTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("markerRingTransparentAfterRestart(");
    expect(viewSrc).toContain("markerRingTransparentAfterRestart()");
    expect(viewSrc).not.toContain("markerRingTransparentFromLook(");
    expect(viewSrc).toContain("transparent: markerRingTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const ringMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/ringMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerRingTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerRingTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerRingTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerRingTransparentAfterRestart(");
    expect(gameSrc).not.toContain("markerRingTransparentFromLook(");
    expect(saveSrc).not.toContain("markerRingTransparentAfterRestart");
    expect(saveSrc).not.toContain("markerRingTransparentFromLook");
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
