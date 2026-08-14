/**
 * Camera shake al toque hostil — headless.
 * worldView aplica offsetX/offsetZ a camera.position; lookAt queda en el player.
 * Envelope: sine decay (1−t)·sin(2π t) en CAMERA_SHAKE_DURATION, amp 0.125.
 * Dirección XZ unitaria vía RNG inyectable en trigger (tests deterministas).
 */

/** Duración del shake (s). */
export const CAMERA_SHAKE_DURATION = 0.2;
/** Amplitud pico (unidades mundo, ejes XZ). 0.1 × 1.25 para leer de noche. */
export const CAMERA_SHAKE_AMP = 0.125;

export interface CameraShakeState {
  /** Segundos transcurridos del shake actual. */
  age: number;
  /** True mientras el shake no ha terminado. */
  active: boolean;
  /** Dirección XZ unitaria (cos θ, sin θ) fijada al trigger. */
  dirX: number;
  dirZ: number;
}

export interface CameraShakeOutput {
  offsetX: number;
  offsetZ: number;
  active: boolean;
}

export function createCameraShakeState(): CameraShakeState {
  return { age: 0, active: false, dirX: 1, dirZ: 0 };
}

function unitFromRng(rng: () => number): { dirX: number; dirZ: number } {
  const raw = rng();
  const u = Number.isFinite(raw) ? raw : 0;
  const angle = u * Math.PI * 2;
  return { dirX: Math.cos(angle), dirZ: Math.sin(angle) };
}

/**
 * Reinicia el shake desde t=0 (re-trigger a mitad = nuevo golpe).
 * `rng` → [0,1) elige el ángulo XZ; default Math.random.
 */
export function triggerCameraShake(
  state: CameraShakeState,
  rng: () => number = Math.random,
): void {
  const dir = unitFromRng(rng);
  state.age = 0;
  state.active = true;
  state.dirX = dir.dirX;
  state.dirZ = dir.dirZ;
}

/**
 * Avanza el shake y devuelve offsets puros (deterministas dado dir + age).
 * Mutates `state`. dt≤0 no avanza age.
 * mag = AMP · (1−t) · sin(2π t) a lo largo de (dirX, dirZ).
 */
export function tickCameraShake(
  state: CameraShakeState,
  dt: number,
): CameraShakeOutput {
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (state.active) {
    state.age += safeDt;
    if (state.age >= CAMERA_SHAKE_DURATION) {
      state.age = CAMERA_SHAKE_DURATION;
      state.active = false;
      return { offsetX: 0, offsetZ: 0, active: false };
    }
  }
  if (!state.active) {
    return { offsetX: 0, offsetZ: 0, active: false };
  }

  const t = state.age / CAMERA_SHAKE_DURATION;
  const decay = 1 - t;
  const wave = Math.sin(t * Math.PI * 2);
  const mag = CAMERA_SHAKE_AMP * decay * wave;
  return {
    offsetX: mag * state.dirX,
    offsetZ: mag * state.dirZ,
    active: true,
  };
}
