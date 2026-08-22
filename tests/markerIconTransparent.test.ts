import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_ICON_TRANSPARENT,
  MARKER_ICON_TRANSPARENT_SPAWN,
  markerIconTransparentAfterRestart,
  markerIconTransparentFromLook,
} from "../src/render/markers";

describe("markerIconTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = markerIconTransparentAfterRestart();
    expect(bootTransparent).toBe(
      markerIconTransparentFromLook(MARKER_ICON_TRANSPARENT),
    );
    expect(bootTransparent).toBe(MARKER_ICON_TRANSPARENT);
    expect(bootTransparent).toBe(MARKER_ICON_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(markerIconTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(markerIconTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(markerIconTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(markerIconTransparentFromLook(MARKER_ICON_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; attach no escribe)", () => {
    const bootTransparent = markerIconTransparentAfterRestart();
    const liveTransparent = markerIconTransparentFromLook(
      MARKER_ICON_TRANSPARENT,
    );
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(markerIconTransparentAfterRestart());
    expect(liveTransparent).toBe(MARKER_ICON_TRANSPARENT_SPAWN);

    expect(markerIconTransparentFromLook(MARKER_ICON_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(markerIconTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("marker-icon mesh transparent recreate lock (R / softReset)", () => {
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
    const iconSrc = readFileSync(
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(iconSrc).toContain("markerIconTransparentAfterRestart(");
    expect(iconSrc).toContain("markerIconTransparentFromLook(");
    expect(iconSrc).toContain("MARKER_ICON_TRANSPARENT_SPAWN");
    expect(iconSrc).toMatch(
      /markerIconTransparentAfterRestart\([\s\S]{0,200}markerIconTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("markerIconTransparentAfterRestart(");
    expect(viewSrc).toContain("markerIconTransparentAfterRestart()");
    expect(viewSrc).not.toContain("markerIconTransparentFromLook(");
    expect(viewSrc).toContain("transparent: markerIconTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const iconMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/iconMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerIconTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerIconTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerIconTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerIconTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerIconTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerIconTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerIconTransparentAfterRestart(");
    expect(gameSrc).not.toContain("markerIconTransparentFromLook(");
    expect(saveSrc).not.toContain("markerIconTransparentAfterRestart");
    expect(saveSrc).not.toContain("markerIconTransparentFromLook");
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
