import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  MELEE_SWING_ANGLE,
  MELEE_SWING_DURATION,
  MELEE_SWING_YAW_RATIO,
  createMeleeSwingState,
  swingPoseApplies,
  tickMeleeSwing,
  triggerMeleeSwing,
} from "../src/render/meleeSwing";

describe("constantes", () => {
  test("duración 0.2875 × 1.15, ángulo 0.4 × 1.15 rad y yaw 0.5 × 1.15", () => {
    expect(MELEE_SWING_DURATION).toBe(0.330625);
    expect(MELEE_SWING_DURATION).toBeCloseTo(0.2875 * 1.15, 10);
    expect(MELEE_SWING_ANGLE).toBe(0.46);
    expect(MELEE_SWING_ANGLE).toBeCloseTo(0.4 * 1.15, 10);
    expect(MELEE_SWING_YAW_RATIO).toBe(0.575);
    expect(MELEE_SWING_YAW_RATIO).toBeCloseTo(0.5 * 1.15, 10);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createMeleeSwingState();
    expect(s.active).toBe(false);
    const out = tickMeleeSwing(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("trigger + tick: pitch y yawBias > 0 (ease-out sine)", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    expect(s.active).toBe(true);
    const out = tickMeleeSwing(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeGreaterThan(0);
    expect(out.yawBias).toBeGreaterThan(0);
    expect(out.yawBias).toBeCloseTo(out.pitch * 0.575, 10);
    expect(out.pitch).toBeLessThanOrEqual(MELEE_SWING_ANGLE + 1e-12);
  });

  test("pico en t=0.5: envelope 1, pitch = ANGLE", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION / 2);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeCloseTo(MELEE_SWING_ANGLE, 10);
    expect(out.yawBias).toBeCloseTo(MELEE_SWING_ANGLE * 0.575, 10);
  });

  test("ease-out sine en t=0.25: sin(π/4) · ANGLE", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION / 4);
    const expected = Math.sin(Math.PI / 4) * MELEE_SWING_ANGLE;
    expect(out.pitch).toBeCloseTo(expected, 10);
    expect(out.yawBias).toBeCloseTo(expected * 0.575, 10);
  });

  test("espejo: t=0.75 igual a t=0.25 (vuelve a reposo)", () => {
    const a = createMeleeSwingState();
    const b = createMeleeSwingState();
    triggerMeleeSwing(a);
    triggerMeleeSwing(b);
    const early = tickMeleeSwing(a, MELEE_SWING_DURATION * 0.25);
    const late = tickMeleeSwing(b, MELEE_SWING_DURATION * 0.75);
    expect(late.pitch).toBeCloseTo(early.pitch, 10);
    expect(late.yawBias).toBeCloseTo(early.yawBias, 10);
  });

  test("al cumplir duración: inactivo y ceros (sin snap residual)", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt extra grande completa el swing en un tick", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    const out = tickMeleeSwing(s, 10);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    tickMeleeSwing(s, 0.05);
    const age = s.age;
    const a = tickMeleeSwing(s, 0);
    expect(s.age).toBe(age);
    const b = tickMeleeSwing(s, -1);
    expect(s.age).toBe(age);
    expect(a.pitch).toBe(b.pitch);
    expect(a.yawBias).toBe(b.yawBias);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0", () => {
    const s = createMeleeSwingState();
    triggerMeleeSwing(s);
    tickMeleeSwing(s, 0.1);
    expect(s.age).toBeGreaterThan(0);
    triggerMeleeSwing(s);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    const out = tickMeleeSwing(s, MELEE_SWING_DURATION / 2);
    expect(out.pitch).toBeCloseTo(MELEE_SWING_ANGLE, 10);
  });
});

describe("swingPoseApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya en reposo no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(swingPoseApplies(true)).toBe(false);
    expect(swingPoseApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(swingPoseApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(swingPoseApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; reset pose; vivo sí; dt<=0 no-op", () => {
    const dead = createMeleeSwingState();
    triggerMeleeSwing(dead);
    tickMeleeSwing(dead, 0.05, false);
    const age = dead.age;
    const hidden = tickMeleeSwing(dead, 0.05, true);
    expect(dead.age).toBe(age);
    expect(hidden.active).toBe(false);
    expect(hidden.pitch).toBe(0);
    expect(hidden.yawBias).toBe(0);

    const idle = createMeleeSwingState();
    expect(tickMeleeSwing(idle, 0.1, true)).toEqual({
      pitch: 0,
      yawBias: 0,
      active: false,
    });
    expect(idle.active).toBe(false);
    expect(idle.age).toBe(0);

    const live = createMeleeSwingState();
    triggerMeleeSwing(live);
    const out = tickMeleeSwing(live, 0.05, false);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeGreaterThan(0);
    expect(out.yawBias).toBeGreaterThan(0);
    expect(live.age).toBeCloseTo(0.05, 10);

    expect(tickMeleeSwing(live, 0, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
    expect(tickMeleeSwing(live, -1, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
    expect(tickMeleeSwing(live, Number.NaN, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
  });

  test("Game freeze / enterGameOver / F9 load-muerto resetan swing; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("swingPoseApplies(");
    expect(src).toContain("this.view.hideMeleeSwing()");
    expect(src).toMatch(
      /syncSwingPoseOverlay\(dt = 0\): void \{[\s\S]{0,280}swingPoseApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2000}this\.syncSwingPoseOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2000}this\.syncSwingPoseOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4400}this\.syncSwingPoseOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncSwingPoseOverlay\(dt\);\s*this\.view\.tickPlayerLoco\(dt, false, false\);\s*this\.syncMuzzleFlashOverlay\(dt\);\s*this\.syncImpactSparkOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4400}this\.view\.tickMeleeSwing\(dt\)/,
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
    expect(viewSrc).toContain("swingPoseApplies(");
    expect(viewSrc).toContain("stepMeleeSwing(");
    expect(viewSrc).toContain("hideMeleeSwing: hideSwing");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toContain("tickMeleeSwing(playerSwing, dt)");
  });
});
