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
  rainStreakVxAfterRestart,
  rainStreakVxFromDrift,
  rainStreakVxFromPhase,
  rainStreakYAfterRestart,
  rainStreakYFromFall,
  rainStreakYFromPhase,
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
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).toContain("rainStreakVxFromDrift(");
    expect(viewSrc).not.toContain("d.y -= d.vy * dt");
    expect(viewSrc).not.toContain("d.y = tickRainStreakY(");
    expect(viewSrc).not.toContain("d.vx = tickRainStreakVx(");
  });
});

describe("rainStreakYAfterRestart (R / softReset)", () => {
  test("caída fresca (spawn); leftover mid-fall no filtra", () => {
    const boot = rainStreakYAfterRestart(0.4);
    expect(boot).toBe(rainStreakYFromPhase(0.4));
    expect(boot).toBe(2 + 0.4 * 6);
    expect(boot).toBe(4.4);
    expect(rainStreakYAfterRestart(0)).toBe(2);
    expect(rainStreakYAfterRestart(1)).toBe(8);
    expect(rainStreakYAfterRestart()).toBe(2);
    expect(boot).toBe(tickRainStreakY(boot, 10, 0, 1, false));

    const leftoverY = 0.4;
    expect(leftoverY).toBeLessThan(2);
    expect(leftoverY).not.toBe(boot);
    expect(rainStreakYFromFall(leftoverY, 10, 0.2, 1, true)).toBe(leftoverY);
    expect(rainStreakYFromFall(leftoverY, 10, 0.2, 1, true)).not.toBe(boot);
    expect(tickRainStreakY(leftoverY, 10, 0.2, 1, true)).toBe(leftoverY);

    const leftoverFall = rainStreakYFromFall(boot, 10, 0.5, 1, false);
    expect(leftoverFall).toBe(tickRainStreakY(boot, 10, 0.5, 1, false));
    expect(leftoverFall).toBeLessThan(boot);
    expect(leftoverFall).not.toBe(rainStreakYAfterRestart(0.4));
    expect(leftoverFall).not.toBe(boot);
  });

  test("vivo tick no usa el helper (Y avanza)", () => {
    const boot = rainStreakYAfterRestart(0.4);
    const live = rainStreakYFromFall(boot, 10, 0.2, 1, false);
    expect(live).toBeCloseTo(boot - 10 * 0.2 * 1.2, 10);
    expect(live).not.toBe(rainStreakYAfterRestart(0.4));
    expect(live).toBeLessThan(boot);
    expect(rainStreakYFromFall(live, 10, 0.1, 1, false)).not.toBe(
      rainStreakYAfterRestart(0.4),
    );
  });
});

describe("rain streaks recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain Y fresco; F9 no helper", () => {
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
    const rainSrc = readFileSync(
      resolve(process.cwd(), "src/render/rainStreaks.ts"),
      "utf8",
    );
    expect(rainSrc).toContain("rainStreakYAfterRestart(");
    expect(rainSrc).toContain("rainStreakYFromPhase(");
    expect(rainSrc).toContain("rainStreakYFromFall(");
    expect(rainSrc).toMatch(
      /rainStreakYFromFall\([\s\S]{0,200}tickRainStreakY\(/,
    );
    expect(viewSrc).toContain("rainStreakYAfterRestart(");
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).toMatch(
      /const y = rainStreakYAfterRestart\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(dt > 0\) \{[\s\S]{0,80}d\.y = rainStreakYFromFall\(\s*d\.y,\s*d\.vy,\s*dt,\s*i\)/,
    );
    expect(viewSrc).toContain("rainStreakVxFromDrift(");
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncRainVisual\(dt = 0\): void \{[\s\S]{0,360}rainVisualApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncRainVisual\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakYAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakYAfterRestart(");
    expect(saveSrc).not.toContain("rainStreakYAfterRestart");
    expect(saveSrc).not.toContain("rainStreakYFromFall");
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

describe("rainStreakVxAfterRestart (R / softReset)", () => {
  test("viento fresco (spawn); leftover mid-drift no filtra", () => {
    const boot = rainStreakVxAfterRestart(0.4);
    expect(boot).toBe(rainStreakVxFromPhase(0.4));
    expect(boot).toBe((0.4 - 0.5) * 14);
    expect(boot).toBeCloseTo(-1.4, 10);
    expect(rainStreakVxAfterRestart(0)).toBe(-7);
    expect(rainStreakVxAfterRestart(1)).toBe(7);
    expect(rainStreakVxAfterRestart()).toBe(-7);
    expect(boot).toBe(tickRainStreakVx(boot, 0, false));

    const leftoverVx = 20;
    expect(leftoverVx).toBeGreaterThan(7);
    expect(leftoverVx).not.toBe(boot);
    expect(rainStreakVxFromDrift(leftoverVx, 0.2, true)).toBe(leftoverVx);
    expect(rainStreakVxFromDrift(leftoverVx, 0.2, true)).not.toBe(boot);
    expect(tickRainStreakVx(leftoverVx, 0.2, true)).toBe(leftoverVx);

    const leftoverDrift = rainStreakVxFromDrift(boot, 5, false);
    expect(leftoverDrift).toBe(tickRainStreakVx(boot, 5, false));
    expect(leftoverDrift).toBe(boot + 5 * 0.4);
    expect(leftoverDrift).toBeCloseTo(0.6, 10);
    expect(leftoverDrift).not.toBe(rainStreakVxAfterRestart(0.4));
    expect(leftoverDrift).not.toBe(boot);
  });

  test("vivo tick no usa el helper (vx avanza)", () => {
    const boot = rainStreakVxAfterRestart(0.4);
    const live = rainStreakVxFromDrift(boot, 0.2, false);
    expect(live).toBeCloseTo(boot + 0.2 * 0.4, 10);
    expect(live).not.toBe(rainStreakVxAfterRestart(0.4));
    expect(live).toBeGreaterThan(boot);
    expect(rainStreakVxFromDrift(live, 0.1, false)).not.toBe(
      rainStreakVxAfterRestart(0.4),
    );
  });
});

describe("rain vx/drift recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain vx fresco; F9 no helper", () => {
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
    const rainSrc = readFileSync(
      resolve(process.cwd(), "src/render/rainStreaks.ts"),
      "utf8",
    );
    expect(rainSrc).toContain("rainStreakVxAfterRestart(");
    expect(rainSrc).toContain("rainStreakVxFromPhase(");
    expect(rainSrc).toContain("rainStreakVxFromDrift(");
    expect(rainSrc).toMatch(
      /rainStreakVxFromDrift\([\s\S]{0,200}tickRainStreakVx\(/,
    );
    expect(viewSrc).toContain("rainStreakVxAfterRestart(");
    expect(viewSrc).toContain("rainStreakVxFromDrift(");
    expect(viewSrc).toMatch(
      /const vx = rainStreakVxAfterRestart\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(dt > 0\) \{[\s\S]{0,360}d\.vx = rainStreakVxFromDrift\(\s*d\.vx,\s*dt\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("d.vx = tickRainStreakVx(");
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncRainVisual\(dt = 0\): void \{[\s\S]{0,360}rainVisualApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncRainVisual\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakVxAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakVxAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakVxAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakVxAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakVxAfterRestart(");
    expect(saveSrc).not.toContain("rainStreakVxAfterRestart");
    expect(saveSrc).not.toContain("rainStreakVxFromDrift");
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
