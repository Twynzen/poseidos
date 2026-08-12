import { describe, expect, test } from "vitest";
import {
  HIT_FLASH_PEAK,
  HIT_FLASH_DECAY_PER_SEC,
  createHitFlash,
  triggerHitFlash,
  tickHitFlash,
} from "../src/ui/hitFlash";

describe("constantes", () => {
  test("peak y decay fijos", () => {
    expect(HIT_FLASH_PEAK).toBe(0.65);
    expect(HIT_FLASH_DECAY_PER_SEC).toBe(2.5);
  });
});

describe("createHitFlash", () => {
  test("empieza en 0", () => {
    expect(createHitFlash().intensity).toBe(0);
  });
});

describe("triggerHitFlash", () => {
  test("strength 1 → intensity 1 (toque hostil)", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    expect(f.intensity).toBe(1);
  });

  test("default strength = 1", () => {
    const f = createHitFlash();
    triggerHitFlash(f);
    expect(f.intensity).toBe(1);
  });

  test("strength parcial (needs DPS scaled)", () => {
    const f = createHitFlash();
    triggerHitFlash(f, Math.min(1, 0.04 * 5));
    expect(f.intensity).toBeCloseTo(0.2, 10);
  });

  test("no baja un flash en curso (max)", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    triggerHitFlash(f, 0.2);
    expect(f.intensity).toBe(1);
  });

  test("clamp 0–1", () => {
    const hi = createHitFlash();
    triggerHitFlash(hi, 4);
    expect(hi.intensity).toBe(1);

    const lo = createHitFlash();
    triggerHitFlash(lo, -2);
    expect(lo.intensity).toBe(0);
  });

  test("NaN / Inf no rompe", () => {
    const f = createHitFlash();
    triggerHitFlash(f, Number.NaN);
    expect(f.intensity).toBe(0);
    triggerHitFlash(f, Number.POSITIVE_INFINITY);
    expect(f.intensity).toBe(0);
  });
});

describe("tickHitFlash", () => {
  test("decae HIT_FLASH_DECAY_PER_SEC por segundo", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    tickHitFlash(f, 0.2);
    expect(f.intensity).toBeCloseTo(1 - HIT_FLASH_DECAY_PER_SEC * 0.2, 10);
  });

  test("dt <= 0 no avanza", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    tickHitFlash(f, 0);
    tickHitFlash(f, -1);
    expect(f.intensity).toBe(1);
  });

  test("llega a 0 y no baja de 0", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    tickHitFlash(f, 1);
    expect(f.intensity).toBe(0);
    tickHitFlash(f, 1);
    expect(f.intensity).toBe(0);
  });

  test("opacity de pico = intensity * HIT_FLASH_PEAK", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    expect(f.intensity * HIT_FLASH_PEAK).toBeCloseTo(HIT_FLASH_PEAK, 10);
    tickHitFlash(f, 0.1);
    expect(f.intensity * HIT_FLASH_PEAK).toBeCloseTo(
      (1 - HIT_FLASH_DECAY_PER_SEC * 0.1) * HIT_FLASH_PEAK,
      10,
    );
  });

  test("determinista entre dos flashes", () => {
    const a = createHitFlash();
    const b = createHitFlash();
    triggerHitFlash(a, 0.8);
    triggerHitFlash(b, 0.8);
    for (let i = 0; i < 12; i++) {
      tickHitFlash(a, 1 / 60);
      tickHitFlash(b, 1 / 60);
    }
    expect(a.intensity).toBe(b.intensity);
  });
});
