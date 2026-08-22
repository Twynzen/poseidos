import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  IMPACT_SPARK_DURATION,
  IMPACT_SPARK_LIGHT_PEAK,
  IMPACT_SPARK_PEAK,
  IMPACT_SPARK_RADIUS,
  createImpactSpark,
  impactSparkApplies,
  tickImpactSpark,
  triggerImpactSpark,
} from "../src/render/impactSpark";

describe("constantes", () => {
  test("duración 0.22 × 1.15 y pico 1 × 1.15", () => {
    expect(IMPACT_SPARK_DURATION).toBe(0.253);
    expect(IMPACT_SPARK_DURATION).toBeCloseTo(0.22 * 1.15, 10);
    expect(IMPACT_SPARK_PEAK).toBe(1.15);
    expect(IMPACT_SPARK_PEAK).toBeCloseTo(1 * 1.15, 10);
  });

  test("radio 0.1125 × 1.15; worldView usa el knob (no magic 0.09/0.1125)", () => {
    expect(IMPACT_SPARK_RADIUS).toBe(0.129375);
    expect(IMPACT_SPARK_RADIUS).toBeCloseTo(0.1125 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "new THREE.SphereGeometry(IMPACT_SPARK_RADIUS, 10, 8)",
    );
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.09\b/);
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.1125\b/);
  });

  test("luz PointLight 1.75 × 1.15; worldView usa el knob (no magic 1.4/1.75)", () => {
    expect(IMPACT_SPARK_LIGHT_PEAK).toBe(2.0125);
    expect(IMPACT_SPARK_LIGHT_PEAK).toBeCloseTo(1.75 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("IMPACT_SPARK_LIGHT_PEAK * out.intensity");
    expect(viewSrc).not.toMatch(/const IMPACT_SPARK_LIGHT_PEAK = 1\.4/);
    expect(viewSrc).not.toMatch(/const IMPACT_SPARK_LIGHT_PEAK = 1\.75/);
    expect(viewSrc).not.toMatch(/impactLight\.intensity = .*\b1\.4\b/);
    expect(viewSrc).not.toMatch(/impactLight\.intensity = .*\b1\.75\b/);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createImpactSpark();
    expect(s.active).toBe(false);
    const out = tickImpactSpark(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("trigger + primer tick: intensity cerca de 1.15 (ease-out sine) y guarda x/y", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 4.5, -2.25);
    expect(s.active).toBe(true);
    expect(s.x).toBe(4.5);
    expect(s.y).toBe(-2.25);
    const dt = 1 / 60;
    const out = tickImpactSpark(s, dt);
    expect(out.active).toBe(true);
    expect(out.x).toBe(4.5);
    expect(out.y).toBe(-2.25);
    const u = dt / IMPACT_SPARK_DURATION;
    const expected = Math.cos((u * Math.PI) / 2) * IMPACT_SPARK_PEAK;
    expect(out.intensity).toBeCloseTo(expected, 10);
    expect(out.intensity).toBeGreaterThan(0.95);
    expect(out.intensity).toBeLessThanOrEqual(IMPACT_SPARK_PEAK + 1e-12);
  });

  test("al cumplir duración: inactivo e intensity 0", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 1, 2);
    const out = tickImpactSpark(s, IMPACT_SPARK_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
    expect(out.x).toBe(1);
    expect(out.y).toBe(2);
  });

  test("dt extra grande completa el spark en un tick", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 0, 0);
    const out = tickImpactSpark(s, 10);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 3, 7);
    tickImpactSpark(s, 0.05);
    const age = s.age;
    const a = tickImpactSpark(s, 0);
    expect(s.age).toBe(age);
    const b = tickImpactSpark(s, -1);
    expect(s.age).toBe(age);
    expect(a.intensity).toBe(b.intensity);
    expect(a.active).toBe(true);
    expect(a.x).toBe(3);
    expect(a.y).toBe(7);
  });

  test("re-trigger a mitad reinicia desde t=0 y actualiza pos", () => {
    const s = createImpactSpark();
    triggerImpactSpark(s, 1, 1);
    tickImpactSpark(s, 0.12);
    expect(s.age).toBeGreaterThan(0);
    triggerImpactSpark(s, 9, -4);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    expect(s.x).toBe(9);
    expect(s.y).toBe(-4);
    const out = tickImpactSpark(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.intensity).toBeGreaterThan(0.95);
    expect(out.x).toBe(9);
    expect(out.y).toBe(-4);
  });
});

describe("impactSparkApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya oculto no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(impactSparkApplies(true)).toBe(false);
    expect(impactSparkApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(impactSparkApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(impactSparkApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; hide; vivo sí; dt<=0 no-op", () => {
    const dead = createImpactSpark();
    triggerImpactSpark(dead, 4, -2);
    tickImpactSpark(dead, 0.05, false);
    const age = dead.age;
    const hidden = tickImpactSpark(dead, 0.05, true);
    expect(dead.age).toBe(age);
    expect(hidden.active).toBe(false);
    expect(hidden.intensity).toBe(0);
    expect(hidden.x).toBe(4);
    expect(hidden.y).toBe(-2);

    const idle = createImpactSpark();
    expect(tickImpactSpark(idle, 0.1, true)).toEqual({
      intensity: 0,
      active: false,
      x: 0,
      y: 0,
    });
    expect(idle.active).toBe(false);
    expect(idle.age).toBe(0);

    const live = createImpactSpark();
    triggerImpactSpark(live, 1, 2);
    const out = tickImpactSpark(live, 0.05, false);
    expect(out.active).toBe(true);
    expect(out.intensity).toBeGreaterThan(0);
    expect(out.x).toBe(1);
    expect(out.y).toBe(2);
    expect(live.age).toBeCloseTo(0.05, 10);

    expect(tickImpactSpark(live, 0, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
    expect(tickImpactSpark(live, -1, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
    expect(tickImpactSpark(live, Number.NaN, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
  });

  test("Game freeze / enterGameOver / F9 load-muerto ocultan impact; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("impactSparkApplies(");
    expect(src).toContain("this.view.hideImpactSpark()");
    expect(src).toMatch(
      /syncImpactSparkOverlay\(dt = 0\): void \{[\s\S]{0,280}impactSparkApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1800}this\.syncImpactSparkOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,1800}this\.syncImpactSparkOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4200}this\.syncImpactSparkOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.view\.tickPlayerLoco\(dt, false, false\);\s*this\.syncMuzzleFlashOverlay\(dt\);\s*this\.syncImpactSparkOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4200}this\.view\.tickImpactSpark\(dt\)/,
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
      /Mixer must keep ticking during freeze[\s\S]{0,120}this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("impactSparkApplies(");
    expect(viewSrc).toContain("stepImpactSpark(");
    expect(viewSrc).toContain("hideImpactSpark: hideImpact");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toContain(
      "applyImpactSparkVisual(tickImpactSpark(impactSpark, dt))",
    );
  });
});
