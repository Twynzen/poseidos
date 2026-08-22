import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_ICON_SIDE,
  MARKER_ICON_SIDE_SPAWN,
  markerIconSideAfterRestart,
  markerIconSideFromLook,
} from "../src/render/markers";

describe("markerIconSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.DoubleSide / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = markerIconSideAfterRestart();
    expect(bootSide).toBe(markerIconSideFromLook(MARKER_ICON_SIDE));
    expect(bootSide).toBe(MARKER_ICON_SIDE);
    expect(bootSide).toBe(MARKER_ICON_SIDE_SPAWN);
    expect(bootSide).toBe(2);
    expect(markerIconSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 0;
    expect(markerIconSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(markerIconSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerIconSideFromLook(MARKER_ICON_SIDE)).toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach no escribe)", () => {
    const bootSide = markerIconSideAfterRestart();
    const liveSide = markerIconSideFromLook(MARKER_ICON_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(markerIconSideAfterRestart());
    expect(liveSide).toBe(MARKER_ICON_SIDE_SPAWN);

    expect(markerIconSideFromLook(MARKER_ICON_SIDE)).toBe(bootSide);
    expect(markerIconSideFromLook(0)).not.toBe(bootSide);
  });
});

describe("marker-icon mesh side recreate lock (R / softReset)", () => {
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
    const iconSrc = readFileSync(
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(iconSrc).toContain("markerIconSideAfterRestart(");
    expect(iconSrc).toContain("markerIconSideFromLook(");
    expect(iconSrc).toContain("MARKER_ICON_SIDE_SPAWN");
    expect(iconSrc).toMatch(
      /markerIconSideAfterRestart\([\s\S]{0,200}markerIconSideFromLook\(/,
    );
    expect(viewSrc).toContain("markerIconSideAfterRestart(");
    expect(viewSrc).toContain("markerIconSideAfterRestart()");
    expect(viewSrc).not.toContain("markerIconSideFromLook(");
    expect(viewSrc).toContain("side: markerIconSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const iconMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,720}side:\s*THREE\.DoubleSide/,
    );
    expect(viewSrc).not.toMatch(/iconMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerIconSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerIconSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerIconSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerIconSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerIconSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerIconSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerIconSideAfterRestart(");
    expect(gameSrc).not.toContain("markerIconSideFromLook(");
    expect(saveSrc).not.toContain("markerIconSideAfterRestart");
    expect(saveSrc).not.toContain("markerIconSideFromLook");
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
