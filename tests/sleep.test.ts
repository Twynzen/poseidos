import { describe, expect, test } from "vitest";
import { TileMap } from "../src/world/tilemap";
import {
  isBedTile,
  makeBed,
  makeFloor,
  makeFurniture,
  makeWall,
} from "../src/world/tile";
import { isIndoor } from "../src/world/indoor";
import { createNeeds } from "../src/actors/needs";
import { GameClock } from "../src/core/clock";
import {
  BED_RADIUS,
  SLEEP_FATIGUE_RELIEF,
  SLEEP_FLOOR_FATIGUE_RELIEF,
  SLEEP_FLOOR_HOURS,
  SLEEP_HOSTILE_RADIUS,
  SLEEP_HOURS,
  hostileNearby,
  isSafehouseHint,
  nearBed,
  sleepWakeLabel,
  trySleep,
} from "../src/actors/sleep";
import { createNeighborhood } from "../src/world/neighborhood";

function openYard(): TileMap {
  return new TileMap(16, 16, makeFloor);
}

/** Habitación con furniture genérico (NO cama) → siesta de suelo. */
function room(): TileMap {
  const map = new TileMap(16, 16, makeFloor);
  for (let y = 4; y <= 8; y++) {
    for (let x = 4; x <= 8; x++) {
      const edge = x === 4 || x === 8 || y === 4 || y === 8;
      map.set(x, y, edge ? makeWall() : makeFloor());
    }
  }
  map.set(6, 6, makeFurniture());
  return map;
}

/** Misma habitación pero con cama. */
function roomWithBed(): TileMap {
  const map = room();
  map.set(6, 6, makeBed());
  return map;
}

describe("isBedTile / nearBed", () => {
  test("isBedTile solo furniture+variant bed", () => {
    expect(isBedTile(undefined)).toBe(false);
    expect(isBedTile(makeFloor())).toBe(false);
    expect(isBedTile(makeFurniture())).toBe(false);
    expect(isBedTile(makeBed())).toBe(true);
    expect(makeBed().variant).toBe("bed");
    expect(makeFurniture().variant).toBeUndefined();
  });

  test("nearBed radio Chebyshev 1", () => {
    const map = new TileMap(10, 10, makeFloor);
    map.set(5, 5, makeBed());
    expect(nearBed(map, 5.5, 5.5)).toBe(true);
    expect(nearBed(map, 6.5, 5.5, BED_RADIUS)).toBe(true); // d=1
    expect(nearBed(map, 6.5, 6.5, BED_RADIUS)).toBe(true); // d=1 diagonal
    expect(nearBed(map, 7.5, 5.5, BED_RADIUS)).toBe(false); // d=2
    expect(nearBed(map, 5.5, 5.5, 0)).toBe(true); // misma celda
    expect(nearBed(openYard(), 5.5, 5.5)).toBe(false);
  });
});

describe("trySleep", () => {
  test("indoor + cama: onBed, relief 60, hours 7", () => {
    const map = roomWithBed();
    expect(isIndoor(map, 6.5, 7.2)).toBe(true);
    expect(nearBed(map, 6.5, 7.2)).toBe(true);
    const needs = createNeeds({ fatigue: 70 });
    const clock = new GameClock(48);
    const before = clock.elapsed;
    const result = trySleep(needs, clock, map, 6.5, 7.2, []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.onBed).toBe(true);
    expect(result.message).toMatch(/^dormiste en la cama hasta /);
    expect(result.hours).toBe(SLEEP_HOURS);
    expect(needs.fatigue).toBeCloseTo(Math.max(0, 70 - SLEEP_FATIGUE_RELIEF), 5);
    expect(clock.elapsed - before).toBeCloseTo(
      (SLEEP_HOURS / 24) * clock.dayLengthSec,
      5,
    );
  });

  test("indoor sin cama: onBed false, floor nap 30/4", () => {
    const map = room();
    expect(nearBed(map, 6.5, 7.2)).toBe(false);
    const needs = createNeeds({ fatigue: 70 });
    const clock = new GameClock(48);
    const before = clock.elapsed;
    const result = trySleep(needs, clock, map, 6.5, 7.2, []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.onBed).toBe(false);
    expect(result.message).toMatch(/^dormiste en el suelo hasta /);
    expect(result.hours).toBe(SLEEP_FLOOR_HOURS);
    expect(needs.fatigue).toBeCloseTo(
      Math.max(0, 70 - SLEEP_FLOOR_FATIGUE_RELIEF),
      5,
    );
    expect(clock.elapsed - before).toBeCloseTo(
      (SLEEP_FLOOR_HOURS / 24) * clock.dayLengthSec,
      5,
    );
  });

  test("fail outdoor", () => {
    const map = openYard();
    expect(isIndoor(map, 8.5, 8.5)).toBe(false);
    const needs = createNeeds({ fatigue: 80 });
    const clock = new GameClock(48);
    const result = trySleep(needs, clock, map, 8.5, 8.5, []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("outdoor");
    expect(result.message).toBe("no puedes dormir aquí");
    expect(needs.fatigue).toBe(80);
    expect(clock.elapsed).toBe(0);
  });

  test("fail con hostile cerca (<6)", () => {
    const map = roomWithBed();
    const needs = createNeeds({ fatigue: 55 });
    const clock = new GameClock(48);
    const hostiles = [{ x: 6.5 + 3, y: 7.2, health: 10 }];
    expect(hostileNearby(hostiles, 6.5, 7.2, SLEEP_HOSTILE_RADIUS)).toBe(true);
    const result = trySleep(needs, clock, map, 6.5, 7.2, hostiles);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("hostile");
    expect(result.message).toMatch(/amenaza/);
    expect(needs.fatigue).toBe(55);
    expect(clock.elapsed).toBe(0);
  });

  test("hostile lejos (>=6) no bloquea", () => {
    const map = room();
    const needs = createNeeds({ fatigue: 50 });
    const clock = new GameClock(48);
    const hostiles = [{ x: 6.5 + 6, y: 7.2, health: 10 }];
    expect(hostileNearby(hostiles, 6.5, 7.2)).toBe(false);
    const result = trySleep(needs, clock, map, 6.5, 7.2, hostiles);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.onBed).toBe(false);
  });

  test("clock con cama avanza ~7/24 del ciclo", () => {
    const map = roomWithBed();
    const needs = createNeeds({ fatigue: 40 });
    const clock = new GameClock(24);
    trySleep(needs, clock, map, 6.5, 7.2, []);
    expect(clock.elapsed).toBeCloseTo(SLEEP_HOURS, 5);
    expect(clock.phase).toBeCloseTo((SLEEP_HOURS / 24) % 1, 5);
  });

  test("fatigue a 0 no baja de 0 (suelo)", () => {
    const map = room();
    const needs = createNeeds({ fatigue: 10 });
    const clock = new GameClock(48);
    const result = trySleep(needs, clock, map, 6.5, 7.2, []);
    expect(result.ok).toBe(true);
    expect(needs.fatigue).toBe(0);
  });
});

describe("safehouse hint + labels + neighborhood beds", () => {
  test("furniture cerca = safehouse hint indoor", () => {
    const map = room();
    expect(isSafehouseHint(map, 6.5, 7.2)).toBe(true);
    expect(isSafehouseHint(openYard(), 8.5, 8.5)).toBe(false);
  });

  test("cama sola indoor = safehouse hint", () => {
    const map = roomWithBed();
    expect(isSafehouseHint(map, 6.5, 7.2)).toBe(true);
  });

  test("sleepWakeLabel cubre franjas", () => {
    expect(sleepWakeLabel(0)).toMatch(/madrugada|noche/);
    expect(sleepWakeLabel(0.5)).toMatch(/mediodía|mañana/);
    expect(typeof sleepWakeLabel(0.9)).toBe("string");
  });

  test("barrio tiene ≥2 camas alcanzables", () => {
    const { map } = createNeighborhood(48);
    let beds = 0;
    map.forEach((_x, _y, tile) => {
      if (isBedTile(tile)) beds++;
    });
    expect(beds).toBeGreaterThanOrEqual(2);
    expect(isBedTile(map.getTile(6, 6))).toBe(true);
    expect(isBedTile(map.getTile(24, 22))).toBe(true);
    // Jugador puede estar indoor cerca de la cama spawn-house
    expect(isIndoor(map, 24.5, 23.5)).toBe(true);
    expect(nearBed(map, 24.5, 23.5)).toBe(true);
  });
});
