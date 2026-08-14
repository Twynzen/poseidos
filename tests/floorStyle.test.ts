import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  aoFactor,
  applyAo,
  applyNightGroundLift,
  BARRICADE_COLOR,
  BARRICADE_EDGE,
  BED_COLOR,
  countAoNeighbors,
  DOOR_CLOSED,
  DOOR_OPEN,
  floorColorAt,
  floorIsOutdoor,
  FURNITURE_COLOR,
  GROUND_NIGHT_LIFT,
  INDOOR_FLOOR_COLOR,
  isAoOccluder,
  nightGroundLift,
  OUTDOOR_GRASS_BASE,
  OUTDOOR_SOLID_THRESHOLD,
  tileSeed01,
  tintFromTile,
  WALL_BASE_COLOR,
  WALL_COLOR,
} from "../src/render/floorStyle";
import type { TileKind } from "../src/world/tile";

describe("tileSeed01", () => {
  test("determinista y en [0,1)", () => {
    const a = tileSeed01(3, 7);
    const b = tileSeed01(3, 7);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(tileSeed01(3, 8)).not.toBe(a);
  });
});

describe("tintFromTile", () => {
  test("indoor = color piso fijo", () => {
    expect(tintFromTile(0, 0, false)).toBe(INDOOR_FLOOR_COLOR);
    expect(tintFromTile(99, 12, false)).toBe(INDOOR_FLOOR_COLOR);
  });

  test("outdoor varía por tile (verdes/grises distintos)", () => {
    const colors = new Set<number>();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        colors.add(tintFromTile(x, y, true));
      }
    }
    expect(colors.size).toBeGreaterThan(4);
    // Canal G suele dominar o empatar (pasto)
    const sample = tintFromTile(2, 5, true);
    const r = (sample >> 16) & 0xff;
    const g = (sample >> 8) & 0xff;
    const b = sample & 0xff;
    expect(g).toBeGreaterThanOrEqual(r - 8);
    expect(g).toBeGreaterThan(b);
    expect(OUTDOOR_GRASS_BASE).toBeGreaterThan(0);
  });
});

describe("aoFactor + applyAo", () => {
  test("0 vecinos = sin AO", () => {
    expect(aoFactor(0, 0)).toBe(0);
    expect(applyAo(0xffffff, 0)).toBe(0xffffff);
  });

  test("más oclusores = más oscuro", () => {
    const base = 0x808080;
    const light = applyAo(base, aoFactor(1, 0));
    const heavy = applyAo(base, aoFactor(4, 0));
    expect(aoFactor(4, 0)).toBe(1);
    expect(heavy).toBeLessThan(light);
    expect(light).toBeLessThan(base);
  });

  test("diagonales pesan la mitad", () => {
    expect(aoFactor(0, 2)).toBeCloseTo(0.25, 5);
    expect(aoFactor(2, 0)).toBeCloseTo(0.5, 5);
  });
});

describe("isAoOccluder + countAoNeighbors", () => {
  test("wall/furniture/barricade ocluyen; floor/door no", () => {
    expect(isAoOccluder("wall")).toBe(true);
    expect(isAoOccluder("furniture")).toBe(true);
    expect(isAoOccluder("barricade")).toBe(true);
    expect(isAoOccluder("floor")).toBe(false);
    expect(isAoOccluder("door")).toBe(false);
    expect(isAoOccluder(undefined)).toBe(false);
  });

  test("cuenta ortho y diag alrededor", () => {
    const grid: Record<string, TileKind> = {
      "1,0": "wall",
      "-1,0": "furniture",
      "0,1": "floor",
      "1,1": "wall",
    };
    const { ortho, diag } = countAoNeighbors(
      (x, y) => grid[`${x},${y}`],
      0,
      0,
    );
    expect(ortho).toBe(2);
    expect(diag).toBe(1);
  });
});

describe("floorIsOutdoor + floorColorAt", () => {
  test("pocos sólidos = outdoor", () => {
    expect(floorIsOutdoor(0)).toBe(true);
    expect(floorIsOutdoor(OUTDOOR_SOLID_THRESHOLD - 1)).toBe(true);
    expect(floorIsOutdoor(OUTDOOR_SOLID_THRESHOLD)).toBe(false);
  });

  test("floorColorAt combina tint outdoor + AO", () => {
    const open = floorColorAt(4, 4, true, 0, 0);
    const edged = floorColorAt(4, 4, true, 2, 0);
    expect(open).toBe(tintFromTile(4, 4, true));
    expect(edged).not.toBe(open);
    expect(edged).toBe(applyAo(open, aoFactor(2, 0)));
    expect(floorColorAt(1, 1, false, 0, 0)).toBe(INDOOR_FLOOR_COLOR);
  });
});

describe("night ground albedo lift", () => {
  test("knobs: night lift 1.45; day = 1", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.45);
    expect(nightGroundLift(0)).toBe(1.45);
    expect(nightGroundLift(1)).toBe(1);
  });

  test("d=0.08 → ~1.414; clamp fuera de [0,1]", () => {
    expect(nightGroundLift(0.08)).toBeCloseTo(1.414, 5);
    expect(nightGroundLift(-1)).toBe(1.45);
    expect(nightGroundLift(2)).toBe(1);
  });

  test("applyNightGroundLift: noche más claro y verde; día igual", () => {
    const day = applyNightGroundLift(OUTDOOR_GRASS_BASE, 1);
    const night = applyNightGroundLift(OUTDOOR_GRASS_BASE, 0);
    expect(day).toBe(OUTDOOR_GRASS_BASE);
    expect(night).toBe(0x58734d);
    const nr = (night >> 16) & 0xff;
    const ng = (night >> 8) & 0xff;
    const nb = night & 0xff;
    const dr = (day >> 16) & 0xff;
    const dg = (day >> 8) & 0xff;
    const db = day & 0xff;
    expect(nr).toBeGreaterThan(dr);
    expect(ng).toBeGreaterThan(dg);
    expect(nb).toBeGreaterThan(db);
    expect(ng).toBeGreaterThan(nr);
    expect(ng).toBeGreaterThan(nb);
  });

  test("floorColorAt día intacto (lift no entra al tint)", () => {
    expect(floorColorAt(4, 4, true, 0, 0)).toBe(tintFromTile(4, 4, true));
    expect(floorColorAt(1, 1, false, 0, 0)).toBe(INDOOR_FLOOR_COLOR);
  });
});

describe("night leftover indoor floor albedo lift", () => {
  test("indoor ya comparte floorMatByColor + lift 1.45; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.45);
    expect(INDOOR_FLOOR_COLOR).toBe(0x2a2e38);
    expect(OUTDOOR_GRASS_BASE).toBe(0x3d4f35);
    expect(tintFromTile(0, 0, false)).toBe(INDOOR_FLOOR_COLOR);
    expect(floorColorAt(1, 1, false, 0, 0)).toBe(INDOOR_FLOOR_COLOR);
    expect(applyNightGroundLift(INDOOR_FLOOR_COLOR, 1)).toBe(INDOOR_FLOOR_COLOR);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("const color = floorColorAt(x, y, outdoor, ortho, diag)");
    expect(src).toContain("return matForFloorColor(color)");
    expect(src).toContain("color: applyNightGroundLift(key, lastDaylight)");
    expect(src).toMatch(/for \(const \[key, m\] of floorMatByColor\)/);
    expect(src).toContain("m.color.setHex(applyNightGroundLift(key, d))");
    expect(src).not.toMatch(/indoorFloorMat|INDOOR_NIGHT_LIFT/);
  });

  test("noche indoor más claro; mismo multiply 1.45 (sin segundo lift)", () => {
    const night = applyNightGroundLift(INDOOR_FLOOR_COLOR, 0);
    expect(night).toBe(0x3d4351);
    const nr = (night >> 16) & 0xff;
    const ng = (night >> 8) & 0xff;
    const nb = night & 0xff;
    const dr = (INDOOR_FLOOR_COLOR >> 16) & 0xff;
    const dg = (INDOOR_FLOOR_COLOR >> 8) & 0xff;
    const db = INDOOR_FLOOR_COLOR & 0xff;
    expect(nr).toBeGreaterThan(dr);
    expect(ng).toBeGreaterThan(dg);
    expect(nb).toBeGreaterThan(db);
  });
});

describe("night wall albedo lift", () => {
  test("walls reuse ground lift; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.45);
    expect(WALL_COLOR).toBe(0x5a5348);
    expect(WALL_BASE_COLOR).toBe(0x1a1c22);
    expect(applyNightGroundLift(WALL_COLOR, 1)).toBe(WALL_COLOR);
    expect(applyNightGroundLift(WALL_BASE_COLOR, 1)).toBe(WALL_BASE_COLOR);
  });

  test("noche muro más claro; mismo multiply 1.45", () => {
    const night = applyNightGroundLift(WALL_COLOR, 0);
    const baseNight = applyNightGroundLift(WALL_BASE_COLOR, 0);
    expect(night).toBe(0x837868);
    expect(baseNight).toBe(0x262931);
    const nr = (night >> 16) & 0xff;
    const ng = (night >> 8) & 0xff;
    const nb = night & 0xff;
    const dr = (WALL_COLOR >> 16) & 0xff;
    const dg = (WALL_COLOR >> 8) & 0xff;
    const db = WALL_COLOR & 0xff;
    expect(nr).toBeGreaterThan(dr);
    expect(ng).toBeGreaterThan(dg);
    expect(nb).toBeGreaterThan(db);
  });
});

describe("night leftover prop albedo lift", () => {
  test("doors/beds/furniture reuse ground lift; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.45);
    expect(DOOR_CLOSED).toBe(0x8b5a2b);
    expect(DOOR_OPEN).toBe(0xc4a35a);
    expect(FURNITURE_COLOR).toBe(0x6b4f2a);
    expect(BED_COLOR).toBe(0x4a1f3d);
    expect(applyNightGroundLift(DOOR_CLOSED, 1)).toBe(DOOR_CLOSED);
    expect(applyNightGroundLift(DOOR_OPEN, 1)).toBe(DOOR_OPEN);
    expect(applyNightGroundLift(FURNITURE_COLOR, 1)).toBe(FURNITURE_COLOR);
    expect(applyNightGroundLift(BED_COLOR, 1)).toBe(BED_COLOR);
  });

  test("noche props más claros; mismo multiply 1.45", () => {
    expect(applyNightGroundLift(DOOR_CLOSED, 0)).toBe(0xca833e);
    expect(applyNightGroundLift(DOOR_OPEN, 0)).toBe(0xffec83);
    expect(applyNightGroundLift(FURNITURE_COLOR, 0)).toBe(0x9b733d);
    expect(applyNightGroundLift(BED_COLOR, 0)).toBe(0x6b2d58);
    for (const base of [DOOR_CLOSED, DOOR_OPEN, FURNITURE_COLOR, BED_COLOR]) {
      const night = applyNightGroundLift(base, 0);
      const nr = (night >> 16) & 0xff;
      const ng = (night >> 8) & 0xff;
      const nb = night & 0xff;
      const dr = (base >> 16) & 0xff;
      const dg = (base >> 8) & 0xff;
      const db = base & 0xff;
      expect(nr).toBeGreaterThan(dr);
      expect(ng).toBeGreaterThan(dg);
      expect(nb).toBeGreaterThan(db);
    }
  });
});

describe("night leftover roof/window albedo lift", () => {
  test("no hay mesh de techo/ventana; walls ya usan el lift 1.45", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.45);
    expect(WALL_COLOR).toBe(0x5a5348);
    expect(applyNightGroundLift(WALL_COLOR, 1)).toBe(WALL_COLOR);
    const tileSrc = readFileSync(
      resolve(process.cwd(), "src/world/tile.ts"),
      "utf8",
    );
    expect(tileSrc).toContain(
      'export type TileKind = "floor" | "wall" | "door" | "furniture" | "barricade"',
    );
    expect(tileSrc).not.toMatch(/"roof"|"ceiling"|"window"/);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).not.toMatch(
      /roofMat|ceilingMat|windowMat|windowPaneMat|roofGeo|ceilingGeo|windowGeo/,
    );
    expect(viewSrc).not.toMatch(
      /ROOF_NIGHT_LIFT|WINDOW_NIGHT_LIFT|CEILING_NIGHT_LIFT/,
    );
    expect(viewSrc).toContain(
      "wallMat.color.setHex(applyNightGroundLift(WALL_COLOR, d))",
    );
    expect(viewSrc).not.toMatch(/tile\.kind === "(roof|ceiling|window)"/);
    const styleSrc = readFileSync(
      resolve(process.cwd(), "src/render/floorStyle.ts"),
      "utf8",
    );
    expect(styleSrc).not.toMatch(
      /ROOF_COLOR|WINDOW_COLOR|CEILING_COLOR|ROOF_NIGHT_LIFT|WINDOW_NIGHT_LIFT/,
    );
  });
});

describe("night leftover barricade albedo lift", () => {
  test("barricades reuse ground lift; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.45);
    expect(BARRICADE_COLOR).toBe(0xc49a6c);
    expect(BARRICADE_EDGE).toBe(0x8a6239);
    expect(applyNightGroundLift(BARRICADE_COLOR, 1)).toBe(BARRICADE_COLOR);
    expect(applyNightGroundLift(BARRICADE_EDGE, 1)).toBe(BARRICADE_EDGE);
  });

  test("noche barricadas más claras; mismo multiply 1.45", () => {
    expect(applyNightGroundLift(BARRICADE_COLOR, 0)).toBe(0xffdf9d);
    expect(applyNightGroundLift(BARRICADE_EDGE, 0)).toBe(0xc88e53);
    for (const base of [BARRICADE_COLOR, BARRICADE_EDGE]) {
      const night = applyNightGroundLift(base, 0);
      const nr = (night >> 16) & 0xff;
      const ng = (night >> 8) & 0xff;
      const nb = night & 0xff;
      const dr = (base >> 16) & 0xff;
      const dg = (base >> 8) & 0xff;
      const db = base & 0xff;
      expect(nr).toBeGreaterThan(dr);
      expect(ng).toBeGreaterThan(dg);
      expect(nb).toBeGreaterThan(db);
    }
  });
});
