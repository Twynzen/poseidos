import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  HIT_LEAN_ANGLE,
  HIT_LEAN_DURATION,
  HIT_LEAN_PITCH_SPAWN,
  HIT_LEAN_YAW_RATIO,
  HIT_LEAN_YAW_SPAWN,
  createHitLeanState,
  hitLeanActiveAfterRestart,
  hitLeanActiveFromLook,
  hitLeanApplies,
  hitLeanPitchAfterRestart,
  hitLeanPitchFromLook,
  hitLeanYawBiasAfterRestart,
  hitLeanYawBiasFromLook,
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

describe("hitLeanAfterRestart (R / softReset)", () => {
  test("lean fresco (idle 0); leftover mid-recoil / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootP = hitLeanPitchAfterRestart();
    const bootY = hitLeanYawBiasAfterRestart();
    const bootA = hitLeanActiveAfterRestart();
    expect(bootP).toBe(hitLeanPitchFromLook(0));
    expect(bootY).toBe(hitLeanYawBiasFromLook(0));
    expect(bootA).toBe(hitLeanActiveFromLook(false));
    expect(bootP).toBe(0);
    expect(bootY).toBe(0);
    expect(bootA).toBe(false);
    expect(bootP).toBe(HIT_LEAN_PITCH_SPAWN);
    expect(bootY).toBe(HIT_LEAN_YAW_SPAWN);
    expect(hitLeanPitchAfterRestart()).toBe(bootP);
    expect(hitLeanYawBiasAfterRestart()).toBe(bootY);
    expect(hitLeanActiveAfterRestart()).toBe(bootA);

    const leftoverMidPitch = -HIT_LEAN_ANGLE;
    const leftoverMidYaw = leftoverMidPitch * HIT_LEAN_YAW_RATIO;
    expect(leftoverMidPitch).not.toBe(bootP);
    expect(leftoverMidYaw).not.toBe(bootY);
    expect(hitLeanPitchFromLook(-HIT_LEAN_ANGLE)).toBe(leftoverMidPitch);
    expect(hitLeanPitchFromLook(-HIT_LEAN_ANGLE)).not.toBe(bootP);
    expect(hitLeanYawBiasFromLook(leftoverMidYaw)).toBe(leftoverMidYaw);
    expect(hitLeanYawBiasFromLook(leftoverMidYaw)).not.toBe(bootY);
    expect(hitLeanActiveFromLook(true)).not.toBe(bootA);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);

    expect(hitLeanPitchFromLook(0)).toBe(bootP);
    expect(hitLeanYawBiasFromLook(0)).toBe(bootY);
    expect(hitLeanActiveFromLook(false)).toBe(bootA);
  });

  test("vivo tick no usa el helper (recoil avanza con look)", () => {
    const bootP = hitLeanPitchAfterRestart();
    const bootY = hitLeanYawBiasAfterRestart();
    const bootA = hitLeanActiveAfterRestart();
    const live = createHitLeanState();
    triggerHitLean(live);
    const mid = tickHitLean(live, HIT_LEAN_DURATION / 2);
    const liveP = hitLeanPitchFromLook(mid.pitch);
    const liveY = hitLeanYawBiasFromLook(mid.yawBias);
    const liveA = hitLeanActiveFromLook(mid.active);
    expect(liveP).toBeCloseTo(-HIT_LEAN_ANGLE, 10);
    expect(liveY).toBeCloseTo(-HIT_LEAN_ANGLE * HIT_LEAN_YAW_RATIO, 10);
    expect(liveA).toBe(true);
    expect(liveP).not.toBe(bootP);
    expect(liveY).not.toBe(bootY);
    expect(liveA).not.toBe(bootA);
    expect(liveP).not.toBe(hitLeanPitchAfterRestart());
    expect(liveY).not.toBe(hitLeanYawBiasAfterRestart());
    expect(liveA).not.toBe(hitLeanActiveAfterRestart());
    expect(liveP).toBeLessThan(bootP);
    expect(liveY).toBeLessThan(bootY);

    expect(hitLeanPitchFromLook(0)).toBe(bootP);
    expect(hitLeanYawBiasFromLook(0)).toBe(bootY);
    expect(hitLeanActiveFromLook(false)).toBe(bootA);
    expect(hitLeanPitchFromLook(-HIT_LEAN_ANGLE)).toBe(-HIT_LEAN_ANGLE);
    expect(hitLeanActiveFromLook(true)).toBe(true);
  });
});

describe("hit lean recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace lean fresco; F9 no helper", () => {
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
    const leanSrc = readFileSync(
      resolve(process.cwd(), "src/render/hitLean.ts"),
      "utf8",
    );
    expect(leanSrc).toContain("hitLeanPitchAfterRestart(");
    expect(leanSrc).toContain("hitLeanYawBiasAfterRestart(");
    expect(leanSrc).toContain("hitLeanActiveAfterRestart(");
    expect(leanSrc).toContain("hitLeanPitchFromLook(");
    expect(leanSrc).toContain("hitLeanYawBiasFromLook(");
    expect(leanSrc).toContain("hitLeanActiveFromLook(");
    expect(leanSrc).toContain("HIT_LEAN_PITCH_SPAWN");
    expect(leanSrc).toContain("HIT_LEAN_YAW_SPAWN");
    expect(leanSrc).toMatch(
      /hitLeanPitchAfterRestart\([\s\S]{0,200}hitLeanPitchFromLook\(/,
    );
    expect(leanSrc).toMatch(
      /hitLeanYawBiasAfterRestart\([\s\S]{0,200}hitLeanYawBiasFromLook\(/,
    );
    expect(viewSrc).toContain("hitLeanPitchAfterRestart(");
    expect(viewSrc).toContain("hitLeanYawBiasAfterRestart(");
    expect(viewSrc).toContain("hitLeanActiveAfterRestart(");
    expect(viewSrc).toContain("hitLeanPitchFromLook(");
    expect(viewSrc).toContain("hitLeanYawBiasFromLook(");
    expect(viewSrc).toContain("hitLeanActiveFromLook(");
    expect(viewSrc).toMatch(
      /playerLocoRoot\.rotation\.x = hitLeanPitchAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /playerLocoRoot\.rotation\.z = hitLeanYawBiasAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /pitch:\s*hitLeanPitchAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /yawBias:\s*hitLeanYawBiasAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /active:\s*hitLeanActiveAfterRestart\(\)/,
    );
    expect(viewSrc).toContain("hitLeanPitchFromLook(out.pitch)");
    expect(viewSrc).toContain("hitLeanYawBiasFromLook(out.yawBias)");
    expect(viewSrc).toContain("hitLeanActiveFromLook(out.active)");
    expect(viewSrc).toContain("hitLeanPitchFromLook(lean.pitch)");
    expect(viewSrc).toMatch(
      /applyLeanOverlayPose\(\{[\s\S]{0,160}hitLeanPitchAfterRestart\(\)/,
    );
    expect(viewSrc).not.toMatch(
      /hideLean\(\): void \{[\s\S]{0,200}hitLeanPitchAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}hitLeanPitchAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}hitLeanPitchAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}hitLeanPitchAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}hitLeanPitchAfterRestart/,
    );
    expect(gameSrc).not.toContain("hitLeanPitchAfterRestart(");
    expect(gameSrc).not.toContain("hitLeanYawBiasAfterRestart(");
    expect(gameSrc).not.toContain("hitLeanActiveAfterRestart(");
    expect(gameSrc).not.toContain("hitLeanPitchFromLook(");
    expect(gameSrc).not.toContain("hitLeanYawBiasFromLook(");
    expect(gameSrc).not.toContain("hitLeanActiveFromLook(");
    expect(saveSrc).not.toContain("hitLeanPitchAfterRestart");
    expect(saveSrc).not.toContain("hitLeanYawBiasAfterRestart");
    expect(saveSrc).not.toContain("hitLeanPitchFromLook");
    expect(saveSrc).not.toContain("hitLeanYawBiasFromLook");
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
