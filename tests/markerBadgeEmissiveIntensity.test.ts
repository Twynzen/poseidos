import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_BADGE_EMISSIVE_INTENSITY,
  MARKER_BADGE_EMISSIVE_INTENSITY_SPAWN,
  markerBadgeEmissiveIntensityAfterRestart,
  markerBadgeEmissiveIntensityFromLook,
} from "../src/render/markers";

describe("markerBadgeEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 0.65); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = markerBadgeEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      markerBadgeEmissiveIntensityFromLook(MARKER_BADGE_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(MARKER_BADGE_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(MARKER_BADGE_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(0.65);
    expect(markerBadgeEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 9;
    expect(markerBadgeEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(markerBadgeEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
      bootIntensity,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerBadgeEmissiveIntensityFromLook(0.65)).toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach no escribe)", () => {
    const bootIntensity = markerBadgeEmissiveIntensityAfterRestart();
    const liveIntensity = markerBadgeEmissiveIntensityFromLook(0.65);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(markerBadgeEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(MARKER_BADGE_EMISSIVE_INTENSITY_SPAWN);

    expect(markerBadgeEmissiveIntensityFromLook(0.65)).toBe(bootIntensity);
    expect(markerBadgeEmissiveIntensityFromLook(9)).not.toBe(bootIntensity);
  });
});

describe("marker-badge mesh emissiveIntensity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace intensity fresco; F9 no helper", () => {
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
    const badgeSrc = readFileSync(
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(badgeSrc).toContain("markerBadgeEmissiveIntensityAfterRestart(");
    expect(badgeSrc).toContain("markerBadgeEmissiveIntensityFromLook(");
    expect(badgeSrc).toContain("MARKER_BADGE_EMISSIVE_INTENSITY_SPAWN");
    expect(badgeSrc).toMatch(
      /markerBadgeEmissiveIntensityAfterRestart\([\s\S]{0,200}markerBadgeEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("markerBadgeEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("markerBadgeEmissiveIntensityAfterRestart()");
    expect(viewSrc).not.toContain("markerBadgeEmissiveIntensityFromLook(");
    expect(viewSrc).toContain(
      "emissiveIntensity: markerBadgeEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}emissiveIntensity:\s*0\.65/,
    );
    expect(viewSrc).not.toMatch(/badgeMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerBadgeEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function attachRoleMarkers\([\s\S]{0,240}markerBadgeEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerBadgeEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerBadgeEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerBadgeEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerBadgeEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerBadgeEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerBadgeEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("markerBadgeEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("markerBadgeEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("markerBadgeEmissiveIntensityFromLook");
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
