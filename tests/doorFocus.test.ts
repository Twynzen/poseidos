import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DOOR_FOCUS_LOOK_X_SPAWN,
  DOOR_FOCUS_LOOK_Z_SPAWN,
  DOOR_FOCUS_PULSE_AMP,
  DOOR_FOCUS_PULSE_SPEED,
  DOOR_FOCUS_REACH,
  DOOR_FOCUS_SCALE_FAR,
  DOOR_FOCUS_SCALE_NEAR,
  doorFocusApplies,
  doorFocusDistAfterRestart,
  doorFocusDistFromLook,
  doorFocusElapsedAfterRestart,
  doorFocusElapsedFromLook,
  doorFocusInReach,
  doorFocusLookXAfterRestart,
  doorFocusLookXFromLook,
  doorFocusLookZAfterRestart,
  doorFocusLookZFromLook,
  doorFocusMul,
  doorFocusMulAfterRestart,
  doorFocusMulFromLook,
  doorBadgeDiscScale,
  doorBadgeFontPx,
  doorBadgeLabel,
  doorBadgeLetterScale,
  doorBadgeY,
  doorFocusPulse,
  doorFocusScale,
  doorRingVisible,
  doorRingVisibleAfterRestart,
  doorRingVisibleFromLook,
} from "../src/render/doorFocus";

describe("constantes", () => {
  test("reach 1.6; near 1.785375; far 1.4812; pulse 0.066125 / 6.9", () => {
    expect(DOOR_FOCUS_REACH).toBe(1.6);
    expect(DOOR_FOCUS_SCALE_NEAR).toBe(1.785375);
    expect(DOOR_FOCUS_SCALE_NEAR).toBeCloseTo(1.5525 * 1.15, 10);
    expect(DOOR_FOCUS_SCALE_FAR).toBe(1.4812);
    expect(DOOR_FOCUS_SCALE_FAR).toBeCloseTo(1.288 * 1.15, 10);
    expect(DOOR_FOCUS_PULSE_AMP).toBe(0.066125);
    expect(DOOR_FOCUS_PULSE_AMP).toBeCloseTo(0.0575 * 1.15, 10);
    expect(DOOR_FOCUS_PULSE_SPEED).toBe(6.9);
    expect(DOOR_FOCUS_PULSE_SPEED).toBeCloseTo(6 * 1.15, 10);
  });

  test("doorBadgeLabel es E; font 92; letter 2.76; disc 1.725; Y 2.645", () => {
    expect(doorBadgeLabel).toBe("E");
    expect(doorBadgeFontPx).toBe(92);
    expect(doorBadgeFontPx).toBeCloseTo(80 * 1.15, 10);
    expect(doorBadgeLetterScale).toBe(2.76);
    expect(doorBadgeLetterScale).toBeCloseTo(2.4 * 1.15, 10);
    expect(doorBadgeDiscScale).toBe(1.725);
    expect(doorBadgeDiscScale).toBeCloseTo(1.5 * 1.15, 10);
    expect(doorBadgeY).toBe(2.645);
    expect(doorBadgeY).toBeCloseTo(2.3 * 1.15, 10);
  });

  test("worldView aplica doorBadgeFontPx al canvas de la letra E del floatBadge existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "makeBadgeLetterTexture(doorBadgeLabel, doorBadgeFontPx)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = doorBadgeY");
  });

  test("worldView aplica doorBadgeLetterScale a la letra E del floatBadge existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "icon.scale.set(doorBadgeLetterScale, doorBadgeLetterScale, 1)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = doorBadgeY");
  });

  test("worldView aplica doorBadgeDiscScale al disc del floatBadge E existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "disc.scale.set(doorBadgeDiscScale, doorBadgeDiscScale, 1)",
    );
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).toContain("badge.position.y = doorBadgeY");
  });

  test("worldView aplica doorFocusMul al grupo de puerta existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("doorFocusMulFromLook(bestD, elapsed, gameOver)");
    expect(src).toContain("e.group.scale.setScalar(mul)");
  });
});

describe("doorFocusScale", () => {
  test("1.785375 en dist 0; 1.4812 en reach; 1.0 fuera", () => {
    expect(doorFocusScale(0)).toBe(1.785375);
    expect(doorFocusScale(1.6)).toBeCloseTo(1.4812, 10);
    expect(doorFocusScale(1.61)).toBe(1);
    expect(doorFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.8: 1.785375 + (1.4812-1.785375)*0.5 = 1.6332875
    expect(doorFocusScale(0.8)).toBeCloseTo(1.6332875, 10);
    const t = 0.25;
    const expected = 1.785375 + (1.4812 - 1.785375) * t;
    expect(doorFocusScale(1.6 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(doorFocusScale(Number.NaN)).toBe(1);
    expect(doorFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });

  test("dist negativa se clampa a 0 → 1.785375", () => {
    expect(doorFocusScale(-0.4)).toBe(1.785375);
    expect(doorFocusInReach(-0.4)).toBe(true);
  });
});

describe("doorFocusPulse", () => {
  test("1 + 0.066125 * sin(elapsed * 6.9)", () => {
    expect(doorFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.066125
    expect(doorFocusPulse(Math.PI / (2 * 6.9))).toBeCloseTo(1.066125, 10);
    // sin(π) = 0 → 1
    expect(doorFocusPulse(Math.PI / 6.9)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.933875
    expect(doorFocusPulse((3 * Math.PI) / (2 * 6.9))).toBeCloseTo(0.933875, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(doorFocusPulse(Number.NaN)).toBe(1);
  });

  test("Infinity elapsed trata como 0", () => {
    expect(doorFocusPulse(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("doorFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse = 1.066125
    expect(doorFocusMul(0, elapsed)).toBeCloseTo(1.785375 * 1.066125, 10);
    expect(doorFocusMul(1.6, elapsed)).toBeCloseTo(1.4812 * 1.066125, 10);
    expect(doorFocusMul(0.8, 0)).toBeCloseTo(1.6332875, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse ≠ 1
    expect(doorFocusMul(1.61, elapsed)).toBe(1);
    expect(doorFocusMul(8, elapsed)).toBe(1);
    expect(doorFocusMul(Number.NaN, elapsed)).toBe(1);
  });
});

describe("doorFocusInReach", () => {
  test("incluye el borde; excluye más allá", () => {
    expect(doorFocusInReach(0)).toBe(true);
    expect(doorFocusInReach(1.6)).toBe(true);
    expect(doorFocusInReach(1.61)).toBe(false);
    expect(doorFocusInReach(Number.NaN)).toBe(false);
  });
});

describe("doorRingVisible", () => {
  test("abierta o cerrada en 0 y en reach → true", () => {
    expect(doorRingVisible(false, 0)).toBe(true);
    expect(doorRingVisible(true, 0)).toBe(true);
    expect(doorRingVisible(false, DOOR_FOCUS_REACH)).toBe(true);
    expect(doorRingVisible(true, DOOR_FOCUS_REACH)).toBe(true);
  });

  test("justo fuera de reach → false", () => {
    expect(doorRingVisible(false, 1.61)).toBe(false);
    expect(doorRingVisible(true, 1.61)).toBe(false);
  });

  test("open y closed ambas true en reach", () => {
    expect(doorRingVisible(false, 0.8)).toBe(true);
    expect(doorRingVisible(true, 0.8)).toBe(true);
  });

  test("NaN / Inf / reach 0 → false", () => {
    expect(doorRingVisible(false, Number.NaN)).toBe(false);
    expect(doorRingVisible(true, Number.POSITIVE_INFINITY)).toBe(false);
    expect(doorRingVisible(false, Number.NEGATIVE_INFINITY)).toBe(false);
    expect(doorRingVisible(false, 0, 0)).toBe(false);
    expect(doorRingVisible(true, 0, Number.NaN)).toBe(false);
    expect(doorRingVisible(false, 0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("doorFocusApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte con pulso: anillo hidden + mul 1; ya apagado no-op; load-muerto hidden; vivo/load-vivo pulsa", () => {
    const elapsed = Math.PI / (2 * 6.9);
    expect(doorFocusApplies(true)).toBe(false);
    expect(doorRingVisible(false, 0, DOOR_FOCUS_REACH, true)).toBe(false);
    expect(doorFocusMul(0, elapsed, true)).toBe(1);

    expect(doorRingVisible(false, 8, DOOR_FOCUS_REACH, true)).toBe(false);
    expect(doorFocusMul(8, elapsed, true)).toBe(1);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(doorFocusApplies(deadRt.gameOver)).toBe(false);
    expect(doorRingVisible(true, 0, DOOR_FOCUS_REACH, deadRt.gameOver)).toBe(
      false,
    );
    expect(doorFocusMul(0, elapsed, deadRt.gameOver)).toBe(1);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(doorFocusApplies(liveRt.gameOver)).toBe(true);
    expect(doorRingVisible(false, 0, DOOR_FOCUS_REACH, liveRt.gameOver)).toBe(
      true,
    );
    expect(doorFocusMul(0, elapsed, liveRt.gameOver)).toBeCloseTo(
      1.785375 * 1.066125,
      10,
    );

    expect(doorFocusApplies(false)).toBe(true);
    expect(doorRingVisible(false, 0)).toBe(true);
    expect(doorFocusMul(0, elapsed)).toBeCloseTo(1.785375 * 1.066125, 10);
  });
});

describe("doorFocusAfterRestart (R / softReset)", () => {
  test("look fresco (spawn 24.5, 15.5); leftover ctor Three ring / dist 0 / origin / far no filtra", () => {
    const barrio = createNeighborhood(48);
    const doors: { x: number; y: number }[] = [];
    barrio.map.forEach((tx, ty, tile) => {
      if (tile.kind === "door") doors.push({ x: tx + 0.5, y: ty + 0.5 });
    });
    expect(doors.length).toBeGreaterThan(0);

    const bootWx = doorFocusLookXAfterRestart();
    const bootWy = doorFocusLookZAfterRestart();
    const bootElapsed = doorFocusElapsedAfterRestart();
    expect(bootWx).toBe(doorFocusLookXFromLook(24.5));
    expect(bootWy).toBe(doorFocusLookZFromLook(15.5));
    expect(bootWx).toBe(DOOR_FOCUS_LOOK_X_SPAWN);
    expect(bootWy).toBe(DOOR_FOCUS_LOOK_Z_SPAWN);
    expect(bootWx).toBe(barrio.spawn.x);
    expect(bootWy).toBe(barrio.spawn.y);
    expect(doorFocusLookXAfterRestart(24.5)).toBe(bootWx);
    expect(doorFocusLookZAfterRestart(15.5)).toBe(bootWy);
    expect(doorFocusLookXAfterRestart(0)).toBe(doorFocusLookXFromLook(0));
    expect(doorFocusLookZAfterRestart(40)).toBe(doorFocusLookZFromLook(40));
    expect(bootElapsed).toBe(0);
    expect(bootElapsed).toBe(doorFocusElapsedFromLook(0));

    let closest = doors[0]!;
    let bootDist = doorFocusDistAfterRestart(closest.x, closest.y);
    for (const door of doors) {
      const d = doorFocusDistAfterRestart(door.x, door.y);
      expect(d).toBeGreaterThan(DOOR_FOCUS_REACH);
      expect(doorRingVisibleAfterRestart(false, d)).toBe(false);
      expect(doorRingVisibleAfterRestart(true, d)).toBe(false);
      expect(doorFocusMulAfterRestart(d)).toBe(1);
      if (d < bootDist) {
        closest = door;
        bootDist = d;
      }
    }
    expect(bootDist).toBe(
      doorFocusDistFromLook(24.5, 15.5, closest.x, closest.y),
    );
    expect(bootDist).toBeGreaterThan(DOOR_FOCUS_REACH);
    const bootRing = doorRingVisibleAfterRestart(false, bootDist);
    const bootMul = doorFocusMulAfterRestart(bootDist);
    expect(bootRing).toBe(false);
    expect(bootRing).toBe(doorRingVisibleFromLook(false, bootDist));
    expect(bootMul).toBe(1);
    expect(bootMul).toBe(doorFocusMulFromLook(bootDist, 0));

    const leftoverCtorRing = true;
    const leftoverCtorDist = 0;
    const leftoverCtorScale = 1;
    expect(leftoverCtorRing).not.toBe(bootRing);
    expect(leftoverCtorDist).not.toBe(bootDist);
    expect(doorRingVisible(false, leftoverCtorDist)).toBe(true);
    expect(doorRingVisible(false, leftoverCtorDist)).not.toBe(bootRing);
    expect(leftoverCtorScale).toBe(bootMul);
    expect(doorFocusMul(leftoverCtorDist, 0)).toBe(1.785375);
    expect(doorFocusMul(leftoverCtorDist, 0)).not.toBe(bootMul);

    const leftoverOriginDist = doorFocusDistFromLook(0, 0, closest.x, closest.y);
    expect(leftoverOriginDist).not.toBe(bootDist);
    expect(doorFocusLookXFromLook(0)).toBe(0);
    expect(doorFocusLookXFromLook(0)).not.toBe(bootWx);
    expect(doorRingVisibleFromLook(false, leftoverOriginDist)).toBe(false);
    expect(doorFocusMulFromLook(leftoverOriginDist, 0)).toBe(1);

    const leftoverFarDist = doorFocusDistFromLook(40, 30, closest.x, closest.y);
    expect(leftoverFarDist).not.toBe(bootDist);
    expect(doorFocusLookXFromLook(40)).toBe(40);
    expect(doorFocusLookZFromLook(30)).toBe(30);
    expect(doorFocusLookXFromLook(40)).not.toBe(bootWx);
    expect(doorFocusLookZFromLook(30)).not.toBe(bootWy);
    expect(doorRingVisibleFromLook(false, leftoverFarDist)).toBe(false);
    expect(doorFocusMulFromLook(leftoverFarDist, 0)).toBe(1);
    expect(leftoverFarDist).not.toBe(
      doorFocusDistAfterRestart(closest.x, closest.y),
    );

    const leftoverPulse = Math.PI / (2 * DOOR_FOCUS_PULSE_SPEED);
    const leftoverMul = doorFocusMulFromLook(0, leftoverPulse);
    expect(leftoverMul).toBeCloseTo(1.785375 * 1.066125, 10);
    expect(leftoverMul).not.toBe(bootMul);
    expect(leftoverMul).not.toBe(doorFocusMulAfterRestart(bootDist));

    expect(doorFocusDistFromLook(24.5, 15.5, closest.x, closest.y)).toBe(
      bootDist,
    );
    expect(doorFocusMulFromLook(bootDist, 0)).toBe(bootMul);
    expect(doorFocusMulAfterRestart(bootDist, true)).toBe(1);
    expect(doorRingVisibleAfterRestart(false, bootDist, true)).toBe(false);
    expect(doorRingVisibleAfterRestart(false, leftoverCtorDist)).toBe(true);
  });

  test("vivo tick no usa el helper (pulso avanza con elapsed)", () => {
    const barrio = createNeighborhood(48);
    const doors: { x: number; y: number }[] = [];
    barrio.map.forEach((tx, ty, tile) => {
      if (tile.kind === "door") doors.push({ x: tx + 0.5, y: ty + 0.5 });
    });
    const closest = doors.reduce((best, door) => {
      const d = doorFocusDistAfterRestart(door.x, door.y);
      return d < best.d ? { x: door.x, y: door.y, d } : best;
    }, { x: doors[0]!.x, y: doors[0]!.y, d: Infinity });
    const bootDist = closest.d;
    const bootMul = doorFocusMulAfterRestart(bootDist);
    const bootElapsed = doorFocusElapsedAfterRestart();
    const liveElapsed = doorFocusElapsedFromLook(
      Math.PI / (2 * DOOR_FOCUS_PULSE_SPEED),
    );
    const liveMulNear = doorFocusMulFromLook(0, liveElapsed);
    const liveLookX = doorFocusLookXFromLook(40);
    const liveLookZ = doorFocusLookZFromLook(30);
    const liveDist = doorFocusDistFromLook(40, 30, closest.x, closest.y);
    expect(liveElapsed).not.toBe(bootElapsed);
    expect(liveElapsed).not.toBe(doorFocusElapsedAfterRestart());
    expect(liveMulNear).not.toBe(bootMul);
    expect(liveMulNear).not.toBe(doorFocusMulAfterRestart(bootDist));
    expect(liveLookX).toBe(40);
    expect(liveLookZ).toBe(30);
    expect(liveLookX).not.toBe(doorFocusLookXAfterRestart());
    expect(liveLookZ).not.toBe(doorFocusLookZAfterRestart());
    expect(liveDist).not.toBe(bootDist);
    expect(liveDist).not.toBe(doorFocusDistAfterRestart(closest.x, closest.y));
    expect(doorFocusMulFromLook(liveDist, liveElapsed)).toBe(1);
    expect(doorRingVisibleFromLook(false, liveDist)).toBe(false);
    expect(doorFocusLookXFromLook(24.5)).toBe(doorFocusLookXAfterRestart());
    expect(doorFocusLookZFromLook(15.5)).toBe(doorFocusLookZAfterRestart());
    expect(doorFocusMulFromLook(bootDist, 0)).toBe(bootMul);
  });
});

describe("door focus recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace door focus fresco; F9 no helper", () => {
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
      resolve(process.cwd(), "src/render/doorFocus.ts"),
      "utf8",
    );
    expect(focusSrc).toContain("doorFocusLookXAfterRestart(");
    expect(focusSrc).toContain("doorFocusLookZAfterRestart(");
    expect(focusSrc).toContain("doorFocusLookXFromLook(");
    expect(focusSrc).toContain("doorFocusLookZFromLook(");
    expect(focusSrc).toContain("doorFocusDistAfterRestart(");
    expect(focusSrc).toContain("doorFocusDistFromLook(");
    expect(focusSrc).toContain("doorFocusElapsedAfterRestart(");
    expect(focusSrc).toContain("doorFocusElapsedFromLook(");
    expect(focusSrc).toContain("doorFocusMulAfterRestart(");
    expect(focusSrc).toContain("doorFocusMulFromLook(");
    expect(focusSrc).toContain("doorRingVisibleAfterRestart(");
    expect(focusSrc).toContain("doorRingVisibleFromLook(");
    expect(focusSrc).toContain("DOOR_FOCUS_LOOK_X_SPAWN");
    expect(focusSrc).toContain("DOOR_FOCUS_LOOK_Z_SPAWN");
    expect(focusSrc).toMatch(
      /doorFocusLookXAfterRestart\([\s\S]{0,200}doorFocusLookXFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /doorFocusLookZAfterRestart\([\s\S]{0,200}doorFocusLookZFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /doorFocusMulAfterRestart\([\s\S]{0,200}doorFocusMulFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /doorRingVisibleAfterRestart\([\s\S]{0,200}doorRingVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("doorFocusLookXAfterRestart(");
    expect(viewSrc).toContain("doorFocusLookZAfterRestart(");
    expect(viewSrc).toContain("doorFocusElapsedAfterRestart(");
    expect(viewSrc).toContain("doorFocusDistFromLook(");
    expect(viewSrc).toContain("doorFocusMulFromLook(");
    expect(viewSrc).toContain("doorRingVisibleFromLook(");
    expect(viewSrc).toMatch(
      /let doorFocusElapsed = doorFocusElapsedAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /applyDoorFocusLook\(\s*doorFocusLookXAfterRestart\(\),\s*doorFocusLookZAfterRestart\(\),\s*doorFocusElapsed/,
    );
    expect(viewSrc).toMatch(
      /const d = doorFocusDistFromLook\(\s*wx,\s*wy,\s*e\.x,\s*e\.y\)/,
    );
    expect(viewSrc).toMatch(
      /const vis = doorRingVisibleFromLook\(\s*open,\s*d,\s*gameOver\)/,
    );
    expect(viewSrc).toMatch(
      /doorFocusMulFromLook\(\s*bestD,\s*elapsed,\s*gameOver\)/,
    );
    expect(viewSrc).toContain("applyDoorFocusLook(");
    expect(viewSrc).toMatch(
      /syncDoorFocus\(wx, wy, dt, gameOver = false\) \{[\s\S]{0,240}applyDoorFocusLook\(wx, wy, doorFocusElapsed, gameOver\)/,
    );
    expect(viewSrc).not.toMatch(/let doorFocusElapsed = 0/);
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncDoorFocus\(/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncInteractFocus\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}doorFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}doorFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}doorFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}doorFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toContain("doorFocusLookXAfterRestart(");
    expect(gameSrc).not.toContain("doorFocusLookZAfterRestart(");
    expect(gameSrc).not.toContain("doorFocusElapsedAfterRestart(");
    expect(gameSrc).not.toContain("doorFocusMulAfterRestart(");
    expect(gameSrc).not.toContain("doorRingVisibleAfterRestart(");
    expect(gameSrc).not.toContain("doorFocusDistAfterRestart(");
    expect(gameSrc).not.toContain("doorFocusLookXFromLook(");
    expect(saveSrc).not.toContain("doorFocusLookXAfterRestart");
    expect(saveSrc).not.toContain("doorFocusElapsedAfterRestart");
    expect(saveSrc).not.toContain("doorFocusMulAfterRestart");
    expect(saveSrc).not.toContain("doorFocusLookXFromLook");
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
