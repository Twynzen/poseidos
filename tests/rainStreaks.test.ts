import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  rainVisualApplies,
  tickRainStreakVx,
  tickRainStreakY,
} from "../src/render/rainStreaks";
import { GameClock } from "../src/core/clock";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";

describe("constantes", () => {
  test("count 47, width 0.04959375, largo día 0.727375 / noche 1.09503, color 0xdeffff", () => {
    expect(RAIN_COUNT).toBe(47);
    expect(RAIN_STREAK_WIDTH).toBe(0.04959375);
    expect(RAIN_STREAK_LENGTH_DAY).toBe(0.727375);
    expect(RAIN_STREAK_LENGTH_NIGHT).toBe(1.09503);
    expect(RAIN_COLOR).toBe(0xdeffff);
  });

  test("opacity 0.3345925 + i×0.68439375; noche +0.39675; active min 8; night cut 0.16617; hide 0.0174", () => {
    expect(RAIN_OPACITY_BASE).toBe(0.3345925);
    expect(RAIN_OPACITY_GAIN).toBe(0.68439375);
    expect(RAIN_OPACITY_NIGHT_ADD).toBe(0.39675);
    expect(RAIN_ACTIVE_BASE).toBe(0.4025);
    expect(RAIN_ACTIVE_BASE).toBeCloseTo(0.35 * 1.15, 10);
    expect(RAIN_ACTIVE_GAIN).toBe(0.7475);
    expect(RAIN_ACTIVE_GAIN).toBeCloseTo(0.65 * 1.15, 10);
    expect(RAIN_ACTIVE_MIN).toBe(8);
    expect(RAIN_NIGHT_COUNT_CUT).toBe(0.16617);
    expect(RAIN_NIGHT_COUNT_CUT).toBeCloseTo(0.191 * 0.87, 10);
    expect(RAIN_HIDE_BELOW).toBe(0.0174);
    expect(RAIN_HIDE_BELOW).toBeCloseTo(0.02 * 0.87, 10);
  });
});

describe("rainNightMix / length / scaleY", () => {
  test("día d=1 → mix 0, largo 0.727375, scaleY 1", () => {
    expect(rainNightMix(1)).toBe(0);
    expect(rainStreakLength(1)).toBe(RAIN_STREAK_LENGTH_DAY);
    expect(rainStreakScaleY(1)).toBe(1);
  });

  test("noche d=0 → mix 1, largo 1.09503, scaleY 1.09503/0.727375", () => {
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
  test("día: 0.3345925 + i×0.68439375; noche suma +0.39675 × nightMix", () => {
    expect(rainStreakOpacity(0, 1)).toBeCloseTo(0.3345925, 10);
    expect(rainStreakOpacity(1, 1)).toBeCloseTo(0.3345925 + 0.68439375, 10);
    expect(rainStreakOpacity(1, 0)).toBeCloseTo(0.3345925 + 0.68439375 + 0.39675, 10);
    expect(rainStreakOpacity(0.5, 0)).toBeCloseTo(0.3345925 + 0.5 * 0.68439375 + 0.39675, 10);
    expect(rainStreakOpacity(1, 0.08)).toBeCloseTo(0.3345925 + 0.68439375 + 0.39675 * 0.92, 10);
  });
});

describe("rainActiveCount", () => {
  test("día i=1 → floor(47×1.15)=54; noche d=0 recorta ×0.83383", () => {
    expect(rainActiveCount(1, 1)).toBe(54);
    expect(rainActiveCount(1, 0)).toBe(Math.floor(47 * (0.4025 + 0.7475) * 0.83383));
  });

  test("día i=0 → floor(47×0.4025)=18; noche menos; piso 8", () => {
    expect(rainActiveCount(0, 1)).toBe(18);
    expect(rainActiveCount(0, 0)).toBe(Math.floor(47 * 0.4025 * 0.83383));
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

describe("rainVisualApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; load-muerto no; vivo/load-vivo sí", () => {
    expect(rainVisualApplies(true)).toBe(false);
    expect(rainVisualApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(rainVisualApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(rainVisualApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza Y/vx; vivo sí; dt<=0 no-op", () => {
    expect(tickRainStreakY(4, 10, 0.1, 1, true)).toBe(4);
    expect(tickRainStreakY(4, 10, 0.1, 1, false)).toBeCloseTo(4 - 10 * 0.1 * 1.2, 10);
    expect(tickRainStreakY(4, 10, 0, 1, false)).toBe(4);
    expect(tickRainStreakY(4, 10, -1, 1, false)).toBe(4);
    expect(tickRainStreakY(4, 10, Number.NaN, 1, false)).toBe(4);

    expect(tickRainStreakVx(2, 0.5, true)).toBe(2);
    expect(tickRainStreakVx(2, 0.5, false)).toBeCloseTo(2.2, 10);
    expect(tickRainStreakVx(2, 0, false)).toBe(2);
    expect(tickRainStreakVx(2, -1, false)).toBe(2);
    expect(tickRainStreakVx(2, Number.NaN, false)).toBe(2);
  });

  test("Game freeze / enterGameOver / F9 load-muerto congelan rain; vivo tickea", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("rainVisualApplies(");
    expect(src).toMatch(
      /syncRainVisual\(dt = 0\): void \{[\s\S]{0,360}rainVisualApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1400}this\.syncRainVisual\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,1400}this\.syncRainVisual\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncRainVisual\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncRainVisual\(dt\);\s*this\.syncGrassVisual\(dt\);/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.view\.syncRain\([\s\S]{0,120}\bdt\b/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("tickRainStreakY(");
    expect(viewSrc).toContain("tickRainStreakVx(");
    expect(viewSrc).not.toContain("d.y -= d.vy * dt");
  });
});
