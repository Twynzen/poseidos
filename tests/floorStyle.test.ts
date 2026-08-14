import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  aoFactor,
  applyAo,
  applyNightGroundLift,
  AO_MAX_DARKEN,
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

  test("INDOOR_FLOOR_COLOR 0x2a2e38 × 1.15; tintFromTile indoor still uses it", () => {
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    const r = (INDOOR_FLOOR_COLOR >> 16) & 0xff;
    const g = (INDOOR_FLOOR_COLOR >> 8) & 0xff;
    const b = INDOOR_FLOOR_COLOR & 0xff;
    expect(r).toBe(0x30);
    expect(g).toBe(0x35);
    expect(b).toBe(0x40);
    expect(Math.round(0x2a * 1.15)).toBe(r);
    expect(Math.round(0x2e * 1.15)).toBe(g);
    expect(Math.round(0x38 * 1.15)).toBe(b);
    expect(tintFromTile(0, 0, false)).toBe(INDOOR_FLOOR_COLOR);
    expect(tintFromTile(99, 12, false)).toBe(INDOOR_FLOOR_COLOR);
    expect(floorColorAt(1, 1, false, 0, 0)).toBe(INDOOR_FLOOR_COLOR);
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
    expect(WALL_COLOR).toBe(0x685f53);
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(AO_MAX_DARKEN).toBe(0.261);
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

  test("first outdoor swatch from OUTDOOR_GRASS_BASE 0x3d4f35 × 1.15", () => {
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
    const r0 = (OUTDOOR_GRASS_BASE >> 16) & 0xff;
    const g0 = (OUTDOOR_GRASS_BASE >> 8) & 0xff;
    const b0 = OUTDOOR_GRASS_BASE & 0xff;
    expect(r0).toBe(0x46);
    expect(g0).toBe(0x5b);
    expect(b0).toBe(0x3d);
    expect(Math.round(0x3d * 1.15)).toBe(r0);
    expect(Math.round(0x4f * 1.15)).toBe(g0);
    expect(Math.round(0x35 * 1.15)).toBe(b0);

    let found = false;
    for (let y = 0; y < 32 && !found; y++) {
      for (let x = 0; x < 32 && !found; x++) {
        const t = tileSeed01(x, y);
        if (Math.floor(t * 8) !== 0) continue;
        const j = tileSeed01(y, x);
        const dr = Math.floor((j - 0.5) * 12);
        const dg = Math.floor((t - 0.5) * 10);
        const db = Math.floor((j * t - 0.25) * 8);
        const clamp = (n: number) => Math.max(0, Math.min(255, n | 0));
        const expected =
          (clamp(r0 + dr) << 16) | (clamp(g0 + dg) << 8) | clamp(b0 + db);
        expect(tintFromTile(x, y, true)).toBe(expected);
        found = true;
      }
    }
    expect(found).toBe(true);

    const src = readFileSync(
      resolve(process.cwd(), "src/render/floorStyle.ts"),
      "utf8",
    );
    expect(src).toContain("(OUTDOOR_GRASS_BASE >> 16) & 0xff");
    expect(src).toContain("(OUTDOOR_GRASS_BASE >> 8) & 0xff");
    expect(src).toContain("OUTDOOR_GRASS_BASE & 0xff");
    expect(src).toContain("[0x45, 0x58, 0x38]");
    expect(src).toContain("[0x34, 0x42, 0x2e]");
    expect(src).toContain("[0x4a, 0x52, 0x3a]");
    expect(src).toContain("[0x3e, 0x4a, 0x36]");
    expect(src).toContain("[0x52, 0x5a, 0x40]");
    expect(src).toContain("[0x2e, 0x3c, 0x2a]");
    expect(src).toContain("[0x48, 0x5e, 0x3c]");
    expect(src).not.toContain("[0x3a, 0x4e, 0x32]");
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    expect(WALL_COLOR).toBe(0x685f53);
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(AO_MAX_DARKEN).toBe(0.261);
  });
});

describe("aoFactor + applyAo", () => {
  test("AO_MAX_DARKEN 0.3 × 0.87; lift/paleta iguales", () => {
    expect(AO_MAX_DARKEN).toBe(0.261);
    expect(AO_MAX_DARKEN).toBeCloseTo(0.3 * 0.87, 10);
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(GROUND_NIGHT_LIFT).toBeCloseTo(1.45 * 1.15, 10);
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
    expect(WALL_COLOR).toBe(0x685f53);
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    expect(applyAo(0xffffff, 0)).toBe(0xffffff);
    expect(applyAo(0xffffff, 1)).toBe(0xbcbcbc);
  });

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
  test("knobs: night lift 1.45 × 1.15; day = 1", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(GROUND_NIGHT_LIFT).toBeCloseTo(1.45 * 1.15, 10);
    expect(AO_MAX_DARKEN).toBe(0.261);
    expect(nightGroundLift(0)).toBe(1.6675);
    expect(nightGroundLift(1)).toBe(1);
  });

  test("d=0.08 → ~1.6141; clamp fuera de [0,1]", () => {
    expect(nightGroundLift(0.08)).toBeCloseTo(1.6141, 5);
    expect(nightGroundLift(-1)).toBe(1.6675);
    expect(nightGroundLift(2)).toBe(1);
  });

  test("applyNightGroundLift: noche más claro y verde; día igual", () => {
    const day = applyNightGroundLift(OUTDOOR_GRASS_BASE, 1);
    const night = applyNightGroundLift(OUTDOOR_GRASS_BASE, 0);
    expect(day).toBe(OUTDOOR_GRASS_BASE);
    expect(night).toBe(0x759866);
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
  test("indoor ya comparte floorMatByColor + lift 1.6675; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
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

  test("noche indoor más claro; mismo multiply 1.6675 (sin segundo lift)", () => {
    const night = applyNightGroundLift(INDOOR_FLOOR_COLOR, 0);
    expect(night).toBe(0x50586b);
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
  test("WALL_COLOR 0x5a5348 × 1.15; worldView still uses it", () => {
    expect(WALL_COLOR).toBe(0x685f53);
    const r = (WALL_COLOR >> 16) & 0xff;
    const g = (WALL_COLOR >> 8) & 0xff;
    const b = WALL_COLOR & 0xff;
    expect(r).toBe(0x68);
    expect(g).toBe(0x5f);
    expect(b).toBe(0x53);
    expect(Math.round((0x5a * 115) / 100)).toBe(r);
    expect(Math.round((0x53 * 115) / 100)).toBe(g);
    expect(Math.round((0x48 * 115) / 100)).toBe(b);
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(AO_MAX_DARKEN).toBe(0.261);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "wallMat.color.setHex(applyNightGroundLift(WALL_COLOR, d))",
    );
    expect(viewSrc).toContain(
      "color: applyNightGroundLift(WALL_COLOR, lastDaylight)",
    );
  });

  test("WALL_BASE_COLOR 0x1a1c22 × 1.15; worldView still uses it", () => {
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    const r = (WALL_BASE_COLOR >> 16) & 0xff;
    const g = (WALL_BASE_COLOR >> 8) & 0xff;
    const b = WALL_BASE_COLOR & 0xff;
    expect(r).toBe(0x1e);
    expect(g).toBe(0x20);
    expect(b).toBe(0x27);
    expect(Math.round((0x1a * 115) / 100)).toBe(r);
    expect(Math.round((0x1c * 115) / 100)).toBe(g);
    expect(Math.round((0x22 * 115) / 100)).toBe(b);
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
    expect(WALL_COLOR).toBe(0x685f53);
    expect(DOOR_CLOSED).toBe(0xa06831);
    expect(DOOR_OPEN).toBe(0xc4a35a);
    expect(FURNITURE_COLOR).toBe(0x6b4f2a);
    expect(BED_COLOR).toBe(0x4a1f3d);
    expect(BARRICADE_COLOR).toBe(0xc49a6c);
    expect(BARRICADE_EDGE).toBe(0x8a6239);
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(AO_MAX_DARKEN).toBe(0.261);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "wallBaseMat.color.setHex(applyNightGroundLift(WALL_BASE_COLOR, d))",
    );
    expect(viewSrc).toContain(
      "color: applyNightGroundLift(WALL_BASE_COLOR, lastDaylight)",
    );
  });

  test("walls reuse ground lift; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(WALL_COLOR).toBe(0x685f53);
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    expect(applyNightGroundLift(WALL_COLOR, 1)).toBe(WALL_COLOR);
    expect(applyNightGroundLift(WALL_BASE_COLOR, 1)).toBe(WALL_BASE_COLOR);
  });

  test("noche muro más claro; mismo multiply 1.6675", () => {
    const night = applyNightGroundLift(WALL_COLOR, 0);
    const baseNight = applyNightGroundLift(WALL_BASE_COLOR, 0);
    expect(night).toBe(0xad9e8a);
    expect(baseNight).toBe(0x323541);
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
  test("DOOR_CLOSED 0x8b5a2b × 1.15; worldView still uses it", () => {
    expect(DOOR_CLOSED).toBe(0xa06831);
    const r = (DOOR_CLOSED >> 16) & 0xff;
    const g = (DOOR_CLOSED >> 8) & 0xff;
    const b = DOOR_CLOSED & 0xff;
    expect(r).toBe(0xa0);
    expect(g).toBe(0x68);
    expect(b).toBe(0x31);
    expect(Math.round((0x8b * 115) / 100)).toBe(r);
    expect(Math.round((0x5a * 115) / 100)).toBe(g);
    expect(Math.round((0x2b * 115) / 100)).toBe(b);
    expect(INDOOR_FLOOR_COLOR).toBe(0x303540);
    expect(OUTDOOR_GRASS_BASE).toBe(0x465b3d);
    expect(WALL_COLOR).toBe(0x685f53);
    expect(WALL_BASE_COLOR).toBe(0x1e2027);
    expect(DOOR_OPEN).toBe(0xc4a35a);
    expect(FURNITURE_COLOR).toBe(0x6b4f2a);
    expect(BED_COLOR).toBe(0x4a1f3d);
    expect(BARRICADE_COLOR).toBe(0xc49a6c);
    expect(BARRICADE_EDGE).toBe(0x8a6239);
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(AO_MAX_DARKEN).toBe(0.261);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "doorClosedMat.color.setHex(applyNightGroundLift(DOOR_CLOSED, d))",
    );
    expect(viewSrc).toContain(
      "color: applyNightGroundLift(DOOR_CLOSED, lastDaylight)",
    );
  });

  test("doors/beds/furniture reuse ground lift; day = identity", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(DOOR_CLOSED).toBe(0xa06831);
    expect(DOOR_OPEN).toBe(0xc4a35a);
    expect(FURNITURE_COLOR).toBe(0x6b4f2a);
    expect(BED_COLOR).toBe(0x4a1f3d);
    expect(applyNightGroundLift(DOOR_CLOSED, 1)).toBe(DOOR_CLOSED);
    expect(applyNightGroundLift(DOOR_OPEN, 1)).toBe(DOOR_OPEN);
    expect(applyNightGroundLift(FURNITURE_COLOR, 1)).toBe(FURNITURE_COLOR);
    expect(applyNightGroundLift(BED_COLOR, 1)).toBe(BED_COLOR);
  });

  test("noche props más claros; mismo multiply 1.6675", () => {
    expect(applyNightGroundLift(DOOR_CLOSED, 0)).toBe(0xffad52);
    expect(applyNightGroundLift(DOOR_OPEN, 0)).toBe(0xffff96);
    expect(applyNightGroundLift(FURNITURE_COLOR, 0)).toBe(0xb28446);
    expect(applyNightGroundLift(BED_COLOR, 0)).toBe(0x7b3466);
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
  test("no hay mesh de techo/ventana; walls ya usan el lift 1.6675", () => {
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(WALL_COLOR).toBe(0x685f53);
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
    expect(GROUND_NIGHT_LIFT).toBe(1.6675);
    expect(BARRICADE_COLOR).toBe(0xc49a6c);
    expect(BARRICADE_EDGE).toBe(0x8a6239);
    expect(applyNightGroundLift(BARRICADE_COLOR, 1)).toBe(BARRICADE_COLOR);
    expect(applyNightGroundLift(BARRICADE_EDGE, 1)).toBe(BARRICADE_EDGE);
  });

  test("noche barricadas más claras; mismo multiply 1.6675", () => {
    expect(applyNightGroundLift(BARRICADE_COLOR, 0)).toBe(0xffffb4);
    expect(applyNightGroundLift(BARRICADE_EDGE, 0)).toBe(0xe6a35f);
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
