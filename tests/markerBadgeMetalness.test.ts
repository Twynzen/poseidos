import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_BADGE_METALNESS,
  MARKER_BADGE_METALNESS_SPAWN,
  markerBadgeMetalnessAfterRestart,
  markerBadgeMetalnessFromLook,
} from "../src/render/markers";

describe("markerBadgeMetalnessAfterRestart (R / softReset)", () => {
  test("metalness fresco (idle 0.1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootMetalness = markerBadgeMetalnessAfterRestart();
    expect(bootMetalness).toBe(
      markerBadgeMetalnessFromLook(MARKER_BADGE_METALNESS),
    );
    expect(bootMetalness).toBe(MARKER_BADGE_METALNESS);
    expect(bootMetalness).toBe(MARKER_BADGE_METALNESS_SPAWN);
    expect(bootMetalness).toBe(0.1);
    expect(markerBadgeMetalnessAfterRestart()).toBe(bootMetalness);

    const leftoverMetalness = 9;
    expect(markerBadgeMetalnessFromLook(leftoverMetalness)).toBe(
      leftoverMetalness,
    );
    expect(markerBadgeMetalnessFromLook(leftoverMetalness)).not.toBe(
      bootMetalness,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(markerBadgeMetalnessFromLook(0.1)).toBe(bootMetalness);
    expect(markerBadgeMetalnessFromLook(0.99)).not.toBe(bootMetalness);
  });

  test("vivo on no cambia metalness (ctor constant; attach no escribe)", () => {
    const bootMetalness = markerBadgeMetalnessAfterRestart();
    const liveMetalness = markerBadgeMetalnessFromLook(0.1);
    expect(liveMetalness).toBe(bootMetalness);
    expect(liveMetalness).toBe(markerBadgeMetalnessAfterRestart());
    expect(liveMetalness).toBe(MARKER_BADGE_METALNESS_SPAWN);

    expect(markerBadgeMetalnessFromLook(0.1)).toBe(bootMetalness);
    expect(markerBadgeMetalnessFromLook(9)).not.toBe(bootMetalness);
  });
});

describe("marker-badge mesh metalness recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace metalness fresco; F9 no helper", () => {
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
    expect(badgeSrc).toContain("markerBadgeMetalnessAfterRestart(");
    expect(badgeSrc).toContain("markerBadgeMetalnessFromLook(");
    expect(badgeSrc).toContain("MARKER_BADGE_METALNESS_SPAWN");
    expect(badgeSrc).toMatch(
      /markerBadgeMetalnessAfterRestart\([\s\S]{0,200}markerBadgeMetalnessFromLook\(/,
    );
    expect(viewSrc).toContain("markerBadgeMetalnessAfterRestart(");
    expect(viewSrc).toContain("markerBadgeMetalnessAfterRestart()");
    expect(viewSrc).not.toContain("markerBadgeMetalnessFromLook(");
    expect(viewSrc).toContain(
      "metalness: markerBadgeMetalnessAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}metalness:\s*0\.1/,
    );
    expect(viewSrc).not.toMatch(/badgeMat\.metalness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerBadgeMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function attachRoleMarkers\([\s\S]{0,240}markerBadgeMetalnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerBadgeMetalnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerBadgeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerBadgeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerBadgeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerBadgeMetalnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerBadgeMetalnessAfterRestart(");
    expect(gameSrc).not.toContain("markerBadgeMetalnessFromLook(");
    expect(saveSrc).not.toContain("markerBadgeMetalnessAfterRestart");
    expect(saveSrc).not.toContain("markerBadgeMetalnessFromLook");
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
