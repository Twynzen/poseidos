import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  WeatherSystem,
  rainNeedsMult,
  rainVisualIntensity,
  weatherHudRaining,
  weatherAfterRestart,
  weatherBootTimer,
  isNightPhase,
  RAIN_THIRST_MULT,
  RAIN_FATIGUE_MULT,
  WEATHER_CHECK_SEC,
  WEATHER_TARGET_INTENSITY,
  WEATHER_BOOT_KIND,
  WEATHER_BOOT_TIMER_FRAC,
} from "../src/world/weather";
import { createNeeds, tickNeeds, NEEDS_RATE } from "../src/actors/needs";
import { TileMap } from "../src/world/tilemap";
import { makeFloor, makeFurniture, makeWall } from "../src/world/tile";
import { isIndoor } from "../src/world/indoor";
import {
  formatHudStatus,
  lastLootMsgAfterRestart,
  type HudStatusInput,
} from "../src/ui/hudStatus";
import { clockAfterRestart } from "../src/core/clock";
import {
  rainActiveCount,
  rainStreakOpacity,
  rainStreaksHidden,
  tickRainStreakY,
} from "../src/render/rainStreaks";

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

function hudBase(over: Partial<HudStatusInput> = {}): HudStatusInput {
  return {
    modo: "noche",
    phasePct: 0,
    muteN: 3,
    possN: 2,
    invLine: "",
    tileX: 10,
    tileY: 12,
    chunksLoaded: 4,
    chunksTotal: 9,
    fov: 8,
    ...over,
  };
}

describe("weatherAfterRestart (R / softReset)", () => {
  test("drizzle fresco; leftover rain / phase no filtra", () => {
    const boot = weatherAfterRestart();
    expect(boot.kind).toBe(WEATHER_BOOT_KIND);
    expect(boot.kind).toBe("drizzle");
    expect(boot.isRaining).toBe(true);
    expect(boot.intensity).toBe(WEATHER_TARGET_INTENSITY.drizzle);
    expect(boot.intensity).toBe(0.4);
    expect(boot.rollTimer).toBe(weatherBootTimer());
    expect(boot.rollTimer).toBeCloseTo(WEATHER_CHECK_SEC * WEATHER_BOOT_TIMER_FRAC, 10);
    expect(new WeatherSystem().kind).toBe("clear");
    expect(new WeatherSystem().kind).not.toBe(boot.kind);

    const leftoverRain = new WeatherSystem({ initial: "rain" });
    leftoverRain.tick(0.5, 0.5);
    expect(leftoverRain.kind).toBe("rain");
    expect(leftoverRain.intensity).toBe(WEATHER_TARGET_INTENSITY.rain);
    expect(leftoverRain.intensity).toBe(0.85);
    expect(leftoverRain.rollTimer).not.toBe(weatherBootTimer());

    const afterRain = weatherAfterRestart();
    expect(afterRain.kind).toBe("drizzle");
    expect(afterRain.intensity).toBe(0.4);
    expect(afterRain.rollTimer).toBe(weatherBootTimer());
    expect(afterRain).not.toBe(leftoverRain);
    expect(afterRain.kind).not.toBe(leftoverRain.kind);
    expect(afterRain.intensity).not.toBe(leftoverRain.intensity);
    expect(afterRain.rollTimer).not.toBe(leftoverRain.rollTimer);

    const leftoverClear = new WeatherSystem({ initial: "clear" });
    leftoverClear.tick(1, 0.5);
    expect(leftoverClear.isRaining).toBe(false);
    expect(leftoverClear.intensity).toBe(0);

    const afterClear = weatherAfterRestart();
    expect(afterClear.isRaining).toBe(true);
    expect(afterClear.intensity).toBe(0.4);
    expect(afterClear.kind).not.toBe(leftoverClear.kind);
  });

  test("vivo tick no usa el helper (tick igual que hoy)", () => {
    const weather = weatherAfterRestart();
    expect(weather.kind).toBe("drizzle");
    expect(weather.rollTimer).toBe(weatherBootTimer());
    weather.tick(0.1, 0);
    expect(weather.kind).toBe("drizzle");
    expect(weather.rollTimer).toBeCloseTo(weatherBootTimer() + 0.1, 10);
    expect(weather.rollTimer).not.toBe(weatherAfterRestart().rollTimer);
    weather.tick(0.15, 0);
    expect(weather.rollTimer).toBeCloseTo(weatherBootTimer() + 0.25, 10);
    expect(weather.intensity).toBe(WEATHER_TARGET_INTENSITY.drizzle);
  });
});

describe("rainVisualIntensity + weatherHudRaining (R / drizzle vs leftover rain)", () => {
  test("outdoor drizzle 0.4; leftover rain 0.85; indoor 0", () => {
    const boot = weatherAfterRestart();
    expect(rainVisualIntensity(boot, false)).toBe(0.4);
    expect(rainVisualIntensity(boot, true)).toBe(0);
    expect(weatherHudRaining(boot, false)).toBe(true);
    expect(weatherHudRaining(boot, true)).toBe(false);

    const leftoverRain = new WeatherSystem({ initial: "rain" });
    expect(rainVisualIntensity(leftoverRain, false)).toBe(0.85);
    expect(rainVisualIntensity(leftoverRain, false)).not.toBe(
      rainVisualIntensity(boot, false),
    );
    expect(weatherHudRaining(leftoverRain, false)).toBe(true);

    const leftoverClear = new WeatherSystem({ initial: "clear" });
    expect(rainVisualIntensity(leftoverClear, false)).toBe(0);
    expect(weatherHudRaining(leftoverClear, false)).toBe(false);
    expect(rainStreaksHidden(rainVisualIntensity(leftoverClear, false))).toBe(
      true,
    );
    expect(rainStreaksHidden(rainVisualIntensity(boot, false))).toBe(false);
  });

  test("streaks drizzle ≠ leftover rain (count / opacity / caída)", () => {
    const clock = clockAfterRestart();
    const daylight = clock.daylight;
    const drizzleI = rainVisualIntensity(weatherAfterRestart(), false);
    const leftover = new WeatherSystem({ initial: "rain" });
    const rainI = rainVisualIntensity(leftover, false);

    expect(rainActiveCount(drizzleI, daylight)).not.toBe(
      rainActiveCount(rainI, daylight),
    );
    expect(rainStreakOpacity(drizzleI, daylight)).not.toBe(
      rainStreakOpacity(rainI, daylight),
    );
    expect(rainStreakOpacity(rainI, daylight)).toBeGreaterThan(
      rainStreakOpacity(drizzleI, daylight),
    );
    expect(rainActiveCount(rainI, daylight)).toBeGreaterThan(
      rainActiveCount(drizzleI, daylight),
    );

    const y0 = 4;
    const drizzleY = tickRainStreakY(y0, 10, 0.1, drizzleI);
    const rainY = tickRainStreakY(y0, 10, 0.1, rainI);
    expect(rainY).toBeLessThan(drizzleY);
    expect(drizzleY).not.toBe(rainY);
  });

  test("HUD vivo pinta lluvia de drizzle; leftover clear no filtra; HAS MUERTO no", () => {
    const boot = weatherAfterRestart();
    const afterR = formatHudStatus(
      hudBase({
        raining: weatherHudRaining(boot, false),
        gameOver: false,
        msg: lastLootMsgAfterRestart(),
      }),
    );
    expect(afterR).toContain("lluvia");
    expect(afterR).toContain("reinicio");
    expect(afterR).not.toContain("HAS MUERTO");

    const leftoverClear = formatHudStatus(
      hudBase({
        raining: weatherHudRaining(new WeatherSystem({ initial: "clear" }), false),
        gameOver: false,
        msg: lastLootMsgAfterRestart(),
      }),
    );
    expect(leftoverClear).not.toContain("lluvia");
    expect(leftoverClear).not.toEqual(afterR);

    const stillDead = formatHudStatus(
      hudBase({
        raining: weatherHudRaining(new WeatherSystem({ initial: "rain" }), false),
        gameOver: true,
        msg: "golpe -12 HP",
      }),
    );
    expect(stillDead).toContain("HAS MUERTO");
    expect(stillDead).not.toContain("lluvia");
  });
});

describe("weather recreate lock (R / softReset)", () => {
  test("Game softReset usa weatherAfterRestart + rainVisualIntensity; F9 no", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    const saveSrc = readFileSync(
      resolve(process.cwd(), "src/core/save.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("weatherAfterRestart(");
    expect(gameSrc).toContain("rainVisualIntensity(");
    expect(gameSrc).toContain("weatherHudRaining(");
    expect(gameSrc).toMatch(
      /this\.weather = new WeatherSystem\(\{ initial: "drizzle" \}\)/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.weather = weatherAfterRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.weather = weatherAfterRestart\(\);[\s\S]{0,4200}this\.refreshHud\(true\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncRainVisual\(dt = 0\): void \{[\s\S]{0,360}rainVisualIntensity\(\s*this\.weather,\s*indoor\)/,
    );
    expect(gameSrc).toMatch(
      /const raining = weatherHudRaining\(\s*this\.weather,\s*indoor\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}weatherAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}weatherAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}weatherAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}weatherAfterRestart/,
    );
    expect(saveSrc).not.toContain("weatherAfterRestart");
    expect(saveSrc).not.toContain("WeatherSystem");
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}this\.showHelp\s*=/,
    );
    expect(gameSrc).toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);/,
    );
    expect(gameSrc).not.toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);\s*this\.hudAcc = 1/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
  });
});
