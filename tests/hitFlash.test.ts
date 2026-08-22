import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  HIT_FLASH_PEAK,
  HIT_FLASH_DECAY_PER_SEC,
  createHitFlash,
  triggerHitFlash,
  tickHitFlash,
  hitFlashOverlayOpacity,
} from "../src/ui/hitFlash";

describe("#hit-flash CSS", () => {
  test("#hit-flash edge stop is 0.62", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/#hit-flash\s*\{[^}]*rgba\(120,\s*0,\s*8,\s*0\.62\)/s);
  });
});

describe("constantes", () => {
  test("peak y decay fijos", () => {
    expect(HIT_FLASH_PEAK).toBe(0.65);
    expect(HIT_FLASH_DECAY_PER_SEC).toBe(2.5);
  });
});

describe("createHitFlash", () => {
  test("empieza en 0", () => {
    expect(createHitFlash().intensity).toBe(0);
  });
});

describe("triggerHitFlash", () => {
  test("strength 1 → intensity 1 (toque hostil)", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    expect(f.intensity).toBe(1);
  });

  test("default strength = 1", () => {
    const f = createHitFlash();
    triggerHitFlash(f);
    expect(f.intensity).toBe(1);
  });

  test("strength parcial (needs DPS scaled)", () => {
    const f = createHitFlash();
    triggerHitFlash(f, Math.min(1, 0.04 * 5));
    expect(f.intensity).toBeCloseTo(0.2, 10);
  });

  test("no baja un flash en curso (max)", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    triggerHitFlash(f, 0.2);
    expect(f.intensity).toBe(1);
  });

  test("clamp 0–1", () => {
    const hi = createHitFlash();
    triggerHitFlash(hi, 4);
    expect(hi.intensity).toBe(1);

    const lo = createHitFlash();
    triggerHitFlash(lo, -2);
    expect(lo.intensity).toBe(0);
  });

  test("NaN / Inf no rompe", () => {
    const f = createHitFlash();
    triggerHitFlash(f, Number.NaN);
    expect(f.intensity).toBe(0);
    triggerHitFlash(f, Number.POSITIVE_INFINITY);
    expect(f.intensity).toBe(0);
  });
});

describe("tickHitFlash", () => {
  test("decae HIT_FLASH_DECAY_PER_SEC por segundo", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    tickHitFlash(f, 0.2);
    expect(f.intensity).toBeCloseTo(1 - HIT_FLASH_DECAY_PER_SEC * 0.2, 10);
  });

  test("dt <= 0 no avanza", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    tickHitFlash(f, 0);
    tickHitFlash(f, -1);
    expect(f.intensity).toBe(1);
  });

  test("llega a 0 y no baja de 0", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    tickHitFlash(f, 1);
    expect(f.intensity).toBe(0);
    tickHitFlash(f, 1);
    expect(f.intensity).toBe(0);
  });

  test("opacity de pico = intensity * HIT_FLASH_PEAK", () => {
    const f = createHitFlash();
    triggerHitFlash(f, 1);
    expect(f.intensity * HIT_FLASH_PEAK).toBeCloseTo(HIT_FLASH_PEAK, 10);
    tickHitFlash(f, 0.1);
    expect(f.intensity * HIT_FLASH_PEAK).toBeCloseTo(
      (1 - HIT_FLASH_DECAY_PER_SEC * 0.1) * HIT_FLASH_PEAK,
      10,
    );
  });

  test("determinista entre dos flashes", () => {
    const a = createHitFlash();
    const b = createHitFlash();
    triggerHitFlash(a, 0.8);
    triggerHitFlash(b, 0.8);
    for (let i = 0; i < 12; i++) {
      tickHitFlash(a, 1 / 60);
      tickHitFlash(b, 1 / 60);
    }
    expect(a.intensity).toBe(b.intensity);
  });
});

describe("hitFlashOverlayOpacity (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte con flash activo: overlay hidden; ya vacío no-op; load-muerto hidden; vivo/load-vivo pinta", () => {
    const flash = createHitFlash();
    triggerHitFlash(flash, 1);
    expect(flash.intensity).toBe(1);

    const deadOpen = hitFlashOverlayOpacity(true, flash.intensity);
    expect(deadOpen).toBe(0);

    const alreadyEmpty = hitFlashOverlayOpacity(true, 0);
    expect(alreadyEmpty).toBe(0);
    expect(hitFlashOverlayOpacity(true, createHitFlash().intensity)).toBe(0);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(hitFlashOverlayOpacity(deadRt.gameOver, flash.intensity)).toBe(0);
    expect(hitFlashOverlayOpacity(deadRt.gameOver, 0)).toBe(0);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(hitFlashOverlayOpacity(liveRt.gameOver, flash.intensity)).toBeCloseTo(
      HIT_FLASH_PEAK,
      10,
    );

    expect(hitFlashOverlayOpacity(false, 1)).toBeCloseTo(HIT_FLASH_PEAK, 10);
    expect(hitFlashOverlayOpacity(false, 0)).toBe(0);
    expect(hitFlashOverlayOpacity(false, 0.4)).toBeCloseTo(
      0.4 * HIT_FLASH_PEAK,
      10,
    );
  });

  test("gameOver oculta; intensity sigue decayendo (R / load-vivo igual que hoy)", () => {
    const flash = createHitFlash();
    triggerHitFlash(flash, 1);
    expect(hitFlashOverlayOpacity(true, flash.intensity)).toBe(0);
    tickHitFlash(flash, 0.2);
    expect(flash.intensity).toBeCloseTo(1 - HIT_FLASH_DECAY_PER_SEC * 0.2, 10);
    expect(hitFlashOverlayOpacity(true, flash.intensity)).toBe(0);
    expect(hitFlashOverlayOpacity(false, flash.intensity)).toBeCloseTo(
      flash.intensity * HIT_FLASH_PEAK,
      10,
    );
  });

  test("Game syncHitFlashOverlay usa hitFlashOverlayOpacity(gameOver); freeze y F9 load-muerto siguen sync", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("hitFlashOverlayOpacity(");
    expect(src).toMatch(
      /syncHitFlashOverlay\(\): void \{[\s\S]{0,280}hitFlashOverlayOpacity\(\s*this\.gameOver/,
    );
    expect(src).not.toMatch(
      /syncHitFlashOverlay\(\): void \{[\s\S]{0,280}this\.hitFlash\.intensity\s*\*\s*HIT_FLASH_PEAK/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,500}this\.syncHitFlashOverlay\(\)/,
    );
    expect(src).toMatch(
      /this\.syncNoiseRingOverlay\(dt\);\s*this\.tickHitFlashOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}this\.tickHitFlashOverlay\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
  });
});
