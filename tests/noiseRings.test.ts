import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  DEFAULT_NOISE_RING_LIFE,
  NOISE_RING_AMBER,
  NOISE_RING_COMBAT,
  NOISE_RING_INNER,
  NOISE_RING_RUN,
  NOISE_RING_WIDTH,
  RUN_NOISE_RING_MIN_AGE,
  applyNoiseRingTick,
  createNoiseRing,
  noiseRingApplies,
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
