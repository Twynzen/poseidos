import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  createLocoBobState,
  locoBobApplies,
  locoBobLeanZAfterRestart,
  locoBobLeanZFromLook,
  locoBobSwayXAfterRestart,
  locoBobSwayXFromLook,
  locoBobYAfterRestart,
  locoBobYFromLook,
  tickLocoBob,
  maxBobAmp,
  locoFreqHz,
  IDLE_BOB_AMP,
  IDLE_FREQ_HZ,
  LOCO_BOB_Y_SPAWN,
  LOCO_LEAN_Z_SPAWN,
  LOCO_SWAY_X_SPAWN,
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
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(SPRINT_BOB_AMP).toBeCloseTo(0.1035 * 1.15, 10);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("walk lean/sway amp bumped; bob Y/freq iguales", () => {
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_LEAN_AMP).toBeCloseTo(0.046 * 1.15, 10);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(WALK_SWAY_AMP).toBeCloseTo(0.04025 * 1.15, 10);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("sprint lean amp 0.0805 × 1.15; sway/bob/walk/freq iguales", () => {
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_LEAN_AMP).toBeCloseTo(0.0805 * 1.15, 10);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("sprint sway amp 0.0575 × 1.15; lean/bob/walk/freq iguales", () => {
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(SPRINT_SWAY_AMP).toBeCloseTo(0.0575 * 1.15, 10);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("sprint freq 2.35 × 1.15; amp/idle/walk iguales", () => {
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
    expect(SPRINT_FREQ_HZ).toBeCloseTo(2.35 * 1.15, 10);
    expect(locoFreqHz({ moving: true, sprinting: true })).toBe(SPRINT_FREQ_HZ);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
  });

  test("walk freq 1.55 × 1.15; amp/idle/sprint iguales", () => {
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(WALK_FREQ_HZ).toBeCloseTo(1.55 * 1.15, 10);
    expect(locoFreqHz({ moving: true, sprinting: false })).toBe(WALK_FREQ_HZ);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("idle freq 0.35 × 1.15; amp/walk/sprint iguales", () => {
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(IDLE_FREQ_HZ).toBeCloseTo(0.35 * 1.15, 10);
    expect(locoFreqHz({ moving: false, sprinting: false })).toBe(IDLE_FREQ_HZ);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("idle sway amp 0.0092 × 1.15; lean/bob/walk/sprint/freq iguales", () => {
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(IDLE_SWAY_AMP).toBeCloseTo(0.0092 * 1.15, 10);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("walk bob amp 0.06325 × 1.15; lean/sway/idle/sprint/freq iguales", () => {
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_BOB_AMP).toBeCloseTo(0.06325 * 1.15, 10);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("walk lean amp 0.046 × 1.15; sway/bob/idle/sprint/freq iguales", () => {
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_LEAN_AMP).toBeCloseTo(0.046 * 1.15, 10);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("walk sway amp 0.04025 × 1.15; lean/bob/idle/sprint/freq iguales", () => {
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(WALK_SWAY_AMP).toBeCloseTo(0.04025 * 1.15, 10);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
  });

  test("sprint bob amp 0.1035 × 1.15; lean/sway/idle/walk/freq iguales", () => {
    expect(SPRINT_BOB_AMP).toBe(0.119025);
    expect(SPRINT_BOB_AMP).toBeCloseTo(0.1035 * 1.15, 10);
    expect(SPRINT_LEAN_AMP).toBe(0.092575);
    expect(SPRINT_SWAY_AMP).toBe(0.066125);
    expect(IDLE_BOB_AMP).toBe(0.01587);
    expect(WALK_BOB_AMP).toBe(0.0727375);
    expect(WALK_LEAN_AMP).toBe(0.0529);
    expect(WALK_SWAY_AMP).toBe(0.0462875);
    expect(IDLE_LEAN_AMP).toBe(0);
    expect(IDLE_SWAY_AMP).toBe(0.01058);
    expect(IDLE_FREQ_HZ).toBe(0.4025);
    expect(WALK_FREQ_HZ).toBe(1.7825);
    expect(SPRINT_FREQ_HZ).toBe(2.7025);
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

describe("locoBobApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya en reposo no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(locoBobApplies(true)).toBe(false);
    expect(locoBobApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(locoBobApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(locoBobApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza phase; zero offsets; vivo idle sí; dt<=0 no-op", () => {
    const dead = createLocoBobState(0);
    tickLocoBob(dead, { moving: false, sprinting: false }, 0.05, false);
    const phase = dead.phase;
    expect(phase).toBeGreaterThan(0);
    const hidden = tickLocoBob(
      dead,
      { moving: false, sprinting: false },
      0.05,
      true,
    );
    expect(dead.phase).toBe(phase);
    expect(hidden.bobY).toBe(0);
    expect(hidden.leanZ).toBe(0);
    expect(hidden.swayX).toBe(0);
    expect(hidden.phase).toBe(phase);

    const idle = createLocoBobState(0);
    expect(
      tickLocoBob(idle, { moving: false, sprinting: false }, 0.1, true),
    ).toEqual({
      bobY: 0,
      leanZ: 0,
      swayX: 0,
      phase: 0,
    });
    expect(idle.phase).toBe(0);

    const live = createLocoBobState(0);
    let peak = 0;
    let peakSway = 0;
    for (let i = 0; i < 120; i++) {
      const out = tickLocoBob(
        live,
        { moving: false, sprinting: false },
        1 / 60,
        false,
      );
      peak = Math.max(peak, Math.abs(out.bobY));
      peakSway = Math.max(peakSway, Math.abs(out.swayX));
    }
    expect(live.phase).toBeGreaterThan(0);
    expect(peak).toBeGreaterThan(IDLE_BOB_AMP * 0.5);
    expect(peak).toBeLessThanOrEqual(IDLE_BOB_AMP + 1e-9);
    expect(peakSway).toBeGreaterThan(IDLE_SWAY_AMP * 0.5);
    expect(peakSway).toBeLessThanOrEqual(IDLE_SWAY_AMP + 1e-9);

    const frozen = live.phase;
    expect(
      tickLocoBob(live, { moving: false, sprinting: false }, 0, false).phase,
    ).toBe(frozen);
    expect(
      tickLocoBob(live, { moving: false, sprinting: false }, -1, false).phase,
    ).toBe(frozen);
    expect(
      tickLocoBob(live, { moving: false, sprinting: false }, Number.NaN, false)
        .phase,
    ).toBe(frozen);
  });

  test("Game freeze / enterGameOver / F9 load-muerto zeroan bob; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("locoBobApplies(");
    expect(src).toContain("this.view.hideLocoBob()");
    expect(src).toMatch(
      /syncLocoBobOverlay\([\s\S]{0,80}dt = 0[\s\S]{0,280}locoBobApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}this\.syncLocoBobOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}this\.syncLocoBobOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4800}this\.syncLocoBobOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncLocoBobOverlay\(dt\);\s*this\.syncHitLeanOverlay\(dt\);\s*\/\/ Mixer must keep ticking during freeze[\s\S]{0,160}this\.syncSwingPoseOverlay\(dt\);\s*this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4800}this\.view\.tickLocoBob\(dt/,
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
    expect(viewSrc).toContain("locoBobApplies(");
    expect(viewSrc).toContain("stepLocoBob(");
    expect(viewSrc).toContain("hideLocoBob: hideBob");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toContain(
      "tickLocoBob(playerLoco, { moving, sprinting }, dt)",
    );
  });
});

describe("locoBobAfterRestart (R / softReset)", () => {
  test("loco fresco (idle 0); leftover mid-stride / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootY = locoBobYAfterRestart();
    const bootLean = locoBobLeanZAfterRestart();
    const bootSway = locoBobSwayXAfterRestart();
    expect(bootY).toBe(locoBobYFromLook(0));
    expect(bootLean).toBe(locoBobLeanZFromLook(0));
    expect(bootSway).toBe(locoBobSwayXFromLook(0));
    expect(bootY).toBe(0);
    expect(bootLean).toBe(0);
    expect(bootSway).toBe(0);
    expect(bootY).toBe(LOCO_BOB_Y_SPAWN);
    expect(bootLean).toBe(LOCO_LEAN_Z_SPAWN);
    expect(bootSway).toBe(LOCO_SWAY_X_SPAWN);
    expect(locoBobYAfterRestart()).toBe(bootY);
    expect(locoBobLeanZAfterRestart()).toBe(bootLean);
    expect(locoBobSwayXAfterRestart()).toBe(bootSway);

    const leftoverMidY = WALK_BOB_AMP;
    const leftoverMidLean = WALK_LEAN_AMP;
    const leftoverMidSway = WALK_SWAY_AMP;
    expect(leftoverMidY).not.toBe(bootY);
    expect(leftoverMidLean).not.toBe(bootLean);
    expect(leftoverMidSway).not.toBe(bootSway);
    expect(locoBobYFromLook(WALK_BOB_AMP)).toBe(leftoverMidY);
    expect(locoBobYFromLook(WALK_BOB_AMP)).not.toBe(bootY);
    expect(locoBobLeanZFromLook(WALK_LEAN_AMP)).toBe(leftoverMidLean);
    expect(locoBobLeanZFromLook(WALK_LEAN_AMP)).not.toBe(bootLean);
    expect(locoBobSwayXFromLook(WALK_SWAY_AMP)).toBe(leftoverMidSway);
    expect(locoBobSwayXFromLook(WALK_SWAY_AMP)).not.toBe(bootSway);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);

    expect(locoBobYFromLook(0)).toBe(bootY);
    expect(locoBobLeanZFromLook(0)).toBe(bootLean);
    expect(locoBobSwayXFromLook(0)).toBe(bootSway);
  });

  test("vivo tick no usa el helper (stride avanza con look)", () => {
    const bootY = locoBobYAfterRestart();
    const bootLean = locoBobLeanZAfterRestart();
    const bootSway = locoBobSwayXAfterRestart();
    const live = createLocoBobState();
    const mid = tickLocoBob(live, { moving: true, sprinting: false }, 0.1);
    const liveY = locoBobYFromLook(mid.bobY);
    const liveLean = locoBobLeanZFromLook(mid.leanZ);
    const liveSway = locoBobSwayXFromLook(mid.swayX);
    expect(liveY).not.toBe(0);
    expect(liveLean).not.toBe(0);
    expect(liveSway).not.toBe(0);
    expect(liveY).not.toBe(bootY);
    expect(liveLean).not.toBe(bootLean);
    expect(liveSway).not.toBe(bootSway);
    expect(liveY).not.toBe(locoBobYAfterRestart());
    expect(liveLean).not.toBe(locoBobLeanZAfterRestart());
    expect(liveSway).not.toBe(locoBobSwayXAfterRestart());
    expect(Math.abs(liveY)).toBeGreaterThan(bootY);
    expect(Math.abs(liveLean)).toBeGreaterThan(bootLean);
    expect(Math.abs(liveSway)).toBeGreaterThan(bootSway);

    expect(locoBobYFromLook(0)).toBe(bootY);
    expect(locoBobLeanZFromLook(0)).toBe(bootLean);
    expect(locoBobSwayXFromLook(0)).toBe(bootSway);
    expect(locoBobYFromLook(WALK_BOB_AMP)).toBe(WALK_BOB_AMP);
    expect(locoBobLeanZFromLook(WALK_LEAN_AMP)).toBe(WALK_LEAN_AMP);
    expect(locoBobSwayXFromLook(WALK_SWAY_AMP)).toBe(WALK_SWAY_AMP);
  });
});

describe("player loco recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace loco fresco; F9 no helper", () => {
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
    const locoSrc = readFileSync(
      resolve(process.cwd(), "src/render/locoBob.ts"),
      "utf8",
    );
    expect(locoSrc).toContain("locoBobYAfterRestart(");
    expect(locoSrc).toContain("locoBobLeanZAfterRestart(");
    expect(locoSrc).toContain("locoBobSwayXAfterRestart(");
    expect(locoSrc).toContain("locoBobYFromLook(");
    expect(locoSrc).toContain("locoBobLeanZFromLook(");
    expect(locoSrc).toContain("locoBobSwayXFromLook(");
    expect(locoSrc).toContain("LOCO_BOB_Y_SPAWN");
    expect(locoSrc).toContain("LOCO_LEAN_Z_SPAWN");
    expect(locoSrc).toContain("LOCO_SWAY_X_SPAWN");
    expect(locoSrc).toMatch(
      /locoBobYAfterRestart\([\s\S]{0,200}locoBobYFromLook\(/,
    );
    expect(locoSrc).toMatch(
      /locoBobLeanZAfterRestart\([\s\S]{0,200}locoBobLeanZFromLook\(/,
    );
    expect(locoSrc).toMatch(
      /locoBobSwayXAfterRestart\([\s\S]{0,200}locoBobSwayXFromLook\(/,
    );
    expect(viewSrc).toContain("locoBobYAfterRestart(");
    expect(viewSrc).toContain("locoBobLeanZAfterRestart(");
    expect(viewSrc).toContain("locoBobSwayXAfterRestart(");
    expect(viewSrc).toContain("locoBobYFromLook(");
    expect(viewSrc).toContain("locoBobLeanZFromLook(");
    expect(viewSrc).toContain("locoBobSwayXFromLook(");
    expect(viewSrc).toMatch(
      /playerLocoRoot\.position\.y = locoBobYAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /bobY:\s*locoBobYAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /leanZ:\s*locoBobLeanZAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /swayX:\s*locoBobSwayXAfterRestart\(\)/,
    );
    expect(viewSrc).toContain("locoBobYFromLook(out.bobY)");
    expect(viewSrc).toContain("locoBobLeanZFromLook(out.leanZ)");
    expect(viewSrc).toContain("locoBobSwayXFromLook(out.swayX)");
    expect(viewSrc).toMatch(
      /applyLocoBobOffsets\(\{[\s\S]{0,160}locoBobYAfterRestart\(\)/,
    );
    expect(viewSrc).not.toMatch(
      /hideBob\(\): void \{[\s\S]{0,200}locoBobYAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}locoBobYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}locoBobYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}locoBobYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}locoBobYAfterRestart/,
    );
    expect(gameSrc).not.toContain("locoBobYAfterRestart(");
    expect(gameSrc).not.toContain("locoBobLeanZAfterRestart(");
    expect(gameSrc).not.toContain("locoBobSwayXAfterRestart(");
    expect(gameSrc).not.toContain("locoBobYFromLook(");
    expect(gameSrc).not.toContain("locoBobLeanZFromLook(");
    expect(gameSrc).not.toContain("locoBobSwayXFromLook(");
    expect(saveSrc).not.toContain("locoBobYAfterRestart");
    expect(saveSrc).not.toContain("locoBobLeanZAfterRestart");
    expect(saveSrc).not.toContain("locoBobYFromLook");
    expect(saveSrc).not.toContain("locoBobLeanZFromLook");
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
