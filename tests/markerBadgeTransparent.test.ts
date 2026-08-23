import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_BADGE_TRANSPARENT,
  MARKER_BADGE_TRANSPARENT_SPAWN,
  markerBadgeTransparentAfterRestart,
  markerBadgeTransparentFromLook,
} from "../src/render/markers";

describe("markerBadgeTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = markerBadgeTransparentAfterRestart();
    expect(bootTransparent).toBe(
      markerBadgeTransparentFromLook(MARKER_BADGE_TRANSPARENT),
    );
    expect(bootTransparent).toBe(MARKER_BADGE_TRANSPARENT);
    expect(bootTransparent).toBe(MARKER_BADGE_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(false);
    expect(markerBadgeTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = true;
    expect(markerBadgeTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(markerBadgeTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(markerBadgeTransparentFromLook(false)).toBe(bootTransparent);
    expect(markerBadgeTransparentFromLook(true)).not.toBe(bootTransparent);
  });

  test("vivo on no cambia transparent (ctor constant; attach/tick no escriben)", () => {
    const bootTransparent = markerBadgeTransparentAfterRestart();
    const liveTransparent = markerBadgeTransparentFromLook(false);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(markerBadgeTransparentAfterRestart());
    expect(liveTransparent).toBe(MARKER_BADGE_TRANSPARENT_SPAWN);

    expect(markerBadgeTransparentFromLook(false)).toBe(bootTransparent);
    expect(markerBadgeTransparentFromLook(true)).not.toBe(bootTransparent);
  });
});

describe("marker-badge mesh transparent recreate lock (R / softReset)", () => {
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
    const badgeSrc = readFileSync(
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(badgeSrc).toContain("markerBadgeTransparentAfterRestart(");
    expect(badgeSrc).toContain("markerBadgeTransparentFromLook(");
    expect(badgeSrc).toContain("MARKER_BADGE_TRANSPARENT_SPAWN");
    expect(badgeSrc).toMatch(
      /markerBadgeTransparentAfterRestart\([\s\S]{0,200}markerBadgeTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("markerBadgeTransparentAfterRestart(");
    expect(viewSrc).toContain("markerBadgeTransparentAfterRestart()");
    expect(viewSrc).not.toContain("markerBadgeTransparentFromLook(");
    expect(viewSrc).toContain(
      "transparent: markerBadgeTransparentAfterRestart()",
    );
    expect(badgeSrc).toContain("markerBadgeTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}transparent:\s*false/,
    );
    expect(badgeSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}transparent:\s*false/,
    );
    expect(viewSrc).not.toMatch(/badgeMat\.transparent\s*=/);
    expect(badgeSrc).not.toMatch(/badgeMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerBadgeTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerBadgeTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}markerBadgeTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}markerBadgeTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}markerBadgeTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerBadgeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerBadgeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerBadgeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerBadgeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerBadgeTransparentAfterRestart(");
    expect(gameSrc).not.toContain("markerBadgeTransparentFromLook(");
    expect(saveSrc).not.toContain("markerBadgeTransparentAfterRestart");
    expect(saveSrc).not.toContain("markerBadgeTransparentFromLook");
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
