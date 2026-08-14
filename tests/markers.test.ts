import { describe, expect, test } from "vitest";
import {
  MARKER_PALETTE,
  markerVisibleInFov,
  paletteFor,
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
});
