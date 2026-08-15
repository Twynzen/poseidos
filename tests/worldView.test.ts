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
  POSSESSED_HEAD_COLOR,
  POSSESSED_HEAD_EMISSIVE,
  WARM_LIGHT_COLOR,
  MUZZLE_FLASH_COLOR,
  MUZZLE_LIGHT_COLOR,
  IMPACT_SPARK_COLOR,
  IMPACT_SPARK_LIGHT_COLOR,
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
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
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

describe("worldView possessed fallback body emissive", () => {
  test("possessed body emissive 0x1a0820 × 1.15/canal → 0x1e0925; color/hostile/player/head/intensity/palette/badge-Y iguales", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).not.toMatch(/const POSSESSED_EMISSIVE = 0x1a0820/);
    const r = 0x1e;
    const g = 0x09;
    const b = 0x25;
    expect(Math.round((0x1a * 115) / 100)).toBe(r);
    expect(Math.round((0x08 * 115) / 100)).toBe(g);
    expect(Math.round((0x20 * 115) / 100)).toBe(b);
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
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

describe("worldView possessed fallback head mesh", () => {
  test("possessed head color 0x7a3d8a × 1.15/canal → 0x8c469f; emissive/color/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    const r = (POSSESSED_HEAD_COLOR >> 16) & 0xff;
    const g = (POSSESSED_HEAD_COLOR >> 8) & 0xff;
    const b = POSSESSED_HEAD_COLOR & 0xff;
    expect(r).toBe(0x8c);
    expect(g).toBe(0x46);
    expect(b).toBe(0x9f);
    expect(Math.round((0x7a * 115) / 100)).toBe(r);
    expect(Math.round((0x3d * 115) / 100)).toBe(g);
    expect(Math.round((0x8a * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).not.toMatch(/color:\s*0x7a3d8a/);
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    expect(POSSESSED_COLOR).toBe(0x68347b);
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

describe("worldView possessed fallback head emissive", () => {
  test("possessed head emissive 0x2a1040 × 1.15/canal → 0x30124a; color/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    const r = (POSSESSED_HEAD_EMISSIVE >> 16) & 0xff;
    const g = (POSSESSED_HEAD_EMISSIVE >> 8) & 0xff;
    const b = POSSESSED_HEAD_EMISSIVE & 0xff;
    expect(r).toBe(0x30);
    expect(g).toBe(0x12);
    expect(b).toBe(0x4a);
    expect(Math.round((0x2a * 115) / 100)).toBe(r);
    expect(Math.round((0x10 * 115) / 100)).toBe(g);
    expect(Math.round((0x40 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).not.toMatch(/emissive:\s*0x2a1040/);
    expect(src).toContain("export const WARM_LIGHT_COLOR = 0xffca81");
    expect(src).toContain("new THREE.PointLight(WARM_LIGHT_COLOR, 0, 7.5, 2)");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView indoor night warm light", () => {
  test("warm light 0xffb070 × 1.15/canal (r clamp) → 0xffca81; possessed/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(WARM_LIGHT_COLOR).toBe(0xffca81);
    const r = (WARM_LIGHT_COLOR >> 16) & 0xff;
    const g = (WARM_LIGHT_COLOR >> 8) & 0xff;
    const b = WARM_LIGHT_COLOR & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xca);
    expect(b).toBe(0x81);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.round((0xb0 * 115) / 100)).toBe(g);
    expect(Math.round((0x70 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const WARM_LIGHT_COLOR = 0xffca81");
    expect(src).toContain("new THREE.PointLight(WARM_LIGHT_COLOR, 0, 7.5, 2)");
    expect(src).not.toMatch(/PointLight\(0xffb070/);
    expect(src).toContain("export const MUZZLE_FLASH_COLOR = 0xffffdd");
    expect(src).toContain("color: MUZZLE_FLASH_COLOR");
    expect(src).toContain("export const MUZZLE_LIGHT_COLOR = 0xffffb8");
    expect(src).toContain("new THREE.PointLight(\n    MUZZLE_LIGHT_COLOR,");
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView muzzle flash mesh", () => {
  test("muzzle flash mesh 0xfff2c0 × 1.15/canal (r/g clamp) → 0xffffdd; warmLight/possessed/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(MUZZLE_FLASH_COLOR).toBe(0xffffdd);
    const r = (MUZZLE_FLASH_COLOR >> 16) & 0xff;
    const g = (MUZZLE_FLASH_COLOR >> 8) & 0xff;
    const b = MUZZLE_FLASH_COLOR & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xff);
    expect(b).toBe(0xdd);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.min(0xff, Math.round((0xf2 * 115) / 100))).toBe(g);
    expect(Math.round((0xc0 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const MUZZLE_FLASH_COLOR = 0xffffdd");
    expect(src).toContain("color: MUZZLE_FLASH_COLOR");
    expect(src).not.toMatch(/color:\s*0xfff2c0/);
    expect(src).toContain("export const MUZZLE_LIGHT_COLOR = 0xffffb8");
    expect(src).toContain("new THREE.PointLight(\n    MUZZLE_LIGHT_COLOR,");
    expect(src).toContain("export const WARM_LIGHT_COLOR = 0xffca81");
    expect(src).toContain("new THREE.PointLight(WARM_LIGHT_COLOR, 0, 7.5, 2)");
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(WARM_LIGHT_COLOR).toBe(0xffca81);
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView muzzle PointLight", () => {
  test("muzzle PointLight 0xffe8a0 × 1.15/canal (r/g clamp) → 0xffffb8; flash/warmLight/possessed/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(MUZZLE_LIGHT_COLOR).toBe(0xffffb8);
    const r = (MUZZLE_LIGHT_COLOR >> 16) & 0xff;
    const g = (MUZZLE_LIGHT_COLOR >> 8) & 0xff;
    const b = MUZZLE_LIGHT_COLOR & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xff);
    expect(b).toBe(0xb8);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.min(0xff, Math.round((0xe8 * 115) / 100))).toBe(g);
    expect(Math.round((0xa0 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const MUZZLE_LIGHT_COLOR = 0xffffb8");
    expect(src).toContain("new THREE.PointLight(\n    MUZZLE_LIGHT_COLOR,");
    expect(src).not.toMatch(/new THREE\.PointLight\(\s*0xffe8a0/);
    expect(src).toContain("export const MUZZLE_FLASH_COLOR = 0xffffdd");
    expect(src).toContain("color: MUZZLE_FLASH_COLOR");
    expect(src).toContain("export const WARM_LIGHT_COLOR = 0xffca81");
    expect(src).toContain("new THREE.PointLight(WARM_LIGHT_COLOR, 0, 7.5, 2)");
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(MUZZLE_FLASH_COLOR).toBe(0xffffdd);
    expect(WARM_LIGHT_COLOR).toBe(0xffca81);
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView impact spark mesh", () => {
  test("impact spark mesh 0xffd080 × 1.15/canal (r clamp) → 0xffef93; light/muzzle/warmLight/possessed/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(IMPACT_SPARK_COLOR).toBe(0xffef93);
    const r = (IMPACT_SPARK_COLOR >> 16) & 0xff;
    const g = (IMPACT_SPARK_COLOR >> 8) & 0xff;
    const b = IMPACT_SPARK_COLOR & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xef);
    expect(b).toBe(0x93);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.round((0xd0 * 115) / 100)).toBe(g);
    expect(Math.round((0x80 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const IMPACT_SPARK_COLOR = 0xffef93");
    expect(src).toContain("color: IMPACT_SPARK_COLOR");
    expect(src).not.toMatch(/color:\s*0xffd080/);
    expect(src).toContain("export const IMPACT_SPARK_LIGHT_COLOR = 0xffef93");
    expect(src).toContain("new THREE.PointLight(\n    IMPACT_SPARK_LIGHT_COLOR,");
    expect(src).toContain("export const MUZZLE_LIGHT_COLOR = 0xffffb8");
    expect(src).toContain("new THREE.PointLight(\n    MUZZLE_LIGHT_COLOR,");
    expect(src).toContain("export const MUZZLE_FLASH_COLOR = 0xffffdd");
    expect(src).toContain("color: MUZZLE_FLASH_COLOR");
    expect(src).toContain("export const WARM_LIGHT_COLOR = 0xffca81");
    expect(src).toContain("new THREE.PointLight(WARM_LIGHT_COLOR, 0, 7.5, 2)");
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(IMPACT_SPARK_LIGHT_COLOR).toBe(0xffef93);
    expect(MUZZLE_LIGHT_COLOR).toBe(0xffffb8);
    expect(MUZZLE_FLASH_COLOR).toBe(0xffffdd);
    expect(WARM_LIGHT_COLOR).toBe(0xffca81);
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});

describe("worldView impact spark PointLight", () => {
  test("impact spark PointLight 0xffd080 × 1.15/canal (r clamp) → 0xffef93; mesh/muzzle/warmLight/possessed/hostile/player/intensity/palette/badge-Y iguales", () => {
    expect(IMPACT_SPARK_LIGHT_COLOR).toBe(0xffef93);
    const r = (IMPACT_SPARK_LIGHT_COLOR >> 16) & 0xff;
    const g = (IMPACT_SPARK_LIGHT_COLOR >> 8) & 0xff;
    const b = IMPACT_SPARK_LIGHT_COLOR & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xef);
    expect(b).toBe(0x93);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.round((0xd0 * 115) / 100)).toBe(g);
    expect(Math.round((0x80 * 115) / 100)).toBe(b);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("export const IMPACT_SPARK_LIGHT_COLOR = 0xffef93");
    expect(src).toContain("new THREE.PointLight(\n    IMPACT_SPARK_LIGHT_COLOR,");
    expect(src).not.toMatch(/new THREE\.PointLight\(\s*0xffd080/);
    expect(src).toContain("export const IMPACT_SPARK_COLOR = 0xffef93");
    expect(src).toContain("color: IMPACT_SPARK_COLOR");
    expect(src).toContain("export const MUZZLE_LIGHT_COLOR = 0xffffb8");
    expect(src).toContain("new THREE.PointLight(\n    MUZZLE_LIGHT_COLOR,");
    expect(src).toContain("export const MUZZLE_FLASH_COLOR = 0xffffdd");
    expect(src).toContain("color: MUZZLE_FLASH_COLOR");
    expect(src).toContain("export const WARM_LIGHT_COLOR = 0xffca81");
    expect(src).toContain("new THREE.PointLight(WARM_LIGHT_COLOR, 0, 7.5, 2)");
    expect(src).toContain("export const POSSESSED_HEAD_EMISSIVE = 0x30124a");
    expect(src).toContain("emissive: POSSESSED_HEAD_EMISSIVE");
    expect(src).toContain("color: POSSESSED_HEAD_COLOR");
    expect(src).toContain("export const POSSESSED_HEAD_COLOR = 0x8c469f");
    expect(src).toContain("emissive: POSSESSED_EMISSIVE");
    expect(src).toContain("color: POSSESSED_COLOR");
    expect(src).toContain("const POSSESSED_EMISSIVE = 0x1e0925");
    expect(src).toContain("emissiveIntensity: 0.22");
    expect(src).toContain("color: HOSTILE_COLOR");
    expect(src).toContain("color: PLAYER_COLOR");
    expect(src).toContain("color: PLAYER_HEAD_COLOR");
    expect(src).toContain("emissive: PLAYER_HEAD_EMISSIVE");
    expect(src).toContain("color: 0xffe8a0");
    expect(src).toContain("new THREE.PointLight(0xffc060, 2.4, 3.2, 2)");
    expect(IMPACT_SPARK_COLOR).toBe(0xffef93);
    expect(MUZZLE_LIGHT_COLOR).toBe(0xffffb8);
    expect(MUZZLE_FLASH_COLOR).toBe(0xffffdd);
    expect(WARM_LIGHT_COLOR).toBe(0xffca81);
    expect(POSSESSED_HEAD_EMISSIVE).toBe(0x30124a);
    expect(POSSESSED_HEAD_COLOR).toBe(0x8c469f);
    expect(POSSESSED_COLOR).toBe(0x68347b);
    expect(HOSTILE_COLOR).toBe(0x7b1e1e);
    expect(PLAYER_COLOR).toBe(0x55a4f4);
    expect(PLAYER_HEAD_COLOR).toBe(0x91d1ff);
    expect(PLAYER_HEAD_EMISSIVE).toBe(0x122537);
    expect(MARKER_PALETTE.possessed.emissive).toBe(0x30124a);
    expect(MARKER_PALETTE.player.badge).toBe(0x91d1ff);
    expect(MARKER_PALETTE.player.emissive).toBe(0x1e4a6e);
    expect(MARKER_PALETTE.player.ring).toBe(0x4392f4);
    expect(MARKER_RING_OPACITY).toBe(0.6877);
    expect(muteBadgeY).toBe(2.3);
    expect(possessedBadgeY).toBe(2.3);
  });
});
