import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_ICON_DEPTH_WRITE,
  MARKER_ICON_DEPTH_WRITE_SPAWN,
  markerIconDepthWriteAfterRestart,
  markerIconDepthWriteFromLook,
} from "../src/render/markers";

describe("markerIconDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = markerIconDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      markerIconDepthWriteFromLook(MARKER_ICON_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(MARKER_ICON_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(MARKER_ICON_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(markerIconDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(markerIconDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(markerIconDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(markerIconDepthWriteFromLook(MARKER_ICON_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; attach no escribe)", () => {
    const bootDepthWrite = markerIconDepthWriteAfterRestart();
    const liveDepthWrite = markerIconDepthWriteFromLook(
      MARKER_ICON_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(markerIconDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(MARKER_ICON_DEPTH_WRITE_SPAWN);

    expect(markerIconDepthWriteFromLook(MARKER_ICON_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(markerIconDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("marker-icon mesh depthWrite recreate lock (R / softReset)", () => {
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
    const iconSrc = readFileSync(
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(iconSrc).toContain("markerIconDepthWriteAfterRestart(");
    expect(iconSrc).toContain("markerIconDepthWriteFromLook(");
    expect(iconSrc).toContain("MARKER_ICON_DEPTH_WRITE_SPAWN");
    expect(iconSrc).toMatch(
      /markerIconDepthWriteAfterRestart\([\s\S]{0,200}markerIconDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("markerIconDepthWriteAfterRestart(");
    expect(viewSrc).toContain("markerIconDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("markerIconDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: markerIconDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const iconMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/iconMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerIconDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerIconDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerIconDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerIconDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerIconDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerIconDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerIconDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("markerIconDepthWriteFromLook(");
    expect(saveSrc).not.toContain("markerIconDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("markerIconDepthWriteFromLook");
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
