import { describe, expect, test } from "vitest";
import {
  makeDoor,
  makeFloor,
  makeWall,
  blocksSight,
} from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import {
  bresenhamLine,
  hasLineOfSight,
  computeVisibleTiles,
  tileKey,
  DEFAULT_FOV_RADIUS,
} from "../src/world/los";

describe("blocksSight", () => {
  test("wall y puerta cerrada bloquean; floor y puerta abierta no", () => {
    expect(blocksSight(makeWall())).toBe(true);
    expect(blocksSight(makeDoor(false))).toBe(true);
    expect(blocksSight(makeDoor(true))).toBe(false);
    expect(blocksSight(makeFloor())).toBe(false);
    expect(blocksSight(undefined)).toBe(true);
  });
});

describe("bresenhamLine", () => {
  test("horizontal y vertical incluyen extremos", () => {
    expect(bresenhamLine(0, 0, 3, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(bresenhamLine(2, 2, 2, 0)).toEqual([
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ]);
  });

  test("mismo punto", () => {
    expect(bresenhamLine(1, 1, 1, 1)).toEqual([{ x: 1, y: 1 }]);
  });
});

describe("hasLineOfSight", () => {
  test("espacio abierto: LOS libre", () => {
    const map = new TileMap(8, 8, makeFloor);
    expect(hasLineOfSight(map, 1, 1, 6, 1)).toBe(true);
    expect(hasLineOfSight(map, 0, 0, 5, 5)).toBe(true);
  });

  test("pared intermedia bloquea; se ve la pared destino", () => {
    const map = new TileMap(8, 8, makeFloor);
    map.set(3, 1, makeWall());
    expect(hasLineOfSight(map, 1, 1, 5, 1)).toBe(false);
    expect(hasLineOfSight(map, 1, 1, 3, 1)).toBe(true);
  });

  test("puerta cerrada bloquea; abierta deja pasar", () => {
    const map = new TileMap(8, 8, makeFloor);
    map.set(3, 2, makeDoor(false));
    expect(hasLineOfSight(map, 1, 2, 5, 2)).toBe(false);
    expect(hasLineOfSight(map, 1, 2, 3, 2)).toBe(true); // se ve la puerta

    map.toggleDoor(3, 2);
    expect(map.get(3, 2)?.open).toBe(true);
    expect(hasLineOfSight(map, 1, 2, 5, 2)).toBe(true);
  });

  test("mismo tile siempre visible", () => {
    const map = new TileMap(4, 4, makeFloor);
    expect(hasLineOfSight(map, 2, 2, 2, 2)).toBe(true);
  });
});

describe("computeVisibleTiles", () => {
  test("incluye origen y respeta radio", () => {
    const map = new TileMap(20, 20, makeFloor);
    const vis = computeVisibleTiles(map, 10.2, 10.7, 3);
    expect(vis.has(tileKey(10, 10))).toBe(true);
    expect(vis.has(tileKey(10, 13))).toBe(true);
    expect(vis.has(tileKey(10, 14))).toBe(false); // fuera de radio 3
    expect(vis.size).toBeGreaterThan(1);
  });

  test("pared oculta tiles detrás", () => {
    const map = new TileMap(10, 5, makeFloor);
    for (let y = 0; y < 5; y++) map.set(4, y, makeWall());
    const vis = computeVisibleTiles(map, 2.5, 2.5, 8);
    expect(vis.has(tileKey(4, 2))).toBe(true); // pared visible
    expect(vis.has(tileKey(5, 2))).toBe(false); // detrás
    expect(vis.has(tileKey(3, 2))).toBe(true);
  });

  test("puerta abierta revela interior; cerrada no", () => {
    const map = new TileMap(12, 7, makeFloor);
    // Habitación: paredes en x=5, hueco puerta en (5,3)
    for (let y = 0; y < 7; y++) {
      if (y !== 3) map.set(5, y, makeWall());
    }
    map.set(5, 3, makeDoor(false));

    const closed = computeVisibleTiles(map, 2.5, 3.5, 8);
    expect(closed.has(tileKey(5, 3))).toBe(true);
    expect(closed.has(tileKey(7, 3))).toBe(false);

    map.toggleDoor(5, 3);
    const open = computeVisibleTiles(map, 2.5, 3.5, 8);
    expect(open.has(tileKey(7, 3))).toBe(true);
  });

  test("DEFAULT_FOV_RADIUS es positivo", () => {
    expect(DEFAULT_FOV_RADIUS).toBeGreaterThan(0);
  });
});
