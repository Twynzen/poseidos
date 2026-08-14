import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { doorBadgeY } from "../src/render/doorFocus";
import { bedBadgeY } from "../src/render/bedFocus";
import {
  INTERACT_RING_INNER,
  INTERACT_RING_OUTER,
  LOOT_BADGE_OPACITY,
  MARKER_BADGE_OPACITY,
  MUTE_BADGE_OPACITY,
  MARKER_PALETTE,
  MARKER_RING_OPACITY,
  PLAYER_BADGE_OPACITY,
  PLAYER_FOOT_RING_OPACITY,
  POSSESSED_BADGE_OPACITY,
  THREAT_RING_INNER,
  THREAT_RING_OUTER,
  THREAT_RING_PULSE_AMP,
  markerBadgeOpacity,
  markerRingOpacity,
  markerRingRadii,
  markerUsesInteractRing,
  markerVisibleInFov,
  muteBadgeY,
  paletteFor,
  possessedBadgeY,
  roleFromHostileKind,
} from "../src/render/markers";

describe("markers (badges + ground rings)", () => {
  test("paleta: mute rojo, poseído púrpura, player azul", () => {
    const mute = paletteFor("mute");
    const poss = paletteFor("possessed");
    const player = paletteFor("player");
    // rojo: canal R dominante
    expect((mute.ring >> 16) & 0xff).toBeGreaterThan((mute.ring >> 8) & 0xff);
    expect((mute.ring >> 16) & 0xff).toBeGreaterThan(mute.ring & 0xff);
    // púrpura: R y B altos, G bajo
    expect((poss.ring >> 16) & 0xff).toBeGreaterThan((poss.ring >> 8) & 0xff);
    expect(poss.ring & 0xff).toBeGreaterThan((poss.ring >> 8) & 0xff);
    // azul: B dominante
    expect(player.ring & 0xff).toBeGreaterThan((player.ring >> 16) & 0xff);
    expect(MARKER_PALETTE.mute.glyph.length).toBeGreaterThan(0);
    expect(MARKER_PALETTE.possessed.glyph.length).toBeGreaterThan(0);
  });

  test("paleta: loot ámbar (anillo 0xd4a03a, badge 0xf0c060, ▣)", () => {
    const loot = paletteFor("loot");
    expect(loot.ring).toBe(0xd4a03a);
    expect(loot.badge).toBe(0xf0c060);
    expect(loot.emissive).toBe(0x403010);
    expect(loot.glyph).toBe("▣");
    // ámbar: R y G dominantes sobre B
    expect((loot.ring >> 16) & 0xff).toBeGreaterThan(loot.ring & 0xff);
    expect((loot.ring >> 8) & 0xff).toBeGreaterThan(loot.ring & 0xff);
    expect(MARKER_PALETTE.loot.glyph.length).toBeGreaterThan(0);
  });

  test("paleta: door steel (anillo 0x5c7388, badge 0x8aa4b8, ⊓)", () => {
    const door = paletteFor("door");
    expect(door.ring).toBe(0x5c7388);
    expect(door.badge).toBe(0x8aa4b8);
    expect(door.emissive).toBe(0x182028);
    expect(door.glyph).toBe("⊓");
    // steel blue-grey: G y B dominantes sobre R
    expect((door.ring >> 8) & 0xff).toBeGreaterThan((door.ring >> 16) & 0xff);
    expect(door.ring & 0xff).toBeGreaterThan((door.ring >> 16) & 0xff);
    expect(MARKER_PALETTE.door.glyph.length).toBeGreaterThan(0);
  });

  test("paleta: bed púrpura sleep (anillo 0x7a6490, badge 0xa890b8, ▭)", () => {
    const bed = paletteFor("bed");
    expect(bed.ring).toBe(0x7a6490);
    expect(bed.badge).toBe(0xa890b8);
    expect(bed.emissive).toBe(0x201828);
    expect(bed.glyph).toBe("▭");
    // púrpura: R y B altos, G más bajo
    expect((bed.ring >> 16) & 0xff).toBeGreaterThan((bed.ring >> 8) & 0xff);
    expect(bed.ring & 0xff).toBeGreaterThan((bed.ring >> 8) & 0xff);
    expect(MARKER_PALETTE.bed.glyph.length).toBeGreaterThan(0);
  });

  test("roles: player mute possessed loot door bed", () => {
    expect(Object.keys(MARKER_PALETTE)).toEqual([
      "player",
      "mute",
      "possessed",
      "loot",
      "door",
      "bed",
    ]);
  });

  test("solo visible en FOV (amenazas)", () => {
    expect(markerVisibleInFov(true)).toBe(true);
    expect(markerVisibleInFov(false)).toBe(false);
  });

  test("roleFromHostileKind mapea mute/possessed", () => {
    expect(roleFromHostileKind("mute")).toBe("mute");
    expect(roleFromHostileKind("possessed")).toBe("possessed");
  });

  test("anillo player oculto (0); loot/door/bed/mute/possessed 0.6877", () => {
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(MARKER_RING_OPACITY).toBeCloseTo(0.598 * 1.15, 5);
    expect(markerRingOpacity("player")).toBe(0);
    expect(paletteFor("player").ring).toBe(0x3a7fd4);
    for (const role of ["loot", "door", "bed", "mute", "possessed"] as const) {
      expect(markerRingOpacity(role)).toBeCloseTo(0.6877, 5);
    }
  });

  test("loot/door/bed usan aro interact 0.416295–1.03155; player no", () => {
    expect(INTERACT_RING_INNER).toBe(0.416295);
    expect(INTERACT_RING_INNER).toBeCloseTo(0.4785 * 0.87, 5);
    expect(INTERACT_RING_OUTER).toBe(1.03155);
    expect(INTERACT_RING_OUTER).toBeCloseTo(0.897 * 1.15, 5);
    for (const role of ["loot", "door", "bed"] as const) {
      expect(markerUsesInteractRing(role)).toBe(true);
      const r = markerRingRadii(role);
      expect(r.inner).toBeCloseTo(0.416295, 5);
      expect(r.outer).toBeCloseTo(1.03155, 5);
    }
    expect(markerUsesInteractRing("player")).toBe(false);
    expect(markerRingOpacity("player")).toBe(0);
  });

  test("mute/possessed usan aro threat 0.37845–0.8993; interact sigue 0.416295–1.03155", () => {
    expect(THREAT_RING_INNER).toBe(0.37845);
    expect(THREAT_RING_INNER).toBeCloseTo(0.435 * 0.87, 5);
    expect(THREAT_RING_OUTER).toBe(0.8993);
    expect(THREAT_RING_OUTER).toBeCloseTo(0.782 * 1.15, 5);
    expect(INTERACT_RING_INNER).toBeCloseTo(0.416295, 5);
    expect(INTERACT_RING_OUTER).toBeCloseTo(1.03155, 5);
    for (const role of ["mute", "possessed"] as const) {
      expect(markerUsesInteractRing(role)).toBe(false);
      const r = markerRingRadii(role);
      expect(r.inner).toBeCloseTo(0.37845, 5);
      expect(r.outer).toBeCloseTo(0.8993, 5);
    }
  });

  test("aros mute/possessed no pulsan (amp 0); radios/opacity iguales", () => {
    expect(THREAT_RING_PULSE_AMP).toBe(0);
    expect(THREAT_RING_INNER).toBeCloseTo(0.37845, 5);
    expect(THREAT_RING_OUTER).toBeCloseTo(0.8993, 5);
    expect(MARKER_RING_OPACITY).toBeCloseTo(0.6877, 5);
    expect(INTERACT_RING_INNER).toBeCloseTo(0.416295, 5);
    expect(INTERACT_RING_OUTER).toBeCloseTo(1.03155, 5);
    const src = readFileSync(resolve(process.cwd(), "src/render/worldView.ts"), "utf8");
    expect(src).not.toMatch(/threatFocus/i);
    expect(src).not.toMatch(/THREAT_FOCUS_PULSE|THREAT_RING_PULSE/);
    const start = src.indexOf("syncHostiles(entities");
    expect(start).toBeGreaterThan(-1);
    const hostiles = src.slice(start, src.indexOf("syncDoor(tx", start));
    expect(hostiles).not.toMatch(/FocusMul|FocusPulse|PULSE_AMP/);
    expect(existsSync(resolve(process.cwd(), "src/render/threatFocus.ts"))).toBe(
      false,
    );
  });

  test("badge player/loot/mute/possessed oculto (0); door/bed 1", () => {
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(LOOT_BADGE_OPACITY).toBe(0);
    expect(MUTE_BADGE_OPACITY).toBe(0);
    expect(POSSESSED_BADGE_OPACITY).toBe(0);
    expect(MARKER_BADGE_OPACITY).toBeCloseTo(1, 5);
    expect(markerBadgeOpacity("player")).toBe(0);
    expect(markerBadgeOpacity("loot")).toBe(0);
    expect(markerBadgeOpacity("mute")).toBe(0);
    expect(markerBadgeOpacity("possessed")).toBe(0);
    for (const role of ["door", "bed"] as const) {
      expect(markerBadgeOpacity(role)).toBeCloseTo(1, 5);
    }
  });

  test("door/bed floatBadge Y 2.645/2.645; mute/possessed 2.0; loot 1.12", () => {
    expect(doorBadgeY).toBe(2.645);
    expect(doorBadgeY).toBeCloseTo(2.3 * 1.15, 10);
    expect(bedBadgeY).toBe(2.645);
    expect(bedBadgeY).toBeCloseTo(2.3 * 1.15, 10);
    expect(muteBadgeY).toBe(2.0);
    expect(possessedBadgeY).toBe(2.0);
    const src = readFileSync(resolve(process.cwd(), "src/render/worldView.ts"), "utf8");
    expect(src).toContain("badge.position.y = doorBadgeY");
    expect(src).toContain("badge.position.y = bedBadgeY");
    expect(src).toContain("badge.position.y = muteBadgeY");
    expect(src).toContain("badge.position.y = possessedBadgeY");
    expect(src).toMatch(/role === "loot"\) badge\.position\.y = 1\.12/);
    expect(src).not.toMatch(/badge\.position\.y = 1\.68/);
  });
});
