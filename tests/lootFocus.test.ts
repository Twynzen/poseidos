import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { CONTAINER_REACH } from "../src/items";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_FOCUS_LOOK_X_SPAWN,
  LOOT_FOCUS_LOOK_Z_SPAWN,
  LOOT_FOCUS_PULSE_AMP,
  LOOT_FOCUS_PULSE_SPEED,
  LOOT_FOCUS_REACH,
  LOOT_FOCUS_SCALE_FAR,
  LOOT_FOCUS_SCALE_NEAR,
  lootBadgeIconScale,
  lootBadgeY,
  lootFocusApplies,
  lootFocusDistAfterRestart,
  lootFocusDistFromLook,
  lootFocusElapsedAfterRestart,
  lootFocusElapsedFromLook,
  lootFocusInReach,
  lootFocusLookXAfterRestart,
  lootFocusLookXFromLook,
  lootFocusLookZAfterRestart,
  lootFocusLookZFromLook,
  lootFocusMul,
  lootFocusMulAfterRestart,
  lootFocusMulFromLook,
  lootFocusPulse,
  lootFocusScale,
  lootRingVisible,
  lootRingVisibleAfterRestart,
  lootRingVisibleFromLook,
} from "../src/render/lootFocus";

describe("constantes", () => {
  test("reach = CONTAINER_REACH 1.6; near 1.785375; far 1.4812; pulse 0.066125 / 6.9", () => {
    expect(LOOT_FOCUS_REACH).toBe(CONTAINER_REACH);
    expect(LOOT_FOCUS_REACH).toBe(1.6);
    expect(LOOT_FOCUS_SCALE_NEAR).toBe(1.785375);
    expect(LOOT_FOCUS_SCALE_NEAR).toBeCloseTo(1.5525 * 1.15, 10);
    expect(LOOT_FOCUS_SCALE_FAR).toBe(1.4812);
    expect(LOOT_FOCUS_SCALE_FAR).toBeCloseTo(1.288 * 1.15, 10);
    expect(LOOT_FOCUS_PULSE_AMP).toBe(0.066125);
    expect(LOOT_FOCUS_PULSE_AMP).toBeCloseTo(0.0575 * 1.15, 10);
    expect(LOOT_FOCUS_PULSE_SPEED).toBe(6.9);
    expect(LOOT_FOCUS_PULSE_SPEED).toBeCloseTo(6 * 1.15, 10);
  });

  test("lootBadgeY 2.645 (misma banda door/bed; 2.3 × 1.15)", () => {
    expect(lootBadgeY).toBe(2.645);
    expect(lootBadgeY).toBeCloseTo(2.3 * 1.15, 10);
  });

  test("worldView aplica lootBadgeY al disc del floatBadge loot existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("badge.position.y = lootBadgeY");
    expect(src).toContain('badge.name = "floatBadge"');
    expect(src).not.toMatch(/role === "loot"\) badge\.position\.y = 1\.12/);
  });

  test("lootBadgeIconScale 0.92 (0.8 × 1.15; worldView usa el knob, no 0.8 inline)", () => {
    expect(lootBadgeIconScale).toBe(0.92);
    expect(lootBadgeIconScale).toBeCloseTo(0.8 * 1.15, 10);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "icon.scale.set(lootBadgeIconScale, lootBadgeIconScale, 1)",
    );
    expect(src).not.toMatch(/icon\.scale\.set\(0\.8,\s*0\.8,\s*1\)/);
  });
});

describe("lootFocusScale", () => {
  test("1.785375 en dist 0; 1.4812 en reach; 1.0 fuera", () => {
    expect(lootFocusScale(0)).toBe(1.785375);
    expect(lootFocusScale(1.6)).toBeCloseTo(1.4812, 10);
    expect(lootFocusScale(1.61)).toBe(1);
    expect(lootFocusScale(10)).toBe(1);
  });

  test("lerp lineal dentro de reach", () => {
    // midpoint 0.8: 1.785375 + (1.4812-1.785375)*0.5 = 1.6332875
    expect(lootFocusScale(0.8)).toBeCloseTo(1.6332875, 10);
    const t = 0.25;
    const expected = 1.785375 + (1.4812 - 1.785375) * t;
    expect(lootFocusScale(1.6 * t)).toBeCloseTo(expected, 10);
  });

  test("NaN / no finito → 1 (fuera)", () => {
    expect(lootFocusScale(Number.NaN)).toBe(1);
    expect(lootFocusScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("lootFocusPulse", () => {
  test("1 + 0.066125 * sin(elapsed * 6.9)", () => {
    expect(lootFocusPulse(0)).toBe(1);
    // sin(π/2) = 1 → 1.066125
    expect(lootFocusPulse(Math.PI / (2 * 6.9))).toBeCloseTo(1.066125, 10);
    // sin(π) = 0 → 1
    expect(lootFocusPulse(Math.PI / 6.9)).toBeCloseTo(1, 10);
    // sin(3π/2) = -1 → 0.933875
    expect(lootFocusPulse((3 * Math.PI) / (2 * 6.9))).toBeCloseTo(0.933875, 10);
  });

  test("NaN elapsed trata como 0", () => {
    expect(lootFocusPulse(Number.NaN)).toBe(1);
  });
});

describe("lootFocusMul", () => {
  test("en reach: scale * pulse", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse = 1.066125
    expect(lootFocusMul(0, elapsed)).toBeCloseTo(1.785375 * 1.066125, 10);
    expect(lootFocusMul(1.6, elapsed)).toBeCloseTo(1.4812 * 1.066125, 10);
    expect(lootFocusMul(0.8, 0)).toBeCloseTo(1.6332875, 10);
  });

  test("fuera de reach: 1 (sin pulso)", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse ≠ 1
    expect(lootFocusMul(1.61, elapsed)).toBe(1);
    expect(lootFocusMul(8, elapsed)).toBe(1);
    expect(lootFocusMul(Number.NaN, elapsed)).toBe(1);
  });
});

describe("lootFocusInReach", () => {
  test("incluye el borde; excluye más allá", () => {
    expect(lootFocusInReach(0)).toBe(true);
    expect(lootFocusInReach(1.6)).toBe(true);
    expect(lootFocusInReach(1.61)).toBe(false);
    expect(lootFocusInReach(Number.NaN)).toBe(false);
  });
});

describe("lootRingVisible", () => {
  test("con loot en reach (0 y borde) → true", () => {
    expect(lootRingVisible(false, 0)).toBe(true);
    expect(lootRingVisible(false, LOOT_FOCUS_REACH)).toBe(true);
  });

  test("con loot justo fuera de reach → false", () => {
    expect(lootRingVisible(false, 1.61)).toBe(false);
  });

  test("empty → false aunque dist 0", () => {
    expect(lootRingVisible(true, 0)).toBe(false);
  });

  test("NaN / Inf / reach 0 → false", () => {
    expect(lootRingVisible(false, Number.NaN)).toBe(false);
    expect(lootRingVisible(false, Number.POSITIVE_INFINITY)).toBe(false);
    expect(lootRingVisible(false, Number.NEGATIVE_INFINITY)).toBe(false);
    expect(lootRingVisible(false, 0, 0)).toBe(false);
    expect(lootRingVisible(false, 0, Number.NaN)).toBe(false);
    expect(lootRingVisible(false, 0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("lootFocusApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte con pulso: anillo hidden + mul 1; ya apagado no-op; load-muerto hidden; vivo/load-vivo pulsa", () => {
    const elapsed = Math.PI / (2 * 6.9); // pulse ≠ 1
    expect(lootFocusApplies(true)).toBe(false);
    expect(lootRingVisible(false, 0, LOOT_FOCUS_REACH, true)).toBe(false);
    expect(lootFocusMul(0, elapsed, true)).toBe(1);

    const alreadyEmpty = lootRingVisible(true, 0, LOOT_FOCUS_REACH, true);
    expect(alreadyEmpty).toBe(false);
    expect(lootFocusMul(8, elapsed, true)).toBe(1);
    expect(lootFocusApplies(true)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(lootFocusApplies(deadRt.gameOver)).toBe(false);
    expect(lootRingVisible(false, 0, LOOT_FOCUS_REACH, deadRt.gameOver)).toBe(
      false,
    );
    expect(lootFocusMul(0, elapsed, deadRt.gameOver)).toBe(1);
    expect(lootRingVisible(true, 0, LOOT_FOCUS_REACH, deadRt.gameOver)).toBe(
      false,
    );

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(lootFocusApplies(liveRt.gameOver)).toBe(true);
    expect(lootRingVisible(false, 0, LOOT_FOCUS_REACH, liveRt.gameOver)).toBe(
      true,
    );
    expect(lootFocusMul(0, elapsed, liveRt.gameOver)).toBeCloseTo(
      1.785375 * 1.066125,
      10,
    );

    expect(lootFocusApplies(false)).toBe(true);
    expect(lootRingVisible(false, 0)).toBe(true);
    expect(lootFocusMul(0, elapsed)).toBeCloseTo(1.785375 * 1.066125, 10);
    expect(lootRingVisible(true, 0)).toBe(false);
    expect(lootFocusMul(1.61, elapsed)).toBe(1);
  });

  test("Game enterGameOver / freeze / F9 load-muerto apagan pulso; vivo no hide", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("syncInteractFocus");
    expect(src).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncLootFocus\([\s\S]{0,200}this\.gameOver/,
    );
    expect(src).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncDoorFocus\([\s\S]{0,80}this\.gameOver/,
    );
    expect(src).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncBedFocus\([\s\S]{0,80}this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,720}this\.syncInteractFocus\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,900}if \(this\.gameOver\) this\.syncInteractFocus\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2200}this\.syncInteractFocus\(dt\)/,
    );
    expect(src).toMatch(
      /if \(!this\.player\.alive\) \{[\s\S]{0,200}enterGameOver\(\)[\s\S]{0,400}this\.syncInteractFocus\(dt\)/,
    );
    expect(src).toMatch(
      /this\.view\.syncPlayer\(this\.player\.x, this\.player\.y\);\s*this\.syncInteractFocus\(dt\);/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2200}this\.view\.syncLootFocus\(/,
    );
  });
});

describe("lootFocusAfterRestart (R / softReset)", () => {
  test("look fresco (spawn 24.5, 15.5); leftover ctor scale 1 / Three ring / origin / far no filtra", () => {
    const barrio = createNeighborhood(48);
    const wood = barrio.containers.list.find((c) => c.id === "madera-spawn");
    expect(wood).toBeTruthy();
    const woodMx = wood!.x + 0.5;
    const woodMy = wood!.y + 0.5;
    const bootWx = lootFocusLookXAfterRestart();
    const bootWy = lootFocusLookZAfterRestart();
    const bootElapsed = lootFocusElapsedAfterRestart();
    const bootDist = lootFocusDistAfterRestart(woodMx, woodMy);
    const bootMul = lootFocusMulAfterRestart(bootDist);
    const bootRing = lootRingVisibleAfterRestart(false, bootDist);

    expect(bootWx).toBe(lootFocusLookXFromLook(24.5));
    expect(bootWy).toBe(lootFocusLookZFromLook(15.5));
    expect(bootWx).toBe(LOOT_FOCUS_LOOK_X_SPAWN);
    expect(bootWy).toBe(LOOT_FOCUS_LOOK_Z_SPAWN);
    expect(bootWx).toBe(barrio.spawn.x);
    expect(bootWy).toBe(barrio.spawn.y);
    expect(lootFocusLookXAfterRestart(24.5)).toBe(bootWx);
    expect(lootFocusLookZAfterRestart(15.5)).toBe(bootWy);
    expect(lootFocusLookXAfterRestart(0)).toBe(lootFocusLookXFromLook(0));
    expect(lootFocusLookZAfterRestart(40)).toBe(lootFocusLookZFromLook(40));

    expect(bootElapsed).toBe(0);
    expect(bootElapsed).toBe(lootFocusElapsedFromLook(0));
    expect(bootDist).toBe(1);
    expect(bootDist).toBe(lootFocusDistFromLook(24.5, 15.5, woodMx, woodMy));
    expect(bootRing).toBe(true);
    expect(bootRing).toBe(lootRingVisibleFromLook(false, bootDist));
    expect(bootMul).toBeCloseTo(lootFocusScale(1) * lootFocusPulse(0), 10);
    expect(bootMul).toBeCloseTo(1.595265625, 10);
    expect(bootMul).not.toBe(1);

    const leftoverCtorScale = 1;
    expect(leftoverCtorScale).not.toBe(bootMul);
    expect(leftoverCtorScale).toBe(lootFocusMulFromLook(8, 0));

    const leftoverCtorRing = true;
    const far = barrio.containers.list.find((c) => c.id !== "madera-spawn");
    expect(far).toBeTruthy();
    const farDist = lootFocusDistAfterRestart(far!.x + 0.5, far!.y + 0.5);
    expect(farDist).toBeGreaterThan(LOOT_FOCUS_REACH);
    expect(lootRingVisibleAfterRestart(false, farDist)).toBe(false);
    expect(leftoverCtorRing).not.toBe(
      lootRingVisibleAfterRestart(false, farDist),
    );

    const leftoverOriginDist = lootFocusDistFromLook(0, 0, woodMx, woodMy);
    expect(leftoverOriginDist).not.toBe(bootDist);
    expect(lootFocusLookXFromLook(0)).toBe(0);
    expect(lootFocusLookXFromLook(0)).not.toBe(bootWx);
    expect(lootRingVisibleFromLook(false, leftoverOriginDist)).toBe(false);
    expect(lootFocusMulFromLook(leftoverOriginDist, 0)).toBe(1);
    expect(lootFocusMulFromLook(leftoverOriginDist, 0)).not.toBe(bootMul);

    const leftoverFarDist = lootFocusDistFromLook(40, 30, woodMx, woodMy);
    expect(leftoverFarDist).not.toBe(bootDist);
    expect(lootFocusLookXFromLook(40)).toBe(40);
    expect(lootFocusLookZFromLook(30)).toBe(30);
    expect(lootFocusLookXFromLook(40)).not.toBe(bootWx);
    expect(lootFocusLookZFromLook(30)).not.toBe(bootWy);
    expect(lootRingVisibleFromLook(false, leftoverFarDist)).toBe(false);
    expect(lootFocusMulFromLook(leftoverFarDist, 0)).toBe(1);
    expect(lootFocusMulFromLook(leftoverFarDist, 0)).not.toBe(bootMul);
    expect(leftoverFarDist).not.toBe(lootFocusDistAfterRestart(woodMx, woodMy));

    const leftoverPulse = Math.PI / (2 * LOOT_FOCUS_PULSE_SPEED);
    const leftoverMul = lootFocusMulFromLook(bootDist, leftoverPulse);
    expect(leftoverMul).toBeCloseTo(bootMul * 1.066125, 10);
    expect(leftoverMul).not.toBe(bootMul);
    expect(leftoverMul).not.toBe(lootFocusMulAfterRestart(bootDist));

    expect(lootFocusDistFromLook(24.5, 15.5, woodMx, woodMy)).toBe(bootDist);
    expect(lootFocusMulFromLook(bootDist, 0)).toBe(bootMul);
    expect(lootRingVisibleFromLook(true, bootDist)).toBe(false);
    expect(lootFocusMulAfterRestart(bootDist, true)).toBe(1);
    expect(lootRingVisibleAfterRestart(false, bootDist, true)).toBe(false);
  });

  test("vivo tick no usa el helper (pulso avanza con elapsed)", () => {
    const barrio = createNeighborhood(48);
    const wood = barrio.containers.list.find((c) => c.id === "madera-spawn")!;
    const woodMx = wood.x + 0.5;
    const woodMy = wood.y + 0.5;
    const bootDist = lootFocusDistAfterRestart(woodMx, woodMy);
    const bootMul = lootFocusMulAfterRestart(bootDist);
    const bootElapsed = lootFocusElapsedAfterRestart();
    const liveElapsed = lootFocusElapsedFromLook(
      Math.PI / (2 * LOOT_FOCUS_PULSE_SPEED),
    );
    const liveMul = lootFocusMulFromLook(bootDist, liveElapsed);
    const liveLookX = lootFocusLookXFromLook(40);
    const liveLookZ = lootFocusLookZFromLook(30);
    const liveDist = lootFocusDistFromLook(40, 30, woodMx, woodMy);
    expect(liveElapsed).not.toBe(bootElapsed);
    expect(liveElapsed).not.toBe(lootFocusElapsedAfterRestart());
    expect(liveMul).not.toBe(bootMul);
    expect(liveMul).not.toBe(lootFocusMulAfterRestart(bootDist));
    expect(liveLookX).toBe(40);
    expect(liveLookZ).toBe(30);
    expect(liveLookX).not.toBe(lootFocusLookXAfterRestart());
    expect(liveLookZ).not.toBe(lootFocusLookZAfterRestart());
    expect(liveDist).not.toBe(bootDist);
    expect(liveDist).not.toBe(lootFocusDistAfterRestart(woodMx, woodMy));
    expect(lootFocusMulFromLook(liveDist, liveElapsed)).toBe(1);
    expect(lootRingVisibleFromLook(false, liveDist)).toBe(false);
    expect(lootFocusLookXFromLook(24.5)).toBe(lootFocusLookXAfterRestart());
    expect(lootFocusLookZFromLook(15.5)).toBe(lootFocusLookZAfterRestart());
    expect(lootFocusMulFromLook(bootDist, 0)).toBe(bootMul);
  });
});

describe("loot focus recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace loot focus fresco; F9 no helper", () => {
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
      resolve(process.cwd(), "src/render/lootFocus.ts"),
      "utf8",
    );
    expect(focusSrc).toContain("lootFocusLookXAfterRestart(");
    expect(focusSrc).toContain("lootFocusLookZAfterRestart(");
    expect(focusSrc).toContain("lootFocusLookXFromLook(");
    expect(focusSrc).toContain("lootFocusLookZFromLook(");
    expect(focusSrc).toContain("lootFocusDistAfterRestart(");
    expect(focusSrc).toContain("lootFocusDistFromLook(");
    expect(focusSrc).toContain("lootFocusElapsedAfterRestart(");
    expect(focusSrc).toContain("lootFocusElapsedFromLook(");
    expect(focusSrc).toContain("lootFocusMulAfterRestart(");
    expect(focusSrc).toContain("lootFocusMulFromLook(");
    expect(focusSrc).toContain("lootRingVisibleAfterRestart(");
    expect(focusSrc).toContain("lootRingVisibleFromLook(");
    expect(focusSrc).toContain("LOOT_FOCUS_LOOK_X_SPAWN");
    expect(focusSrc).toContain("LOOT_FOCUS_LOOK_Z_SPAWN");
    expect(focusSrc).toMatch(
      /lootFocusLookXAfterRestart\([\s\S]{0,200}lootFocusLookXFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /lootFocusLookZAfterRestart\([\s\S]{0,200}lootFocusLookZFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /lootFocusMulAfterRestart\([\s\S]{0,200}lootFocusMulFromLook\(/,
    );
    expect(focusSrc).toMatch(
      /lootRingVisibleAfterRestart\([\s\S]{0,200}lootRingVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("lootFocusLookXAfterRestart(");
    expect(viewSrc).toContain("lootFocusLookZAfterRestart(");
    expect(viewSrc).toContain("lootFocusElapsedAfterRestart(");
    expect(viewSrc).toContain("lootFocusDistFromLook(");
    expect(viewSrc).toContain("lootFocusMulFromLook(");
    expect(viewSrc).toContain("lootRingVisibleFromLook(");
    expect(viewSrc).toMatch(
      /let lootFocusElapsed = lootFocusElapsedAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /applyLootFocusLook\(\s*lootFocusLookXAfterRestart\(\),\s*lootFocusLookZAfterRestart\(\),\s*lootFocusElapsed/,
    );
    expect(viewSrc).toMatch(
      /const d = lootFocusDistFromLook\(\s*wx,\s*wy,\s*e\.x,\s*e\.y\)/,
    );
    expect(viewSrc).toMatch(
      /const vis = lootRingVisibleFromLook\(\s*empty,\s*d,\s*gameOver\)/,
    );
    expect(viewSrc).toMatch(
      /lootFocusMulFromLook\(\s*bestD,\s*elapsed,\s*gameOver\)/,
    );
    expect(viewSrc).toContain("applyLootFocusLook(");
    expect(viewSrc).not.toMatch(/let lootFocusElapsed = 0/);
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3200}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncLootFocus\(/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncInteractFocus\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootFocusLookXAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootFocusLookXAfterRestart(");
    expect(gameSrc).not.toContain("lootFocusLookZAfterRestart(");
    expect(gameSrc).not.toContain("lootFocusElapsedAfterRestart(");
    expect(gameSrc).not.toContain("lootFocusMulAfterRestart(");
    expect(gameSrc).not.toContain("lootRingVisibleAfterRestart(");
    expect(gameSrc).not.toContain("lootFocusDistAfterRestart(");
    expect(gameSrc).not.toContain("lootFocusLookXFromLook(");
    expect(saveSrc).not.toContain("lootFocusLookXAfterRestart");
    expect(saveSrc).not.toContain("lootFocusElapsedAfterRestart");
    expect(saveSrc).not.toContain("lootFocusMulAfterRestart");
    expect(saveSrc).not.toContain("lootFocusLookXFromLook");
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
