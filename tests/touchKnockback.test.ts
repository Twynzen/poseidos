import { describe, expect, test } from "vitest";
import { makeFloor, makeWall } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { PlayerSim, PLAYER_RADIUS } from "../src/actors/player";
import {
  TOUCH_KNOCKBACK_DIST,
  knockbackFromTouch,
  tryApplyTouchKnockback,
} from "../src/combat";

function openMap(w = 12, h = 8): TileMap {
  const map = new TileMap(w, h, makeFloor);
  for (let x = 0; x < w; x++) {
    map.set(x, 0, makeWall());
    map.set(x, h - 1, makeWall());
  }
  for (let y = 0; y < h; y++) {
    map.set(0, y, makeWall());
    map.set(w - 1, y, makeWall());
  }
  return map;
}

describe("knockbackFromTouch", () => {
  test("dirección: aleja al player del hostil", () => {
    const east = knockbackFromTouch(5.5, 4.5, 4.5, 4.5);
    expect(east.x).toBeCloseTo(TOUCH_KNOCKBACK_DIST);
    expect(east.y).toBeCloseTo(0);

    const south = knockbackFromTouch(5.5, 5.5, 5.5, 4.5);
    expect(south.x).toBeCloseTo(0);
    expect(south.y).toBeCloseTo(TOUCH_KNOCKBACK_DIST);

    const diag = knockbackFromTouch(6, 6, 5, 5);
    const len = Math.hypot(diag.x, diag.y);
    expect(len).toBeCloseTo(TOUCH_KNOCKBACK_DIST);
    expect(diag.x).toBeGreaterThan(0);
    expect(diag.y).toBeGreaterThan(0);
    expect(diag.x).toBeCloseTo(diag.y);
  });

  test("overlap casi cero usa fallback +X estable", () => {
    const same = knockbackFromTouch(3, 3, 3, 3);
    expect(same).toEqual({ x: TOUCH_KNOCKBACK_DIST, y: 0 });

    const tiny = knockbackFromTouch(3, 3, 3 + 1e-12, 3);
    expect(tiny).toEqual({ x: TOUCH_KNOCKBACK_DIST, y: 0 });

    const custom = knockbackFromTouch(1, 1, 1, 1, 0.8);
    expect(custom).toEqual({ x: 0.8, y: 0 });
  });
});

describe("tryApplyTouchKnockback", () => {
  test("full (nx,ny) si el destino está libre", () => {
    const map = openMap();
    const player = new PlayerSim({ x: 5.5, y: 4.5 });
    const moved = tryApplyTouchKnockback(player, { x: 4.5, y: 4.5 }, map);
    expect(moved).toBe(true);
    expect(player.x).toBeCloseTo(5.5 + TOUCH_KNOCKBACK_DIST);
    expect(player.y).toBeCloseTo(4.5);
    expect(map.canOccupy(player.x, player.y, PLAYER_RADIUS)).toBe(true);
  });

  test("slide X si full bloqueado pero (nx, y) libre", () => {
    const map = openMap();
    for (let x = 0; x < 12; x++) map.set(x, 3, makeWall());
    const player = new PlayerSim({ x: 2.5, y: 2.5 });
    const ox = player.x;
    const oy = player.y;
    const moved = tryApplyTouchKnockback(player, { x: 2.1, y: 2.1 }, map);
    expect(moved).toBe(true);
    expect(player.x).toBeGreaterThan(ox);
    expect(player.y).toBe(oy);
    expect(map.canOccupy(player.x, player.y, PLAYER_RADIUS)).toBe(true);
  });

  test("slide Y si full y slide X bloqueados", () => {
    const map = openMap();
    for (let y = 0; y < 8; y++) map.set(3, y, makeWall());
    const player = new PlayerSim({ x: 2.5, y: 2.5 });
    const ox = player.x;
    const oy = player.y;
    const moved = tryApplyTouchKnockback(player, { x: 2.1, y: 2.1 }, map);
    expect(moved).toBe(true);
    expect(player.x).toBe(ox);
    expect(player.y).toBeGreaterThan(oy);
    expect(map.canOccupy(player.x, player.y, PLAYER_RADIUS)).toBe(true);
  });

  test("blocked: no mueve si full y ambos slides chocan", () => {
    const map = openMap();
    for (let x = 0; x < 12; x++) map.set(x, 3, makeWall());
    for (let y = 0; y < 8; y++) map.set(3, y, makeWall());
    const player = new PlayerSim({ x: 2.5, y: 2.5 });
    const ox = player.x;
    const oy = player.y;
    const moved = tryApplyTouchKnockback(player, { x: 2.1, y: 2.1 }, map);
    expect(moved).toBe(false);
    expect(player.x).toBe(ox);
    expect(player.y).toBe(oy);
  });
});
