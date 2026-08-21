/**
 * Flash rojo de daño (vignette HUD) — headless.
 * Overlay `#hit-flash` en index.html; game.ts sincroniza opacity cada frame.
 */

export const HIT_FLASH_PEAK = 0.65;
export const HIT_FLASH_DECAY_PER_SEC = 2.5;

export type HitFlash = {
  /** 0–1. Opacity CSS = intensity * HIT_FLASH_PEAK. */
  intensity: number;
};

export function createHitFlash(): HitFlash {
  return { intensity: 0 };
}

/**
 * Sube intensity a max(actual, strength clamp 0–1).
 * No baja un flash en curso (toque fuerte gana a DPS needs).
 */
export function triggerHitFlash(flash: HitFlash, strength = 1): void {
  const s = Number.isFinite(strength) ? Math.max(0, Math.min(1, strength)) : 0;
  if (s > flash.intensity) flash.intensity = s;
}

/** Decae lineal; dt <= 0 o no finito es no-op. */
export function tickHitFlash(flash: HitFlash, dt: number): void {
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (safeDt === 0 || flash.intensity <= 0) {
    if (flash.intensity < 0) flash.intensity = 0;
    return;
  }
  flash.intensity = Math.max(0, flash.intensity - HIT_FLASH_DECAY_PER_SEC * safeDt);
}

/**
 * HAS MUERTO / F9 load-muerto: no pintar flash rojo encima.
 * Vivo (incl. F9 load-vivo): intensity × peak, igual que hoy.
 * Ya vacío (intensity 0) = 0; gameOver no inventa flash.
 */
export function hitFlashOverlayOpacity(
  gameOver: boolean,
  intensity: number,
): number {
  if (gameOver) return 0;
  return intensity * HIT_FLASH_PEAK;
}
