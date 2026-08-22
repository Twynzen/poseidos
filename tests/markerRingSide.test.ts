import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_RING_SIDE,
  MARKER_RING_SIDE_SPAWN,
  markerRingSideAfterRestart,
  markerRingSideFromLook,
} from "../src/render/markers";

describe("markerRingSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.DoubleSide / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = markerRingSideAfterRestart();
    expect(bootSide).toBe(markerRingSideFromLook(MARKER_RING_SIDE));
    expect(bootSide).toBe(MARKER_RING_SIDE);
    expect(bootSide).toBe(MARKER_RING_SIDE_SPAWN);
    expect(bootSide).toBe(2);
    expect(markerRingSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 0;
    expect(markerRingSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(markerRingSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerRingSideFromLook(MARKER_RING_SIDE)).toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach no escribe)", () => {
    const bootSide = markerRingSideAfterRestart();
    const liveSide = markerRingSideFromLook(MARKER_RING_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(markerRingSideAfterRestart());
    expect(liveSide).toBe(MARKER_RING_SIDE_SPAWN);

    expect(markerRingSideFromLook(MARKER_RING_SIDE)).toBe(bootSide);
    expect(markerRingSideFromLook(0)).not.toBe(bootSide);
  });
});

describe("marker-ring mesh side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(ringSrc).toContain("markerRingSideAfterRestart(");
    expect(ringSrc).toContain("markerRingSideFromLook(");
    expect(ringSrc).toContain("MARKER_RING_SIDE_SPAWN");
    expect(ringSrc).toMatch(
      /markerRingSideAfterRestart\([\s\S]{0,200}markerRingSideFromLook\(/,
    );
    expect(viewSrc).toContain("markerRingSideAfterRestart(");
    expect(viewSrc).toContain("markerRingSideAfterRestart()");
    expect(viewSrc).not.toContain("markerRingSideFromLook(");
    expect(viewSrc).toContain("side: markerRingSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const ringMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,720}side:\s*THREE\.DoubleSide/,
    );
    expect(viewSrc).not.toMatch(/ringMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerRingSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function attachRoleMarkers\([\s\S]{0,240}markerRingSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerRingSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerRingSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerRingSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerRingSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerRingSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerRingSideAfterRestart(");
    expect(gameSrc).not.toContain("markerRingSideFromLook(");
    expect(saveSrc).not.toContain("markerRingSideAfterRestart");
    expect(saveSrc).not.toContain("markerRingSideFromLook");
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
