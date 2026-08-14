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
