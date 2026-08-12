import { describe, expect, test } from "vitest";
import { makeDoor, makeFloor, makeWall, isWalkable } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { createNeighborhood } from "../src/world/neighborhood";
import { PlayerSim, PLAYER_RADIUS } from "../src/actors/player";
import { GameClock } from "../src/core/clock";
import { DEFAULT_DAY_LENGTH_SEC } from "../src/core/config";

describe("tiles", () => {
  test("walkable: floor sí, wall no, door según open", () => {
    expect(isWalkable(makeFloor())).toBe(true);
    expect(isWalkable(makeWall())).toBe(false);
    expect(isWalkable(makeDoor(false))).toBe(false);
    expect(isWalkable(makeDoor(true))).toBe(true);
    expect(isWalkable(undefined)).toBe(false);
  });
});

describe("TileMap colisión", () => {
  test("canOccupy bloquea paredes y puertas cerradas", () => {
    const map = new TileMap(5, 5, makeFloor);
    map.set(2, 2, makeWall());
    map.set(3, 2, makeDoor(false));

    expect(map.canOccupy(0.5, 0.5, PLAYER_RADIUS)).toBe(true);
    expect(map.canOccupy(2.5, 2.5, PLAYER_RADIUS)).toBe(false);
    expect(map.canOccupy(3.5, 2.5, PLAYER_RADIUS)).toBe(false);

    map.toggleDoor(3, 2);
    expect(map.get(3, 2)?.open).toBe(true);
    expect(map.canOccupy(3.5, 2.5, PLAYER_RADIUS)).toBe(true);
  });

  test("fuera de bounds no es walkable", () => {
    const map = new TileMap(3, 3, makeFloor);
    expect(map.walkable(-1, 0)).toBe(false);
    expect(map.walkable(0, 3)).toBe(false);
  });
});

describe("door toggle", () => {
  test("toggleDoor invierte open y nearestDoor encuentra", () => {
    const map = new TileMap(8, 8, makeFloor);
    map.set(4, 3, makeDoor(false));
    expect(map.toggleDoor(4, 3)).toBe(true);
    expect(map.toggleDoor(4, 3)).toBe(false);
    expect(map.toggleDoor(0, 0)).toBeNull();

    const near = map.nearestDoor(4.2, 3.1, 1.6);
    expect(near).not.toBeNull();
    expect(near?.x).toBe(4);
    expect(near?.y).toBe(3);
  });

  test("player tryToggleDoor cerca de puerta", () => {
    const map = new TileMap(10, 10, makeFloor);
    map.set(5, 5, makeDoor(false));
    const player = new PlayerSim({ x: 5.4, y: 5.2 });
    const r = player.tryToggleDoor(map);
    expect(r).toEqual({ x: 5, y: 5, open: true });
    expect(map.get(5, 5)?.open).toBe(true);
  });

  test("player no abre puerta lejos", () => {
    const map = new TileMap(10, 10, makeFloor);
    map.set(9, 9, makeDoor(false));
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.tryToggleDoor(map)).toBeNull();
  });
});

describe("player movimiento + colisión", () => {
  test("no atraviesa pared", () => {
    const map = new TileMap(6, 6, makeFloor);
    for (let x = 0; x < 6; x++) map.set(x, 3, makeWall());
    const player = new PlayerSim({ x: 2.5, y: 1.5 });
    // Empujar hacia la pared muchas veces
    for (let i = 0; i < 40; i++) {
      player.move(0.05, { x: 0, z: 1 }, map);
    }
    expect(player.y).toBeLessThan(3 - PLAYER_RADIUS + 0.05);
    expect(map.canOccupy(player.x, player.y, PLAYER_RADIUS)).toBe(true);
  });
});

describe("neighborhood", () => {
  test("48x48 con puertas y spawn libre", () => {
    const { map, spawn } = createNeighborhood(48);
    expect(map.width).toBe(48);
    expect(map.height).toBe(48);
    expect(map.countKind("door")).toBeGreaterThan(0);
    expect(map.countKind("wall")).toBeGreaterThan(0);
    expect(map.canOccupy(spawn.x, spawn.y, PLAYER_RADIUS)).toBe(true);
  });

  test("cobertizos y casas densas: doors ≥11 y furniture ≥20", () => {
    const { map, containers } = createNeighborhood(48);
    expect(map.countKind("door")).toBeGreaterThanOrEqual(11);
    expect(map.countKind("furniture")).toBeGreaterThanOrEqual(20);
    expect(containers.list.length).toBe(map.countKind("furniture"));
    // Colisión: spawn sigue libre; escombros de calle intactos
    expect(map.getTile(15, 15)?.kind).toBe("wall");
    expect(map.getTile(28, 28)?.kind).toBe("wall");
  });
});

describe("GameClock", () => {
  test("daylight cicla y advance avanza fase", () => {
    const clock = new GameClock(10);
    expect(clock.phase).toBe(0);
    const night = clock.daylight;
    clock.advance(5); // mediodía
    expect(clock.phase).toBeCloseTo(0.5, 5);
    expect(clock.daylight).toBeGreaterThan(night);
    clock.advance(5);
    expect(clock.phase).toBeCloseTo(0, 5);
  });

  test("DEFAULT_DAY_LENGTH_SEC es jugable (>= 180s)", () => {
    expect(DEFAULT_DAY_LENGTH_SEC).toBeGreaterThanOrEqual(180);
  });
});
