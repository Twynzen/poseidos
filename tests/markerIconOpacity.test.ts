import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_ICON_OPACITY,
  MARKER_ICON_OPACITY_SPAWN,
  markerIconOpacityAfterRestart,
  markerIconOpacityFromLook,
} from "../src/render/markers";

describe("markerIconOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 0.92); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = markerIconOpacityAfterRestart();
    expect(bootOpacity).toBe(markerIconOpacityFromLook(MARKER_ICON_OPACITY));
    expect(bootOpacity).toBe(MARKER_ICON_OPACITY);
    expect(bootOpacity).toBe(MARKER_ICON_OPACITY_SPAWN);
    expect(bootOpacity).toBe(0.92);
    expect(markerIconOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.1;
    expect(markerIconOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(markerIconOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerIconOpacityFromLook(MARKER_ICON_OPACITY)).toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; attach no escribe)", () => {
    const bootOpacity = markerIconOpacityAfterRestart();
    const liveOpacity = markerIconOpacityFromLook(MARKER_ICON_OPACITY);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(markerIconOpacityAfterRestart());
    expect(liveOpacity).toBe(MARKER_ICON_OPACITY_SPAWN);

    expect(markerIconOpacityFromLook(MARKER_ICON_OPACITY)).toBe(bootOpacity);
    expect(markerIconOpacityFromLook(0.1)).not.toBe(bootOpacity);
  });
});

describe("marker-icon mesh opacity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace opacity fresco; F9 no helper", () => {
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
    expect(iconSrc).toContain("markerIconOpacityAfterRestart(");
    expect(iconSrc).toContain("markerIconOpacityFromLook(");
    expect(iconSrc).toContain("MARKER_ICON_OPACITY_SPAWN");
    expect(iconSrc).toMatch(
      /markerIconOpacityAfterRestart\([\s\S]{0,200}markerIconOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("markerIconOpacityAfterRestart(");
    expect(viewSrc).toContain("markerIconOpacityAfterRestart()");
    expect(viewSrc).not.toContain("markerIconOpacityFromLook(");
    expect(viewSrc).toContain("opacity: markerIconOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const iconMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}opacity:\s*0\.92/,
    );
    expect(viewSrc).not.toMatch(/iconMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerIconOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerIconOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerIconOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerIconOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerIconOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerIconOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerIconOpacityAfterRestart(");
    expect(gameSrc).not.toContain("markerIconOpacityFromLook(");
    expect(saveSrc).not.toContain("markerIconOpacityAfterRestart");
    expect(saveSrc).not.toContain("markerIconOpacityFromLook");
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
