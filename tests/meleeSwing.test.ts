import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MELEE_SWING_ANGLE,
  MELEE_SWING_DURATION,
  MELEE_SWING_PITCH_SPAWN,
  MELEE_SWING_YAW_RATIO,
  MELEE_SWING_YAW_SPAWN,
  createMeleeSwingState,
  meleeSwingActiveAfterRestart,
  meleeSwingActiveFromLook,
  meleeSwingPitchAfterRestart,
  meleeSwingPitchFromLook,
  meleeSwingYawBiasAfterRestart,
  meleeSwingYawBiasFromLook,
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

describe("meleeSwingAfterRestart (R / softReset)", () => {
  test("swing fresco (idle 0); leftover mid-swing / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootP = meleeSwingPitchAfterRestart();
    const bootY = meleeSwingYawBiasAfterRestart();
    const bootA = meleeSwingActiveAfterRestart();
    expect(bootP).toBe(meleeSwingPitchFromLook(0));
    expect(bootY).toBe(meleeSwingYawBiasFromLook(0));
    expect(bootA).toBe(meleeSwingActiveFromLook(false));
    expect(bootP).toBe(0);
    expect(bootY).toBe(0);
    expect(bootA).toBe(false);
    expect(bootP).toBe(MELEE_SWING_PITCH_SPAWN);
    expect(bootY).toBe(MELEE_SWING_YAW_SPAWN);
    expect(meleeSwingPitchAfterRestart()).toBe(bootP);
    expect(meleeSwingYawBiasAfterRestart()).toBe(bootY);
    expect(meleeSwingActiveAfterRestart()).toBe(bootA);

    const leftoverMidPitch = MELEE_SWING_ANGLE;
    const leftoverMidYaw = MELEE_SWING_ANGLE * MELEE_SWING_YAW_RATIO;
    expect(leftoverMidPitch).not.toBe(bootP);
    expect(leftoverMidYaw).not.toBe(bootY);
    expect(meleeSwingPitchFromLook(MELEE_SWING_ANGLE)).toBe(leftoverMidPitch);
    expect(meleeSwingPitchFromLook(MELEE_SWING_ANGLE)).not.toBe(bootP);
    expect(meleeSwingYawBiasFromLook(leftoverMidYaw)).toBe(leftoverMidYaw);
    expect(meleeSwingYawBiasFromLook(leftoverMidYaw)).not.toBe(bootY);
    expect(meleeSwingActiveFromLook(true)).not.toBe(bootA);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);

    expect(meleeSwingPitchFromLook(0)).toBe(bootP);
    expect(meleeSwingYawBiasFromLook(0)).toBe(bootY);
    expect(meleeSwingActiveFromLook(false)).toBe(bootA);
  });

  test("vivo tick no usa el helper (swing avanza con look)", () => {
    const bootP = meleeSwingPitchAfterRestart();
    const bootY = meleeSwingYawBiasAfterRestart();
    const bootA = meleeSwingActiveAfterRestart();
    const live = createMeleeSwingState();
    triggerMeleeSwing(live);
    const mid = tickMeleeSwing(live, MELEE_SWING_DURATION / 2);
    const liveP = meleeSwingPitchFromLook(mid.pitch);
    const liveY = meleeSwingYawBiasFromLook(mid.yawBias);
    const liveA = meleeSwingActiveFromLook(mid.active);
    expect(liveP).toBeCloseTo(MELEE_SWING_ANGLE, 10);
    expect(liveY).toBeCloseTo(MELEE_SWING_ANGLE * MELEE_SWING_YAW_RATIO, 10);
    expect(liveA).toBe(true);
    expect(liveP).not.toBe(bootP);
    expect(liveY).not.toBe(bootY);
    expect(liveA).not.toBe(bootA);
    expect(liveP).not.toBe(meleeSwingPitchAfterRestart());
    expect(liveY).not.toBe(meleeSwingYawBiasAfterRestart());
    expect(liveA).not.toBe(meleeSwingActiveAfterRestart());
    expect(liveP).toBeGreaterThan(bootP);
    expect(liveY).toBeGreaterThan(bootY);

    expect(meleeSwingPitchFromLook(0)).toBe(bootP);
    expect(meleeSwingYawBiasFromLook(0)).toBe(bootY);
    expect(meleeSwingActiveFromLook(false)).toBe(bootA);
    expect(meleeSwingPitchFromLook(MELEE_SWING_ANGLE)).toBe(MELEE_SWING_ANGLE);
    expect(meleeSwingActiveFromLook(true)).toBe(true);
  });
});

describe("melee swing recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace swing fresco; F9 no helper", () => {
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
    const swingSrc = readFileSync(
      resolve(process.cwd(), "src/render/meleeSwing.ts"),
      "utf8",
    );
    expect(swingSrc).toContain("meleeSwingPitchAfterRestart(");
    expect(swingSrc).toContain("meleeSwingYawBiasAfterRestart(");
    expect(swingSrc).toContain("meleeSwingActiveAfterRestart(");
    expect(swingSrc).toContain("meleeSwingPitchFromLook(");
    expect(swingSrc).toContain("meleeSwingYawBiasFromLook(");
    expect(swingSrc).toContain("meleeSwingActiveFromLook(");
    expect(swingSrc).toContain("MELEE_SWING_PITCH_SPAWN");
    expect(swingSrc).toContain("MELEE_SWING_YAW_SPAWN");
    expect(swingSrc).toMatch(
      /meleeSwingPitchAfterRestart\([\s\S]{0,200}meleeSwingPitchFromLook\(/,
    );
    expect(swingSrc).toMatch(
      /meleeSwingYawBiasAfterRestart\([\s\S]{0,200}meleeSwingYawBiasFromLook\(/,
    );
    expect(viewSrc).toContain("meleeSwingPitchAfterRestart(");
    expect(viewSrc).toContain("meleeSwingYawBiasAfterRestart(");
    expect(viewSrc).toContain("meleeSwingActiveAfterRestart(");
    expect(viewSrc).toContain("meleeSwingPitchFromLook(");
    expect(viewSrc).toContain("meleeSwingYawBiasFromLook(");
    expect(viewSrc).toContain("meleeSwingActiveFromLook(");
    expect(viewSrc).toMatch(
      /playerLocoRoot\.rotation\.x = meleeSwingPitchAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /playerLocoRoot\.rotation\.z = meleeSwingYawBiasAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /pitch:\s*meleeSwingPitchAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /yawBias:\s*meleeSwingYawBiasAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /active:\s*meleeSwingActiveAfterRestart\(\)/,
    );
    expect(viewSrc).toContain("meleeSwingPitchFromLook(out.pitch)");
    expect(viewSrc).toContain("meleeSwingYawBiasFromLook(out.yawBias)");
    expect(viewSrc).toContain("meleeSwingActiveFromLook(out.active)");
    expect(viewSrc).toContain("meleeSwingPitchFromLook(swing.pitch)");
    expect(viewSrc).toMatch(
      /applySwingOverlayPose\(\{[\s\S]{0,160}meleeSwingPitchAfterRestart\(\)/,
    );
    expect(viewSrc).not.toMatch(
      /hideSwing\(\): void \{[\s\S]{0,200}meleeSwingPitchAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3300}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}meleeSwingPitchAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}meleeSwingPitchAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}meleeSwingPitchAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}meleeSwingPitchAfterRestart/,
    );
    expect(gameSrc).not.toContain("meleeSwingPitchAfterRestart(");
    expect(gameSrc).not.toContain("meleeSwingYawBiasAfterRestart(");
    expect(gameSrc).not.toContain("meleeSwingActiveAfterRestart(");
    expect(gameSrc).not.toContain("meleeSwingPitchFromLook(");
    expect(gameSrc).not.toContain("meleeSwingYawBiasFromLook(");
    expect(gameSrc).not.toContain("meleeSwingActiveFromLook(");
    expect(saveSrc).not.toContain("meleeSwingPitchAfterRestart");
    expect(saveSrc).not.toContain("meleeSwingYawBiasAfterRestart");
    expect(saveSrc).not.toContain("meleeSwingPitchFromLook");
    expect(saveSrc).not.toContain("meleeSwingYawBiasFromLook");
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
