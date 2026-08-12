import { describe, expect, test } from "vitest";
import {
  makeBarricade,
  makeDoor,
  makeFloor,
  makeWall,
} from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { findPath, nextStep } from "../src/world/pathfinding";

function openMap(w = 12, h = 12): TileMap {
  return new TileMap(w, h, makeFloor);
}

describe("findPath A*", () => {
  test("camino recto en espacio abierto", () => {
    const map = openMap();
    const path = findPath(map, { x: 1, y: 1 }, { x: 5, y: 1 });
    expect(path[0]).toEqual({ x: 1, y: 1 });
    expect(path[path.length - 1]).toEqual({ x: 5, y: 1 });
    expect(path.length).toBe(5);
  });

  test("mismo tile → camino de un punto", () => {
    const map = openMap();
    expect(findPath(map, { x: 3, y: 3 }, { x: 3, y: 3 })).toEqual([
      { x: 3, y: 3 },
    ]);
  });

  test("evita muros y encuentra desvío", () => {
    const map = openMap();
    // Muro vertical con hueco abajo
    for (let y = 0; y < 8; y++) map.set(4, y, makeWall());
    map.set(4, 7, makeFloor()); // paso
    const path = findPath(map, { x: 2, y: 2 }, { x: 6, y: 2 });
    expect(path.length).toBeGreaterThan(0);
    expect(path.some((p) => p.x === 4 && p.y === 7)).toBe(true);
    for (const p of path) {
      expect(map.walkable(p.x, p.y)).toBe(true);
    }
  });

  test("barricada bloquea como muro", () => {
    const map = openMap();
    for (let y = 0; y < map.height; y++) map.set(5, y, makeBarricade());
    const path = findPath(map, { x: 2, y: 5 }, { x: 8, y: 5 });
    expect(path).toEqual([]);
  });

  test("puerta cerrada bloquea; abierta permite paso", () => {
    const map = openMap();
    for (let y = 0; y < map.height; y++) map.set(5, y, makeWall());
    map.set(5, 5, makeDoor(false));
    expect(findPath(map, { x: 2, y: 5 }, { x: 8, y: 5 })).toEqual([]);
    map.set(5, 5, makeDoor(true));
    const openPath = findPath(map, { x: 2, y: 5 }, { x: 8, y: 5 });
    expect(openPath.length).toBeGreaterThan(0);
    expect(openPath.some((p) => p.x === 5 && p.y === 5)).toBe(true);
  });

  test("fuera de bounds / meta no walkable → []", () => {
    const map = openMap();
    map.set(5, 5, makeWall());
    expect(findPath(map, { x: 1, y: 1 }, { x: 5, y: 5 })).toEqual([]);
    expect(findPath(map, { x: -1, y: 0 }, { x: 2, y: 2 })).toEqual([]);
  });

  test("nextStep da vecino hacia goal", () => {
    const map = openMap();
    const step = nextStep(map, { x: 1, y: 1 }, { x: 4, y: 1 });
    expect(step).toEqual({ x: 2, y: 1 });
    expect(nextStep(map, { x: 1, y: 1 }, { x: 1, y: 1 })).toBeNull();
  });
});
