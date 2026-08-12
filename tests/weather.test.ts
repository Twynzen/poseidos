import { describe, expect, test } from "vitest";
import {
  WeatherSystem,
  rainNeedsMult,
  isNightPhase,
  RAIN_THIRST_MULT,
  RAIN_FATIGUE_MULT,
  WEATHER_CHECK_SEC,
} from "../src/world/weather";
import { createNeeds, tickNeeds, NEEDS_RATE } from "../src/actors/needs";
import { TileMap } from "../src/world/tilemap";
import { makeFloor, makeFurniture, makeWall } from "../src/world/tile";
import { isIndoor } from "../src/world/indoor";

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length]!;
    i++;
    return v;
  };
}

function openYard(): TileMap {
  return new TileMap(16, 16, makeFloor);
}

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

describe("WeatherSystem", () => {
  test("inicia clear con intensity 0; API isRaining/intensity", () => {
    const w = new WeatherSystem({ initial: "clear" });
    expect(w.kind).toBe("clear");
    expect(w.isRaining).toBe(false);
    expect(w.intensity).toBe(0);
  });

  test("setKind rain → isRaining + intensity alta", () => {
    const w = new WeatherSystem();
    w.setKind("rain");
    expect(w.isRaining).toBe(true);
    expect(w.intensity).toBeGreaterThan(0.7);
    w.setKind("drizzle");
    expect(w.isRaining).toBe(true);
    expect(w.intensity).toBeGreaterThan(0.3);
    expect(w.intensity).toBeLessThan(0.6);
  });

  test("tick con rng bajo arranca lluvia de noche", () => {
    // rng siempre 0 → pStart noche 0.42 → empieza (drizzle si r < 0.42*0.45)
    const w = new WeatherSystem({
      checkInterval: 1,
      rng: seqRng([0]),
      initial: "clear",
    });
    // timer empieza en 0.35*interval → un tick de 1s dispara roll
    w.tick(1, 0); // medianoche
    expect(w.isRaining).toBe(true);
  });

  test("tick sin roll (dt corto) no cambia kind", () => {
    const w = new WeatherSystem({
      checkInterval: WEATHER_CHECK_SEC,
      rng: () => 0,
      initial: "clear",
    });
    w.tick(0.05, 0.5);
    expect(w.kind).toBe("clear");
  });

  test("isNightPhase: medianoche sí, mediodía no", () => {
    expect(isNightPhase(0)).toBe(true);
    expect(isNightPhase(0.5)).toBe(false);
    expect(isNightPhase(0.9)).toBe(true);
    expect(isNightPhase(undefined)).toBe(false);
  });
});

describe("rainNeedsMult + survival outdoor vs indoor", () => {
  test("indoor o clear → mult 1", () => {
    const raining = { isRaining: true, intensity: 1 };
    expect(rainNeedsMult(raining, true)).toEqual({ thirst: 1, fatigue: 1 });
    expect(rainNeedsMult({ isRaining: false, intensity: 0 }, false)).toEqual({
      thirst: 1,
      fatigue: 1,
    });
  });

  test("outdoor raining intensity 1 → RAIN_*_MULT", () => {
    const m = rainNeedsMult({ isRaining: true, intensity: 1 }, false);
    expect(m.thirst).toBeCloseTo(RAIN_THIRST_MULT, 5);
    expect(m.fatigue).toBeCloseTo(RAIN_FATIGUE_MULT, 5);
  });

  test("outdoor lluvia sube thirst/fatigue más que indoor", () => {
    const outdoorMap = openYard();
    const indoorMap = room();
    expect(isIndoor(outdoorMap, 8.5, 8.5)).toBe(false);
    expect(isIndoor(indoorMap, 6.5, 6.5)).toBe(true);

    const weather = { isRaining: true, intensity: 1 };
    const out = createNeeds();
    const inn = createNeeds();
    const dt = 10;
    tickNeeds(out, dt, rainNeedsMult(weather, false));
    tickNeeds(inn, dt, rainNeedsMult(weather, true));

    expect(out.thirst).toBeGreaterThan(inn.thirst);
    expect(out.fatigue).toBeGreaterThan(inn.fatigue);
    // hunger sin mult (igual)
    expect(out.hunger).toBeCloseTo(inn.hunger, 5);
    expect(inn.thirst).toBeCloseTo(NEEDS_RATE.thirst * dt, 5);
    expect(out.thirst).toBeCloseTo(NEEDS_RATE.thirst * dt * RAIN_THIRST_MULT, 5);
    expect(out.fatigue).toBeCloseTo(
      NEEDS_RATE.fatigue * dt * RAIN_FATIGUE_MULT,
      5,
    );
  });
});
