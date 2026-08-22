import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BED_FOCUS_LOOK_X_SPAWN,
  BED_FOCUS_LOOK_Z_SPAWN,
  BED_FOCUS_PULSE_AMP,
  BED_FOCUS_PULSE_SPEED,
  BED_FOCUS_REACH,
  BED_FOCUS_SCALE_FAR,
  BED_FOCUS_SCALE_NEAR,
  bedFocusApplies,
  bedFocusDistAfterRestart,
  bedFocusDistFromLook,
  bedFocusElapsedAfterRestart,
  bedFocusElapsedFromLook,
  bedFocusInReach,
  bedFocusLookXAfterRestart,
  bedFocusLookXFromLook,
  bedFocusLookZAfterRestart,
  bedFocusLookZFromLook,
  bedFocusMul,
  bedFocusMulAfterRestart,
  bedFocusMulFromLook,
  bedBadgeDiscScale,
  bedBadgeFontPx,
  bedBadgeLabel,
  bedBadgeLetterScale,
  bedBadgeY,
  bedFocusPulse,
  bedFocusScale,
  bedRingVisible,
  bedRingVisibleAfterRestart,
  bedRingVisibleFromLook,
} from "../src/render/bedFocus";

describe("constantes", () => {
  test("reach 1.5; near 1.785375; far 1.4812; pulse 0.066125 / 6.9", () => {
    expect(BED_FOCUS_REACH).toBe(1.5);
    expect(BED_FOCUS_SCALE_NEAR).toBe(1.785375);
    expect(BED_FOCUS_SCALE_NEAR).toBeCloseTo(1.5525 * 1.15, 10);
    expect(BED_FOCUS_SCALE_FAR).toBe(1.4812);
    expect(BED_FOCUS_SCALE_FAR).toBeCloseTo(1.288 * 1.15, 10);
    expect(BED_FOCUS_PULSE_AMP).toBe(0.066125);
    expect(BED_FOCUS_PULSE_AMP).toBeCloseTo(0.0575 * 1.15, 10);
    expect(BED_FOCUS_PULSE_SPEED).toBe(6.9);
    expect(BED_FOCUS_PULSE_SPEED).toBeCloseTo(6 * 1.15, 10);
  });

  test("bedBadgeLabel es Z; font 92; letter 2.76; disc 1.725; Y 2.645", () => {
    expect(bedBadgeLabel).toBe("Z");
    expect(bedBadgeFontPx).toBe(92);
    expect(bedBadgeFontPx).toBeCloseTo(80 * 1.15, 10);
    expect(bedBadgeLetterScale).toBe(2.76);
    expect(bedBadgeLetterScale).toBeCloseTo(2.4 * 1.15, 10);
    expect(bedBadgeDiscScale).toBe(1.725);
    expect(bedBadgeDiscScale).toBeCloseTo(1.5 * 1.15, 10);
    expect(bedBadgeY).toBe(2.645);
    expect(bedBadgeY).toBeCloseTo(2.3 * 1.15, 10);
  });

  test("worldView aplica bedBadgeFontPx al canvas de la letra Z del floatBadge existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "makeBadgeLetterTexture(bedBadgeLabel, bedBadgeFontPx)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = bedBadgeY");
  });

  test("worldView aplica bedBadgeLetterScale a la letra Z del floatBadge existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "icon.scale.set(bedBadgeLetterScale, bedBadgeLetterScale, 1)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = bedBadgeY");
  });

  test("worldView aplica bedBadgeDiscScale al disc del floatBadge Z existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "disc.scale.set(bedBadgeDiscScale, bedBadgeDiscScale, 1)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = bedBadgeY");
  });

  test("worldView aplica bedFocusMul al grupo de cama existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("bedFocusMulFromLook(bestD, elapsed, gameOver)");
    expect(src).toContain("e.group.scale.setScalar(mul)");
  });
});

describe("bedFocusScale", () => {
  test("1.785375 en dist 0; 1.4812 en reach; 1.0 fuera", () => {
    expect(bedFocusScale(0)).toBe(1.785375);
    expect(bedFocusScale(1.5)).toBeCloseTo(1.4812, 10);
    expect(bedFocusScale(1.51)).toBe(1);
    expect(bedFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.75: 1.785375 + (1.4812-1.785375)*0.5 = 1.6332875
    expect(bedFocusScale(0.75)).toBeCloseTo(1.6332875, 10);
    const t = 0.25;
    const expected = 1.785375 + (1.4812 - 1.785375) * t;
    expect(bedFocusScale(1.5 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(bedFocusScale(Number.NaN)).toBe(1);
    expect(bedFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });

  test("dist negativa se clampa a 0 → 1.785375", () => {
    expect(bedFocusScale(-0.4)).toBe(1.785375);
    expect(bedFocusInReach(-0.4)).toBe(true);
  });
});

describe("bedFocusPulse", () => {
  test("1 + 0.066125 * sin(elapsed * 6.9)", () => {
    expect(bedFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.066125
    expect(bedFocusPulse(Math.PI / (2 * 6.9))).toBeCloseTo(1.066125, 10);
    // sin(π) = 0 → 1
    expect(bedFocusPulse(Math.PI / 6.9)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.933875
    expect(bedFocusPulse((3 * Math.PI) / (2 * 6.9))).toBeCloseTo(0.933875, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(bedFocusPulse(Number.NaN)).toBe(1);
  });

  test("Infinity elapsed trata como 0", () => {
    expect(bedFocusPulse(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("bedFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse = 1.066125
    expect(bedFocusMul(0, elapsed)).toBeCloseTo(1.785375 * 1.066125, 10);
    expect(bedFocusMul(1.5, elapsed)).toBeCloseTo(1.4812 * 1.066125, 10);
    expect(bedFocusMul(0.75, 0)).toBeCloseTo(1.6332875, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse ≠ 1
    expect(bedFocusMul(1.51, elapsed)).toBe(1);
    expect(bedFocusMul(8, elapsed)).toBe(1);
    expect(bedFocusMul(Number.NaN, elapsed)).toBe(1);
  });
});

describe("bedFocusInReach", () => {
  test("incluye el borde; excluye más allá", () => {
    expect(bedFocusInReach(0)).toBe(true);
    expect(bedFocusInReach(1.5)).toBe(true);
    expect(bedFocusInReach(1.51)).toBe(false);
    expect(bedFocusInReach(Number.NaN)).toBe(false);
  });
});

describe("bedRingVisible", () => {
  test("0 y borde de reach → true", () => {
    expect(bedRingVisible(0)).toBe(true);
    expect(bedRingVisible(BED_FOCUS_REACH)).toBe(true);
  });

  test("justo fuera de reach → false", () => {
    expect(bedRingVisible(1.51)).toBe(false);
  });

  test("NaN / Inf / reach 0 → false", () => {
    expect(bedRingVisible(Number.NaN)).toBe(false);
    expect(bedRingVisible(Number.POSITIVE_INFINITY)).toBe(false);
    expect(bedRingVisible(Number.NEGATIVE_INFINITY)).toBe(false);
    expect(bedRingVisible(0, 0)).toBe(false);
    expect(bedRingVisible(0, Number.NaN)).toBe(false);
    expect(bedRingVisible(0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("bedFocusApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte con pulso: anillo hidden + mul 1; ya apagado no-op; load-muerto hidden; vivo/load-vivo pulsa", () => {
    const elapsed = Math.PI / (2 * 6.9);
    expect(bedFocusApplies(true)).toBe(false);
    expect(bedRingVisible(0, BED_FOCUS_REACH, true)).toBe(false);
    expect(bedFocusMul(0, elapsed, true)).toBe(1);

    expect(bedRingVisible(8, BED_FOCUS_REACH, true)).toBe(false);
    expect(bedFocusMul(8, elapsed, true)).toBe(1);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(bedFocusApplies(deadRt.gameOver)).toBe(false);
    expect(bedRingVisible(0, BED_FOCUS_REACH, deadRt.gameOver)).toBe(false);
    expect(bedFocusMul(0, elapsed, deadRt.gameOver)).toBe(1);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(bedFocusApplies(liveRt.gameOver)).toBe(true);
    expect(bedRingVisible(0, BED_FOCUS_REACH, liveRt.gameOver)).toBe(true);
    expect(bedFocusMul(0, elapsed, liveRt.gameOver)).toBeCloseTo(
      1.785375 * 1.066125,
      10,
    );

    expect(bedFocusApplies(false)).toBe(true);
    expect(bedRingVisible(0)).toBe(true);
    expect(bedFocusMul(0, elapsed)).toBeCloseTo(1.785375 * 1.066125, 10);
  });
});

describe("bedFocusAfterRestart (R / softReset)", () => {
  test("look fresco (spawn 24.5, 15.5); leftover ctor Three ring / dist 0 / origin / far no filtra", () => {
    const barrio = createNeighborhood(48);
    const beds: { x: number; y: number }[] = [];
    barrio.map.forEach((tx, ty, tile) => {
      if (tile.variant === "bed") beds.push({ x: tx + 0.5, y: ty + 0.5 });
    });
    expect(beds.length).toBeGreaterThan(0);

    const bootWx = bedFocusLookXAfterRestart();
    const bootWy = bedFocusLookZAfterRestart();
    const bootElapsed = bedFocusElapsedAfterRestart();
    expect(bootWx).toBe(bedFocusLookXFromLook(24.5));
    expect(bootWy).toBe(bedFocusLookZFromLook(15.5));
    expect(bootWx).toBe(BED_FOCUS_LOOK_X_SPAWN);
    expect(bootWy).toBe(BED_FOCUS_LOOK_Z_SPAWN);
    expect(bootWx).toBe(barrio.spawn.x);
    expect(bootWy).toBe(barrio.spawn.y);
    expect(bedFocusLookXAfterRestart(24.5)).toBe(bootWx);
    expect(bedFocusLookZAfterRestart(15.5)).toBe(bootWy);
    expect(bedFocusLookXAfterRestart(0)).toBe(bedFocusLookXFromLook(0));
    expect(bedFocusLookZAfterRestart(40)).toBe(bedFocusLookZFromLook(40));
    expect(bootElapsed).toBe(0);
    expect(bootElapsed).toBe(bedFocusElapsedFromLook(0));

    let closest = beds[0]!;
    let bootDist = bedFocusDistAfterRestart(closest.x, closest.y);
    for (const bed of beds) {
      const d = bedFocusDistAfterRestart(bed.x, bed.y);
      expect(d).toBeGreaterThan(BED_FOCUS_REACH);
      expect(bedRingVisibleAfterRestart(d)).toBe(false);
      expect(bedFocusMulAfterRestart(d)).toBe(1);
      if (d < bootDist) {
        closest = bed;
        bootDist = d;
      }
    }
    expect(bootDist).toBe(
      bedFocusDistFromLook(24.5, 15.5, closest.x, closest.y),
    );
    expect(bootDist).toBeGreaterThan(BED_FOCUS_REACH);
    const bootRing = bedRingVisibleAfterRestart(bootDist);
    const bootMul = bedFocusMulAfterRestart(bootDist);
    expect(bootRing).toBe(false);
    expect(bootRing).toBe(bedRingVisibleFromLook(bootDist));
    expect(bootMul).toBe(1);
    expect(bootMul).toBe(bedFocusMulFromLook(bootDist, 0));

    const leftoverCtorRing = true;
    const leftoverCtorDist = 0;
    const leftoverCtorScale = 1;
    expect(leftoverCtorRing).not.toBe(bootRing);
    expect(leftoverCtorDist).not.toBe(bootDist);
    expect(bedRingVisible(leftoverCtorDist)).toBe(true);
    expect(bedRingVisible(leftoverCtorDist)).not.toBe(bootRing);
    expect(leftoverCtorScale).toBe(bootMul);
    expect(bedFocusMul(leftoverCtorDist, 0)).toBe(1.785375);
    expect(bedFocusMul(leftoverCtorDist, 0)).not.toBe(bootMul);

    const leftoverOriginDist = bedFocusDistFromLook(0, 0, closest.x, closest.y);
    expect(leftoverOriginDist).not.toBe(bootDist);
    expect(bedFocusLookXFromLook(0)).toBe(0);
    expect(bedFocusLookXFromLook(0)).not.toBe(bootWx);
    expect(bedRingVisibleFromLook(leftoverOriginDist)).toBe(false);
    expect(bedFocusMulFromLook(leftoverOriginDist, 0)).toBe(1);

    const leftoverFarDist = bedFocusDistFromLook(40, 30, closest.x, closest.y);
    expect(leftoverFarDist).not.toBe(bootDist);
    expect(bedFocusLookXFromLook(40)).toBe(40);
    expect(bedFocusLookZFromLook(30)).toBe(30);
    expect(bedFocusLookXFromLook(40)).not.toBe(bootWx);
    expect(bedFocusLookZFromLook(30)).not.toBe(bootWy);
    expect(bedRingVisibleFromLook(leftoverFarDist)).toBe(false);
    expect(bedFocusMulFromLook(leftoverFarDist, 0)).toBe(1);
    expect(leftoverFarDist).not.toBe(
      bedFocusDistAfterRestart(closest.x, closest.y),
    );

    const leftoverPulse = Math.PI / (2 * BED_FOCUS_PULSE_SPEED);
    const leftoverMul = bedFocusMulFromLook(0, leftoverPulse);
    expect(leftoverMul).toBeCloseTo(1.785375 * 1.066125, 10);
    expect(leftoverMul).not.toBe(bootMul);
    expect(leftoverMul).not.toBe(bedFocusMulAfterRestart(bootDist));

    expect(bedFocusDistFromLook(24.5, 15.5, closest.x, closest.y)).toBe(
      bootDist,
    );
    expect(bedFocusMulFromLook(bootDist, 0)).toBe(bootMul);
    expect(bedFocusMulAfterRestart(bootDist, true)).toBe(1);
    expect(bedRingVisibleAfterRestart(bootDist, true)).toBe(false);
    expect(bedRingVisibleAfterRestart(leftoverCtorDist)).toBe(true);
  });

  test("vivo tick no usa el helper (pulso avanza con elapsed)", () => {
    const barrio = createNeighborhood(48);
    const beds: { x: number; y: number }[] = [];
    barrio.map.forEach((tx, ty, tile) => {
      if (tile.variant === "bed") beds.push({ x: tx + 0.5, y: ty + 0.5 });
    });
    const closest = beds.reduce((best, bed) => {
      const d = bedFocusDistAfterRestart(bed.x, bed.y);
      return d < best.d ? { x: bed.x, y: bed.y, d } : best;
    }, { x: beds[0]!.x, y: beds[0]!.y, d: Infinity });
    const bootDist = closest.d;
    const bootMul = bedFocusMulAfterRestart(bootDist);
    const bootElapsed = bedFocusElapsedAfterRestart();
    const liveElapsed = bedFocusElapsedFromLook(
      Math.PI / (2 * BED_FOCUS_PULSE_SPEED),
    );
    const liveMulNear = bedFocusMulFromLook(0, liveElapsed);
    const liveLookX = bedFocusLookXFromLook(40);
    const liveLookZ = bedFocusLookZFromLook(30);
    const liveDist = bedFocusDistFromLook(40, 30, closest.x, closest.y);
    expect(liveElapsed).not.toBe(bootElapsed);
    expect(liveElapsed).not.toBe(bedFocusElapsedAfterRestart());
    expect(liveMulNear).not.toBe(bootMul);
    expect(liveMulNear).not.toBe(bedFocusMulAfterRestart(bootDist));
    expect(liveLookX).toBe(40);
    expect(liveLookZ).toBe(30);
    expect(liveLookX).not.toBe(bedFocusLookXAfterRestart());
    expect(liveLookZ).not.toBe(bedFocusLookZAfterRestart());
    expect(liveDist).not.toBe(bootDist);
    expect(liveDist).not.toBe(bedFocusDistAfterRestart(closest.x, closest.y));
    expect(bedFocusMulFromLook(liveDist, liveElapsed)).toBe(1);
    expect(bedRingVisibleFromLook(liveDist)).toBe(false);
    expect(bedFocusLookXFromLook(24.5)).toBe(bedFocusLookXAfterRestart());
    expect(bedFocusLookZFromLook(15.5)).toBe(bedFocusLookZAfterRestart());
    expect(bedFocusMulFromLook(bootDist, 0)).toBe(bootMul);
  });
});

describe("bed focus recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace bed focus fresco; F9 no helper", () => {
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
    const focusSrc = readFileSync(
      resolve(process.cwd(), "src/render/bedFocus.ts"),
      "utf8",
    );
    expect(focusSrc).toContain("bedFocusLookXAfterRestart(");
    expect(focusSrc).toContain("bedFocusLookZAfterRestart(");
    expect(focusSrc).toContain("bedFocusLookXFromLook(");
    expect(focusSrc).toContain("bedFocusLookZFromLook(");
    expect(focusSrc).toContain("bedFocusDistAfterRestart(");
    expect(focusSrc).toContain("bedFocusDistFromLook(");
    expect(focusSrc).toContain("bedFocusElapsedAfterRestart(");
    expect(focusSrc).toContain("bedFocusElapsedFromLook(");
    expect(focusSrc).toContain("bedFocusMulAfterRestart(");
    expect(focusSrc).toContain("bedFocusMulFromLook(");
    expect(focusSrc).toContain("bedRingVisibleAfterRestart(");
    expect(focusSrc).toContain("bedRingVisibleFromLook(");
    expect(focusSrc).toContain("BED_FOCUS_LOOK_X_SPAWN");
    expect(focusSrc).toContain("BED_FOCUS_LOOK_Z_SPAWN");
    expect(focusSrc).toMatch(
      /bedFocusLookXAfterRestart\([\s\S]{0,200}bedFocusLookXFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /bedFocusLookZAfterRestart\([\s\S]{0,200}bedFocusLookZFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /bedFocusMulAfterRestart\([\s\S]{0,200}bedFocusMulFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /bedRingVisibleAfterRestart\([\s\S]{0,200}bedRingVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("bedFocusLookXAfterRestart(");
    expect(viewSrc).toContain("bedFocusLookZAfterRestart(");
    expect(viewSrc).toContain("bedFocusElapsedAfterRestart(");
    expect(viewSrc).toContain("bedFocusDistFromLook(");
    expect(viewSrc).toContain("bedFocusMulFromLook(");
    expect(viewSrc).toContain("bedRingVisibleFromLook(");
    expect(viewSrc).toMatch(
      /let bedFocusElapsed = bedFocusElapsedAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /applyBedFocusLook\(\s*bedFocusLookXAfterRestart\(\),\s*bedFocusLookZAfterRestart\(\),\s*bedFocusElapsed/,
    );
    expect(viewSrc).toMatch(
      /const d = bedFocusDistFromLook\(\s*wx,\s*wy,\s*e\.x,\s*e\.y\)/,
    );
    expect(viewSrc).toMatch(
      /const vis = bedRingVisibleFromLook\(\s*d,\s*gameOver\)/,
    );
    expect(viewSrc).toMatch(
      /bedFocusMulFromLook\(\s*bestD,\s*elapsed,\s*gameOver\)/,
    );
    expect(viewSrc).toContain("applyBedFocusLook(");
    expect(viewSrc).toMatch(
      /syncBedFocus\(wx, wy, dt, gameOver = false\) \{[\s\S]{0,240}applyBedFocusLook\(wx, wy, bedFocusElapsed, gameOver\)/,
    );
    expect(viewSrc).not.toMatch(/let bedFocusElapsed = 0/);
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3600}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncBedFocus\(/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncInteractFocus\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}bedFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}bedFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}bedFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}bedFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toContain("bedFocusLookXAfterRestart(");
    expect(gameSrc).not.toContain("bedFocusLookZAfterRestart(");
    expect(gameSrc).not.toContain("bedFocusElapsedAfterRestart(");
    expect(gameSrc).not.toContain("bedFocusMulAfterRestart(");
    expect(gameSrc).not.toContain("bedRingVisibleAfterRestart(");
    expect(gameSrc).not.toContain("bedFocusDistAfterRestart(");
    expect(gameSrc).not.toContain("bedFocusLookXFromLook(");
    expect(saveSrc).not.toContain("bedFocusLookXAfterRestart");
    expect(saveSrc).not.toContain("bedFocusElapsedAfterRestart");
    expect(saveSrc).not.toContain("bedFocusMulAfterRestart");
    expect(saveSrc).not.toContain("bedFocusLookXFromLook");
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
