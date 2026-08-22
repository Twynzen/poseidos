import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DEFAULT_NOISE_RING_LIFE,
  NOISE_RING_AMBER,
  NOISE_RING_COMBAT,
  NOISE_RING_COUNT_SPAWN,
  NOISE_RING_INNER,
  NOISE_RING_OPACITY_SPAWN,
  NOISE_RING_RUN,
  NOISE_RING_SCALE_SPAWN,
  NOISE_RING_WIDTH,
  RUN_NOISE_RING_MIN_AGE,
  applyNoiseRingTick,
  createNoiseRing,
  lastRunRingAgeAfterRestart,
  noiseRingActiveAfterRestart,
  noiseRingActiveFromLook,
  noiseRingApplies,
  noiseRingCountAfterRestart,
  noiseRingCountFromLook,
  noiseRingOpacityAfterRestart,
  noiseRingOpacityFromLook,
  noiseRingScaleAfterRestart,
  noiseRingScaleFromLook,
  ringColorHex,
  ringOpacity,
  ringProgress,
  ringScale,
  runNoiseRingReady,
  shouldShowNoiseRing,
  shouldSpawnNoiseRing,
  tickNoiseRing,
} from "../src/render/noiseRings";

describe("constantes", () => {
  test("vida 0.9775 × 1.15 / run cooldown 0.348 × 0.87", () => {
    expect(DEFAULT_NOISE_RING_LIFE).toBe(1.124125);
    expect(DEFAULT_NOISE_RING_LIFE).toBeCloseTo(0.9775 * 1.15, 10);
    expect(RUN_NOISE_RING_MIN_AGE).toBe(0.30276);
    expect(RUN_NOISE_RING_MIN_AGE).toBeCloseTo(0.348 * 0.87, 10);
  });

  test("grosor 0.225 × 1.15; inner 0.67425 × 0.87; worldView usa el knob (no magic 0.82)", () => {
    expect(NOISE_RING_WIDTH).toBe(0.25875);
    expect(NOISE_RING_WIDTH).toBeCloseTo(0.225 * 1.15, 10);
    expect(NOISE_RING_INNER).toBe(0.5865975);
    expect(NOISE_RING_INNER).toBeCloseTo(0.67425 * 0.87, 10);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "new THREE.RingGeometry(NOISE_RING_INNER, 1, 48)",
    );
    expect(viewSrc).not.toMatch(/RingGeometry\(0\.82\b/);
  });

  test("ámbar 0xe8b060 × 1.15/canal (r clamp) → 0xffca6e; width/life/inner/min-age sin cambio", () => {
    expect(NOISE_RING_AMBER).toBe(0xffca6e);
    const r = (NOISE_RING_AMBER >> 16) & 0xff;
    const g = (NOISE_RING_AMBER >> 8) & 0xff;
    const b = NOISE_RING_AMBER & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xca);
    expect(b).toBe(0x6e);
    expect(Math.min(0xff, Math.round((0xe8 * 115) / 100))).toBe(r);
    expect(Math.round((0xb0 * 115) / 100)).toBe(g);
    expect(Math.round((0x60 * 115) / 100)).toBe(b);
    expect(ringColorHex("door")).toBe(NOISE_RING_AMBER);
    expect(ringColorHex("loot")).toBe(NOISE_RING_AMBER);
    expect(ringColorHex("attack")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("gun")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("barricade")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("walk")).toBe(NOISE_RING_RUN);
    expect(ringColorHex("run")).toBe(NOISE_RING_RUN);
    expect(DEFAULT_NOISE_RING_LIFE).toBe(1.124125);
    expect(NOISE_RING_WIDTH).toBe(0.25875);
    expect(NOISE_RING_INNER).toBe(0.5865975);
    expect(RUN_NOISE_RING_MIN_AGE).toBe(0.30276);
  });

  test("rojo/naranja 0xff6030 × 1.15/canal (r clamp) → 0xff6e37; ámbar/width/life/inner/min-age sin cambio", () => {
    expect(NOISE_RING_COMBAT).toBe(0xff6e37);
    const r = (NOISE_RING_COMBAT >> 16) & 0xff;
    const g = (NOISE_RING_COMBAT >> 8) & 0xff;
    const b = NOISE_RING_COMBAT & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0x6e);
    expect(b).toBe(0x37);
    expect(Math.min(0xff, Math.round((0xff * 115) / 100))).toBe(r);
    expect(Math.round((0x60 * 115) / 100)).toBe(g);
    expect(Math.round((0x30 * 115) / 100)).toBe(b);
    expect(ringColorHex("attack")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("gun")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("barricade")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("door")).toBe(NOISE_RING_AMBER);
    expect(ringColorHex("loot")).toBe(NOISE_RING_AMBER);
    expect(ringColorHex("walk")).toBe(NOISE_RING_RUN);
    expect(ringColorHex("run")).toBe(NOISE_RING_RUN);
    expect(DEFAULT_NOISE_RING_LIFE).toBe(1.124125);
    expect(NOISE_RING_WIDTH).toBe(0.25875);
    expect(NOISE_RING_INNER).toBe(0.5865975);
    expect(RUN_NOISE_RING_MIN_AGE).toBe(0.30276);
  });

  test("blanco 0xe8e8f0 × 1.15/canal (all clamp) → 0xffffff; ámbar/rojo/width/life/inner/min-age sin cambio", () => {
    expect(NOISE_RING_RUN).toBe(0xffffff);
    const r = (NOISE_RING_RUN >> 16) & 0xff;
    const g = (NOISE_RING_RUN >> 8) & 0xff;
    const b = NOISE_RING_RUN & 0xff;
    expect(r).toBe(0xff);
    expect(g).toBe(0xff);
    expect(b).toBe(0xff);
    expect(Math.min(0xff, Math.round((0xe8 * 115) / 100))).toBe(r);
    expect(Math.min(0xff, Math.round((0xe8 * 115) / 100))).toBe(g);
    expect(Math.min(0xff, Math.round((0xf0 * 115) / 100))).toBe(b);
    expect(ringColorHex("walk")).toBe(NOISE_RING_RUN);
    expect(ringColorHex("run")).toBe(NOISE_RING_RUN);
    expect(ringColorHex("idle")).toBe(NOISE_RING_RUN);
    expect(ringColorHex("door")).toBe(NOISE_RING_AMBER);
    expect(ringColorHex("loot")).toBe(NOISE_RING_AMBER);
    expect(ringColorHex("attack")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("gun")).toBe(NOISE_RING_COMBAT);
    expect(ringColorHex("barricade")).toBe(NOISE_RING_COMBAT);
    expect(DEFAULT_NOISE_RING_LIFE).toBe(1.124125);
    expect(NOISE_RING_WIDTH).toBe(0.25875);
    expect(NOISE_RING_INNER).toBe(0.5865975);
    expect(RUN_NOISE_RING_MIN_AGE).toBe(0.30276);
  });
});

describe("noiseRings (headless)", () => {
  test("createNoiseRing defaults", () => {
    const r = createNoiseRing({ x: 1, y: 2, radius: 6, kind: "run" });
    expect(r.x).toBe(1);
    expect(r.y).toBe(2);
    expect(r.radius).toBe(6);
    expect(r.kind).toBe("run");
    expect(r.age).toBe(0);
    expect(r.life).toBe(DEFAULT_NOISE_RING_LIFE);
  });

  test("createNoiseRing respeta life custom", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 4, life: 1.2 });
    expect(r.life).toBe(1.2);
    expect(r.kind).toBe("run");
  });

  test("tick hasta muerto", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 5, life: 0.5 });
    expect(tickNoiseRing(r, 0.2)).toBe(true);
    expect(r.age).toBeCloseTo(0.2, 5);
    expect(tickNoiseRing(r, 0.2)).toBe(true);
    expect(tickNoiseRing(r, 0.2)).toBe(false);
    expect(r.age).toBeGreaterThanOrEqual(0.5);
  });

  test("scale ease-out 0→1 y opacity fade", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 8, life: 1 });
    expect(ringProgress(r)).toBe(0);
    expect(ringScale(r)).toBe(0);
    expect(ringOpacity(r)).toBe(1);

    r.age = 0.5;
    expect(ringProgress(r)).toBeCloseTo(0.5, 5);
    // easeOutQuad(0.5) = 1 - 0.25 = 0.75
    expect(ringScale(r)).toBeCloseTo(0.75, 5);
    expect(ringOpacity(r)).toBeCloseTo(0.5, 5);

    r.age = 1;
    expect(ringProgress(r)).toBe(1);
    expect(ringScale(r)).toBe(1);
    expect(ringOpacity(r)).toBe(0);
  });

  test("scale/opacity bounds en [0,1]", () => {
    const r = createNoiseRing({ x: 0, y: 0, radius: 3, life: 0.8 });
    for (let t = 0; t <= 20; t++) {
      r.age = (t / 20) * r.life;
      const s = ringScale(r);
      const o = ringOpacity(r);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
    }
  });

  test("shouldShowNoiseRing oculta walk", () => {
    expect(shouldShowNoiseRing("walk")).toBe(false);
    expect(shouldShowNoiseRing("run")).toBe(true);
    expect(shouldShowNoiseRing("door")).toBe(true);
    expect(shouldShowNoiseRing("loot")).toBe(true);
    expect(shouldShowNoiseRing("barricade")).toBe(true);
    expect(shouldShowNoiseRing("attack")).toBe(true);
    expect(shouldShowNoiseRing("gun")).toBe(true);
  });

  test("runNoiseRingReady: null/undefined o >= 0.30276", () => {
    expect(RUN_NOISE_RING_MIN_AGE).toBe(0.30276);
    expect(runNoiseRingReady(null)).toBe(true);
    expect(runNoiseRingReady(undefined)).toBe(true);
    expect(runNoiseRingReady(0)).toBe(false);
    expect(runNoiseRingReady(0.30275)).toBe(false);
    expect(runNoiseRingReady(0.30276)).toBe(true);
    expect(runNoiseRingReady(0.348)).toBe(true);
    expect(runNoiseRingReady(0.4)).toBe(true);
    expect(runNoiseRingReady(1)).toBe(true);
  });

  test("shouldSpawnNoiseRing: run throttled; walk hidden; others shown", () => {
    expect(shouldSpawnNoiseRing("run")).toBe(true);
    expect(shouldSpawnNoiseRing("run", null)).toBe(true);
    expect(shouldSpawnNoiseRing("run", undefined)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.2)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.30275)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.30276)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0.348)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0.4)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0.8)).toBe(true);

    expect(shouldSpawnNoiseRing("walk")).toBe(false);
    expect(shouldSpawnNoiseRing("walk", 0)).toBe(false);
    expect(shouldSpawnNoiseRing("walk", 1)).toBe(false);

    expect(shouldSpawnNoiseRing("door", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("loot", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("barricade", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("attack", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("gun", 0)).toBe(true);
  });

  test("ringColorHex por kind", () => {
    expect(ringColorHex("run")).toBe(0xffffff);
    expect(ringColorHex("walk")).toBe(0xffffff);
    expect(ringColorHex("door")).toBe(0xffca6e);
    expect(ringColorHex("loot")).toBe(0xffca6e);
    expect(ringColorHex("attack")).toBe(0xff6e37);
    expect(ringColorHex("gun")).toBe(0xff6e37);
    expect(ringColorHex("barricade")).toBe(0xff6e37);
  });
});

describe("noiseRingApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; ya vacío no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(noiseRingApplies(true)).toBe(false);
    expect(noiseRingApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(noiseRingApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(noiseRingApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza age; vivo sí", () => {
    const dead = createNoiseRing({ x: 0, y: 0, radius: 5, life: 0.5 });
    expect(applyNoiseRingTick(dead, 0.2, true)).toBe(true);
    expect(dead.age).toBe(0);
    expect(ringProgress(dead)).toBe(0);
    expect(ringOpacity(dead)).toBe(1);

    const live = createNoiseRing({ x: 0, y: 0, radius: 5, life: 0.5 });
    expect(applyNoiseRingTick(live, 0.2, false)).toBe(true);
    expect(live.age).toBeCloseTo(0.2, 5);
    expect(applyNoiseRingTick(live, 0.2, false)).toBe(true);
    expect(applyNoiseRingTick(live, 0.2, false)).toBe(false);
    expect(live.age).toBeGreaterThanOrEqual(0.5);

    const alreadyDone = createNoiseRing({ x: 0, y: 0, radius: 3, life: 0.1 });
    alreadyDone.age = 0.1;
    expect(applyNoiseRingTick(alreadyDone, 0.2, true)).toBe(false);
    expect(alreadyDone.age).toBe(0.1);
  });

  test("Game freeze / enterGameOver / F9 load-muerto ocultan anillos; vivo tickea", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("noiseRingApplies(");
    expect(src).toContain("this.view.hideNoiseRings()");
    expect(src).toMatch(
      /syncNoiseRingOverlay\(dt = 0\): void \{[\s\S]{0,280}noiseRingApplies\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1200}this\.syncNoiseRingOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,1200}this\.syncNoiseRingOverlay\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}this\.syncNoiseRingOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncTracerOverlay\(dt\);\s*this\.syncNoiseRingOverlay\(dt\);/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}this\.view\.tickNoiseRings\(dt\)/,
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

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("noiseRingApplies(");
    expect(viewSrc).toContain("applyNoiseRingTick(");
    expect(viewSrc).toContain("hideNoiseRings: clearNoiseRings");
  });
});

describe("lastRunRingAgeAfterRestart (R / softReset)", () => {
  test("reinicio → null; edad previa no filtra", () => {
    expect(lastRunRingAgeAfterRestart()).toBeNull();
    expect(shouldSpawnNoiseRing("run", lastRunRingAgeAfterRestart())).toBe(
      true,
    );
    expect(runNoiseRingReady(lastRunRingAgeAfterRestart())).toBe(true);

    let current: number | null = 0;
    expect(shouldSpawnNoiseRing("run", current)).toBe(false);
    current = lastRunRingAgeAfterRestart();
    expect(current).toBeNull();
    expect(current).not.toBe(0);
    expect(shouldSpawnNoiseRing("run", current)).toBe(true);

    current = 0.2;
    expect(shouldSpawnNoiseRing("run", current)).toBe(false);
    current = lastRunRingAgeAfterRestart();
    expect(current).toBeNull();
    expect(current).not.toBe(0.2);
    expect(shouldSpawnNoiseRing("run", current)).toBe(true);

    current = 0.30275;
    expect(runNoiseRingReady(current)).toBe(false);
    current = lastRunRingAgeAfterRestart();
    expect(runNoiseRingReady(current)).toBe(true);
  });

  test("vivo sprint no usa el helper (shouldSpawnNoiseRing igual que hoy)", () => {
    expect(shouldSpawnNoiseRing("run")).toBe(true);
    expect(shouldSpawnNoiseRing("run", null)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.2)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.30275)).toBe(false);
    expect(shouldSpawnNoiseRing("run", 0.30276)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0.348)).toBe(true);
    expect(shouldSpawnNoiseRing("run", 0)).not.toBe(
      shouldSpawnNoiseRing("run", lastRunRingAgeAfterRestart()),
    );
    expect(shouldSpawnNoiseRing("walk", lastRunRingAgeAfterRestart())).toBe(
      false,
    );
    expect(shouldSpawnNoiseRing("door", 0)).toBe(true);
    expect(shouldSpawnNoiseRing("gun", 0)).toBe(true);
  });

  test("Game softReset asigna helper; F9 load no toca age; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("lastRunRingAgeAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,1600}this\.lastRunRingAgeSec = lastRunRingAgeAfterRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.noise = new NoiseBus\(\);[\s\S]{0,200}this\.lastRunRingAgeSec = lastRunRingAgeAfterRestart\(\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lastRunRingAgeAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}this\.lastRunRingAgeSec\s*=/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}lastRunRingAgeAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}this\.lastRunRingAgeSec\s*=/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}lastRunRingAgeAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}this\.lastRunRingAgeSec\s*=/,
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

describe("noiseRingAfterRestart (R / softReset)", () => {
  test("ring fresco (idle opacity/scale 0 + pool empty); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootI = noiseRingOpacityAfterRestart();
    const bootS = noiseRingScaleAfterRestart();
    const bootA = noiseRingActiveAfterRestart();
    const bootN = noiseRingCountAfterRestart();
    expect(bootI).toBe(noiseRingOpacityFromLook(0));
    expect(bootS).toBe(noiseRingScaleFromLook(0));
    expect(bootA).toBe(noiseRingActiveFromLook(false));
    expect(bootN).toBe(noiseRingCountFromLook(0));
    expect(bootI).toBe(0);
    expect(bootS).toBe(0);
    expect(bootA).toBe(false);
    expect(bootN).toBe(0);
    expect(bootI).toBe(NOISE_RING_OPACITY_SPAWN);
    expect(bootS).toBe(NOISE_RING_SCALE_SPAWN);
    expect(bootN).toBe(NOISE_RING_COUNT_SPAWN);
    expect(noiseRingOpacityAfterRestart()).toBe(bootI);
    expect(noiseRingScaleAfterRestart()).toBe(bootS);
    expect(noiseRingActiveAfterRestart()).toBe(bootA);
    expect(noiseRingCountAfterRestart()).toBe(bootN);

    const leftover = createNoiseRing({ x: 40, y: 30, radius: 6, kind: "run", life: 1 });
    leftover.age = 0.5;
    const leftoverMidI = ringOpacity(leftover);
    const leftoverMidS = ringScale(leftover);
    expect(leftoverMidI).toBeCloseTo(0.5, 5);
    expect(leftoverMidS).toBeCloseTo(0.75, 5);
    expect(leftoverMidI).not.toBe(bootI);
    expect(leftoverMidS).not.toBe(bootS);
    expect(noiseRingOpacityFromLook(leftoverMidI)).toBe(leftoverMidI);
    expect(noiseRingOpacityFromLook(leftoverMidI)).not.toBe(bootI);
    expect(noiseRingScaleFromLook(leftoverMidS)).toBe(leftoverMidS);
    expect(noiseRingScaleFromLook(leftoverMidS)).not.toBe(bootS);
    expect(noiseRingActiveFromLook(true)).not.toBe(bootA);
    expect(noiseRingCountFromLook(1)).not.toBe(bootN);

    const leftoverFarX = leftover.x;
    const leftoverFarZ = leftover.y;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(noiseRingOpacityFromLook(0)).toBe(bootI);
    expect(noiseRingScaleFromLook(0)).toBe(bootS);
    expect(noiseRingActiveFromLook(false)).toBe(bootA);
    expect(noiseRingCountFromLook(0)).toBe(bootN);
  });

  test("vivo tick no usa el helper (opacity/scale avanzan con look)", () => {
    const bootI = noiseRingOpacityAfterRestart();
    const bootS = noiseRingScaleAfterRestart();
    const bootA = noiseRingActiveAfterRestart();
    const bootN = noiseRingCountAfterRestart();
    const live = createNoiseRing({ x: 24.5, y: 15.5, radius: 6, kind: "run", life: 1 });
    expect(applyNoiseRingTick(live, 0.5, false)).toBe(true);
    const liveI = noiseRingOpacityFromLook(ringOpacity(live));
    const liveS = noiseRingScaleFromLook(ringScale(live));
    const liveA = noiseRingActiveFromLook(true);
    const liveN = noiseRingCountFromLook(1);
    expect(liveI).toBeCloseTo(0.5, 5);
    expect(liveS).toBeCloseTo(0.75, 5);
    expect(liveA).toBe(true);
    expect(liveN).toBe(1);
    expect(liveI).not.toBe(bootI);
    expect(liveS).not.toBe(bootS);
    expect(liveA).not.toBe(bootA);
    expect(liveN).not.toBe(bootN);
    expect(liveI).not.toBe(noiseRingOpacityAfterRestart());
    expect(liveS).not.toBe(noiseRingScaleAfterRestart());
    expect(liveA).not.toBe(noiseRingActiveAfterRestart());
    expect(liveN).not.toBe(noiseRingCountAfterRestart());
    expect(liveN).toBeGreaterThan(bootN);

    expect(noiseRingOpacityFromLook(0)).toBe(bootI);
    expect(noiseRingScaleFromLook(0)).toBe(bootS);
    expect(noiseRingActiveFromLook(false)).toBe(bootA);
    expect(noiseRingCountFromLook(0)).toBe(bootN);
    expect(noiseRingOpacityFromLook(0.5)).toBe(0.5);
    expect(noiseRingScaleFromLook(0.75)).toBe(0.75);
    expect(noiseRingCountFromLook(1)).toBe(1);
  });
});

describe("noise rings recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace ring fresco; F9 no helper", () => {
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
    const ringSrc = readFileSync(
      resolve(process.cwd(), "src/render/noiseRings.ts"),
      "utf8",
    );
    expect(ringSrc).toContain("noiseRingOpacityAfterRestart(");
    expect(ringSrc).toContain("noiseRingScaleAfterRestart(");
    expect(ringSrc).toContain("noiseRingActiveAfterRestart(");
    expect(ringSrc).toContain("noiseRingCountAfterRestart(");
    expect(ringSrc).toContain("noiseRingOpacityFromLook(");
    expect(ringSrc).toContain("noiseRingScaleFromLook(");
    expect(ringSrc).toContain("noiseRingActiveFromLook(");
    expect(ringSrc).toContain("noiseRingCountFromLook(");
    expect(ringSrc).toContain("NOISE_RING_OPACITY_SPAWN");
    expect(ringSrc).toContain("NOISE_RING_SCALE_SPAWN");
    expect(ringSrc).toContain("NOISE_RING_COUNT_SPAWN");
    expect(ringSrc).toMatch(
      /noiseRingOpacityAfterRestart\([\s\S]{0,200}noiseRingOpacityFromLook\(/,
    );
    expect(ringSrc).toMatch(
      /noiseRingScaleAfterRestart\([\s\S]{0,200}noiseRingScaleFromLook\(/,
    );
    expect(viewSrc).toContain("noiseRingOpacityAfterRestart(");
    expect(viewSrc).toContain("noiseRingScaleAfterRestart(");
    expect(viewSrc).toContain("noiseRingActiveAfterRestart(");
    expect(viewSrc).toContain("noiseRingCountAfterRestart(");
    expect(viewSrc).toContain("noiseRingOpacityFromLook(");
    expect(viewSrc).toContain("noiseRingScaleFromLook(");
    expect(viewSrc).toMatch(
      /opacity:\s*noiseRingOpacityAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /noiseRingPool: PooledNoiseRing\[\] = new Array\(noiseRingCountAfterRestart\(\)\)/,
    );
    expect(viewSrc).toContain("mesh.visible = noiseRingActiveAfterRestart()");
    expect(viewSrc).toContain("mesh.scale.set(s, 1, s)");
    expect(viewSrc).toContain(
      "slot.mat.opacity = noiseRingOpacityFromLook(ringOpacity(state))",
    );
    expect(viewSrc).toContain(
      "p.mat.opacity = noiseRingOpacityFromLook(ringOpacity(p.state))",
    );
    expect(viewSrc).toContain("noiseRingScaleFromLook(ringScale(state))");
    expect(viewSrc).toContain("noiseRingScaleFromLook(ringScale(p.state))");
    expect(viewSrc).not.toMatch(
      /hideNoiseRings: clearNoiseRings[\s\S]{0,80}noiseRingOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearNoiseRings\(\): void \{[\s\S]{0,200}noiseRingOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}noiseRingOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}noiseRingOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}noiseRingOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}noiseRingOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("noiseRingOpacityAfterRestart(");
    expect(gameSrc).not.toContain("noiseRingScaleAfterRestart(");
    expect(gameSrc).not.toContain("noiseRingActiveAfterRestart(");
    expect(gameSrc).not.toContain("noiseRingCountAfterRestart(");
    expect(gameSrc).not.toContain("noiseRingOpacityFromLook(");
    expect(gameSrc).not.toContain("noiseRingScaleFromLook(");
    expect(saveSrc).not.toContain("noiseRingOpacityAfterRestart");
    expect(saveSrc).not.toContain("noiseRingScaleAfterRestart");
    expect(saveSrc).not.toContain("noiseRingOpacityFromLook");
    expect(saveSrc).not.toContain("noiseRingScaleFromLook");
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
