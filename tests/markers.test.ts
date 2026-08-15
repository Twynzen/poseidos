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

  test("paleta: loot ámbar (anillo 0xf4b843, badge 0xffdd6e, ▣)", () => {
    const loot = paletteFor("loot");
    expect(loot.ring).toBe(0xf4b843);
    expect(loot.badge).toBe(0xffdd6e);
    expect(loot.emissive).toBe(0x4a3712);
    expect(loot.glyph).toBe("▣");
    // ámbar: R y G dominantes sobre B
    expect((loot.ring >> 16) & 0xff).toBeGreaterThan(loot.ring & 0xff);
    expect((loot.ring >> 8) & 0xff).toBeGreaterThan(loot.ring & 0xff);
    expect(MARKER_PALETTE.loot.glyph.length).toBeGreaterThan(0);
  });

  test("paleta: door steel (anillo 0x6a849c, badge 0x9fbdd4, ⊓)", () => {
    const door = paletteFor("door");
    expect(door.ring).toBe(0x6a849c);
    expect(door.badge).toBe(0x9fbdd4);
    expect(door.emissive).toBe(0x1c252e);
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
    expect(paletteFor("player").ring).toBe(0x4392f4);
    for (const role of ["loot", "door", "bed", "mute", "possessed"] as const) {
      expect(markerRingOpacity(role)).toBeCloseTo(0.6877, 5);
    }
  });

  test("player ring 0x3a7fd4 × 1.15/canal → 0x4392f4; glyph/other-roles/opacities iguales", () => {
    const player = paletteFor("player");
    expect(player.ring).toBe(0x4392f4);
    const r = (player.ring >> 16) & 0xff;
    const g = (player.ring >> 8) & 0xff;
    const b = player.ring & 0xff;
    expect(r).toBe(0x43);
    expect(g).toBe(0x92);
    expect(b).toBe(0xf4);
    expect(Math.round((0x3a * 115) / 100)).toBe(r);
    expect(Math.round((0x7f * 115) / 100)).toBe(g);
    expect(Math.round((0xd4 * 115) / 100)).toBe(b);
    expect(player.badge).toBe(0x91d1ff);
    expect(player.emissive).toBe(0x1e4a6e);
    expect(player.glyph).toBe("●");
    expect(MARKER_PALETTE.mute.ring).toBe(0xe14545);
    expect(MARKER_PALETTE.possessed.ring).toBe(0xa046d4);
    expect(MARKER_PALETTE.loot.ring).toBe(0xf4b843);
    expect(MARKER_PALETTE.door.ring).toBe(0x6a849c);
    expect(MARKER_PALETTE.bed.ring).toBe(0x7a6490);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("player badge 0x7eb6ef × 1.15/canal (b clamp) → 0x91d1ff; ring/glyph/other-roles/opacities iguales", () => {
    const player = paletteFor("player");
    expect(player.badge).toBe(0x91d1ff);
    const r = (player.badge >> 16) & 0xff;
    const g = (player.badge >> 8) & 0xff;
    const b = player.badge & 0xff;
    expect(r).toBe(0x91);
    expect(g).toBe(0xd1);
    expect(b).toBe(0xff);
    expect(Math.round((0x7e * 115) / 100)).toBe(r);
    expect(Math.round((0xb6 * 115) / 100)).toBe(g);
    expect(Math.min(0xff, Math.round((0xef * 115) / 100))).toBe(b);
    expect(player.ring).toBe(0x4392f4);
    expect(player.emissive).toBe(0x1e4a6e);
    expect(player.glyph).toBe("●");
    expect(MARKER_PALETTE.mute.badge).toBe(0xff7b7b);
    expect(MARKER_PALETTE.possessed.badge).toBe(0xe590ff);
    expect(MARKER_PALETTE.loot.badge).toBe(0xffdd6e);
    expect(MARKER_PALETTE.door.badge).toBe(0x9fbdd4);
    expect(MARKER_PALETTE.bed.badge).toBe(0xa890b8);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("player emissive 0x1a4060 × 1.15/canal → 0x1e4a6e; ring/badge/glyph/other-roles/opacities iguales", () => {
    const player = paletteFor("player");
    expect(player.emissive).toBe(0x1e4a6e);
    const r = (player.emissive >> 16) & 0xff;
    const g = (player.emissive >> 8) & 0xff;
    const b = player.emissive & 0xff;
    expect(r).toBe(0x1e);
    expect(g).toBe(0x4a);
    expect(b).toBe(0x6e);
    expect(Math.round((0x1a * 115) / 100)).toBe(r);
    expect(Math.round((0x40 * 115) / 100)).toBe(g);
    expect(Math.round((0x60 * 115) / 100)).toBe(b);
    expect(player.ring).toBe(0x4392f4);
    expect(player.badge).toBe(0x91d1ff);
    expect(player.glyph).toBe("●");
    expect(MARKER_PALETTE.mute.emissive).toBe(0x4a1212);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.loot.emissive).toBe(0x4a3712);
    expect(MARKER_PALETTE.door.emissive).toBe(0x1c252e);
    expect(MARKER_PALETTE.bed.emissive).toBe(0x201828);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("mute ring 0xc43c3c × 1.15/canal → 0xe14545; badge/emissive/glyph/other-roles/opacities iguales", () => {
    const mute = paletteFor("mute");
    expect(mute.ring).toBe(0xe14545);
    const r = (mute.ring >> 16) & 0xff;
    const g = (mute.ring >> 8) & 0xff;
    const b = mute.ring & 0xff;
    expect(r).toBe(0xe1);
    expect(g).toBe(0x45);
    expect(b).toBe(0x45);
    expect(Math.round((0xc4 * 115) / 100)).toBe(r);
    expect(Math.round((0x3c * 115) / 100)).toBe(g);
    expect(Math.round((0x3c * 115) / 100)).toBe(b);
    expect(mute.badge).toBe(0xff7b7b);
    expect(mute.emissive).toBe(0x4a1212);
    expect(mute.glyph).toBe("✕");
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_PALETTE.possessed.ring).toBe(0xa046d4);
    expect(MARKER_PALETTE.loot.ring).toBe(0xf4b843);
    expect(MARKER_PALETTE.door.ring).toBe(0x6a849c);
    expect(MARKER_PALETTE.bed.ring).toBe(0x7a6490);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("mute badge 0xff6b6b × 1.15/canal (r clamp) → 0xff7b7b; ring/emissive/glyph/other-roles/opacities iguales", () => {
    const mute = paletteFor("mute");
    expect(mute.badge).toBe(0xff7b7b);
    const r = (mute.badge >> 16) & 0xff;
    const g = (mute.badge >> 8) & 0xff;
    const b = mute.badge & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0x7b);
    expect(b).toBe(0x7b);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.round((0x6b * 115) / 100)).toBe(g);
    expect(Math.round((0x6b * 115) / 100)).toBe(b);
    expect(mute.ring).toBe(0xe14545);
    expect(mute.emissive).toBe(0x4a1212);
    expect(mute.glyph).toBe("✕");
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.possessed.badge).toBe(0xe590ff);
    expect(MARKER_PALETTE.loot.badge).toBe(0xffdd6e);
    expect(MARKER_PALETTE.door.badge).toBe(0x9fbdd4);
    expect(MARKER_PALETTE.bed.badge).toBe(0xa890b8);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("mute emissive 0x401010 × 1.15/canal → 0x4a1212; ring/badge/glyph/other-roles/opacities iguales", () => {
    const mute = paletteFor("mute");
    expect(mute.emissive).toBe(0x4a1212);
    const r = (mute.emissive >> 16) & 0xff;
    const g = (mute.emissive >> 8) & 0xff;
    const b = mute.emissive & 0xff;
    expect(r).toBe(0x4a);
    expect(g).toBe(0x12);
    expect(b).toBe(0x12);
    expect(Math.round((0x40 * 115) / 100)).toBe(r);
    expect(Math.round((0x10 * 115) / 100)).toBe(g);
    expect(Math.round((0x10 * 115) / 100)).toBe(b);
    expect(mute.ring).toBe(0xe14545);
    expect(mute.badge).toBe(0xff7b7b);
    expect(mute.glyph).toBe("✕");
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.loot.emissive).toBe(0x4a3712);
    expect(MARKER_PALETTE.door.emissive).toBe(0x1c252e);
    expect(MARKER_PALETTE.bed.emissive).toBe(0x201828);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("possessed ring 0x8b3db8 × 1.15/canal → 0xa046d4; badge/emissive/glyph/other-roles/opacities iguales", () => {
    const possessed = paletteFor("possessed");
    expect(possessed.ring).toBe(0xa046d4);
    const r = (possessed.ring >> 16) & 0xff;
    const g = (possessed.ring >> 8) & 0xff;
    const b = possessed.ring & 0xff;
    expect(r).toBe(0xa0);
    expect(g).toBe(0x46);
    expect(b).toBe(0xd4);
    expect(Math.round((0x8b * 115) / 100)).toBe(r);
    expect(Math.round((0x3d * 115) / 100)).toBe(g);
    expect(Math.round((0xb8 * 115) / 100)).toBe(b);
    expect(possessed.badge).toBe(0xe590ff);
    expect(possessed.emissive).toBe(0x30124a);
    expect(possessed.glyph).toBe("◆");
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_PALETTE.mute.ring).toBe(0xe14545);
    expect(MARKER_PALETTE.loot.ring).toBe(0xf4b843);
    expect(MARKER_PALETTE.door.ring).toBe(0x6a849c);
    expect(MARKER_PALETTE.bed.ring).toBe(0x7a6490);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("possessed badge 0xc77dff × 1.15/canal (b clamp) → 0xe590ff; ring/emissive/glyph/other-roles/opacities iguales", () => {
    const possessed = paletteFor("possessed");
    expect(possessed.badge).toBe(0xe590ff);
    const r = (possessed.badge >> 16) & 0xff;
    const g = (possessed.badge >> 8) & 0xff;
    const b = possessed.badge & 0xff;
    expect(r).toBe(0xe5);
    expect(g).toBe(0x90);
    expect(b).toBe(0xff);
    expect(Math.round((0xc7 * 115) / 100)).toBe(r);
    expect(Math.round((0x7d * 115) / 100)).toBe(g);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(b);
    expect(possessed.ring).toBe(0xa046d4);
    expect(possessed.emissive).toBe(0x30124a);
    expect(possessed.glyph).toBe("◆");
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.mute.badge).toBe(0xff7b7b);
    expect(MARKER_PALETTE.loot.badge).toBe(0xffdd6e);
    expect(MARKER_PALETTE.door.badge).toBe(0x9fbdd4);
    expect(MARKER_PALETTE.bed.badge).toBe(0xa890b8);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("possessed emissive 0x2a1040 × 1.15/canal → 0x30124a; ring/badge/glyph/other-roles/opacities iguales", () => {
    const possessed = paletteFor("possessed");
    expect(possessed.emissive).toBe(0x30124a);
    const r = (possessed.emissive >> 16) & 0xff;
    const g = (possessed.emissive >> 8) & 0xff;
    const b = possessed.emissive & 0xff;
    expect(r).toBe(0x30);
    expect(g).toBe(0x12);
    expect(b).toBe(0x4a);
    expect(Math.round((0x2a * 115) / 100)).toBe(r);
    expect(Math.round((0x10 * 115) / 100)).toBe(g);
    expect(Math.round((0x40 * 115) / 100)).toBe(b);
    expect(possessed.ring).toBe(0xa046d4);
    expect(possessed.badge).toBe(0xe590ff);
    expect(possessed.glyph).toBe("◆");
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.mute.emissive).toBe(0x4a1212);
    expect(MARKER_PALETTE.loot.emissive).toBe(0x4a3712);
    expect(MARKER_PALETTE.door.emissive).toBe(0x1c252e);
    expect(MARKER_PALETTE.bed.emissive).toBe(0x201828);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("loot ring 0xd4a03a × 1.15/canal → 0xf4b843; badge/emissive/glyph/other-roles/opacities iguales", () => {
    const loot = paletteFor("loot");
    expect(loot.ring).toBe(0xf4b843);
    const r = (loot.ring >> 16) & 0xff;
    const g = (loot.ring >> 8) & 0xff;
    const b = loot.ring & 0xff;
    expect(r).toBe(0xf4);
    expect(g).toBe(0xb8);
    expect(b).toBe(0x43);
    expect(Math.round((0xd4 * 115) / 100)).toBe(r);
    expect(Math.round((0xa0 * 115) / 100)).toBe(g);
    expect(Math.round((0x3a * 115) / 100)).toBe(b);
    expect(loot.badge).toBe(0xffdd6e);
    expect(loot.emissive).toBe(0x4a3712);
    expect(loot.glyph).toBe("▣");
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_PALETTE.mute.ring).toBe(0xe14545);
    expect(MARKER_PALETTE.possessed.ring).toBe(0xa046d4);
    expect(MARKER_PALETTE.door.ring).toBe(0x6a849c);
    expect(MARKER_PALETTE.bed.ring).toBe(0x7a6490);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("loot badge 0xf0c060 × 1.15/canal (r clamp) → 0xffdd6e; ring/emissive/glyph/other-roles/opacities iguales", () => {
    const loot = paletteFor("loot");
    expect(loot.badge).toBe(0xffdd6e);
    const r = (loot.badge >> 16) & 0xff;
    const g = (loot.badge >> 8) & 0xff;
    const b = loot.badge & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xdd);
    expect(b).toBe(0x6e);
    expect(Math.min(0xff, Math.round((0xf0 * 115) / 100))).toBe(r);
    expect(Math.round((0xc0 * 115) / 100)).toBe(g);
    expect(Math.round((0x60 * 115) / 100)).toBe(b);
    expect(loot.ring).toBe(0xf4b843);
    expect(loot.emissive).toBe(0x4a3712);
    expect(loot.glyph).toBe("▣");
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.mute.badge).toBe(0xff7b7b);
    expect(MARKER_PALETTE.possessed.badge).toBe(0xe590ff);
    expect(MARKER_PALETTE.door.badge).toBe(0x9fbdd4);
    expect(MARKER_PALETTE.bed.badge).toBe(0xa890b8);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("loot emissive 0x403010 × 1.15/canal → 0x4a3712; ring/badge/glyph/other-roles/opacities iguales", () => {
    const loot = paletteFor("loot");
    expect(loot.emissive).toBe(0x4a3712);
    const r = (loot.emissive >> 16) & 0xff;
    const g = (loot.emissive >> 8) & 0xff;
    const b = loot.emissive & 0xff;
    expect(r).toBe(0x4a);
    expect(g).toBe(0x37);
    expect(b).toBe(0x12);
    expect(Math.round((0x40 * 115) / 100)).toBe(r);
    expect(Math.round((0x30 * 115) / 100)).toBe(g);
    expect(Math.round((0x10 * 115) / 100)).toBe(b);
    expect(loot.ring).toBe(0xf4b843);
    expect(loot.badge).toBe(0xffdd6e);
    expect(loot.glyph).toBe("▣");
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.mute.emissive).toBe(0x4a1212);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.door.emissive).toBe(0x1c252e);
    expect(MARKER_PALETTE.bed.emissive).toBe(0x201828);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("door ring 0x5c7388 × 1.15/canal → 0x6a849c; badge/emissive/glyph/other-roles/opacities iguales", () => {
    const door = paletteFor("door");
    expect(door.ring).toBe(0x6a849c);
    const r = (door.ring >> 16) & 0xff;
    const g = (door.ring >> 8) & 0xff;
    const b = door.ring & 0xff;
    expect(r).toBe(0x6a);
    expect(g).toBe(0x84);
    expect(b).toBe(0x9c);
    expect(Math.round((0x5c * 115) / 100)).toBe(r);
    expect(Math.round((0x73 * 115) / 100)).toBe(g);
    expect(Math.round((0x88 * 115) / 100)).toBe(b);
    expect(door.badge).toBe(0x9fbdd4);
    expect(door.emissive).toBe(0x1c252e);
    expect(door.glyph).toBe("⊓");
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_PALETTE.mute.ring).toBe(0xe14545);
    expect(MARKER_PALETTE.possessed.ring).toBe(0xa046d4);
    expect(MARKER_PALETTE.loot.ring).toBe(0xf4b843);
    expect(MARKER_PALETTE.bed.ring).toBe(0x7a6490);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("door badge 0x8aa4b8 × 1.15/canal → 0x9fbdd4; ring/emissive/glyph/other-roles/opacities iguales", () => {
    const door = paletteFor("door");
    expect(door.badge).toBe(0x9fbdd4);
    const r = (door.badge >> 16) & 0xff;
    const g = (door.badge >> 8) & 0xff;
    const b = door.badge & 0xff;
    expect(r).toBe(0x9f);
    expect(g).toBe(0xbd);
    expect(b).toBe(0xd4);
    expect(Math.round((0x8a * 115) / 100)).toBe(r);
    expect(Math.round((0xa4 * 115) / 100)).toBe(g);
    expect(Math.round((0xb8 * 115) / 100)).toBe(b);
    expect(door.ring).toBe(0x6a849c);
    expect(door.emissive).toBe(0x1c252e);
    expect(door.glyph).toBe("⊓");
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.mute.badge).toBe(0xff7b7b);
    expect(MARKER_PALETTE.possessed.badge).toBe(0xe590ff);
    expect(MARKER_PALETTE.loot.badge).toBe(0xffdd6e);
    expect(MARKER_PALETTE.bed.badge).toBe(0xa890b8);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
  });

  test("door emissive 0x182028 × 1.15/canal → 0x1c252e; ring/badge/glyph/other-roles/opacities iguales", () => {
    const door = paletteFor("door");
    expect(door.emissive).toBe(0x1c252e);
    const r = (door.emissive >> 16) & 0xff;
    const g = (door.emissive >> 8) & 0xff;
    const b = door.emissive & 0xff;
    expect(r).toBe(0x1c);
    expect(g).toBe(0x25);
    expect(b).toBe(0x2e);
    expect(Math.round((0x18 * 115) / 100)).toBe(r);
    expect(Math.round((0x20 * 115) / 100)).toBe(g);
    expect(Math.round((0x28 * 115) / 100)).toBe(b);
    expect(door.ring).toBe(0x6a849c);
    expect(door.badge).toBe(0x9fbdd4);
    expect(door.glyph).toBe("⊓");
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.mute.emissive).toBe(0x4a1212);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.loot.emissive).toBe(0x4a3712);
    expect(MARKER_PALETTE.bed.emissive).toBe(0x201828);
    expect(PLAYER_BADGE_OPACITY).toBe(0);
    expect(PLAYER_FOOT_RING_OPACITY).toBe(0);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
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
