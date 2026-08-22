import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  AMBIENT_DAY_B,
  AMBIENT_DAY_G,
  AMBIENT_DAY_R,
  AMBIENT_INTENSITY_GAIN,
  AMBIENT_INTENSITY_NIGHT,
  AMBIENT_NIGHT_B_ADD,
  AMBIENT_NIGHT_G_SUB,
  AMBIENT_NIGHT_R_SUB,
  AMBIENT_WARM_B,
  AMBIENT_WARM_G,
  AMBIENT_WARM_PUSH,
  AMBIENT_WARM_R,
  ambientRgb,
  atmosphereAfterRestart,
  atmosphereFor,
  atmosphereFromClock,
  DAWN_TINT_B,
  DAWN_TINT_G,
  DAWN_TINT_R,
  DUSK_TINT_B,
  DUSK_TINT_G,
  DUSK_TINT_R,
  dawnWarmth,
  duskWarmth,
  FOG_FAR_DAY,
  FOG_FAR_NIGHT,
  FOG_NEAR_DAY,
  FOG_NEAR_NIGHT,
  fogNearFar,
  nightAmbientIntensity,
  nightSunIntensity,
  SKY_DAY,
  SKY_NIGHT,
  SKY_WARM_MIX,
  SKY_WARM_NIGHT_ADD,
  skyRgb,
  SUN_DAY_B,
  SUN_DAY_G,
  SUN_DAY_R,
  SUN_INTENSITY_GAIN,
  SUN_INTENSITY_NIGHT,
  SUN_NIGHT_B_ADD,
  SUN_NIGHT_G_SUB,
  SUN_NIGHT_R_SUB,
  SUN_WARM_B,
  SUN_WARM_G,
  SUN_WARM_R,
  sunRgb,
  type Rgb,
} from "../src/render/fogAtmosphere";
import { GameClock, clockAfterRestart } from "../src/core/clock";
import { DEFAULT_DAY_LENGTH_SEC } from "../src/core/config";
import { WeatherSystem } from "../src/world/weather";

function in01(c: Rgb): void {
  expect(c.r).toBeGreaterThanOrEqual(0);
  expect(c.r).toBeLessThanOrEqual(1);
  expect(c.g).toBeGreaterThanOrEqual(0);
  expect(c.g).toBeLessThanOrEqual(1);
  expect(c.b).toBeGreaterThanOrEqual(0);
  expect(c.b).toBeLessThanOrEqual(1);
}

/** Daylight como GameClock para una phase dada (sin avanzar tiempo). */
function daylightAt(phase: number): number {
  const clock = new GameClock(100);
  clock.elapsed = phase * 100;
  return clock.daylight;
}

describe("fogNearFar", () => {
  test("knobs: día far 100 × 1.15; NIGHT/NEAR_DAY iguales", () => {
    expect(FOG_NEAR_NIGHT).toBe(30.4175);
    expect(FOG_NEAR_NIGHT).toBeCloseTo(26.45 * 1.15, 10);
    expect(FOG_FAR_NIGHT).toBe(78.0275);
    expect(FOG_FAR_NIGHT).toBeCloseTo(67.85 * 1.15, 10);
    expect(FOG_NEAR_DAY).toBe(43.7);
    expect(FOG_NEAR_DAY).toBeCloseTo(38 * 1.15, 10);
    expect(FOG_FAR_DAY).toBe(115);
    expect(FOG_FAR_DAY).toBeCloseTo(100 * 1.15, 10);
  });

  test("noche: far menor y near más tight que de día", () => {
    const night = fogNearFar(0.08);
    const day = fogNearFar(1);
    expect(night.far).toBeLessThan(day.far);
    expect(night.near).toBeLessThan(day.near);
    expect(night.near).toBeLessThan(night.far);
    expect(day.near).toBeLessThan(day.far);
  });

  test("d=0 → night knobs; noon d=1 → day knobs (far día 115)", () => {
    expect(fogNearFar(0)).toEqual({ near: 30.4175, far: 78.0275 });
    expect(fogNearFar(1)).toEqual({ near: 43.7, far: 115 });
  });

  test("near < far siempre en [0,1]", () => {
    for (const d of [0, 0.08, 0.35, 0.54, 0.8, 1]) {
      const f = fogNearFar(d);
      expect(f.near).toBeLessThan(f.far);
    }
  });
});

describe("dawn / dusk warmth bands", () => {
  test("dawn pico en banda 0.2–0.35; dusk en 0.65–0.8", () => {
    expect(dawnWarmth(0.275)).toBeGreaterThan(0.9);
    expect(dawnWarmth(0.1)).toBe(0);
    expect(dawnWarmth(0.5)).toBe(0);
    expect(duskWarmth(0.725)).toBeGreaterThan(0.9);
    expect(duskWarmth(0.5)).toBe(0);
    expect(duskWarmth(0.9)).toBe(0);
  });
});

describe("skyRgb cinematic", () => {
  test("knobs: dawn tint r 0.72 × 1.15 / g 0.38 × 1.15 / b 0.28 × 1.15; dusk r 0.78 × 1.15 / g 0.32 × 1.15 / b 0.18 × 1.15; warm mix 0.35 × 1.15; night add 0.25 × 1.15; sky iguales", () => {
    expect(DAWN_TINT_R).toBe(0.828);
    expect(DAWN_TINT_R).toBeCloseTo(0.72 * 1.15, 10);
    expect(DAWN_TINT_G).toBe(0.437);
    expect(DAWN_TINT_G).toBeCloseTo(0.38 * 1.15, 10);
    expect(DAWN_TINT_B).toBe(0.322);
    expect(DAWN_TINT_B).toBeCloseTo(0.28 * 1.15, 10);
    expect(DUSK_TINT_R).toBe(0.897);
    expect(DUSK_TINT_R).toBeCloseTo(0.78 * 1.15, 10);
    expect(DUSK_TINT_G).toBe(0.368);
    expect(DUSK_TINT_G).toBeCloseTo(0.32 * 1.15, 10);
    expect(DUSK_TINT_B).toBe(0.207);
    expect(DUSK_TINT_B).toBeCloseTo(0.18 * 1.15, 10);
    expect(SKY_WARM_MIX).toBe(0.4025);
    expect(SKY_WARM_MIX).toBeCloseTo(0.35 * 1.15, 10);
    expect(SKY_WARM_NIGHT_ADD).toBe(0.2875);
    expect(SKY_WARM_NIGHT_ADD).toBeCloseTo(0.25 * 1.15, 10);
  });

  test("dawn más cálido que noon (r mayor / r>b)", () => {
    const dawnPhase = 0.275;
    const noonPhase = 0.5;
    const dawn = skyRgb(dawnPhase, daylightAt(dawnPhase));
    const noon = skyRgb(noonPhase, daylightAt(noonPhase));
    expect(dawn.r).toBeGreaterThan(noon.r);
    expect(dawn.r).toBeGreaterThan(dawn.b);
  });

  test("dusk más cálido que noon", () => {
    const duskPhase = 0.725;
    const noonPhase = 0.5;
    const dusk = skyRgb(duskPhase, daylightAt(duskPhase));
    const noon = skyRgb(noonPhase, daylightAt(noonPhase));
    expect(dusk.r).toBeGreaterThan(noon.r);
    expect(dusk.r).toBeGreaterThan(dusk.b);
  });

  test("noche azul/violeta oscuro (b >= r, luminance baja)", () => {
    const night = skyRgb(0, daylightAt(0));
    expect(night.b).toBeGreaterThanOrEqual(night.r);
    expect(night.r + night.g + night.b).toBeLessThan(0.47);
  });

  test("knobs: día r 0.26 × 1.15 / g 0.33 × 1.15 / b 0.47 × 1.15; noche iguales", () => {
    expect(SKY_NIGHT).toEqual({ r: 0.092575, g: 0.119025, b: 0.18515 });
    expect(SKY_NIGHT.r).toBe(0.092575);
    expect(SKY_NIGHT.g).toBe(0.119025);
    expect(SKY_NIGHT.b).toBe(0.18515);
    expect(SKY_DAY).toEqual({ r: 0.299, g: 0.3795, b: 0.5405 });
    expect(SKY_DAY.r).toBe(0.299);
    expect(SKY_DAY.r).toBeCloseTo(0.26 * 1.15, 10);
    expect(SKY_DAY.g).toBe(0.3795);
    expect(SKY_DAY.g).toBeCloseTo(0.33 * 1.15, 10);
    expect(SKY_DAY.b).toBe(0.5405);
    expect(SKY_DAY.b).toBeCloseTo(0.47 * 1.15, 10);
  });

  test("d=0 → night sky/fog; noon d=1 → day sky (día r 0.299 / g 0.3795 / b 0.5405)", () => {
    expect(skyRgb(0, 0)).toEqual(SKY_NIGHT);
    expect(atmosphereFor(0, 0).sky).toEqual(SKY_NIGHT);
    expect(skyRgb(0.5, 1)).toEqual(SKY_DAY);
    expect(atmosphereFor(0.5, 1).sky).toEqual(SKY_DAY);
  });
});

describe("night / noon light intensity floors", () => {
  test("knobs: night floors 0.276 × 1.15 / 0.184 × 1.15; gains 0.529 × 1.15 / 1.196 × 1.15", () => {
    expect(AMBIENT_INTENSITY_NIGHT).toBe(0.3174);
    expect(AMBIENT_INTENSITY_NIGHT).toBeCloseTo(0.276 * 1.15, 10);
    expect(AMBIENT_INTENSITY_GAIN).toBe(0.60835);
    expect(AMBIENT_INTENSITY_GAIN).toBeCloseTo(0.529 * 1.15, 10);
    expect(SUN_INTENSITY_NIGHT).toBe(0.2116);
    expect(SUN_INTENSITY_NIGHT).toBeCloseTo(0.184 * 1.15, 10);
    expect(SUN_INTENSITY_GAIN).toBe(1.3754);
    expect(SUN_INTENSITY_GAIN).toBeCloseTo(1.196 * 1.15, 10);
  });

  test("noche d=0.08 → ambient ~0.366, sun ~0.322", () => {
    expect(nightAmbientIntensity(0.08)).toBeCloseTo(0.366068, 5);
    expect(nightSunIntensity(0.08)).toBeCloseTo(0.321632, 5);
  });

  test("noon d=1 → ambient 0.92575, sun 1.587 (gain sol 1.3754)", () => {
    expect(nightAmbientIntensity(1)).toBeCloseTo(0.92575, 10);
    expect(nightSunIntensity(1)).toBeCloseTo(1.587, 10);
  });

  test("d=0 → floors; clamp fuera de [0,1]", () => {
    expect(nightAmbientIntensity(0)).toBe(0.3174);
    expect(nightSunIntensity(0)).toBe(0.2116);
    expect(nightAmbientIntensity(-1)).toBe(0.3174);
    expect(nightSunIntensity(2)).toBeCloseTo(1.587, 10);
  });
});

describe("ambientRgb night mix", () => {
  test("knobs: night r subtract 0.18 × 0.87; g subtract 0.06 × 0.87; b add 0.14 × 1.15; warm push 0.12 × 1.15; warm r 0.2 × 1.15; warm g 0.05 × 1.15; warm b 0.08 × 1.15; day r 0x6a/255 × 1.15; day g 0x6a/255 × 1.15; day b 0x78/255 × 1.15", () => {
    expect(AMBIENT_NIGHT_R_SUB).toBe(0.1566);
    expect(AMBIENT_NIGHT_R_SUB).toBeCloseTo(0.18 * 0.87, 10);
    expect(AMBIENT_NIGHT_G_SUB).toBe(0.0522);
    expect(AMBIENT_NIGHT_G_SUB).toBeCloseTo(0.06 * 0.87, 10);
    expect(AMBIENT_NIGHT_B_ADD).toBe(0.161);
    expect(AMBIENT_NIGHT_B_ADD).toBeCloseTo(0.14 * 1.15, 10);
    expect(AMBIENT_WARM_PUSH).toBe(0.138);
    expect(AMBIENT_WARM_PUSH).toBeCloseTo(0.12 * 1.15, 10);
    expect(AMBIENT_WARM_R).toBe(0.23);
    expect(AMBIENT_WARM_R).toBeCloseTo(0.2 * 1.15, 10);
    expect(AMBIENT_WARM_G).toBe(0.0575);
    expect(AMBIENT_WARM_G).toBeCloseTo(0.05 * 1.15, 10);
    expect(AMBIENT_WARM_B).toBe(0.092);
    expect(AMBIENT_WARM_B).toBeCloseTo(0.08 * 1.15, 10);
    expect(AMBIENT_DAY_R).toBe((0x6a / 255) * 1.15);
    expect(AMBIENT_DAY_R).toBeCloseTo((0x6a / 255) * 1.15, 10);
    expect(AMBIENT_DAY_R).toBeCloseTo(0.4780392156862745, 10);
    expect(AMBIENT_DAY_G).toBe((0x6a / 255) * 1.15);
    expect(AMBIENT_DAY_G).toBeCloseTo((0x6a / 255) * 1.15, 10);
    expect(AMBIENT_DAY_G).toBeCloseTo(0.4780392156862745, 10);
    expect(AMBIENT_DAY_B).toBe((0x78 / 255) * 1.15);
    expect(AMBIENT_DAY_B).toBeCloseTo((0x78 / 255) * 1.15, 10);
    expect(AMBIENT_DAY_B).toBeCloseTo(0.5411764705882353, 10);
  });

  test("d=0 → night r/g/b follow knobs; b add 0.161", () => {
    const night = ambientRgb(0, 0);
    expect(night.r).toBeCloseTo(AMBIENT_DAY_R - AMBIENT_NIGHT_R_SUB, 10);
    expect(night.g).toBeCloseTo(AMBIENT_DAY_G - AMBIENT_NIGHT_G_SUB, 10);
    expect(night.b).toBeCloseTo(AMBIENT_DAY_B + AMBIENT_NIGHT_B_ADD, 10);
    expect(night.b).toBeCloseTo(AMBIENT_DAY_B + 0.161, 10);
  });

  test("dawn/dusk ambient follows AMBIENT_WARM_PUSH / AMBIENT_WARM_R / AMBIENT_WARM_G / AMBIENT_WARM_B", () => {
    const dawnPhase = 0.275;
    const duskPhase = 0.725;
    const dawnPush = dawnWarmth(dawnPhase) * AMBIENT_WARM_PUSH;
    const duskPush = duskWarmth(duskPhase) * AMBIENT_WARM_PUSH;
    const dawn = ambientRgb(1, dawnPhase);
    const dusk = ambientRgb(1, duskPhase);
    expect(dawn.r).toBeCloseTo(AMBIENT_DAY_R + dawnPush * AMBIENT_WARM_R, 10);
    expect(dawn.g).toBeCloseTo(AMBIENT_DAY_G + dawnPush * AMBIENT_WARM_G, 10);
    expect(dawn.b).toBeCloseTo(AMBIENT_DAY_B - dawnPush * AMBIENT_WARM_B, 10);
    expect(dusk.r).toBeCloseTo(AMBIENT_DAY_R + duskPush * AMBIENT_WARM_R, 10);
    expect(dusk.g).toBeCloseTo(AMBIENT_DAY_G + duskPush * AMBIENT_WARM_G, 10);
    expect(dusk.b).toBeCloseTo(AMBIENT_DAY_B - duskPush * AMBIENT_WARM_B, 10);
  });
});

describe("sunRgb night mix", () => {
  test("knobs: night r subtract 0.15 × 0.87; g subtract 0.2 × 0.87; b add 0.12 × 1.15; warm r 0.12 × 1.15; warm g 0.02 × 1.15; warm b 0.14 × 1.15; day r 0.91 × 1.15; day g 0.88 × 1.15; day b 0.82 × 1.15", () => {
    expect(SUN_NIGHT_R_SUB).toBe(0.1305);
    expect(SUN_NIGHT_R_SUB).toBeCloseTo(0.15 * 0.87, 10);
    expect(SUN_NIGHT_G_SUB).toBe(0.174);
    expect(SUN_NIGHT_G_SUB).toBeCloseTo(0.2 * 0.87, 10);
    expect(SUN_NIGHT_B_ADD).toBe(0.138);
    expect(SUN_NIGHT_B_ADD).toBeCloseTo(0.12 * 1.15, 10);
    expect(SUN_WARM_R).toBe(0.138);
    expect(SUN_WARM_R).toBeCloseTo(0.12 * 1.15, 10);
    expect(SUN_WARM_G).toBe(0.023);
    expect(SUN_WARM_G).toBeCloseTo(0.02 * 1.15, 10);
    expect(SUN_WARM_B).toBe(0.161);
    expect(SUN_WARM_B).toBeCloseTo(0.14 * 1.15, 10);
    expect(SUN_DAY_R).toBe(0.91 * 1.15);
    expect(SUN_DAY_R).toBeCloseTo(0.91 * 1.15, 10);
    expect(SUN_DAY_R).toBeCloseTo(1.0465, 10);
    expect(SUN_DAY_G).toBe(0.88 * 1.15);
    expect(SUN_DAY_G).toBeCloseTo(0.88 * 1.15, 10);
    expect(SUN_DAY_G).toBeCloseTo(1.012, 10);
    expect(SUN_DAY_B).toBe(0.82 * 1.15);
    expect(SUN_DAY_B).toBeCloseTo(0.82 * 1.15, 10);
    expect(SUN_DAY_B).toBeCloseTo(0.943, 10);
  });

  test("d=0 → night r/g/b follow knobs; b add 0.138", () => {
    const night = sunRgb(0, 0);
    expect(night.r).toBeCloseTo(SUN_DAY_R - SUN_NIGHT_R_SUB, 10);
    expect(night.g).toBeCloseTo(SUN_DAY_G - SUN_NIGHT_G_SUB, 10);
    expect(night.g).toBeCloseTo(SUN_DAY_G - 0.174, 10);
    expect(night.b).toBeCloseTo(Math.min(1, SUN_DAY_B + SUN_NIGHT_B_ADD), 10);
    expect(night.b).toBeCloseTo(Math.min(1, SUN_DAY_B + 0.138), 10);
  });

  test("dawn/dusk sun follows SUN_WARM_R / SUN_WARM_G / SUN_WARM_B", () => {
    const dawnPhase = 0.275;
    const duskPhase = 0.725;
    const dawnWarm = dawnWarmth(dawnPhase);
    const duskWarm = duskWarmth(duskPhase);
    const dawn = sunRgb(1, dawnPhase);
    const dusk = sunRgb(1, duskPhase);
    expect(dawn.r).toBeCloseTo(Math.min(1, SUN_DAY_R + dawnWarm * SUN_WARM_R), 10);
    expect(dawn.g).toBeCloseTo(Math.min(1, SUN_DAY_G + dawnWarm * SUN_WARM_G), 10);
    expect(dawn.b).toBeCloseTo(SUN_DAY_B - dawnWarm * SUN_WARM_B, 10);
    expect(dusk.r).toBeCloseTo(Math.min(1, SUN_DAY_R + duskWarm * SUN_WARM_R), 10);
    expect(dusk.g).toBeCloseTo(Math.min(1, SUN_DAY_G + duskWarm * SUN_WARM_G), 10);
    expect(dusk.b).toBeCloseTo(SUN_DAY_B - duskWarm * SUN_WARM_B, 10);
  });
});

describe("rgb ranges + atmosphereFor", () => {
  test("sky/ambient/sun en 0..1 en fases clave", () => {
    const phases = [0, 0.25, 0.275, 0.5, 0.725, 0.75, 0.9];
    for (const phase of phases) {
      const d = daylightAt(phase);
      in01(skyRgb(phase, d));
      in01(ambientRgb(d, phase));
      in01(sunRgb(d, phase));
      const atm = atmosphereFor(phase, d);
      in01(atm.sky);
      in01(atm.ambient);
      in01(atm.sun);
      expect(atm.near).toBeLessThan(atm.far);
    }
  });
});

describe("atmosphereAfterRestart (R / softReset)", () => {
  test("medianoche fresco; leftover noon / dusk / lastDaylight=1 no filtra", () => {
    const boot = atmosphereAfterRestart();
    const clock = clockAfterRestart();
    expect(clock.phase).toBe(0);
    expect(clock.daylight).toBeCloseTo(0.08, 10);
    expect(boot).toEqual(atmosphereFromClock(clock));
    expect(boot.sky).toEqual(skyRgb(0, clock.daylight));
    expect(boot.near).toBeLessThan(FOG_NEAR_DAY);
    expect(boot.far).toBeLessThan(FOG_FAR_DAY);
    expect(boot.sky).not.toEqual(SKY_DAY);
    expect(nightAmbientIntensity(clock.daylight)).toBeLessThan(
      nightAmbientIntensity(1),
    );
    expect(nightSunIntensity(clock.daylight)).toBeLessThan(nightSunIntensity(1));

    const leftoverNoon = new GameClock(DEFAULT_DAY_LENGTH_SEC);
    leftoverNoon.elapsed = DEFAULT_DAY_LENGTH_SEC * 0.5;
    expect(leftoverNoon.phase).toBeCloseTo(0.5, 5);
    expect(leftoverNoon.daylight).toBeCloseTo(1, 5);
    const noonAtm = atmosphereFromClock(leftoverNoon);
    expect(noonAtm.sky).toEqual(SKY_DAY);
    expect(noonAtm).not.toEqual(boot);
    expect(noonAtm.far).toBeGreaterThan(boot.far);
    expect(noonAtm.near).toBeGreaterThan(boot.near);

    // WorldView ctor nace lastDaylight=1 (noon mats) — syncDayNight pisa clock fresco.
    const leftoverCtorDaylight = 1;
    expect(leftoverCtorDaylight).not.toBe(clock.daylight);
    expect(
      atmosphereFromClock({ phase: 0.5, daylight: leftoverCtorDaylight }),
    ).not.toEqual(boot);

    const leftoverNoc = new GameClock(DEFAULT_DAY_LENGTH_SEC);
    leftoverNoc.elapsed = DEFAULT_DAY_LENGTH_SEC * 0.9;
    expect(Math.floor(leftoverNoc.phase * 100)).toBe(90);
    expect(atmosphereFromClock(leftoverNoc)).not.toEqual(boot);
  });

  test("weather rain 0.85 no tintea cielo (storm leftover = clock)", () => {
    const storm = new WeatherSystem({ initial: "rain" });
    expect(storm.intensity).toBe(0.85);
    const boot = atmosphereAfterRestart();
    expect(boot).toEqual(atmosphereFromClock(clockAfterRestart()));
    expect(atmosphereFromClock(clockAfterRestart())).not.toEqual(
      atmosphereFromClock({
        phase: 0.5,
        daylight: 1,
      }),
    );
    void storm;
  });

  test("vivo tick no usa el helper (advance pinta noon)", () => {
    const clock = clockAfterRestart();
    const boot = atmosphereFromClock(clock);
    expect(boot).toEqual(atmosphereAfterRestart());
    clock.advance(DEFAULT_DAY_LENGTH_SEC * 0.5);
    const noon = atmosphereFromClock(clock);
    expect(noon.sky).toEqual(SKY_DAY);
    expect(noon).not.toEqual(boot);
    expect(noon).not.toEqual(atmosphereAfterRestart());
  });
});

describe("lighting recreate lock (R / softReset)", () => {
  test("Game softReset syncLighting lee clock fresco; F9 no helper", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    const saveSrc = readFileSync(
      resolve(process.cwd(), "src/core/save.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("clockAfterRestart(");
    expect(gameSrc).toContain("weatherAfterRestart(");
    expect(gameSrc).toContain("warmLightFromClock(");
    expect(gameSrc).toContain("this.syncLighting()");
    expect(viewSrc).toContain("atmosphereFromClock(");
    expect(viewSrc).toMatch(/let lastDaylight = 1;/);
    expect(gameSrc).toMatch(
      /this\.clock = new GameClock\(DEFAULT_DAY_LENGTH_SEC\)/,
    );
    expect(gameSrc).toMatch(
      /this\.weather = new WeatherSystem\(\{ initial: "drizzle" \}\)/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.clock = clockAfterRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.clock = clockAfterRestart\(\);[\s\S]{0,4200}this\.syncLighting\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.weather = weatherAfterRestart\(\);[\s\S]{0,4200}this\.syncLighting\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,2000}this\.syncLighting\(\)/,
    );
    expect(gameSrc).toMatch(
      /syncLighting\(\): void \{[\s\S]{0,360}this\.view\.syncDayNight\(this\.clock\)/,
    );
    expect(gameSrc).toMatch(
      /syncLighting\(\): void \{[\s\S]{0,360}warmLightFromClock\(\s*indoor,\s*this\.clock/,
    );
    expect(viewSrc).toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,240}atmosphereFromClock\(clock\)/,
    );
    expect(viewSrc).toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,80}lastDaylight = d/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}atmosphereAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}atmosphereAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}atmosphereAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}atmosphereAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightAfterRestart/,
    );
    expect(saveSrc).not.toContain("atmosphereAfterRestart");
    expect(saveSrc).not.toContain("warmLightAfterRestart");
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
