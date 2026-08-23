import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MARKER_BADGE_DEPTH_WRITE,
  MARKER_BADGE_DEPTH_WRITE_SPAWN,
  markerBadgeDepthWriteAfterRestart,
  markerBadgeDepthWriteFromLook,
} from "../src/render/markers";

describe("markerBadgeDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = markerBadgeDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      markerBadgeDepthWriteFromLook(MARKER_BADGE_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(MARKER_BADGE_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(MARKER_BADGE_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(markerBadgeDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(markerBadgeDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(markerBadgeDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(markerBadgeDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(markerBadgeDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = markerBadgeDepthWriteAfterRestart();
    const liveDepthWrite = markerBadgeDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(markerBadgeDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(MARKER_BADGE_DEPTH_WRITE_SPAWN);

    expect(markerBadgeDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(markerBadgeDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("marker-badge mesh depthWrite recreate lock (R / softReset)", () => {
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
    const badgeSrc = readFileSync(
      resolve(process.cwd(), "src/render/markers.ts"),
      "utf8",
    );
    expect(badgeSrc).toContain("markerBadgeDepthWriteAfterRestart(");
    expect(badgeSrc).toContain("markerBadgeDepthWriteFromLook(");
    expect(badgeSrc).toContain("MARKER_BADGE_DEPTH_WRITE_SPAWN");
    expect(badgeSrc).toMatch(
      /markerBadgeDepthWriteAfterRestart\([\s\S]{0,200}markerBadgeDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("markerBadgeDepthWriteAfterRestart(");
    expect(viewSrc).toContain("markerBadgeDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("markerBadgeDepthWriteFromLook(");
    expect(viewSrc).toContain(
      "depthWrite: markerBadgeDepthWriteAfterRestart()",
    );
    expect(badgeSrc).toContain("markerBadgeDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}depthWrite:\s*true/,
    );
    expect(badgeSrc).not.toMatch(
      /const badgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/badgeMat\.depthWrite\s*=/);
    expect(badgeSrc).not.toMatch(/badgeMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}markerBadgeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function setInteractRingVisible\([\s\S]{0,240}markerBadgeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncGrass\([\s\S]{0,240}markerBadgeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}markerBadgeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}markerBadgeDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}markerBadgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}markerBadgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}markerBadgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}markerBadgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("markerBadgeDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("markerBadgeDepthWriteFromLook(");
    expect(saveSrc).not.toContain("markerBadgeDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("markerBadgeDepthWriteFromLook");
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
