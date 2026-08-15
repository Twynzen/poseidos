import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  MARKER_PALETTE,
  MARKER_RING_OPACITY,
  muteBadgeY,
  possessedBadgeY,
} from "../src/render/markers";
import { PLAYER_HEAD_EMISSIVE } from "../src/render/worldView";

describe("worldView player head mesh", () => {
  test("player head emissive 0x102030 × 1.15/canal → 0x122537; color/intensity/palette/badge-Y iguales", () => {
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    const r = (PLAYER_HEAD_EMISSIVE >> 16) & 0xff;
    const g = (PLAYER_HEAD_EMISSIVE >> 8) & 0xff;
    const b = PLAYER_HEAD_EMISSIVE & 0xff;
    expect(r).toBe(0x12);
    expect(g).toBe(0x25);
    expect(b).toBe(0x37);
    expect(Math.round((0x10 * 115) / 100)).toBe(r);
    expect(Math.round((0x20 * 115) / 100)).toBe(g);
    expect(Math.round((0x30 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(src).toMatch(/color:\s*0x7eb6ef/);
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).not.toMatch(/emissive:\s*0x102030/);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});
