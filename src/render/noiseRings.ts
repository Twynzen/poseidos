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

/** Vida visual por defecto (expansión + fade). */
export const DEFAULT_NOISE_RING_LIFE = 0.9775;

/** Grosor del aro unitario (outer=1). 0.18 × 1.25 para leer de noche. */
export const NOISE_RING_WIDTH = 0.225;
/** Radio interior del RingGeometry unitario. */
export const NOISE_RING_INNER = 1 - NOISE_RING_WIDTH;

/** Kinds que dibujan anillo (walk spamea — no mostrar). */
export const NOISE_RING_VISIBLE_KINDS = new Set([
  "run",
  "door",
  "loot",
  "barricade",
  "attack",
  "gun",
]);

export function shouldShowNoiseRing(kind: string): boolean {
  return NOISE_RING_VISIBLE_KINDS.has(kind);
}

/** Mínima edad (s) del último anillo run antes de spawnear otro. */
export const RUN_NOISE_RING_MIN_AGE = 0.4;

/** true si no hay anillo previo o ya pasó el cooldown de sprint. */
export function runNoiseRingReady(lastAge: number | null | undefined): boolean {
  return lastAge == null || lastAge >= RUN_NOISE_RING_MIN_AGE;
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

/** Ease-out expand 0→1 (quad). */
export function ringScale(r: NoiseRingState): number {
  const t = ringProgress(r);
  return 1 - (1 - t) * (1 - t);
}

/** Fade lineal 1→0. */
export function ringOpacity(r: NoiseRingState): number {
  return 1 - ringProgress(r);
}

/** Color hex por kind (feedback jugable). */
export function ringColorHex(kind: string): number {
  switch (kind) {
    case "door":
    case "loot":
      return 0xe8b060; // ámbar
    case "attack":
    case "gun":
    case "barricade":
      return 0xff6030; // rojo/naranja
    case "walk":
    case "run":
    default:
      return 0xe8e8f0; // blanco suave
  }
}
