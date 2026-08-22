import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_ICON_COLOR,
  MARKER_ICON_COLOR_SPAWN,
  markerIconColorAfterRestart,
  markerIconColorFromLook,
} from "../src/render/markers";

describe("markerIconColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle 0xffffff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = markerIconColorAfterRestart();
    expect(bootColor).toBe(markerIconColorFromLook(MARKER_ICON_COLOR));
    expect(bootColor).toBe(MARKER_ICON_COLOR);
    expect(bootColor).toBe(MARKER_ICON_COLOR_SPAWN);
    expect(bootColor).toBe(0xffffff);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xff);
    expect(markerIconColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xff0000;
    expect(markerIconColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(markerIconColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerIconColorFromLook(MARKER_ICON_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; attach no escribe)", () => {
    const bootColor = markerIconColorAfterRestart();
    const liveColor = markerIconColorFromLook(MARKER_ICON_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(markerIconColorAfterRestart());
    expect(liveColor).toBe(MARKER_ICON_COLOR_SPAWN);

    expect(markerIconColorFromLook(MARKER_ICON_COLOR)).toBe(bootColor);
    expect(markerIconColorFromLook(0xff0000)).not.toBe(bootColor);
  });
});

describe("marker-icon mesh color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(iconSrc).toContain("markerIconColorAfterRestart(");
    expect(iconSrc).toContain("markerIconColorFromLook(");
    expect(iconSrc).toContain("MARKER_ICON_COLOR_SPAWN");
    expect(iconSrc).toMatch(
      /markerIconColorAfterRestart\([\s\S]{0,200}markerIconColorFromLook\(/,
    );
    expect(viewSrc).toContain("markerIconColorAfterRestart(");
    expect(viewSrc).toContain("markerIconColorAfterRestart()");
    expect(viewSrc).not.toContain("markerIconColorFromLook(");
    expect(viewSrc).toContain("color: markerIconColorAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const iconMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,240}color:\s*0xffffff/,
    );
    expect(viewSrc).not.toMatch(/iconMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerIconColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerIconColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerIconColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerIconColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerIconColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerIconColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerIconColorAfterRestart(");
    expect(gameSrc).not.toContain("markerIconColorFromLook(");
    expect(saveSrc).not.toContain("markerIconColorAfterRestart");
    expect(saveSrc).not.toContain("markerIconColorFromLook");
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
