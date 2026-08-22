import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import { MUZZLE_FORWARD } from "../src/render/worldView";
import { TRACER_HEIGHT } from "../src/render/tracers";
import {
  MUZZLE_FLASH_DURATION,
  MUZZLE_FLASH_PEAK,
  MUZZLE_FLASH_POS_X_SPAWN,
  MUZZLE_FLASH_POS_Y_SPAWN,
  MUZZLE_FLASH_POS_Z_SPAWN,
  MUZZLE_FLASH_RADIUS,
  MUZZLE_LIGHT_PEAK,
  createMuzzleFlash,
  muzzleFlashActiveAfterRestart,
  muzzleFlashActiveFromLook,
  muzzleFlashApplies,
  muzzleFlashIntensityAfterRestart,
  muzzleFlashIntensityFromLook,
  muzzleFlashPosXAfterRestart,
  muzzleFlashPosXFromLook,
  muzzleFlashPosYAfterRestart,
  muzzleFlashPosYFromLook,
  muzzleFlashPosZAfterRestart,
  muzzleFlashPosZFromLook,
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

describe("muzzleFlashAfterRestart (R / softReset)", () => {
  test("flash fresco (inactive + pos yaw 0); leftover ctor Three opacity 1 / origin 0,0 / far no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootI = muzzleFlashIntensityAfterRestart();
    const bootA = muzzleFlashActiveAfterRestart();
    const bootX = muzzleFlashPosXAfterRestart();
    const bootY = muzzleFlashPosYAfterRestart();
    const bootZ = muzzleFlashPosZAfterRestart();
    expect(bootI).toBe(muzzleFlashIntensityFromLook(0));
    expect(bootA).toBe(muzzleFlashActiveFromLook(false));
    expect(bootX).toBe(muzzleFlashPosXFromLook(0));
    expect(bootY).toBe(muzzleFlashPosYFromLook(TRACER_HEIGHT));
    expect(bootZ).toBe(muzzleFlashPosZFromLook(MUZZLE_FORWARD));
    expect(bootI).toBe(0);
    expect(bootA).toBe(false);
    expect(bootX).toBe(MUZZLE_FLASH_POS_X_SPAWN);
    expect(bootY).toBe(MUZZLE_FLASH_POS_Y_SPAWN);
    expect(bootZ).toBe(MUZZLE_FLASH_POS_Z_SPAWN);
    expect(bootY).toBe(TRACER_HEIGHT);
    expect(bootZ).toBe(MUZZLE_FORWARD);
    expect(muzzleFlashPosXAfterRestart(0)).toBe(bootX);
    expect(muzzleFlashPosYAfterRestart(TRACER_HEIGHT)).toBe(bootY);
    expect(muzzleFlashPosZAfterRestart(0.552)).toBe(bootZ);
    expect(muzzleFlashPosXAfterRestart(40)).toBe(muzzleFlashPosXFromLook(40));
    expect(muzzleFlashPosZAfterRestart(30)).toBe(muzzleFlashPosZFromLook(30));

    const leftoverCtorOpacity = 1;
    const leftoverCtorX = 0;
    const leftoverCtorY = 0;
    const leftoverCtorZ = 0;
    expect(leftoverCtorOpacity).not.toBe(bootI);
    expect(leftoverCtorY).not.toBe(bootY);
    expect(leftoverCtorZ).not.toBe(bootZ);
    expect(muzzleFlashIntensityFromLook(1)).toBe(leftoverCtorOpacity);
    expect(muzzleFlashIntensityFromLook(1)).not.toBe(bootI);
    expect(muzzleFlashPosYFromLook(0)).toBe(leftoverCtorY);
    expect(muzzleFlashPosZFromLook(0)).toBe(leftoverCtorZ);
    expect(muzzleFlashPosYFromLook(0)).not.toBe(bootY);
    expect(muzzleFlashPosZFromLook(0)).not.toBe(bootZ);
    expect(leftoverCtorX).toBe(bootX);

    const leftoverFarX = muzzleFlashPosXFromLook(40);
    const leftoverFarZ = muzzleFlashPosZFromLook(30);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);
    expect(leftoverFarX).not.toBe(bootX);
    expect(leftoverFarZ).not.toBe(bootZ);
    expect(leftoverFarX).not.toBe(muzzleFlashPosXAfterRestart());
    expect(leftoverFarZ).not.toBe(muzzleFlashPosZAfterRestart());

    expect(muzzleFlashPosXFromLook(0)).toBe(bootX);
    expect(muzzleFlashPosYFromLook(TRACER_HEIGHT)).toBe(bootY);
    expect(muzzleFlashPosZFromLook(0.552)).toBe(bootZ);
    expect(muzzleFlashActiveFromLook(false)).toBe(bootA);
    expect(muzzleFlashActiveFromLook(true)).not.toBe(bootA);
  });

  test("vivo tick no usa el helper (flash avanza con look)", () => {
    const bootI = muzzleFlashIntensityAfterRestart();
    const bootA = muzzleFlashActiveAfterRestart();
    const bootX = muzzleFlashPosXAfterRestart();
    const bootY = muzzleFlashPosYAfterRestart();
    const bootZ = muzzleFlashPosZAfterRestart();
    const liveI = muzzleFlashIntensityFromLook(1);
    const liveA = muzzleFlashActiveFromLook(true);
    const liveX = muzzleFlashPosXFromLook(40);
    const liveZ = muzzleFlashPosZFromLook(30);
    expect(liveI).toBe(1);
    expect(liveA).toBe(true);
    expect(liveX).toBe(40);
    expect(liveZ).toBe(30);
    expect(liveI).not.toBe(bootI);
    expect(liveA).not.toBe(bootA);
    expect(liveX).not.toBe(bootX);
    expect(liveZ).not.toBe(bootZ);
    expect(liveI).not.toBe(muzzleFlashIntensityAfterRestart());
    expect(liveA).not.toBe(muzzleFlashActiveAfterRestart());
    expect(liveX).not.toBe(muzzleFlashPosXAfterRestart());
    expect(liveZ).not.toBe(muzzleFlashPosZAfterRestart());
    expect(liveX).toBeGreaterThan(bootX);
    expect(liveZ).toBeGreaterThan(bootZ);

    expect(muzzleFlashIntensityFromLook(0)).toBe(bootI);
    expect(muzzleFlashActiveFromLook(false)).toBe(bootA);
    expect(muzzleFlashPosXFromLook(0)).toBe(bootX);
    expect(muzzleFlashPosYFromLook(TRACER_HEIGHT)).toBe(bootY);
    expect(muzzleFlashPosZFromLook(0.552)).toBe(bootZ);
    expect(muzzleFlashPosYFromLook(0)).toBe(0);
    expect(muzzleFlashPosZFromLook(0)).toBe(0);
  });
});

describe("muzzle flash recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace muzzle fresco; F9 no helper", () => {
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
    const flashSrc = readFileSync(
      resolve(process.cwd(), "src/render/muzzleFlash.ts"),
      "utf8",
    );
    expect(flashSrc).toContain("muzzleFlashIntensityAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashActiveAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashPosXAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashPosYAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashPosZAfterRestart(");
    expect(flashSrc).toContain("muzzleFlashIntensityFromLook(");
    expect(flashSrc).toContain("muzzleFlashActiveFromLook(");
    expect(flashSrc).toContain("muzzleFlashPosXFromLook(");
    expect(flashSrc).toContain("muzzleFlashPosYFromLook(");
    expect(flashSrc).toContain("muzzleFlashPosZFromLook(");
    expect(flashSrc).toContain("MUZZLE_FLASH_POS_X_SPAWN");
    expect(flashSrc).toContain("MUZZLE_FLASH_POS_Y_SPAWN");
    expect(flashSrc).toContain("MUZZLE_FLASH_POS_Z_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleFlashIntensityAfterRestart\([\s\S]{0,200}muzzleFlashIntensityFromLook\(/,
    );
    expect(flashSrc).toMatch(
      /muzzleFlashPosYAfterRestart\([\s\S]{0,200}muzzleFlashPosYFromLook\(/,
    );
    expect(flashSrc).toMatch(
      /muzzleFlashPosZAfterRestart\([\s\S]{0,200}muzzleFlashPosZFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleFlashIntensityAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashActiveAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashPosXAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashPosYAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashPosZAfterRestart(");
    expect(viewSrc).toContain("muzzleFlashIntensityFromLook(");
    expect(viewSrc).toContain("muzzleFlashActiveFromLook(");
    expect(viewSrc).toContain("muzzleFlashPosXFromLook(");
    expect(viewSrc).toContain("muzzleFlashPosZFromLook(");
    expect(viewSrc).toMatch(
      /opacity:\s*muzzleFlashIntensityAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /muzzleMesh\.visible = muzzleFlashActiveAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /muzzleMesh\.position\.set\(\s*muzzleFlashPosXAfterRestart\(\),\s*muzzleFlashPosYAfterRestart\(\),\s*muzzleFlashPosZAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /muzzleLight\.position\.set\(\s*muzzleFlashPosXAfterRestart\(\),\s*muzzleFlashPosYAfterRestart\(\),\s*muzzleFlashPosZAfterRestart\(\)/,
    );
    expect(viewSrc).toContain("muzzleMesh.position.set(ox, TRACER_HEIGHT, oz)");
    expect(viewSrc).toContain(
      "muzzleFlashPosXFromLook(Math.sin(playerGltfYaw) * MUZZLE_FORWARD)",
    );
    expect(viewSrc).toContain(
      "muzzleFlashPosZFromLook(Math.cos(playerGltfYaw) * MUZZLE_FORWARD)",
    );
    expect(viewSrc).toMatch(
      /applyMuzzleFlashVisual\(\{[\s\S]{0,120}muzzleFlashIntensityAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /muzzleMat\.opacity = muzzleFlashIntensityFromLook\(out\.intensity\)/,
    );
    expect(viewSrc).toMatch(
      /muzzleFlashColorAfterRestart\(\),[\s\S]{0,200}opacity:\s*muzzleFlashIntensityAfterRestart\(\)/,
    );
    expect(viewSrc).not.toMatch(
      /muzzleFlashColorAfterRestart\(\),[\s\S]{0,200}opacity:\s*1,/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleFlashIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleFlashIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleFlashIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleFlashIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleFlashIntensityAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashActiveAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashPosXAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashPosYAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashPosZAfterRestart(");
    expect(gameSrc).not.toContain("muzzleFlashIntensityFromLook(");
    expect(gameSrc).not.toContain("muzzleFlashActiveFromLook(");
    expect(gameSrc).not.toContain("muzzleFlashPosXFromLook(");
    expect(gameSrc).not.toContain("muzzleFlashPosYFromLook(");
    expect(gameSrc).not.toContain("muzzleFlashPosZFromLook(");
    expect(saveSrc).not.toContain("muzzleFlashIntensityAfterRestart");
    expect(saveSrc).not.toContain("muzzleFlashPosXAfterRestart");
    expect(saveSrc).not.toContain("muzzleFlashIntensityFromLook");
    expect(saveSrc).not.toContain("muzzleFlashPosXFromLook");
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
