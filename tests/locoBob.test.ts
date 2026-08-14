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
  WALK_LEAN_AMP,
  WALK_SWAY_AMP,
  SPRINT_BOB_AMP,
  SPRINT_FREQ_HZ,
  SPRINT_LEAN_AMP,
  SPRINT_SWAY_AMP,
  IDLE_LEAN_AMP,
  IDLE_SWAY_AMP,
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

  test("idle bob amp 0.01587; walk/sprint/freq iguales", () => {
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(IDLE_BOB_AMP).toBeCloseTo(0.0138 * 1.15, 10);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_BOB_AMP).toBeCloseTo(0.06325 * 1.15, 10);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(SPRINT_BOB_AMP).toBeCloseTo(0.09 * 1.15, 10);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("walk lean/sway amp bumped; bob Y/freq iguales", () => {
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_LEAN_AMP).toBeCloseTo(0.046 * 1.15, 10);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(WALK_SWAY_AMP).toBeCloseTo(0.04025 * 1.15, 10);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("sprint lean amp 0.07 × 1.15; sway/bob/walk/freq iguales", () => {
    expect(SPRINT_LEAN_AMP).toBe(0.0805);
    expect(SPRINT_LEAN_AMP).toBeCloseTo(0.07 * 1.15, 10);
    expect(SPRINT_SWAY_AMP).toBe(0.0575);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("sprint sway amp 0.05 × 1.15; lean/bob/walk/freq iguales", () => {
    expect(SPRINT_SWAY_AMP).toBe(0.0575);
    expect(SPRINT_SWAY_AMP).toBeCloseTo(0.05 * 1.15, 10);
    expect(SPRINT_LEAN_AMP).toBe(0.0805);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("idle sway amp 0.0092 × 1.15; lean/bob/walk/sprint/freq iguales", () => {
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(IDLE_SWAY_AMP).toBeCloseTo(0.0092 * 1.15, 10);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(SPRINT_LEAN_AMP).toBe(0.0805);
    expect(SPRINT_SWAY_AMP).toBe(0.0575);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("walk bob amp 0.06325 × 1.15; lean/sway/idle/sprint/freq iguales", () => {
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_BOB_AMP).toBeCloseTo(0.06325 * 1.15, 10);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(SPRINT_LEAN_AMP).toBe(0.0805);
    expect(SPRINT_SWAY_AMP).toBe(0.0575);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("walk lean amp 0.046 × 1.15; sway/bob/idle/sprint/freq iguales", () => {
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_LEAN_AMP).toBeCloseTo(0.046 * 1.15, 10);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(SPRINT_LEAN_AMP).toBe(0.0805);
    expect(SPRINT_SWAY_AMP).toBe(0.0575);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });

  test("walk sway amp 0.04025 × 1.15; lean/bob/idle/sprint/freq iguales", () => {
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(WALK_SWAY_AMP).toBeCloseTo(0.04025 * 1.15, 10);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.1035);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(SPRINT_LEAN_AMP).toBe(0.0805);
    expect(SPRINT_SWAY_AMP).toBe(0.0575);
    expect(IDLE_FREQ_HZ).toBe(0.35);
    expect(WALK_FREQ_HZ).toBe(1.55);
    expect(SPRINT_FREQ_HZ).toBe(2.35);
  });
});

describe("tickLocoBob", () => {
  test("idle: phase avanza lento; |bobY|/|swayX| acotados a idle amp", () => {
    const s = createLocoBobState(0);
    let peak = 0;
    let peakSway = 0;
    let peakLean = 0;
    for (let i = 0; i < 120; i++) {
      const out = tickLocoBob(s, { moving: false, sprinting: false }, 1 / 60);
      peak = Math.max(peak, Math.abs(out.bobY));
      peakSway = Math.max(peakSway, Math.abs(out.swayX));
      peakLean = Math.max(peakLean, Math.abs(out.leanZ));
    }
    expect(s.phase).toBeGreaterThan(0);
    // ~2s * IDLE_FREQ * 2π ≈ 4.4 rad
    expect(s.phase).toBeLessThan(WALK_FREQ_HZ * Math.PI * 2 * 2);
    expect(peak).toBeLessThanOrEqual(IDLE_BOB_AMP + 1e-9);
    expect(peak).toBeGreaterThan(IDLE_BOB_AMP * 0.5);
    expect(peakSway).toBeLessThanOrEqual(IDLE_SWAY_AMP + 1e-9);
    expect(peakSway).toBeGreaterThan(IDLE_SWAY_AMP * 0.5);
    expect(peakLean).toBe(0);
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
    expect(peakLean).toBeLessThanOrEqual(0.06);
    expect(peakLean).toBeGreaterThan(WALK_LEAN_AMP * 0.85);
    expect(peakLean).toBeLessThanOrEqual(WALK_LEAN_AMP + 1e-9);
    expect(peakSway).toBeGreaterThan(0.02);
    expect(peakSway).toBeLessThanOrEqual(0.05);
    expect(peakSway).toBeGreaterThan(WALK_SWAY_AMP * 0.85);
    expect(peakSway).toBeLessThanOrEqual(WALK_SWAY_AMP + 1e-9);
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
