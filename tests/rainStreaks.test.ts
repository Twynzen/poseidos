import { describe, expect, test } from "vitest";
import {
  RAIN_ACTIVE_BASE,
  RAIN_ACTIVE_GAIN,
  RAIN_ACTIVE_MIN,
  RAIN_COLOR,
  RAIN_COUNT,
  RAIN_HIDE_BELOW,
  RAIN_NIGHT_COUNT_CUT,
  RAIN_OPACITY_BASE,
  RAIN_OPACITY_GAIN,
  RAIN_OPACITY_NIGHT_ADD,
  RAIN_STREAK_LENGTH_DAY,
  RAIN_STREAK_LENGTH_NIGHT,
  RAIN_STREAK_WIDTH,
  rainActiveCount,
  rainNightMix,
  rainStreakLength,
  rainStreakOpacity,
  rainStreakScaleY,
  rainStreaksHidden,
} from "../src/render/rainStreaks";
import { GameClock } from "../src/core/clock";

describe("constantes", () => {
  test("count 41, width 0.04959375, largo día 0.6325 / noche 1.09503, color 0xdeffff", () => {
    expect(RAIN_COUNT).toBe(41);
    expect(RAIN_STREAK_WIDTH).toBe(0.04959375);
    expect(RAIN_STREAK_LENGTH_DAY).toBe(0.6325);
    expect(RAIN_STREAK_LENGTH_NIGHT).toBe(1.09503);
    expect(RAIN_COLOR).toBe(0xdeffff);
  });

  test("opacity 0.29095 + i×0.595125; noche +0.39675; active min 7; night cut 0.191; hide 0.0174", () => {
    expect(RAIN_OPACITY_BASE).toBe(0.29095);
    expect(RAIN_OPACITY_GAIN).toBe(0.595125);
    expect(RAIN_OPACITY_NIGHT_ADD).toBe(0.39675);
    expect(RAIN_ACTIVE_BASE).toBe(0.4025);
    expect(RAIN_ACTIVE_BASE).toBeCloseTo(0.35 * 1.15, 10);
    expect(RAIN_ACTIVE_GAIN).toBe(0.7475);
    expect(RAIN_ACTIVE_GAIN).toBeCloseTo(0.65 * 1.15, 10);
    expect(RAIN_ACTIVE_MIN).toBe(7);
    expect(RAIN_NIGHT_COUNT_CUT).toBe(0.191);
    expect(RAIN_HIDE_BELOW).toBe(0.0174);
    expect(RAIN_HIDE_BELOW).toBeCloseTo(0.02 * 0.87, 10);
  });
});

describe("rainNightMix / length / scaleY", () => {
  test("día d=1 → mix 0, largo 0.6325, scaleY 1", () => {
    expect(rainNightMix(1)).toBe(0);
    expect(rainStreakLength(1)).toBe(RAIN_STREAK_LENGTH_DAY);
    expect(rainStreakScaleY(1)).toBe(1);
  });

  test("noche d=0 → mix 1, largo 1.09503, scaleY 1.09503/0.6325", () => {
    expect(rainNightMix(0)).toBe(1);
    expect(rainStreakLength(0)).toBe(RAIN_STREAK_LENGTH_NIGHT);
    expect(rainStreakScaleY(0)).toBeCloseTo(
      RAIN_STREAK_LENGTH_NIGHT / RAIN_STREAK_LENGTH_DAY,
      10,
    );
  });

  test("medianoche GameClock d=0.08 → mix 0.92; noon mix 0", () => {
    const night = new GameClock(100);
    night.elapsed = 0;
    expect(night.daylight).toBeCloseTo(0.08, 10);
    expect(rainNightMix(night.daylight)).toBeCloseTo(0.92, 10);
    expect(rainStreakLength(night.daylight)).toBeGreaterThan(
      RAIN_STREAK_LENGTH_DAY,
    );
    expect(rainStreakScaleY(night.daylight)).toBeGreaterThan(1);

    const noon = new GameClock(100);
    noon.elapsed = 50;
    expect(noon.daylight).toBeCloseTo(1, 10);
    expect(rainNightMix(noon.daylight)).toBeCloseTo(0, 10);
    expect(rainStreakScaleY(noon.daylight)).toBeCloseTo(1, 10);
  });

  test("daylight fuera de [0,1] se clampa", () => {
    expect(rainNightMix(-1)).toBe(1);
    expect(rainNightMix(2)).toBe(0);
    expect(rainNightMix(Number.NaN)).toBe(1);
  });
});

describe("rainStreakOpacity", () => {
  test("día: 0.29095 + i×0.595125; noche suma +0.39675 × nightMix", () => {
    expect(rainStreakOpacity(0, 1)).toBeCloseTo(0.29095, 10);
    expect(rainStreakOpacity(1, 1)).toBeCloseTo(0.29095 + 0.595125, 10);
    expect(rainStreakOpacity(1, 0)).toBeCloseTo(0.29095 + 0.595125 + 0.39675, 10);
    expect(rainStreakOpacity(0.5, 0)).toBeCloseTo(0.29095 + 0.5 * 0.595125 + 0.39675, 10);
    expect(rainStreakOpacity(1, 0.08)).toBeCloseTo(0.29095 + 0.595125 + 0.39675 * 0.92, 10);
  });
});

describe("rainActiveCount", () => {
  test("día i=1 → floor(41×1.15)=47; noche d=0 recorta ×0.809", () => {
    expect(rainActiveCount(1, 1)).toBe(47);
    expect(rainActiveCount(1, 0)).toBe(Math.floor(41 * (0.4025 + 0.7475) * 0.809));
  });

  test("día i=0 → floor(41×0.4025)=16; noche menos; piso 7", () => {
    expect(rainActiveCount(0, 1)).toBe(16);
    expect(rainActiveCount(0, 0)).toBe(Math.floor(41 * 0.4025 * 0.809));
    expect(rainActiveCount(0, 0)).toBeGreaterThanOrEqual(RAIN_ACTIVE_MIN);
    expect(rainActiveCount(1, 0)).toBeLessThan(rainActiveCount(1, 1));
  });
});

describe("rainStreaksHidden", () => {
  test("hide ≤ 0.0174; visible por encima", () => {
    expect(rainStreaksHidden(0)).toBe(true);
    expect(rainStreaksHidden(0.0174)).toBe(true);
    expect(rainStreaksHidden(0.02)).toBe(false);
    expect(rainStreaksHidden(1)).toBe(false);
    expect(rainStreaksHidden(Number.NaN)).toBe(true);
  });
});
