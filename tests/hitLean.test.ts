import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  HIT_LEAN_ANGLE,
  HIT_LEAN_DURATION,
  HIT_LEAN_YAW_RATIO,
  createHitLeanState,
  hitLeanApplies,
  tickHitLean,
  triggerHitLean,
} from "../src/render/hitLean";

describe("constantes", () => {
  test("duración 0.23 × 1.15, ángulo 0.35 × 1.15 rad y yaw 0.5 × 1.15", () => {
    expect(HIT_LEAN_DURATION).toBe(0.2645);
    expect(HIT_LEAN_DURATION).toBeCloseTo(0.23 * 1.15, 10);
    expect(HIT_LEAN_ANGLE).toBe(0.4025);
    expect(HIT_LEAN_ANGLE).toBeCloseTo(0.35 * 1.15, 10);
    expect(HIT_LEAN_YAW_RATIO).toBe(0.575);
    expect(HIT_LEAN_YAW_RATIO).toBeCloseTo(0.5 * 1.15, 10);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createHitLeanState();
    expect(s.active).toBe(false);
    const out = tickHitLean(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("trigger + tick: pitch y yawBias < 0 (ease-out sine, recoil)", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    expect(s.active).toBe(true);
    const out = tickHitLean(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeLessThan(0);
    expect(out.yawBias).toBeLessThan(0);
    expect(out.yawBias).toBeCloseTo(out.pitch * 0.575, 10);
    expect(out.pitch).toBeGreaterThanOrEqual(-HIT_LEAN_ANGLE - 1e-12);
  });

  test("pico en t=0.5: envelope 1, pitch = -ANGLE", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, HIT_LEAN_DURATION / 2);
    expect(out.active).toBe(true);
    expect(out.pitch).toBeCloseTo(-HIT_LEAN_ANGLE, 10);
    expect(out.yawBias).toBeCloseTo(-HIT_LEAN_ANGLE * 0.575, 10);
  });

  test("ease-out sine en t=0.25: -sin(π/4) · ANGLE", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, HIT_LEAN_DURATION / 4);
    const expected = -Math.sin(Math.PI / 4) * HIT_LEAN_ANGLE;
    expect(out.pitch).toBeCloseTo(expected, 10);
    expect(out.yawBias).toBeCloseTo(expected * 0.575, 10);
  });

  test("espejo: t=0.75 igual a t=0.25 (vuelve a reposo)", () => {
    const a = createHitLeanState();
    const b = createHitLeanState();
    triggerHitLean(a);
    triggerHitLean(b);
    const early = tickHitLean(a, HIT_LEAN_DURATION * 0.25);
    const late = tickHitLean(b, HIT_LEAN_DURATION * 0.75);
    expect(late.pitch).toBeCloseTo(early.pitch, 10);
    expect(late.yawBias).toBeCloseTo(early.yawBias, 10);
  });

  test("al cumplir duración: inactivo y ceros (sin snap residual)", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, HIT_LEAN_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt extra grande completa el lean en un tick", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    const out = tickHitLean(s, 10);
    expect(out.active).toBe(false);
    expect(out.pitch).toBe(0);
    expect(out.yawBias).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    tickHitLean(s, 0.05);
    const age = s.age;
    const a = tickHitLean(s, 0);
    expect(s.age).toBe(age);
    const b = tickHitLean(s, -1);
    expect(s.age).toBe(age);
    expect(a.pitch).toBe(b.pitch);
    expect(a.yawBias).toBe(b.yawBias);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0", () => {
    const s = createHitLeanState();
    triggerHitLean(s);
    tickHitLean(s, 0.1);
    expect(s.age).toBeGreaterThan(0);
    triggerHitLean(s);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    const out = tickHitLean(s, HIT_LEAN_DURATION / 2);
    expect(out.pitch).toBeCloseTo(-HIT_LEAN_ANGLE, 10);
  });
});

describe("hitLeanApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya en reposo no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(hitLeanApplies(true)).toBe(false);
    expect(hitLeanApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(hitLeanApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(hitLeanApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; reset pose; vivo sí; dt<=0 no-op", () => {
    const dead = createHitLeanState();
    triggerHitLean(dead);
    tickHitLean(dead, 0.05, false);
    const age = dead.age;
    const hidden = tickHitLean(dead, 0.05, true);
    expect(dead.age).toBe(age);
    expect(hidden.active).toBe(false);
    expect(hidden.pitch).toBe(0);
    expect(hidden.yawBias).toBe(0);

    const idle = createHitLeanState();
    expect(tickHitLean(idle, 0.1, true)).toEqual({
      pitch: 0,
      yawBias: 0,
      active: false,
    });
    expect(idle.active).toBe(false);
    expect(idle.age).toBe(0);

    const live = createHitLeanState();
    triggerHitLean(live);
    const out = tickHitLean(live, HIT_LEAN_DURATION / 4, false);
    const expected = -Math.sin(Math.PI / 4) * HIT_LEAN_ANGLE;
    expect(out.active).toBe(true);
    expect(out.pitch).toBeCloseTo(expected, 10);
    expect(out.yawBias).toBeCloseTo(expected * 0.575, 10);
    expect(live.age).toBeCloseTo(HIT_LEAN_DURATION / 4, 10);

    expect(tickHitLean(live, 0, false).active).toBe(true);
    expect(live.age).toBeCloseTo(HIT_LEAN_DURATION / 4, 10);
    expect(tickHitLean(live, -1, false).active).toBe(true);
    expect(live.age).toBeCloseTo(HIT_LEAN_DURATION / 4, 10);
    expect(tickHitLean(live, Number.NaN, false).active).toBe(true);
    expect(live.age).toBeCloseTo(HIT_LEAN_DURATION / 4, 10);
  });

  test("Game freeze / enterGameOver / F9 load-muerto resetan lean; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("hitLeanApplies(");
    expect(src).toContain("this.view.hideHitLean()");
    expect(src).toMatch(
      /syncHitLeanOverlay\(dt = 0\): void \{[\s\S]{0,280}hitLeanApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2200}this\.syncHitLeanOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2200}this\.syncHitLeanOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4600}this\.syncHitLeanOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncHitLeanOverlay\(dt\);\s*\/\/ Mixer must keep ticking during freeze[\s\S]{0,160}this\.syncSwingPoseOverlay\(dt\);\s*this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4600}this\.view\.tickHitLean\(dt\)/,
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
    expect(viewSrc).toContain("hitLeanApplies(");
    expect(viewSrc).toContain("stepHitLean(");
    expect(viewSrc).toContain("hideHitLean: hideLean");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toContain("tickHitLean(playerHitLean, dt)");
  });
});
