import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  CAMERA_SHAKE_AMP,
  CAMERA_SHAKE_DURATION,
  CAMERA_SHAKE_FREQ,
  CAMERA_SHAKE_OFFSET_X_SPAWN,
  CAMERA_SHAKE_OFFSET_Z_SPAWN,
  cameraShakeActiveAfterRestart,
  cameraShakeActiveFromLook,
  cameraShakeApplies,
  cameraShakeOffsetXAfterRestart,
  cameraShakeOffsetXFromLook,
  cameraShakeOffsetZAfterRestart,
  cameraShakeOffsetZFromLook,
  createCameraShakeState,
  tickCameraShake,
  triggerCameraShake,
} from "../src/render/cameraShake";

/** mag = AMP · (1−t) · sin(2π t · FREQ/42) */
function expectedMag(t: number): number {
  return (
    CAMERA_SHAKE_AMP *
    (1 - t) *
    Math.sin(t * Math.PI * 2 * (CAMERA_SHAKE_FREQ / 42))
  );
}

describe("constantes", () => {
  test("freq 48.3 × 1.15; duración 0.23 × 1.15 y amplitud 0.125 × 1.15", () => {
    expect(CAMERA_SHAKE_FREQ).toBe(55.545);
    expect(CAMERA_SHAKE_FREQ).toBeCloseTo(48.3 * 1.15, 10);
    expect(CAMERA_SHAKE_DURATION).toBe(0.2645);
    expect(CAMERA_SHAKE_DURATION).toBeCloseTo(0.23 * 1.15, 10);
    expect(CAMERA_SHAKE_AMP).toBe(0.14375);
    expect(CAMERA_SHAKE_AMP).toBeCloseTo(0.125 * 1.15, 10);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createCameraShakeState();
    expect(s.active).toBe(false);
    const out = tickCameraShake(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.offsetX).toBe(0);
    expect(out.offsetZ).toBe(0);
  });

  test("trigger + tick con rng=0: dir +X, sine decay en offsetX", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    expect(s.active).toBe(true);
    expect(s.dirX).toBeCloseTo(1, 10);
    expect(s.dirZ).toBeCloseTo(0, 10);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 4);
    const mag = expectedMag(0.25);
    expect(out.active).toBe(true);
    expect(out.offsetX).toBeCloseTo(mag, 10);
    expect(out.offsetZ).toBeCloseTo(0, 10);
    expect(Math.abs(mag)).toBeGreaterThan(CAMERA_SHAKE_AMP * 0.5);
  });

  test("rng=0.25: dir +Z, mismo mag en offsetZ", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0.25);
    expect(s.dirX).toBeCloseTo(0, 10);
    expect(s.dirZ).toBeCloseTo(1, 10);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 4);
    const mag = expectedMag(0.25);
    expect(out.offsetX).toBeCloseTo(0, 10);
    expect(out.offsetZ).toBeCloseTo(mag, 10);
  });

  test("t=0.5: sine-decay con FREQ 55.545 (primer cruce ya pasó)", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 2);
    const mag = expectedMag(0.5);
    expect(out.active).toBe(true);
    expect(out.offsetX).toBeCloseTo(mag, 10);
    expect(out.offsetZ).toBeCloseTo(0, 10);
  });

  test("primer cruce por cero antes de t=0.5 (más rápido que 1 ciclo)", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const halfCycle = CAMERA_SHAKE_DURATION * (0.5 * 42 / CAMERA_SHAKE_FREQ);
    const out = tickCameraShake(s, halfCycle);
    expect(out.active).toBe(true);
    expect(out.offsetX).toBeCloseTo(0, 10);
    expect(halfCycle).toBeLessThan(CAMERA_SHAKE_DURATION / 2);
  });

  test("t=0.75: mag sigue el sine-decay a FREQ 55.545", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION * 0.75);
    const mag = expectedMag(0.75);
    expect(out.offsetX).toBeCloseTo(mag, 10);
    expect(mag).toBeLessThan(0);
  });

  test("|offset| acotado a AMP", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    let peak = 0;
    for (let i = 0; i < 24; i++) {
      const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 24);
      peak = Math.max(peak, Math.hypot(out.offsetX, out.offsetZ));
    }
    expect(peak).toBeLessThanOrEqual(CAMERA_SHAKE_AMP + 1e-12);
    expect(peak).toBeGreaterThan(CAMERA_SHAKE_AMP * 0.5);
  });

  test("al cumplir duración: inactivo y ceros (sin snap residual)", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.offsetX).toBe(0);
    expect(out.offsetZ).toBe(0);
  });

  test("dt extra grande completa el shake en un tick", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const out = tickCameraShake(s, 10);
    expect(out.active).toBe(false);
    expect(out.offsetX).toBe(0);
    expect(out.offsetZ).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    tickCameraShake(s, 0.05);
    const age = s.age;
    const a = tickCameraShake(s, 0);
    expect(s.age).toBe(age);
    const b = tickCameraShake(s, -1);
    expect(s.age).toBe(age);
    expect(a.offsetX).toBe(b.offsetX);
    expect(a.offsetZ).toBe(b.offsetZ);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0 y puede cambiar dir", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    tickCameraShake(s, 0.1);
    expect(s.age).toBeGreaterThan(0);
    triggerCameraShake(s, () => 0.25);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    expect(s.dirZ).toBeCloseTo(1, 10);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 4);
    expect(out.offsetZ).toBeCloseTo(expectedMag(0.25), 10);
  });

  test("mismo rng → mismos offsets (determinista)", () => {
    const a = createCameraShakeState();
    const b = createCameraShakeState();
    triggerCameraShake(a, () => 0.3);
    triggerCameraShake(b, () => 0.3);
    for (let i = 0; i < 8; i++) {
      const oa = tickCameraShake(a, 1 / 60);
      const ob = tickCameraShake(b, 1 / 60);
      expect(oa.offsetX).toBe(ob.offsetX);
      expect(oa.offsetZ).toBe(ob.offsetZ);
    }
  });

  test("rng distinto → dirección distinta", () => {
    const a = createCameraShakeState();
    const b = createCameraShakeState();
    triggerCameraShake(a, () => 0);
    triggerCameraShake(b, () => 0.25);
    const oa = tickCameraShake(a, CAMERA_SHAKE_DURATION / 4);
    const ob = tickCameraShake(b, CAMERA_SHAKE_DURATION / 4);
    expect(Math.abs(oa.offsetX)).toBeGreaterThan(0.05);
    expect(oa.offsetZ).toBeCloseTo(0, 10);
    expect(ob.offsetX).toBeCloseTo(0, 10);
    expect(Math.abs(ob.offsetZ)).toBeGreaterThan(0.05);
  });

  test("rng NaN no rompe: dir por defecto +X", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => Number.NaN);
    expect(s.dirX).toBeCloseTo(1, 10);
    expect(s.dirZ).toBeCloseTo(0, 10);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 4);
    expect(out.offsetX).toBeCloseTo(expectedMag(0.25), 10);
  });
});

describe("cameraShakeApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya en reposo no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(cameraShakeApplies(true)).toBe(false);
    expect(cameraShakeApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(cameraShakeApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(cameraShakeApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; zero offset; vivo sí; dt<=0 no-op", () => {
    const dead = createCameraShakeState();
    triggerCameraShake(dead, () => 0);
    tickCameraShake(dead, 0.05, false);
    const age = dead.age;
    const hidden = tickCameraShake(dead, 0.05, true);
    expect(dead.age).toBe(age);
    expect(hidden.active).toBe(false);
    expect(hidden.offsetX).toBe(0);
    expect(hidden.offsetZ).toBe(0);

    const idle = createCameraShakeState();
    expect(tickCameraShake(idle, 0.1, true)).toEqual({
      offsetX: 0,
      offsetZ: 0,
      active: false,
    });
    expect(idle.active).toBe(false);
    expect(idle.age).toBe(0);

    const live = createCameraShakeState();
    triggerCameraShake(live, () => 0);
    const out = tickCameraShake(live, CAMERA_SHAKE_DURATION / 4, false);
    expect(out.active).toBe(true);
    expect(out.offsetX).toBeCloseTo(expectedMag(0.25), 10);
    expect(out.offsetZ).toBeCloseTo(0, 10);
    expect(live.age).toBeCloseTo(CAMERA_SHAKE_DURATION / 4, 10);

    expect(tickCameraShake(live, 0, false).active).toBe(true);
    expect(live.age).toBeCloseTo(CAMERA_SHAKE_DURATION / 4, 10);
    expect(tickCameraShake(live, -1, false).active).toBe(true);
    expect(live.age).toBeCloseTo(CAMERA_SHAKE_DURATION / 4, 10);
    expect(tickCameraShake(live, Number.NaN, false).active).toBe(true);
    expect(live.age).toBeCloseTo(CAMERA_SHAKE_DURATION / 4, 10);
  });

  test("Game freeze / enterGameOver / F9 load-muerto zeroan shake; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("cameraShakeApplies(");
    expect(src).toContain("this.view.hideCameraShake()");
    expect(src).toMatch(
      /syncCameraShakeOverlay\(dt = 0\): void \{[\s\S]{0,320}cameraShakeApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2200}this\.syncCameraShakeOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2200}this\.syncCameraShakeOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4600}this\.syncCameraShakeOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.view\.tickPlayerLoco\(dt, false, false\);\s*this\.syncMuzzleFlashOverlay\(dt\);\s*this\.syncImpactSparkOverlay\(dt\);\s*this\.syncCameraShakeOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4600}this\.view\.tickCameraShake\(dt\)/,
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
    expect(src).toMatch(
      /Mixer must keep ticking during freeze[\s\S]{0,160}this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("cameraShakeApplies(");
    expect(viewSrc).toContain("stepCameraShake(");
    expect(viewSrc).toContain("hideCameraShake: hideShake");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toContain("tickCameraShake(playerCameraShake, dt)");
  });
});

describe("cameraShakeAfterRestart (R / softReset)", () => {
  test("shake fresco (idle 0); leftover mid-shake / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootX = cameraShakeOffsetXAfterRestart();
    const bootZ = cameraShakeOffsetZAfterRestart();
    const bootA = cameraShakeActiveAfterRestart();
    expect(bootX).toBe(cameraShakeOffsetXFromLook(0));
    expect(bootZ).toBe(cameraShakeOffsetZFromLook(0));
    expect(bootA).toBe(cameraShakeActiveFromLook(false));
    expect(bootX).toBe(0);
    expect(bootZ).toBe(0);
    expect(bootA).toBe(false);
    expect(bootX).toBe(CAMERA_SHAKE_OFFSET_X_SPAWN);
    expect(bootZ).toBe(CAMERA_SHAKE_OFFSET_Z_SPAWN);
    expect(cameraShakeOffsetXAfterRestart()).toBe(bootX);
    expect(cameraShakeOffsetZAfterRestart()).toBe(bootZ);
    expect(cameraShakeActiveAfterRestart()).toBe(bootA);

    const leftoverMidX = CAMERA_SHAKE_AMP;
    const leftoverMidZ = CAMERA_SHAKE_AMP;
    expect(leftoverMidX).not.toBe(bootX);
    expect(leftoverMidZ).not.toBe(bootZ);
    expect(cameraShakeOffsetXFromLook(CAMERA_SHAKE_AMP)).toBe(leftoverMidX);
    expect(cameraShakeOffsetXFromLook(CAMERA_SHAKE_AMP)).not.toBe(bootX);
    expect(cameraShakeOffsetZFromLook(CAMERA_SHAKE_AMP)).toBe(leftoverMidZ);
    expect(cameraShakeOffsetZFromLook(CAMERA_SHAKE_AMP)).not.toBe(bootZ);
    expect(cameraShakeActiveFromLook(true)).not.toBe(bootA);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);

    expect(cameraShakeOffsetXFromLook(0)).toBe(bootX);
    expect(cameraShakeOffsetZFromLook(0)).toBe(bootZ);
    expect(cameraShakeActiveFromLook(false)).toBe(bootA);
  });

  test("vivo tick no usa el helper (shake avanza con look)", () => {
    const bootX = cameraShakeOffsetXAfterRestart();
    const bootZ = cameraShakeOffsetZAfterRestart();
    const bootA = cameraShakeActiveAfterRestart();
    const live = createCameraShakeState();
    triggerCameraShake(live, () => 0);
    const mid = tickCameraShake(live, CAMERA_SHAKE_DURATION / 4);
    const liveX = cameraShakeOffsetXFromLook(mid.offsetX);
    const liveZ = cameraShakeOffsetZFromLook(mid.offsetZ);
    const liveA = cameraShakeActiveFromLook(mid.active);
    const mag = expectedMag(0.25);
    expect(liveX).toBeCloseTo(mag, 10);
    expect(liveZ).toBeCloseTo(0, 10);
    expect(liveA).toBe(true);
    expect(liveX).not.toBe(bootX);
    expect(liveA).not.toBe(bootA);
    expect(liveX).not.toBe(cameraShakeOffsetXAfterRestart());
    expect(liveA).not.toBe(cameraShakeActiveAfterRestart());
    expect(Math.abs(liveX)).toBeGreaterThan(CAMERA_SHAKE_AMP * 0.5);

    expect(cameraShakeOffsetXFromLook(0)).toBe(bootX);
    expect(cameraShakeOffsetZFromLook(0)).toBe(bootZ);
    expect(cameraShakeActiveFromLook(false)).toBe(bootA);
    expect(cameraShakeOffsetXFromLook(CAMERA_SHAKE_AMP)).toBe(CAMERA_SHAKE_AMP);
    expect(cameraShakeActiveFromLook(true)).toBe(true);
  });
});

describe("camera shake recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace shake fresco; F9 no helper", () => {
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
    const shakeSrc = readFileSync(
      resolve(process.cwd(), "src/render/cameraShake.ts"),
      "utf8",
    );
    expect(shakeSrc).toContain("cameraShakeOffsetXAfterRestart(");
    expect(shakeSrc).toContain("cameraShakeOffsetZAfterRestart(");
    expect(shakeSrc).toContain("cameraShakeActiveAfterRestart(");
    expect(shakeSrc).toContain("cameraShakeOffsetXFromLook(");
    expect(shakeSrc).toContain("cameraShakeOffsetZFromLook(");
    expect(shakeSrc).toContain("cameraShakeActiveFromLook(");
    expect(shakeSrc).toContain("CAMERA_SHAKE_OFFSET_X_SPAWN");
    expect(shakeSrc).toContain("CAMERA_SHAKE_OFFSET_Z_SPAWN");
    expect(shakeSrc).toMatch(
      /cameraShakeOffsetXAfterRestart\([\s\S]{0,200}cameraShakeOffsetXFromLook\(/,
    );
    expect(shakeSrc).toMatch(
      /cameraShakeOffsetZAfterRestart\([\s\S]{0,200}cameraShakeOffsetZFromLook\(/,
    );
    expect(viewSrc).toContain("cameraShakeOffsetXAfterRestart(");
    expect(viewSrc).toContain("cameraShakeOffsetZAfterRestart(");
    expect(viewSrc).toContain("cameraShakeActiveAfterRestart(");
    expect(viewSrc).toContain("cameraShakeOffsetXFromLook(");
    expect(viewSrc).toContain("cameraShakeOffsetZFromLook(");
    expect(viewSrc).toContain("cameraShakeActiveFromLook(");
    expect(viewSrc).toMatch(
      /offsetX:\s*cameraShakeOffsetXAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /offsetZ:\s*cameraShakeOffsetZAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /active:\s*cameraShakeActiveAfterRestart\(\)/,
    );
    expect(viewSrc).toContain("cameraShakeOffsetXFromLook(out.offsetX)");
    expect(viewSrc).toContain("cameraShakeOffsetZFromLook(out.offsetZ)");
    expect(viewSrc).toContain("cameraShakeActiveFromLook(out.active)");
    expect(viewSrc).toContain(
      "cameraShakeOffsetXFromLook(cameraShakeOut.offsetX)",
    );
    expect(viewSrc).toContain(
      "cameraShakeOffsetZFromLook(cameraShakeOut.offsetZ)",
    );
    expect(viewSrc).toMatch(
      /cameraFollowPosXAfterRestart\([\s\S]{0,120}cameraShakeOffsetXAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /cameraFollowPosZAfterRestart\([\s\S]{0,120}cameraShakeOffsetZAfterRestart\(\)/,
    );
    expect(viewSrc).not.toMatch(
      /hideShake\(\): void \{[\s\S]{0,200}cameraShakeOffsetXAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3000}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}cameraShakeOffsetXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}cameraShakeOffsetXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}cameraShakeOffsetXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}cameraShakeOffsetXAfterRestart/,
    );
    expect(gameSrc).not.toContain("cameraShakeOffsetXAfterRestart(");
    expect(gameSrc).not.toContain("cameraShakeOffsetZAfterRestart(");
    expect(gameSrc).not.toContain("cameraShakeActiveAfterRestart(");
    expect(gameSrc).not.toContain("cameraShakeOffsetXFromLook(");
    expect(gameSrc).not.toContain("cameraShakeOffsetZFromLook(");
    expect(gameSrc).not.toContain("cameraShakeActiveFromLook(");
    expect(saveSrc).not.toContain("cameraShakeOffsetXAfterRestart");
    expect(saveSrc).not.toContain("cameraShakeOffsetZAfterRestart");
    expect(saveSrc).not.toContain("cameraShakeOffsetXFromLook");
    expect(saveSrc).not.toContain("cameraShakeOffsetZFromLook");
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
