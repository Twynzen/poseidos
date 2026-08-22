import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RAIN_ACTIVE_BASE,
  RAIN_ACTIVE_GAIN,
  RAIN_ACTIVE_MIN,
  RAIN_ANCHOR_X_SPAWN,
  RAIN_ANCHOR_Z_SPAWN,
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
  RAIN_WRAP_BELOW,
  rainActiveCount,
  rainActiveCountAfterRestart,
  rainActiveCountFromLook,
  rainAnchorXAfterRestart,
  rainAnchorXFromLook,
  rainAnchorZAfterRestart,
  rainAnchorZFromLook,
  rainNightMix,
  rainStreakLength,
  rainStreakNeedsWrap,
  rainStreakOpacity,
  rainStreakOpacityAfterRestart,
  rainStreakOpacityFromLook,
  rainStreakScaleY,
  rainStreakScaleYAfterRestart,
  rainStreakScaleYFromLook,
  rainStreaksHidden,
  rainStreaksHiddenAfterRestart,
  rainStreaksHiddenFromLook,
  rainStreakVxAfterRestart,
  rainStreakVxFromDrift,
  rainStreakVxFromPhase,
  rainStreakVyAfterRestart,
  rainStreakVyFromPhase,
  rainStreakVyFromSpeed,
  rainStreakVzAfterRestart,
  rainStreakVzFromPhase,
  rainStreakVzFromZ,
  rainStreakYAfterRestart,
  rainStreakYFromFall,
  rainStreakYFromPhase,
  rainStreakYFromWrap,
  rainStreakYWrapAfterRestart,
  rainVisualApplies,
  tickRainStreakVx,
  tickRainStreakY,
} from "../src/render/rainStreaks";
import { GameClock } from "../src/core/clock";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";

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
      /if \(dt > 0\) \{[\s\S]{0,80}d\.y = rainStreakYFromFall\(\s*d\.y,\s*rainStreakVyFromSpeed\(\s*d\.vy\),\s*dt,\s*i\)/,
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
      /if \(dt > 0\) \{[\s\S]{0,560}d\.vx = rainStreakVxFromDrift\(\s*d\.vx,\s*dt\)/,
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

describe("rainStreakVyAfterRestart (R / softReset)", () => {
  test("speed fresco (spawn); leftover mid-life vy no filtra", () => {
    const boot = rainStreakVyAfterRestart(0.4);
    expect(boot).toBe(rainStreakVyFromPhase(0.4));
    expect(boot).toBe(9 + 0.4 * 6);
    expect(boot).toBeCloseTo(11.4, 10);
    expect(rainStreakVyAfterRestart(0)).toBe(9);
    expect(rainStreakVyAfterRestart(1)).toBe(15);
    expect(rainStreakVyAfterRestart()).toBe(9);
    expect(boot).toBe(rainStreakVyFromSpeed(boot));

    const leftoverVy = 20;
    expect(leftoverVy).toBeGreaterThan(15);
    expect(leftoverVy).not.toBe(boot);
    expect(rainStreakVyFromSpeed(leftoverVy)).toBe(leftoverVy);
    expect(rainStreakVyFromSpeed(leftoverVy)).not.toBe(boot);
    expect(rainStreakYFromFall(4.4, leftoverVy, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, leftoverVy, 0.2, 1, true)).toBe(4.4);

    const leftoverFall = rainStreakYFromFall(
      4.4,
      rainStreakVyFromSpeed(leftoverVy),
      0.5,
      1,
      false,
    );
    const bootFall = rainStreakYFromFall(
      4.4,
      rainStreakVyFromSpeed(boot),
      0.5,
      1,
      false,
    );
    expect(leftoverFall).toBe(tickRainStreakY(4.4, leftoverVy, 0.5, 1, false));
    expect(leftoverFall).toBeLessThan(bootFall);
    expect(rainStreakVyFromSpeed(leftoverVy)).not.toBe(
      rainStreakVyAfterRestart(0.4),
    );
    expect(rainStreakVyFromSpeed(leftoverVy)).not.toBe(boot);
  });

  test("vivo tick no usa el helper (vy se queda; Y avanza)", () => {
    const boot = rainStreakVyAfterRestart(0.4);
    const liveVy = rainStreakVyFromSpeed(boot);
    expect(liveVy).toBe(boot);
    expect(liveVy).toBe(rainStreakVyAfterRestart(0.4));
    const live = rainStreakYFromFall(4.4, liveVy, 0.2, 1, false);
    expect(live).toBeCloseTo(4.4 - boot * 0.2 * 1.2, 10);
    expect(live).not.toBe(4.4);
    expect(rainStreakYFromFall(live, liveVy, 0.1, 1, false)).not.toBe(4.4);
  });
});

describe("rain vy/speed recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain vy fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainStreakVyAfterRestart(");
    expect(rainSrc).toContain("rainStreakVyFromPhase(");
    expect(rainSrc).toContain("rainStreakVyFromSpeed(");
    expect(rainSrc).toMatch(
      /rainStreakVyAfterRestart\([\s\S]{0,200}rainStreakVyFromPhase\(/,
    );
    expect(viewSrc).toContain("rainStreakVyAfterRestart(");
    expect(viewSrc).toContain("rainStreakVyFromSpeed(");
    expect(viewSrc).toMatch(
      /const vy = rainStreakVyAfterRestart\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(dt > 0\) \{[\s\S]{0,80}d\.y = rainStreakYFromFall\(\s*d\.y,\s*rainStreakVyFromSpeed\(\s*d\.vy\),\s*dt,\s*i\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("d.vy = tickRainStreak");
    expect(viewSrc).not.toContain("vy: 9 + Math.random()");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakVyAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakVyAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakVyAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakVyAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakVyAfterRestart(");
    expect(saveSrc).not.toContain("rainStreakVyAfterRestart");
    expect(saveSrc).not.toContain("rainStreakVyFromSpeed");
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

describe("rainStreakVzAfterRestart (R / softReset)", () => {
  test("deriva Z fresca (spawn); leftover mid-life vz no filtra", () => {
    const boot = rainStreakVzAfterRestart(0.4);
    expect(boot).toBe(rainStreakVzFromPhase(0.4));
    expect(boot).toBe((0.4 - 0.5) * 14);
    expect(boot).toBeCloseTo(-1.4, 10);
    expect(rainStreakVzAfterRestart(0)).toBe(-7);
    expect(rainStreakVzAfterRestart(1)).toBe(7);
    expect(rainStreakVzAfterRestart()).toBe(-7);
    expect(boot).toBe(rainStreakVzFromZ(boot));

    const leftoverVz = 20;
    expect(leftoverVz).toBeGreaterThan(7);
    expect(leftoverVz).not.toBe(boot);
    expect(rainStreakVzFromZ(leftoverVz)).toBe(leftoverVz);
    expect(rainStreakVzFromZ(leftoverVz)).not.toBe(boot);
    expect(rainStreakYFromFall(4.4, 10, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, 10, 0.2, 1, true)).toBe(4.4);

    expect(rainStreakVzFromZ(leftoverVz)).not.toBe(
      rainStreakVzAfterRestart(0.4),
    );
    expect(rainStreakVzFromZ(leftoverVz)).not.toBe(boot);
  });

  test("vivo tick no usa el helper (vz se queda; Y avanza)", () => {
    const boot = rainStreakVzAfterRestart(0.4);
    const liveVz = rainStreakVzFromZ(boot);
    expect(liveVz).toBe(boot);
    expect(liveVz).toBe(rainStreakVzAfterRestart(0.4));
    const live = rainStreakYFromFall(4.4, 10, 0.2, 1, false);
    expect(live).toBeCloseTo(4.4 - 10 * 0.2 * 1.2, 10);
    expect(live).not.toBe(4.4);
    expect(rainStreakVzFromZ(liveVz)).toBe(boot);
    expect(rainStreakYFromFall(live, 10, 0.1, 1, false)).not.toBe(4.4);
  });
});

describe("rain vz/deriva recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain vz fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainStreakVzAfterRestart(");
    expect(rainSrc).toContain("rainStreakVzFromPhase(");
    expect(rainSrc).toContain("rainStreakVzFromZ(");
    expect(rainSrc).toMatch(
      /rainStreakVzAfterRestart\([\s\S]{0,200}rainStreakVzFromPhase\(/,
    );
    expect(viewSrc).toContain("rainStreakVzAfterRestart(");
    expect(viewSrc).toContain("rainStreakVzFromZ(");
    expect(viewSrc).toMatch(
      /const vz = rainStreakVzAfterRestart\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(dt > 0\) \{[\s\S]{0,600}d\.mesh\.position\.set\(\s*d\.vx,\s*d\.y,\s*rainStreakVzFromZ\(\s*d\.vz\)\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("d.vz = tickRainStreak");
    expect(viewSrc).not.toContain("const vz = (Math.random()");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakVzAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakVzAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakVzAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakVzAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakVzAfterRestart(");
    expect(saveSrc).not.toContain("rainStreakVzAfterRestart");
    expect(saveSrc).not.toContain("rainStreakVzFromZ");
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

describe("rainStreakYWrapAfterRestart (R / softReset)", () => {
  test("respawn fresco (wrap); leftover mid-fall wrap no filtra", () => {
    const boot = rainStreakYWrapAfterRestart(0.4);
    expect(boot).toBe(rainStreakYFromWrap(0.4));
    expect(boot).toBe(2.2 + 0.4 * 5.5);
    expect(boot).toBeCloseTo(4.4, 10);
    expect(rainStreakYWrapAfterRestart(0)).toBe(2.2);
    expect(rainStreakYWrapAfterRestart(1)).toBe(7.7);
    expect(rainStreakYWrapAfterRestart()).toBe(2.2);
    expect(RAIN_WRAP_BELOW).toBe(0.15);
    expect(rainStreakNeedsWrap(boot)).toBe(false);
    expect(rainStreakNeedsWrap(RAIN_WRAP_BELOW)).toBe(false);

    const leftoverY = 0.1;
    expect(leftoverY).toBeLessThan(RAIN_WRAP_BELOW);
    expect(rainStreakNeedsWrap(leftoverY)).toBe(true);
    expect(leftoverY).not.toBe(boot);
    expect(rainStreakNeedsWrap(leftoverY)).not.toBe(rainStreakNeedsWrap(boot));
    expect(rainStreakYFromFall(leftoverY, 10, 0.2, 1, true)).toBe(leftoverY);
    expect(rainStreakYFromFall(leftoverY, 10, 0.2, 1, true)).not.toBe(boot);
    expect(tickRainStreakY(leftoverY, 10, 0.2, 1, true)).toBe(leftoverY);

    const leftoverWrap = rainStreakYFromWrap(0);
    expect(leftoverWrap).toBe(2.2);
    expect(leftoverWrap).not.toBe(rainStreakYAfterRestart(0));
    expect(rainStreakYAfterRestart(0)).toBe(2);
    expect(rainStreakNeedsWrap(rainStreakYAfterRestart(0))).toBe(false);
    expect(rainStreakYFromWrap(1)).toBe(7.7);
    expect(rainStreakYFromWrap(1)).not.toBe(rainStreakYAfterRestart(1));
    expect(rainStreakYAfterRestart(1)).toBe(8);

    expect(rainStreakNeedsWrap(Number.NaN)).toBe(false);
    expect(rainStreakNeedsWrap(0.15)).toBe(false);
    expect(rainStreakNeedsWrap(0.149)).toBe(true);
  });

  test("vivo tick no usa el helper (Y avanza; wrap solo si floor)", () => {
    const boot = rainStreakYWrapAfterRestart(0.4);
    const live = rainStreakYFromFall(boot, 10, 0.2, 1, false);
    expect(live).toBeCloseTo(boot - 10 * 0.2 * 1.2, 10);
    expect(live).not.toBe(rainStreakYWrapAfterRestart(0.4));
    expect(live).toBeLessThan(boot);
    expect(rainStreakNeedsWrap(live)).toBe(false);
    expect(rainStreakYFromFall(live, 10, 0.1, 1, false)).not.toBe(
      rainStreakYWrapAfterRestart(0.4),
    );

    const midFall = rainStreakYFromFall(0.2, 10, 0.1, 1, false);
    expect(midFall).toBeCloseTo(0.2 - 10 * 0.1 * 1.2, 10);
    expect(midFall).toBeLessThan(RAIN_WRAP_BELOW);
    expect(rainStreakNeedsWrap(midFall)).toBe(true);
    expect(rainStreakYFromWrap(0.4)).not.toBe(midFall);
    expect(rainStreakYWrapAfterRestart(0.4)).not.toBe(midFall);
  });
});

describe("rainStreakScaleYAfterRestart (R / softReset)", () => {
  test("largo fresco (medianoche); leftover mid-life scale no filtra", () => {
    const boot = rainStreakScaleYAfterRestart();
    expect(boot).toBe(rainStreakScaleYFromLook(0.08));
    expect(boot).toBe(rainStreakScaleY(0.08));
    expect(boot).toBe(
      rainStreakLength(0.08) / RAIN_STREAK_LENGTH_DAY,
    );
    expect(boot).toBeCloseTo(
      (0.727375 + (1.09503 - 0.727375) * 0.92) / 0.727375,
      10,
    );
    expect(rainStreakScaleYAfterRestart(0.08)).toBe(boot);
    expect(rainStreakScaleYAfterRestart(1)).toBe(rainStreakScaleY(1));
    expect(rainStreakScaleYAfterRestart(0)).toBe(rainStreakScaleY(0));

    const leftoverCtor = 1;
    expect(leftoverCtor).not.toBe(boot);
    expect(leftoverCtor).toBeLessThan(boot);
    expect(rainStreakScaleYFromLook(0.08)).not.toBe(leftoverCtor);

    const leftoverNoon = rainStreakScaleYFromLook(1);
    expect(leftoverNoon).toBe(rainStreakScaleY(1));
    expect(leftoverNoon).toBe(1);
    expect(leftoverNoon).not.toBe(boot);
    expect(leftoverNoon).not.toBe(rainStreakScaleYAfterRestart());

    const leftoverNight = rainStreakScaleYFromLook(0);
    expect(leftoverNight).toBe(rainStreakScaleY(0));
    expect(leftoverNight).toBeCloseTo(
      RAIN_STREAK_LENGTH_NIGHT / RAIN_STREAK_LENGTH_DAY,
      10,
    );
    expect(leftoverNight).toBeGreaterThan(boot);
    expect(leftoverNight).not.toBe(rainStreakScaleYAfterRestart());

    expect(rainStreakScaleYFromLook(0.5)).not.toBe(boot);
    expect(rainStreakYFromFall(4.4, 10, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, 10, 0.2, 1, true)).toBe(4.4);
  });

  test("vivo tick no usa el helper (largo avanza con daylight)", () => {
    const boot = rainStreakScaleYAfterRestart();
    const liveNoon = rainStreakScaleYFromLook(1);
    expect(liveNoon).toBe(rainStreakScaleY(1));
    expect(liveNoon).not.toBe(boot);
    expect(liveNoon).not.toBe(rainStreakScaleYAfterRestart());
    expect(liveNoon).toBeLessThan(boot);

    const liveDusk = rainStreakScaleYFromLook(0);
    expect(liveDusk).toBeGreaterThan(boot);
    expect(liveDusk).not.toBe(rainStreakScaleYAfterRestart());
    expect(rainStreakScaleYFromLook(0.08)).toBe(boot);
  });
});

describe("rain scaleY/largo recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain scaleY fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainStreakScaleYAfterRestart(");
    expect(rainSrc).toContain("rainStreakScaleYFromLook(");
    expect(rainSrc).toContain("rainStreakScaleY(");
    expect(rainSrc).toMatch(
      /rainStreakScaleYAfterRestart\([\s\S]{0,200}rainStreakScaleYFromLook\(/,
    );
    expect(viewSrc).toContain("rainStreakScaleYAfterRestart(");
    expect(viewSrc).toContain("rainStreakScaleYFromLook(");
    expect(viewSrc).toMatch(
      /mesh\.scale\.set\(\s*1,\s*rainStreakScaleYAfterRestart\(\s*\),\s*1\s*\)/,
    );
    expect(viewSrc).toMatch(
      /const sy = rainStreakScaleYFromLook\(\s*daylight\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("const sy = rainStreakScaleY(");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakScaleYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakScaleYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakScaleYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakScaleYAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakScaleYAfterRestart(");
    expect(gameSrc).not.toContain("rainStreakScaleYFromLook(");
    expect(saveSrc).not.toContain("rainStreakScaleYAfterRestart");
    expect(saveSrc).not.toContain("rainStreakScaleYFromLook");
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

describe("rainStreakOpacityAfterRestart (R / softReset)", () => {
  test("look fresco (drizzle + medianoche); leftover mid-life opacity no filtra", () => {
    const boot = rainStreakOpacityAfterRestart();
    expect(boot).toBe(rainStreakOpacityFromLook(0.4, 0.08));
    expect(boot).toBe(rainStreakOpacity(0.4, 0.08));
    expect(boot).toBeCloseTo(0.3345925 + 0.4 * 0.68439375 + 0.39675 * 0.92, 10);
    expect(rainStreakOpacityAfterRestart(0.4, 0.08)).toBe(boot);
    expect(rainStreakOpacityAfterRestart(0, 1)).toBe(rainStreakOpacity(0, 1));
    expect(rainStreakOpacityAfterRestart(1, 0)).toBe(rainStreakOpacity(1, 0));

    const leftoverCtor = 0.45;
    expect(leftoverCtor).not.toBe(boot);
    expect(leftoverCtor).toBeLessThan(boot);
    expect(rainStreakOpacityFromLook(0.4, 0.08)).not.toBe(leftoverCtor);

    const leftoverStormNoon = rainStreakOpacityFromLook(0.85, 1);
    expect(leftoverStormNoon).toBe(rainStreakOpacity(0.85, 1));
    expect(leftoverStormNoon).toBeCloseTo(0.3345925 + 0.85 * 0.68439375, 10);
    expect(leftoverStormNoon).not.toBe(boot);
    expect(leftoverStormNoon).not.toBe(rainStreakOpacityAfterRestart());

    const leftoverDrizzleNoon = rainStreakOpacityFromLook(0.4, 1);
    expect(leftoverDrizzleNoon).toBe(rainStreakOpacity(0.4, 1));
    expect(leftoverDrizzleNoon).toBeLessThan(boot);
    expect(leftoverDrizzleNoon).not.toBe(rainStreakOpacityAfterRestart());

    expect(rainStreakOpacityFromLook(0.85, 0.08)).not.toBe(boot);
    expect(rainStreakYFromFall(4.4, 10, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, 10, 0.2, 1, true)).toBe(4.4);
  });

  test("vivo tick no usa el helper (look avanza con intensity/daylight)", () => {
    const boot = rainStreakOpacityAfterRestart();
    const liveNoon = rainStreakOpacityFromLook(0.4, 1);
    expect(liveNoon).toBe(rainStreakOpacity(0.4, 1));
    expect(liveNoon).not.toBe(boot);
    expect(liveNoon).not.toBe(rainStreakOpacityAfterRestart());
    expect(liveNoon).toBeLessThan(boot);

    const liveStorm = rainStreakOpacityFromLook(0.85, 0.08);
    expect(liveStorm).toBeGreaterThan(boot);
    expect(liveStorm).not.toBe(rainStreakOpacityAfterRestart());
    expect(rainStreakOpacityFromLook(0.4, 0.08)).toBe(boot);
  });
});

describe("rain opacity/look recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain opacity fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainStreakOpacityAfterRestart(");
    expect(rainSrc).toContain("rainStreakOpacityFromLook(");
    expect(rainSrc).toContain("rainStreakOpacity(");
    expect(rainSrc).toMatch(
      /rainStreakOpacityAfterRestart\([\s\S]{0,200}rainStreakOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("rainStreakOpacityAfterRestart(");
    expect(viewSrc).toContain("rainStreakOpacityFromLook(");
    expect(viewSrc).toMatch(
      /opacity:\s*rainStreakOpacityAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /const op = rainStreakOpacityFromLook\(\s*i,\s*daylight\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("opacity: 0.45");
    expect(viewSrc).not.toContain("const op = rainStreakOpacity(");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakOpacityAfterRestart(");
    expect(gameSrc).not.toContain("rainStreakOpacityFromLook(");
    expect(saveSrc).not.toContain("rainStreakOpacityAfterRestart");
    expect(saveSrc).not.toContain("rainStreakOpacityFromLook");
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

describe("rain wrap/respawn recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain spawn (no wrap leftover); F9 no helper", () => {
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
    expect(rainSrc).toContain("rainStreakYWrapAfterRestart(");
    expect(rainSrc).toContain("rainStreakYFromWrap(");
    expect(rainSrc).toContain("rainStreakNeedsWrap(");
    expect(rainSrc).toContain("RAIN_WRAP_BELOW");
    expect(rainSrc).toMatch(
      /rainStreakYWrapAfterRestart\([\s\S]{0,200}rainStreakYFromWrap\(/,
    );
    expect(viewSrc).toContain("rainStreakNeedsWrap(");
    expect(viewSrc).toContain("rainStreakYFromWrap(");
    expect(viewSrc).toContain("rainStreakYAfterRestart(");
    expect(viewSrc).toMatch(
      /const y = rainStreakYAfterRestart\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(dt > 0\) \{[\s\S]{0,200}if \(rainStreakNeedsWrap\(\s*d\.y\)\) \{[\s\S]{0,80}d\.y = rainStreakYFromWrap\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(rainStreakNeedsWrap\(\s*d\.y\)\) \{[\s\S]{0,200}d\.vx = rainStreakVxFromPhase\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toMatch(
      /if \(rainStreakNeedsWrap\(\s*d\.y\)\) \{[\s\S]{0,200}d\.vz = rainStreakVzFromPhase\(\s*Math\.random\(\)\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("d.y < 0.15");
    expect(viewSrc).not.toContain("2.2 + Math.random()");
    expect(viewSrc).not.toContain("d.vx = (Math.random()");
    expect(viewSrc).not.toContain("d.vz = (Math.random()");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreakYWrapAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreakYWrapAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreakYWrapAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreakYWrapAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreakYWrapAfterRestart(");
    expect(gameSrc).not.toContain("rainStreakYFromWrap(");
    expect(gameSrc).not.toContain("rainStreakNeedsWrap(");
    expect(saveSrc).not.toContain("rainStreakYWrapAfterRestart");
    expect(saveSrc).not.toContain("rainStreakYFromWrap");
    expect(saveSrc).not.toContain("rainStreakNeedsWrap");
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

describe("rainActiveCountAfterRestart (R / softReset)", () => {
  test("count fresco (drizzle + medianoche); leftover mid-life active no filtra", () => {
    const boot = rainActiveCountAfterRestart();
    expect(boot).toBe(rainActiveCountFromLook(0.4, 0.08));
    expect(boot).toBe(rainActiveCount(0.4, 0.08));
    expect(boot).toBe(
      Math.max(
        RAIN_ACTIVE_MIN,
        Math.floor(47 * (0.4025 + 0.4 * 0.7475) * (1 - 0.16617 * 0.92)),
      ),
    );
    expect(boot).toBe(27);
    expect(rainActiveCountAfterRestart(0.4, 0.08)).toBe(boot);
    expect(rainActiveCountAfterRestart(0, 1)).toBe(rainActiveCount(0, 1));
    expect(rainActiveCountAfterRestart(1, 0)).toBe(rainActiveCount(1, 0));

    const leftoverCtor = RAIN_COUNT;
    expect(leftoverCtor).toBe(47);
    expect(leftoverCtor).not.toBe(boot);
    expect(leftoverCtor).toBeGreaterThan(boot);
    expect(rainActiveCountFromLook(0.4, 0.08)).not.toBe(leftoverCtor);

    const leftoverStormNoon = rainActiveCountFromLook(0.85, 1);
    expect(leftoverStormNoon).toBe(rainActiveCount(0.85, 1));
    expect(leftoverStormNoon).toBe(
      Math.floor(47 * (0.4025 + 0.85 * 0.7475)),
    );
    expect(leftoverStormNoon).toBe(48);
    expect(leftoverStormNoon).not.toBe(boot);
    expect(leftoverStormNoon).not.toBe(rainActiveCountAfterRestart());

    const leftoverDrizzleNoon = rainActiveCountFromLook(0.4, 1);
    expect(leftoverDrizzleNoon).toBe(rainActiveCount(0.4, 1));
    expect(leftoverDrizzleNoon).toBe(Math.floor(47 * (0.4025 + 0.4 * 0.7475)));
    expect(leftoverDrizzleNoon).toBe(32);
    expect(leftoverDrizzleNoon).toBeGreaterThan(boot);
    expect(leftoverDrizzleNoon).not.toBe(rainActiveCountAfterRestart());

    expect(rainActiveCountFromLook(0.85, 0.08)).not.toBe(boot);
    expect(rainStreakYFromFall(4.4, 10, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, 10, 0.2, 1, true)).toBe(4.4);
  });

  test("vivo tick no usa el helper (count avanza con intensity/daylight)", () => {
    const boot = rainActiveCountAfterRestart();
    const liveNoon = rainActiveCountFromLook(0.4, 1);
    expect(liveNoon).toBe(rainActiveCount(0.4, 1));
    expect(liveNoon).not.toBe(boot);
    expect(liveNoon).not.toBe(rainActiveCountAfterRestart());
    expect(liveNoon).toBeGreaterThan(boot);

    const liveStorm = rainActiveCountFromLook(0.85, 0.08);
    expect(liveStorm).toBeGreaterThan(boot);
    expect(liveStorm).not.toBe(rainActiveCountAfterRestart());
    expect(rainActiveCountFromLook(0.4, 0.08)).toBe(boot);
  });
});

describe("rain count/active recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain count fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainActiveCountAfterRestart(");
    expect(rainSrc).toContain("rainActiveCountFromLook(");
    expect(rainSrc).toContain("rainActiveCount(");
    expect(rainSrc).toMatch(
      /rainActiveCountAfterRestart\([\s\S]{0,200}rainActiveCountFromLook\(/,
    );
    expect(viewSrc).toContain("rainActiveCountAfterRestart(");
    expect(viewSrc).toContain("rainActiveCountFromLook(");
    expect(viewSrc).toMatch(
      /mesh\.visible = i < rainActiveCountAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /const active = rainActiveCountFromLook\(\s*i,\s*daylight\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toContain("const active = rainActiveCount(");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainActiveCountAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainActiveCountAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainActiveCountAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainActiveCountAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainActiveCountAfterRestart(");
    expect(gameSrc).not.toContain("rainActiveCountFromLook(");
    expect(saveSrc).not.toContain("rainActiveCountAfterRestart");
    expect(saveSrc).not.toContain("rainActiveCountFromLook");
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

describe("rainStreaksHiddenAfterRestart (R / softReset)", () => {
  test("grupo fresco (drizzle visible); leftover mid-life hide no filtra", () => {
    const boot = rainStreaksHiddenAfterRestart();
    expect(boot).toBe(rainStreaksHiddenFromLook(0.4));
    expect(boot).toBe(rainStreaksHidden(0.4));
    expect(boot).toBe(false);
    expect(rainStreaksHiddenAfterRestart(0.4)).toBe(boot);
    expect(rainStreaksHiddenAfterRestart(0)).toBe(rainStreaksHidden(0));
    expect(rainStreaksHiddenAfterRestart(1)).toBe(rainStreaksHidden(1));

    const leftoverCtor = true;
    expect(leftoverCtor).not.toBe(boot);
    expect(leftoverCtor).toBe(true);
    expect(rainStreaksHiddenFromLook(0.4)).not.toBe(leftoverCtor);

    const leftoverClear = rainStreaksHiddenFromLook(0);
    expect(leftoverClear).toBe(rainStreaksHidden(0));
    expect(leftoverClear).toBe(true);
    expect(leftoverClear).not.toBe(boot);
    expect(leftoverClear).not.toBe(rainStreaksHiddenAfterRestart());

    const leftoverIndoor = rainStreaksHiddenFromLook(0);
    expect(leftoverIndoor).toBe(true);
    expect(leftoverIndoor).not.toBe(rainStreaksHiddenAfterRestart());

    const leftoverHideBelow = rainStreaksHiddenFromLook(0.0174);
    expect(leftoverHideBelow).toBe(true);
    expect(leftoverHideBelow).not.toBe(boot);

    const leftoverStorm = rainStreaksHiddenFromLook(0.85);
    expect(leftoverStorm).toBe(rainStreaksHidden(0.85));
    expect(leftoverStorm).toBe(false);
    expect(leftoverStorm).toBe(boot);

    expect(rainStreaksHiddenFromLook(0.4)).toBe(boot);
    expect(rainStreakYFromFall(4.4, 10, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, 10, 0.2, 1, true)).toBe(4.4);
  });

  test("vivo tick no usa el helper (hide avanza con intensity)", () => {
    const boot = rainStreaksHiddenAfterRestart();
    const liveClear = rainStreaksHiddenFromLook(0);
    expect(liveClear).toBe(rainStreaksHidden(0));
    expect(liveClear).not.toBe(boot);
    expect(liveClear).not.toBe(rainStreaksHiddenAfterRestart());
    expect(liveClear).toBe(true);

    const liveIndoor = rainStreaksHiddenFromLook(0);
    expect(liveIndoor).toBe(true);
    expect(liveIndoor).not.toBe(rainStreaksHiddenAfterRestart());
    expect(rainStreaksHiddenFromLook(0.4)).toBe(boot);
    expect(rainStreaksHiddenFromLook(0.85)).toBe(false);
  });
});

describe("rain hide/grupo recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain grupo fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainStreaksHiddenAfterRestart(");
    expect(rainSrc).toContain("rainStreaksHiddenFromLook(");
    expect(rainSrc).toContain("rainStreaksHidden(");
    expect(rainSrc).toMatch(
      /rainStreaksHiddenAfterRestart\([\s\S]{0,200}rainStreaksHiddenFromLook\(/,
    );
    expect(viewSrc).toContain("rainStreaksHiddenAfterRestart(");
    expect(viewSrc).toContain("rainStreaksHiddenFromLook(");
    expect(viewSrc).toMatch(
      /rainGroup\.visible = !rainStreaksHiddenAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /if \(rainStreaksHiddenFromLook\(\s*i\)\) \{/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toMatch(
      /const rainGroup = new THREE\.Group\(\);\s*rainGroup\.visible = false/,
    );
    expect(viewSrc).not.toContain("if (rainStreaksHidden(i))");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainStreaksHiddenAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainStreaksHiddenAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainStreaksHiddenAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainStreaksHiddenAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainStreaksHiddenAfterRestart(");
    expect(gameSrc).not.toContain("rainStreaksHiddenFromLook(");
    expect(saveSrc).not.toContain("rainStreaksHiddenAfterRestart");
    expect(saveSrc).not.toContain("rainStreaksHiddenFromLook");
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

describe("rainAnchorAfterRestart (R / softReset)", () => {
  test("pos fresco (spawn 24.5, 15.5); leftover mid-life origin no filtra", () => {
    const bootX = rainAnchorXAfterRestart();
    const bootZ = rainAnchorZAfterRestart();
    const barrio = createNeighborhood(48);
    expect(bootX).toBe(rainAnchorXFromLook(24.5));
    expect(bootZ).toBe(rainAnchorZFromLook(15.5));
    expect(bootX).toBe(RAIN_ANCHOR_X_SPAWN);
    expect(bootZ).toBe(RAIN_ANCHOR_Z_SPAWN);
    expect(bootX).toBe(barrio.spawn.x);
    expect(bootZ).toBe(barrio.spawn.y);
    expect(rainAnchorXAfterRestart(24.5)).toBe(bootX);
    expect(rainAnchorZAfterRestart(15.5)).toBe(bootZ);
    expect(rainAnchorXAfterRestart(0)).toBe(rainAnchorXFromLook(0));
    expect(rainAnchorZAfterRestart(40)).toBe(rainAnchorZFromLook(40));

    const leftoverCtorX = 0;
    const leftoverCtorZ = 0;
    expect(leftoverCtorX).not.toBe(bootX);
    expect(leftoverCtorZ).not.toBe(bootZ);
    expect(leftoverCtorX).toBe(0);
    expect(leftoverCtorZ).toBe(0);
    expect(rainAnchorXFromLook(24.5)).not.toBe(leftoverCtorX);
    expect(rainAnchorZFromLook(15.5)).not.toBe(leftoverCtorZ);

    const leftoverFarX = rainAnchorXFromLook(40);
    const leftoverFarZ = rainAnchorZFromLook(30);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(leftoverFarX).not.toBe(bootX);
    expect(leftoverFarZ).not.toBe(bootZ);
    expect(leftoverFarX).not.toBe(rainAnchorXAfterRestart());
    expect(leftoverFarZ).not.toBe(rainAnchorZAfterRestart());

    const leftoverOrigin = rainAnchorXFromLook(0);
    expect(leftoverOrigin).toBe(0);
    expect(leftoverOrigin).not.toBe(rainAnchorXAfterRestart());

    expect(rainAnchorXFromLook(24.5)).toBe(bootX);
    expect(rainAnchorZFromLook(15.5)).toBe(bootZ);
    expect(rainStreakYFromFall(4.4, 10, 0.2, 1, true)).toBe(4.4);
    expect(tickRainStreakY(4.4, 10, 0.2, 1, true)).toBe(4.4);
  });

  test("vivo tick no usa el helper (origin avanza con player)", () => {
    const bootX = rainAnchorXAfterRestart();
    const bootZ = rainAnchorZAfterRestart();
    const liveX = rainAnchorXFromLook(40);
    const liveZ = rainAnchorZFromLook(30);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveX).not.toBe(rainAnchorXAfterRestart());
    expect(liveZ).not.toBe(rainAnchorZAfterRestart());
    expect(liveX).toBeGreaterThan(bootX);
    expect(liveZ).toBeGreaterThan(bootZ);

    expect(rainAnchorXFromLook(24.5)).toBe(bootX);
    expect(rainAnchorZFromLook(15.5)).toBe(bootZ);
    expect(rainAnchorXFromLook(0)).toBe(0);
  });
});

describe("rain position/anchor recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rain pos fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainAnchorXAfterRestart(");
    expect(rainSrc).toContain("rainAnchorZAfterRestart(");
    expect(rainSrc).toContain("rainAnchorXFromLook(");
    expect(rainSrc).toContain("rainAnchorZFromLook(");
    expect(rainSrc).toContain("RAIN_ANCHOR_X_SPAWN");
    expect(rainSrc).toContain("RAIN_ANCHOR_Z_SPAWN");
    expect(rainSrc).toMatch(
      /rainAnchorXAfterRestart\([\s\S]{0,200}rainAnchorXFromLook\(/,
    );
    expect(rainSrc).toMatch(
      /rainAnchorZAfterRestart\([\s\S]{0,200}rainAnchorZFromLook\(/,
    );
    expect(viewSrc).toContain("rainAnchorXAfterRestart(");
    expect(viewSrc).toContain("rainAnchorZAfterRestart(");
    expect(viewSrc).toContain("rainAnchorXFromLook(");
    expect(viewSrc).toContain("rainAnchorZFromLook(");
    expect(viewSrc).toMatch(
      /rainGroup\.position\.set\(\s*rainAnchorXAfterRestart\(\s*\),\s*0,\s*rainAnchorZAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /let rainAnchorX = rainAnchorXAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /let rainAnchorZ = rainAnchorZAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /rainAnchorX = rainAnchorXFromLook\(\s*wx\)/,
    );
    expect(viewSrc).toMatch(
      /rainAnchorZ = rainAnchorZFromLook\(\s*wy\)/,
    );
    expect(viewSrc).toMatch(
      /rainGroup\.position\.set\(\s*rainAnchorXFromLook\(\s*wx\),\s*0,\s*rainAnchorZFromLook\(\s*wy\)/,
    );
    expect(viewSrc).toContain("rainStreakYFromFall(");
    expect(viewSrc).not.toMatch(/let rainAnchorX = 0/);
    expect(viewSrc).not.toMatch(/let rainAnchorZ = 0/);
    expect(viewSrc).not.toContain("rainGroup.position.set(wx, 0, wy)");
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainAnchorXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainAnchorXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainAnchorXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainAnchorXAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainAnchorXAfterRestart(");
    expect(gameSrc).not.toContain("rainAnchorZAfterRestart(");
    expect(gameSrc).not.toContain("rainAnchorXFromLook(");
    expect(gameSrc).not.toContain("rainAnchorZFromLook(");
    expect(saveSrc).not.toContain("rainAnchorXAfterRestart");
    expect(saveSrc).not.toContain("rainAnchorZAfterRestart");
    expect(saveSrc).not.toContain("rainAnchorXFromLook");
    expect(saveSrc).not.toContain("rainAnchorZFromLook");
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
