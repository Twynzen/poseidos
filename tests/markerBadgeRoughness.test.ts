import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_BADGE_ROUGHNESS,
  MARKER_BADGE_ROUGHNESS_SPAWN,
  markerBadgeRoughnessAfterRestart,
  markerBadgeRoughnessFromLook,
} from "../src/render/markers";

describe("markerBadgeRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.45); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = markerBadgeRoughnessAfterRestart();
    expect(bootRoughness).toBe(
      markerBadgeRoughnessFromLook(MARKER_BADGE_ROUGHNESS),
    );
    expect(bootRoughness).toBe(MARKER_BADGE_ROUGHNESS);
    expect(bootRoughness).toBe(MARKER_BADGE_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.45);
    expect(markerBadgeRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 9;
    expect(markerBadgeRoughnessFromLook(leftoverRoughness)).toBe(
      leftoverRoughness,
    );
    expect(markerBadgeRoughnessFromLook(leftoverRoughness)).not.toBe(
      bootRoughness,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerBadgeRoughnessFromLook(0.45)).toBe(bootRoughness);
    expect(markerBadgeRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach no escribe)", () => {
    const bootRoughness = markerBadgeRoughnessAfterRestart();
    const liveRoughness = markerBadgeRoughnessFromLook(0.45);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(markerBadgeRoughnessAfterRestart());
    expect(liveRoughness).toBe(MARKER_BADGE_ROUGHNESS_SPAWN);

    expect(markerBadgeRoughnessFromLook(0.45)).toBe(bootRoughness);
    expect(markerBadgeRoughnessFromLook(9)).not.toBe(bootRoughness);
  });
});

describe("marker-badge mesh roughness recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace roughness fresco; F9 no helper", () => {
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
    expect(badgeSrc).toContain("markerBadgeRoughnessAfterRestart(");
    expect(badgeSrc).toContain("markerBadgeRoughnessFromLook(");
    expect(badgeSrc).toContain("MARKER_BADGE_ROUGHNESS_SPAWN");
    expect(badgeSrc).toMatch(
      /markerBadgeRoughnessAfterRestart\([\s\S]{0,200}markerBadgeRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("markerBadgeRoughnessAfterRestart(");
    expect(viewSrc).toContain("markerBadgeRoughnessAfterRestart()");
    expect(viewSrc).not.toContain("markerBadgeRoughnessFromLook(");
    expect(viewSrc).toContain(
      "roughness: markerBadgeRoughnessAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}roughness:\s*0\.45/,
    );
    expect(viewSrc).not.toMatch(/badgeMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerBadgeRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function attachRoleMarkers\([\s\S]{0,240}markerBadgeRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerBadgeRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerBadgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerBadgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerBadgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerBadgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerBadgeRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("markerBadgeRoughnessFromLook(");
    expect(saveSrc).not.toContain("markerBadgeRoughnessAfterRestart");
    expect(saveSrc).not.toContain("markerBadgeRoughnessFromLook");
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
