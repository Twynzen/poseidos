import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  MUZZLE_FLASH_DURATION,
  MUZZLE_FLASH_PEAK,
  MUZZLE_FLASH_RADIUS,
  MUZZLE_LIGHT_PEAK,
  createMuzzleFlash,
  muzzleFlashApplies,
  tickMuzzleFlash,
  triggerMuzzleFlash,
} from "../src/render/muzzleFlash";

describe("constantes", () => {
  test("duración 0.12 × 1.15 y pico 1 × 1.15", () => {
    expect(MUZZLE_FLASH_DURATION).toBe(0.138);
    expect(MUZZLE_FLASH_DURATION).toBeCloseTo(0.12 * 1.15, 10);
    expect(MUZZLE_FLASH_PEAK).toBe(1.15);
    expect(MUZZLE_FLASH_PEAK).toBeCloseTo(1 * 1.15, 10);
  });

  test("radio 0.1375 × 1.15; worldView usa el knob (no magic 0.11/0.1375)", () => {
    expect(MUZZLE_FLASH_RADIUS).toBe(0.158125);
    expect(MUZZLE_FLASH_RADIUS).toBeCloseTo(0.1375 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "new THREE.SphereGeometry(MUZZLE_FLASH_RADIUS, 10, 8)",
    );
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.11\b/);
    expect(viewSrc).not.toMatch(/SphereGeometry\(0\.1375\b/);
  });

  test("luz PointLight 2.75 × 1.15; worldView usa el knob (no magic 2.2/2.75)", () => {
    expect(MUZZLE_LIGHT_PEAK).toBe(3.1625);
    expect(MUZZLE_LIGHT_PEAK).toBeCloseTo(2.75 * 1.15, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("MUZZLE_LIGHT_PEAK * out.intensity");
    expect(viewSrc).not.toMatch(/const MUZZLE_LIGHT_PEAK = 2\.2/);
    expect(viewSrc).not.toMatch(/const MUZZLE_LIGHT_PEAK = 2\.75/);
    expect(viewSrc).not.toMatch(/muzzleLight\.intensity = .*\b2\.2\b/);
    expect(viewSrc).not.toMatch(/muzzleLight\.intensity = .*\b2\.75\b/);
  });
});

describe("create / trigger / tick", () => {
  test("create: inactivo, tick da ceros", () => {
    const s = createMuzzleFlash();
    expect(s.active).toBe(false);
    const out = tickMuzzleFlash(s, 1 / 60);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("trigger + primer tick: intensity cerca de 1.15 (ease-out sine)", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    expect(s.active).toBe(true);
    const dt = 1 / 60;
    const out = tickMuzzleFlash(s, dt);
    expect(out.active).toBe(true);
    const u = dt / MUZZLE_FLASH_DURATION;
    const expected = Math.cos((u * Math.PI) / 2) * MUZZLE_FLASH_PEAK;
    expect(out.intensity).toBeCloseTo(expected, 10);
    expect(out.intensity).toBeGreaterThan(0.95);
    expect(out.intensity).toBeLessThanOrEqual(MUZZLE_FLASH_PEAK + 1e-12);
  });

  test("al cumplir duración: inactivo e intensity 0", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    const out = tickMuzzleFlash(s, MUZZLE_FLASH_DURATION);
    expect(s.active).toBe(false);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("dt extra grande completa el flash en un tick", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    const out = tickMuzzleFlash(s, 10);
    expect(out.active).toBe(false);
    expect(out.intensity).toBe(0);
  });

  test("dt ≤ 0 no avanza age; output determinista", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    tickMuzzleFlash(s, 0.05);
    const age = s.age;
    const a = tickMuzzleFlash(s, 0);
    expect(s.age).toBe(age);
    const b = tickMuzzleFlash(s, -1);
    expect(s.age).toBe(age);
    expect(a.intensity).toBe(b.intensity);
    expect(a.active).toBe(true);
  });

  test("re-trigger a mitad reinicia desde t=0", () => {
    const s = createMuzzleFlash();
    triggerMuzzleFlash(s);
    tickMuzzleFlash(s, 0.08);
    expect(s.age).toBeGreaterThan(0);
    triggerMuzzleFlash(s);
    expect(s.age).toBe(0);
    expect(s.active).toBe(true);
    const out = tickMuzzleFlash(s, 1 / 60);
    expect(out.active).toBe(true);
    expect(out.intensity).toBeGreaterThan(0.95);
  });
});

describe("muzzleFlashApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya oculto no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(muzzleFlashApplies(true)).toBe(false);
    expect(muzzleFlashApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(muzzleFlashApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(muzzleFlashApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; hide; vivo sí; dt<=0 no-op", () => {
    const dead = createMuzzleFlash();
    triggerMuzzleFlash(dead);
    tickMuzzleFlash(dead, 0.05, false);
    const age = dead.age;
    const hidden = tickMuzzleFlash(dead, 0.05, true);
    expect(dead.age).toBe(age);
    expect(hidden.active).toBe(false);
    expect(hidden.intensity).toBe(0);

    const idle = createMuzzleFlash();
    expect(tickMuzzleFlash(idle, 0.1, true)).toEqual({
      intensity: 0,
      active: false,
    });
    expect(idle.active).toBe(false);
    expect(idle.age).toBe(0);

    const live = createMuzzleFlash();
    triggerMuzzleFlash(live);
    const out = tickMuzzleFlash(live, 0.05, false);
    expect(out.active).toBe(true);
    expect(out.intensity).toBeGreaterThan(0);
    expect(live.age).toBeCloseTo(0.05, 10);

    expect(tickMuzzleFlash(live, 0, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
    expect(tickMuzzleFlash(live, -1, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
    expect(tickMuzzleFlash(live, Number.NaN, false).active).toBe(true);
    expect(live.age).toBeCloseTo(0.05, 10);
  });

  test("Game freeze / enterGameOver / F9 load-muerto ocultan muzzle; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("muzzleFlashApplies(");
    expect(src).toContain("this.view.hideMuzzleFlash()");
    expect(src).toMatch(
      /syncMuzzleFlashOverlay\(dt = 0\): void \{[\s\S]{0,280}muzzleFlashApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1600}this\.syncMuzzleFlashOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,1600}this\.syncMuzzleFlashOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4000}this\.syncMuzzleFlashOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.view\.tickPlayerLoco\(dt, false, false\);\s*this\.syncMuzzleFlashOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4000}this\.view\.tickMuzzleFlash\(dt\)/,
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
    expect(viewSrc).toContain("muzzleFlashApplies(");
    expect(viewSrc).toContain("stepMuzzleFlash(");
    expect(viewSrc).toContain("hideMuzzleFlash: hideMuzzle");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toContain(
      "applyMuzzleFlashVisual(tickMuzzleFlash(playerMuzzle, dt))",
    );
  });
});
