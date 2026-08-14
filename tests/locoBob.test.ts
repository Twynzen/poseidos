import { describe, expect, test } from "vitest";
import {
  createLocoBobState,
  tickLocoBob,
  maxBobAmp,
  locoFreqHz,
  IDLE_BOB_AMP,
  IDLE_FREQ_HZ,
  WALK_BOB_AMP,
  WALK_FREQ_HZ,
  SPRINT_BOB_AMP,
  SPRINT_FREQ_HZ,
} from "../src/render/locoBob";

describe("locoFreqHz / maxBobAmp", () => {
  test("idle < walk < sprint en frecuencia", () => {
    expect(locoFreqHz({ moving: false, sprinting: false })).toBe(IDLE_FREQ_HZ);
    expect(locoFreqHz({ moving: true, sprinting: false })).toBe(WALK_FREQ_HZ);
    expect(locoFreqHz({ moving: true, sprinting: true })).toBe(SPRINT_FREQ_HZ);
    expect(IDLE_FREQ_HZ).toBeLessThan(WALK_FREQ_HZ);
    expect(WALK_FREQ_HZ).toBeLessThan(SPRINT_FREQ_HZ);
  });

  test("idle amp < walk < sprint", () => {
    expect(maxBobAmp({ moving: false, sprinting: false })).toBe(IDLE_BOB_AMP);
    expect(maxBobAmp({ moving: true, sprinting: false })).toBe(WALK_BOB_AMP);
    expect(maxBobAmp({ moving: true, sprinting: true })).toBe(SPRINT_BOB_AMP);
    expect(IDLE_BOB_AMP).toBeLessThan(WALK_BOB_AMP);
    expect(WALK_BOB_AMP).toBeLessThan(SPRINT_BOB_AMP);
  });

  test("sprint bob amp 0.1035; walk/idle/freq iguales", () => {
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(SPRINT_BOB_AMP).toBeCloseTo(0.09 * 1.15, 10);
    expect(WALK_BOB_AMP).toBe(0.06325);
    expect(WALK_BOB_AMP).toBeCloseTo(0.055 * 1.15, 10);
    expect(IDLE_BOB_AMP).toBe(0.012);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });
});

describe("tickLocoBob", () => {
  test("idle: phase avanza lento; |bobY| acotado a idle amp", () => {
    const s = createLocoBobState(0);
    let peak = 0;
    for (let i = 0; i < 120; i++) {
      const out = tickLocoBob(s, { moving: false, sprinting: false }, 1 / 60);
      peak = Math.max(peak, Math.abs(out.bobY));
    }
    expect(s.phase).toBeGreaterThan(0);
    // ~2s * IDLE_FREQ * 2π ≈ 4.4 rad
    expect(s.phase).toBeLessThan(WALK_FREQ_HZ * Math.PI * 2 * 2);
    expect(peak).toBeLessThanOrEqual(IDLE_BOB_AMP + 1e-9);
    expect(peak).toBeGreaterThan(IDLE_BOB_AMP * 0.5);
  });

  test("moving aumenta phase más rápido que idle", () => {
    const idle = createLocoBobState(0);
    const walk = createLocoBobState(0);
    const dt = 0.1;
    tickLocoBob(idle, { moving: false, sprinting: false }, dt);
    tickLocoBob(walk, { moving: true, sprinting: false }, dt);
    expect(walk.phase).toBeGreaterThan(idle.phase);
  });

  test("sprint phase rate > walk phase rate", () => {
    const walk = createLocoBobState(0);
    const sprint = createLocoBobState(0);
    const dt = 0.05;
    tickLocoBob(walk, { moving: true, sprinting: false }, dt);
    tickLocoBob(sprint, { moving: true, sprinting: true }, dt);
    expect(sprint.phase).toBeGreaterThan(walk.phase);
    expect(sprint.phase / walk.phase).toBeCloseTo(
      SPRINT_FREQ_HZ / WALK_FREQ_HZ,
      5,
    );
  });

  test("walk amplitudes en rangos esperados", () => {
    const s = createLocoBobState(0);
    let peakBob = 0;
    let peakLean = 0;
    let peakSway = 0;
    for (let i = 0; i < 180; i++) {
      const out = tickLocoBob(s, { moving: true, sprinting: false }, 1 / 60);
      peakBob = Math.max(peakBob, Math.abs(out.bobY));
      peakLean = Math.max(peakLean, Math.abs(out.leanZ));
      peakSway = Math.max(peakSway, Math.abs(out.swayX));
    }
    expect(peakBob).toBeGreaterThan(WALK_BOB_AMP * 0.85);
    expect(peakBob).toBeLessThanOrEqual(WALK_BOB_AMP + 1e-9);
    expect(peakLean).toBeGreaterThan(0.02);
    expect(peakLean).toBeLessThanOrEqual(0.05);
    expect(peakSway).toBeGreaterThan(0.02);
    expect(peakSway).toBeLessThanOrEqual(0.05);
  });

  test("sprint bob peak > walk bob peak", () => {
    const walk = createLocoBobState(0);
    const sprint = createLocoBobState(0);
    let walkPeak = 0;
    let sprintPeak = 0;
    for (let i = 0; i < 180; i++) {
      walkPeak = Math.max(
        walkPeak,
        Math.abs(tickLocoBob(walk, { moving: true, sprinting: false }, 1 / 60).bobY),
      );
      sprintPeak = Math.max(
        sprintPeak,
        Math.abs(tickLocoBob(sprint, { moving: true, sprinting: true }, 1 / 60).bobY),
      );
    }
    expect(sprintPeak).toBeGreaterThan(walkPeak);
    expect(sprintPeak).toBeLessThanOrEqual(SPRINT_BOB_AMP + 1e-9);
  });

  test("dt <= 0 no avanza phase; output determinista", () => {
    const s = createLocoBobState(1.23);
    const a = tickLocoBob(s, { moving: true, sprinting: false }, 0);
    expect(a.phase).toBe(1.23);
    const b = tickLocoBob(s, { moving: true, sprinting: false }, -1);
    expect(b.phase).toBe(1.23);
    expect(a.bobY).toBe(b.bobY);
  });

  test("output phase refleja state", () => {
    const s = createLocoBobState(0);
    const out = tickLocoBob(s, { moving: true, sprinting: false }, 0.016);
    expect(out.phase).toBe(s.phase);
  });
});
