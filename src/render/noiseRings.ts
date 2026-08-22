/**
 * Estado / easing de anillos de ruido en el suelo — headless.
 * La malla Three vive en worldView.spawnNoiseRing / tickNoiseRings.
 */

export interface NoiseRingSpawn {
  x: number;
  y: number;
  /** Radio objetivo en tiles. */
  radius: number;
  kind?: string;
  /** Segundos de vida total. */
  life?: number;
}

export interface NoiseRingState {
  x: number;
  y: number;
  radius: number;
  kind: string;
  age: number;
  life: number;
}

/** Vida visual por defecto (expansión + fade). 0.9775 × 1.15 para leer de noche. */
export const DEFAULT_NOISE_RING_LIFE = 1.124125;

/** Grosor del aro unitario (outer=1). 0.225 × 1.15 para leer de noche. */
export const NOISE_RING_WIDTH = 0.25875;
/** Radio interior del RingGeometry unitario. 0.67425 × 0.87 para leerse de noche. */
export const NOISE_RING_INNER = 0.5865975;

/** Kinds que dibujan anillo (walk spamea — no mostrar). */
export const NOISE_RING_VISIBLE_KINDS = new Set([
  "run",
  "door",
  "loot",
  "barricade",
  "attack",
  "gun",
]);

/**
 * HAS MUERTO / F9 load-muerto: no avanzar anillos ni pintar aros.
 * Vivo (incl. F9 load-vivo): tick/scale/opacity de hoy.
 * Ya vacío = no-op; gameOver no inventa anillo.
 */
export function noiseRingApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

export function shouldShowNoiseRing(kind: string): boolean {
  return NOISE_RING_VISIBLE_KINDS.has(kind);
}

/** Mínima edad (s) del último anillo run antes de spawnear otro. 0.348 × 0.87 para leer de noche. */
export const RUN_NOISE_RING_MIN_AGE = 0.30276;

/** true si no hay anillo previo o ya pasó el cooldown de sprint. */
export function runNoiseRingReady(lastAge: number | null | undefined): boolean {
  return lastAge == null || lastAge >= RUN_NOISE_RING_MIN_AGE;
}

/**
 * R / softReset: kit fresco, nunca sprintó.
 * Game.lastRunRingAgeSec debe coincidir (un sprint <0.3s previo no filtra).
 * F9 load no usa esto — la edad persiste (misma carrera).
 */
export function lastRunRingAgeAfterRestart(): number | null {
  return null;
}

/**
 * ¿Spawnear anillo visual? Walk (y kinds no visibles) no.
 * Run además exige cooldown; door/loot/barricade/attack/gun no se throttlean.
 */
export function shouldSpawnNoiseRing(
  kind: string,
  lastSpawnAgeSec?: number | null,
): boolean {
  if (!shouldShowNoiseRing(kind)) return false;
  if (kind === "run") return runNoiseRingReady(lastSpawnAgeSec);
  return true;
}

export function createNoiseRing(spawn: NoiseRingSpawn): NoiseRingState {
  const life =
    spawn.life != null && Number.isFinite(spawn.life) && spawn.life > 0
      ? spawn.life
      : DEFAULT_NOISE_RING_LIFE;
  const radius =
    spawn.radius != null && Number.isFinite(spawn.radius) && spawn.radius > 0
      ? spawn.radius
      : 1;
  return {
    x: spawn.x,
    y: spawn.y,
    radius,
    kind: spawn.kind ?? "run",
    age: 0,
    life,
  };
}

/** Progress 0..1 = age/life. */
export function ringProgress(r: NoiseRingState): number {
  if (r.life <= 0) return 1;
  if (r.age <= 0) return 0;
  if (r.age >= r.life) return 1;
  return r.age / r.life;
}

/**
 * Avanza age; true si sigue vivo.
 */
export function tickNoiseRing(r: NoiseRingState, dt: number): boolean {
  if (dt > 0) r.age += dt;
  return r.age < r.life;
}

/**
 * Avanza age si aplica; gameOver no muta (skip tick).
 * true si sigue vivo (age < life), igual que tickNoiseRing.
 */
export function applyNoiseRingTick(
  r: NoiseRingState,
  dt: number,
  gameOver = false,
): boolean {
  if (!noiseRingApplies(gameOver)) return r.age < r.life;
  return tickNoiseRing(r, dt);
}

/** Ease-out expand 0→1 (quad). */
export function ringScale(r: NoiseRingState): number {
  const t = ringProgress(r);
  return 1 - (1 - t) * (1 - t);
}

/** Fade lineal 1→0. */
export function ringOpacity(r: NoiseRingState): number {
  return 1 - ringProgress(r);
}

/** Idle ring opacity. Ctor pool opacity 0 = fresco. Mid-life leftover ≠ 0. */
export const NOISE_RING_OPACITY_SPAWN = 0;
/** Idle ring scale. Ctor hidden / age 0 scale 0 = fresco. Mid-life leftover ≠ 0. */
export const NOISE_RING_SCALE_SPAWN = 0;
/** Idle ring count. Ctor pool empty (state null) = fresco. Mid-life count leftover ≠ 0. */
export const NOISE_RING_COUNT_SPAWN = 0;

/**
 * Opacity que lee spawn/tick (look fresco o vivo).
 * leftover mid-life fade ≠ fresco (idle 0).
 */
export function noiseRingOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * Scale que lee spawn/tick (look fresco o vivo).
 * leftover mid-life expand ≠ fresco (idle 0).
 */
export function noiseRingScaleFromLook(scale: number): number {
  return scale;
}

/**
 * Active/visible que lee spawn (look fresco o vivo).
 * leftover mid-life ring ≠ fresco (pool empty).
 */
export function noiseRingActiveFromLook(active: boolean): boolean {
  return active;
}

/**
 * Count del pool activo que nace empty (look fresco o vivo).
 * leftover mid-life count ≠ fresco (0).
 */
export function noiseRingCountFromLook(count: number): number {
  return count;
}

/**
 * R / softReset: opacity fresco (idle 0).
 * WorldView nace mat AfterRestart; leftover mid-life no filtra.
 * spawn/tick lee noiseRingOpacityFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function noiseRingOpacityAfterRestart(): number {
  return noiseRingOpacityFromLook(NOISE_RING_OPACITY_SPAWN);
}

/**
 * R / softReset: scale fresco (idle 0).
 * WorldView nace mesh.scale AfterRestart; leftover mid-life no filtra.
 * spawn/tick lee noiseRingScaleFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function noiseRingScaleAfterRestart(): number {
  return noiseRingScaleFromLook(NOISE_RING_SCALE_SPAWN);
}

/**
 * R / softReset: active fresco (false).
 * leftover mid-life ring no filtra.
 */
export function noiseRingActiveAfterRestart(): boolean {
  return noiseRingActiveFromLook(false);
}

/**
 * R / softReset: count fresco (pool empty).
 * leftover mid-life count no filtra.
 */
export function noiseRingCountAfterRestart(): number {
  return noiseRingCountFromLook(NOISE_RING_COUNT_SPAWN);
}

/** Transparent del noise-ring mesh. Ctor mat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const NOISE_RING_TRANSPARENT = true;

/** Idle noise-ring mesh transparent. Ctor mat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const NOISE_RING_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * spawn/tick no escriben transparent (ctor constant).
 */
export function noiseRingTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace mat.transparent AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function noiseRingTransparentAfterRestart(): boolean {
  return noiseRingTransparentFromLook(NOISE_RING_TRANSPARENT_SPAWN);
}

/** DepthWrite del noise-ring mesh. Ctor mat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const NOISE_RING_DEPTH_WRITE = false;

/** Idle noise-ring mesh depthWrite. Ctor mat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const NOISE_RING_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * spawn/tick no escriben depthWrite (ctor constant).
 */
export function noiseRingDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace mat.depthWrite AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escriben depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function noiseRingDepthWriteAfterRestart(): boolean {
  return noiseRingDepthWriteFromLook(NOISE_RING_DEPTH_WRITE_SPAWN);
}

/** Ámbar door/loot. 0xe8b060 × 1.15/canal (r clamp) para leer de noche. */
export const NOISE_RING_AMBER = 0xffca6e;

/** Rojo/naranja attack/gun/barricade. 0xff6030 × 1.15/canal (r clamp) para leer de noche. */
export const NOISE_RING_COMBAT = 0xff6e37;

/** Blanco walk/run/default. 0xe8e8f0 × 1.15/canal (all clamp) para leer de noche. */
export const NOISE_RING_RUN = 0xffffff;

/** Color hex por kind (feedback jugable). */
export function ringColorHex(kind: string): number {
  switch (kind) {
    case "door":
    case "loot":
      return NOISE_RING_AMBER;
    case "attack":
    case "gun":
    case "barricade":
      return NOISE_RING_COMBAT;
    case "walk":
    case "run":
    default:
      return NOISE_RING_RUN;
  }
}
