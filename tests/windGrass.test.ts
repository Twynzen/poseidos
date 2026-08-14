import { describe, expect, test } from "vitest";
import {
  BLADE_SY_BASE,
  BLADE_SY_RANGE,
  BLADE_XZ_PAD,
  BLADE_XZ_RANGE,
  BLADE_Y_MUL,
  BLADES_PER_TILE,
  bladeBasePose,
  bladePoseAt,
  bladeWind,
  buildBladePoses,
  collectGrassTiles,
  countSolidsNear,
  GRASS_RADIUS,
  MAX_GRASS_INSTANCES,
  tileAcceptsGrass,
  WIND_SPEED,
  WIND_SPEED_Z_MUL,
  WIND_SWAY,
  WIND_SWAY_Z_MUL,
  WIND_YAW,
} from "../src/render/windGrass";
import type { TileKind } from "../src/world/tile";

describe("tileAcceptsGrass", () => {
  test("solo floor outdoor", () => {
    expect(tileAcceptsGrass("floor", true)).toBe(true);
    expect(tileAcceptsGrass("floor", false)).toBe(false);
    expect(tileAcceptsGrass("wall", true)).toBe(false);
    expect(tileAcceptsGrass("door", true)).toBe(false);
    expect(tileAcceptsGrass("furniture", true)).toBe(false);
    expect(tileAcceptsGrass("barricade", true)).toBe(false);
    expect(tileAcceptsGrass(undefined, true)).toBe(false);
  });
});

describe("collectGrassTiles", () => {
  test("omite walls/indoor; solo outdoor floor en radio", () => {
    // Patio abierto + un muro en (0,0) y cluster indoor lejos
    const grid: Record<string, TileKind> = {};
    for (let y = -4; y <= 4; y++) {
      for (let x = -4; x <= 4; x++) {
        grid[`${x},${y}`] = "floor";
      }
    }
    grid["0,0"] = "wall";
    // Indoor: muchos muros alrededor de (10,10)
    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 12; x++) {
        grid[`${x},${y}`] = "floor";
      }
    }
    grid["9,9"] = "wall";
    grid["10,9"] = "wall";
    grid["11,9"] = "wall";
    grid["9,10"] = "wall";

    const getKind = (x: number, y: number) => grid[`${x},${y}`];
    const tiles = collectGrassTiles(0, 0, getKind, 3);

    expect(tiles.every((t) => Math.max(Math.abs(t.tx), Math.abs(t.ty)) <= 3)).toBe(
      true,
    );
    expect(tiles.some((t) => t.tx === 0 && t.ty === 0)).toBe(false);
    expect(tiles.length).toBeGreaterThan(0);
    // Todos floor outdoor
    for (const t of tiles) {
      expect(grid[`${t.tx},${t.ty}`]).toBe("floor");
      expect(countSolidsNear(getKind, t.tx, t.ty)).toBeLessThan(3);
    }
  });

  test("radio por defecto acotado", () => {
    expect(GRASS_RADIUS).toBe(8);
    expect(MAX_GRASS_INSTANCES).toBeLessThanOrEqual(400);
    expect(MAX_GRASS_INSTANCES).toBeGreaterThanOrEqual(200);
  });
});

describe("blade transforms + wind", () => {
  test("blade Y mul 0.18 × 1.15; xz/sy/wind/count iguales", () => {
    expect(WIND_SWAY).toBe(0.0595125);
    expect(WIND_SWAY).toBeCloseTo(0.05175 * 1.15, 10);
    expect(WIND_SWAY_Z_MUL).toBe(0.7475);
    expect(WIND_SWAY_Z_MUL).toBeCloseTo(0.65 * 1.15, 10);
    expect(WIND_YAW).toBe(0.3703);
    expect(WIND_YAW).toBeCloseTo(0.322 * 1.15, 10);
    expect(WIND_SPEED).toBe(3.174);
    expect(WIND_SPEED).toBeCloseTo(2.76 * 1.15, 10);
    expect(WIND_SPEED_Z_MUL).toBe(1.5755);
    expect(WIND_SPEED_Z_MUL).toBeCloseTo(1.37 * 1.15, 10);
    expect(BLADE_SY_BASE).toBe(0.8625);
    expect(BLADE_SY_BASE).toBeCloseTo(0.75 * 1.15, 10);
    expect(BLADE_SY_RANGE).toBe(0.6325);
    expect(BLADE_SY_RANGE).toBeCloseTo(0.55 * 1.15, 10);
    expect(BLADE_XZ_RANGE).toBe(0.736);
    expect(BLADE_XZ_RANGE).toBeCloseTo(0.64 * 1.15, 10);
    expect(BLADE_XZ_PAD).toBe(0.1566);
    expect(BLADE_XZ_PAD).toBeCloseTo(0.18 * 0.87, 10);
    expect(BLADE_Y_MUL).toBe(0.207);
    expect(BLADE_Y_MUL).toBeCloseTo(0.18 * 1.15, 10);
    expect(BLADES_PER_TILE).toBe(3);
    expect(MAX_GRASS_INSTANCES).toBe(368);
  });

  test("base pose dentro del tile; wind oscila", () => {
    const base = bladeBasePose(5, 2, 0, 0.3);
    expect(base.x).toBeGreaterThanOrEqual(5);
    expect(base.x).toBeLessThan(6);
    expect(base.z).toBeGreaterThanOrEqual(2);
    expect(base.z).toBeLessThan(3);
    expect(base.sy).toBeGreaterThan(0.5);

    const w0 = bladeWind(0, 0.25);
    const w1 = bladeWind(Math.PI / (2 * WIND_SPEED), 0.25); // ~sin peak-ish
    expect(Math.abs(w0.dx)).toBeLessThanOrEqual(WIND_SWAY + 1e-9);
    expect(Math.abs(w0.dyaw)).toBeLessThanOrEqual(WIND_YAW + 1e-9);
    expect(Math.abs(w1.dx) + Math.abs(w1.dz)).toBeGreaterThan(0);
    expect(Math.abs(w1.dyaw)).toBeLessThanOrEqual(WIND_YAW + 1e-9);

    const p0 = bladePoseAt(5, 2, 1, 0.4, 0);
    const p1 = bladePoseAt(5, 2, 1, 0.4, 1.1);
    expect(p0.x !== p1.x || p0.z !== p1.z || p0.yaw !== p1.yaw).toBe(true);
  });

  test("buildBladePoses respeta cap", () => {
    const many: { tx: number; ty: number; seed: number }[] = [];
    for (let i = 0; i < 200; i++) {
      many.push({ tx: i % 20, ty: Math.floor(i / 20), seed: i / 200 });
    }
    const poses = buildBladePoses(many, 0, 50, BLADES_PER_TILE);
    expect(poses.length).toBe(50);
  });
});
