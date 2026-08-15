import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  MARKER_PALETTE,
  MARKER_RING_OPACITY,
  muteBadgeY,
  possessedBadgeY,
} from "../src/render/markers";
import {
  HOSTILE_COLOR,
  PLAYER_COLOR,
  PLAYER_HEAD_COLOR,
  PLAYER_HEAD_EMISSIVE,
  POSSESSED_COLOR,
} from "../src/render/worldView";

describe("worldView player head mesh", () => {
  test("player head emissive 0x102030 × 1.15/canal → 0x122537; intensity/palette/badge-Y iguales", () => {
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
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).not.toMatch(/emissive:\s*0x102030/);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });

  test("player head color 0x7eb6ef × 1.15/canal (b clamp) → 0x91d1ff; emissive/intensity/palette/badge-Y iguales", () => {
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    const r = (PLAYER_HEAD_COLOR >> 16) & 0xff;
    const g = (PLAYER_HEAD_COLOR >> 8) & 0xff;
    const b = PLAYER_HEAD_COLOR & 0xff;
    expect(r).toBe(0x91);
    expect(g).toBe(0xd1);
    expect(b).toBe(0xff);
    expect(Math.round((0x7e * 115) / 100)).toBe(r);
    expect(Math.round((0xb6 * 115) / 100)).toBe(g);
    expect(Math.min(0xff, Math.round((0xef * 115) / 100))).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).not.toMatch(/color:\s*0x7eb6ef/);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView player body mesh", () => {
  test("player body color 0x4a8fd4 × 1.15/canal → 0x55a4f4; head/emissive/intensity/palette/badge-Y iguales", () => {
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    const r = (PLAYER_COLOR >> 16) & 0xff;
    const g = (PLAYER_COLOR >> 8) & 0xff;
    const b = PLAYER_COLOR & 0xff;
    expect(r).toBe(0x55);
    expect(g).toBe(0xa4);
    expect(b).toBe(0xf4);
    expect(Math.round((0x4a * 115) / 100)).toBe(r);
    expect(Math.round((0x8f * 115) / 100)).toBe(g);
    expect(Math.round((0xd4 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).not.toMatch(/color:\s*0x4a8fd4/);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView mute/hostile fallback body mesh", () => {
  test("hostile body color 0x6b1a1a × 1.15/canal → 0x7b1e1e; player/head/emissive/intensity/palette/badge-Y iguales", () => {
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    const r = (HOSTILE_COLOR >> 16) & 0xff;
    const g = (HOSTILE_COLOR >> 8) & 0xff;
    const b = HOSTILE_COLOR & 0xff;
    expect(r).toBe(0x7b);
    expect(g).toBe(0x1e);
    expect(b).toBe(0x1e);
    expect(Math.round((0x6b * 115) / 100)).toBe(r);
    expect(Math.round((0x1a * 115) / 100)).toBe(g);
    expect(Math.round((0x1a * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).not.toMatch(/color:\s*0x6b1a1a/);
    expect(src).toContain("const POSSESSED_COLOR = 0x68347b");
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView possessed fallback body mesh", () => {
  test("possessed body color 0x5a2d6b × 1.15/canal → 0x68347b; hostile/player/head/emissive/intensity/palette/badge-Y iguales", () => {
    expect(POSSESSED_COLOR).toBe(0x68347b);
    const r = (POSSESSED_COLOR >> 16) & 0xff;
    const g = (POSSESSED_COLOR >> 8) & 0xff;
    const b = POSSESSED_COLOR & 0xff;
    expect(r).toBe(0x68);
    expect(g).toBe(0x34);
    expect(b).toBe(0x7b);
    expect(Math.round((0x5a * 115) / 100)).toBe(r);
    expect(Math.round((0x2d * 115) / 100)).toBe(g);
    expect(Math.round((0x6b * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).not.toMatch(/color:\s*0x5a2d6b/);
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1a0820");
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});
