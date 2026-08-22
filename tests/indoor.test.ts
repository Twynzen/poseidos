import { describe, expect, test } from "vitest";
import { TileMap } from "../src/world/tilemap";
import {
  makeFloor,
  makeFurniture,
  makeWall,
} from "../src/world/tile";
import {
  isIndoor,
  warmLightAnchor,
  warmLightAfterRestart,
  warmLightFromClock,
  warmLightIntensity,
  INDOOR_SOLID_THRESHOLD,
} from "../src/world/indoor";
import { GameClock, clockAfterRestart } from "../src/core/clock";
import { DEFAULT_DAY_LENGTH_SEC } from "../src/core/config";

function openYard(): TileMap {
  // 16x16 todo floor — outdoor
  return new TileMap(16, 16, makeFloor);
}

function room(): TileMap {
  const map = new TileMap(16, 16, makeFloor);
  // Habitación 5x5 en (4,4)-(8,8)
  for (let y = 4; y <= 8; y++) {
    for (let x = 4; x <= 8; x++) {
      const edge = x === 4 || x === 8 || y === 4 || y === 8;
      map.set(x, y, edge ? makeWall() : makeFloor());
    }
  }
  map.set(6, 6, makeFurniture());
  return map;
}

describe("isIndoor heuristic", () => {
  test("calle abierta = outdoor", () => {
    const map = openYard();
    expect(isIndoor(map, 8.5, 8.5)).toBe(false);
  });

  test("interior de habitación con muros = indoor", () => {
    const map = room();
    expect(isIndoor(map, 6.5, 6.5)).toBe(true);
    // umbral documentado
    expect(INDOOR_SOLID_THRESHOLD).toBeGreaterThanOrEqual(3);
  });

  test("tile furniture = indoor aunque aislado", () => {
    const map = openYard();
    map.set(3, 3, makeFurniture());
    expect(isIndoor(map, 3.2, 3.2)).toBe(true);
  });
});

describe("warm light", () => {
  test("ancla a furniture cercano o al player", () => {
    const map = room();
    const a = warmLightAnchor(map, 6.5, 7.2);
    expect(a.fromFurniture).toBe(true);
    expect(a.x).toBeCloseTo(6.5, 5);
    expect(a.y).toBeCloseTo(6.5, 5);

    const open = openYard();
    const b = warmLightAnchor(open, 2.2, 2.4);
    expect(b.fromFurniture).toBe(false);
    expect(b.x).toBeCloseTo(2.2, 5);
  });

  test("intensidad solo indoor + daylight bajo", () => {
    expect(warmLightIntensity(false, 0.1)).toBe(0);
    expect(warmLightIntensity(true, 1)).toBe(0);
    expect(warmLightIntensity(true, 0.08)).toBeGreaterThan(0.5);
    expect(warmLightIntensity(true, 0.4)).toBeGreaterThan(0);
    expect(warmLightIntensity(true, 0.4)).toBeLessThan(0.2);
  });
});

describe("warmLightAfterRestart (R / softReset)", () => {
  test("noche indoor fresco; leftover noon / outdoor no filtra", () => {
    const clock = clockAfterRestart();
    expect(clock.daylight).toBeCloseTo(0.08, 10);
    expect(warmLightAfterRestart(false)).toBe(0);
    expect(warmLightAfterRestart(true)).toBeGreaterThan(0.5);
    expect(warmLightAfterRestart(true)).toBe(
      warmLightFromClock(true, clock),
    );
    expect(warmLightAfterRestart(true)).toBe(
      warmLightIntensity(true, clock.daylight),
    );

    const leftoverNoon = new GameClock(DEFAULT_DAY_LENGTH_SEC);
    leftoverNoon.elapsed = DEFAULT_DAY_LENGTH_SEC * 0.5;
    expect(leftoverNoon.daylight).toBeCloseTo(1, 5);
    expect(warmLightFromClock(true, leftoverNoon)).toBe(0);
    expect(warmLightFromClock(true, leftoverNoon)).not.toBe(
      warmLightAfterRestart(true),
    );
    expect(warmLightFromClock(false, leftoverNoon)).toBe(0);
  });

  test("vivo tick no usa el helper (advance apaga warm)", () => {
    const clock = clockAfterRestart();
    expect(warmLightFromClock(true, clock)).toBe(warmLightAfterRestart(true));
    clock.advance(DEFAULT_DAY_LENGTH_SEC * 0.5);
    expect(warmLightFromClock(true, clock)).toBe(0);
    expect(warmLightFromClock(true, clock)).not.toBe(
      warmLightAfterRestart(true),
    );
  });
});
