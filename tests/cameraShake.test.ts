import { describe, expect, test } from "vitest";
import {
  CAMERA_SHAKE_AMP,
  CAMERA_SHAKE_DURATION,
  createCameraShakeState,
  tickCameraShake,
  triggerCameraShake,
} from "../src/render/cameraShake";

/** mag = AMP · (1−t) · sin(2π t) */
function expectedMag(t: number): number {
  return CAMERA_SHAKE_AMP * (1 - t) * Math.sin(t * Math.PI * 2);
}

describe("constantes", () => {
  test("duración 0.2 × 1.15 y amplitud 0.1 × 1.25", () => {
    expect(CAMERA_SHAKE_DURATION).toBe(0.23);
    expect(CAMERA_SHAKE_DURATION).toBeCloseTo(0.2 * 1.15, 10);
    expect(CAMERA_SHAKE_AMP).toBe(0.125);
    expect(CAMERA_SHAKE_AMP).toBeCloseTo(0.1 * 1.25, 10);
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
    expect(mag).toBeCloseTo(CAMERA_SHAKE_AMP * 0.75, 10);
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

  test("t=0.5: sin(π)=0, offsets en cero a mitad (decay 0.5)", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION / 2);
    expect(out.active).toBe(true);
    expect(out.offsetX).toBeCloseTo(0, 10);
    expect(out.offsetZ).toBeCloseTo(0, 10);
  });

  test("t=0.75: mag negativo (segunda mitad del sine)", () => {
    const s = createCameraShakeState();
    triggerCameraShake(s, () => 0);
    const out = tickCameraShake(s, CAMERA_SHAKE_DURATION * 0.75);
    const mag = expectedMag(0.75);
    expect(out.offsetX).toBeCloseTo(mag, 10);
    expect(mag).toBeCloseTo(-CAMERA_SHAKE_AMP * 0.25, 10);
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
