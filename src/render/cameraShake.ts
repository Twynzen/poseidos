/**
 * Camera shake al toque hostil — headless.
 * worldView aplica offsetX/offsetZ a camera.position; lookAt queda en el player.
 * Envelope: sine decay (1−t)·sin(2π t · FREQ/42) en CAMERA_SHAKE_DURATION, amp 0.14375.
 * Dirección XZ unitaria vía RNG inyectable en trigger (tests deterministas).
 */

/** Duración del shake (s). 0.23 × 1.15 para leer de noche. */
export const CAMERA_SHAKE_DURATION = 0.2645;
/** Amplitud pico (unidades mundo, ejes XZ). 0.125 × 1.15 para leer de noche. */
export const CAMERA_SHAKE_AMP = 0.14375;
/** Frecuencia del sine (base 42 = 1 ciclo). 48.3 × 1.15 para leer de noche. */
export const CAMERA_SHAKE_FREQ = 55.545;

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

/**
 * HAS MUERTO / F9 load-muerto: no avanzar el shake ni aplicar offset.
 * Vivo (incl. F9 load-vivo): tick/offset de hoy.
 * Ya en reposo = no-op; gameOver no inventa shake.
 */
export function cameraShakeApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
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
 * mag = AMP · (1−t) · sin(2π t · FREQ/42) a lo largo de (dirX, dirZ).
 * gameOver → skip tick / zero offset; no inventa shake.
 */
export function tickCameraShake(
  state: CameraShakeState,
  dt: number,
  gameOver = false,
): CameraShakeOutput {
  if (!cameraShakeApplies(gameOver)) {
    return { offsetX: 0, offsetZ: 0, active: false };
  }
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
  const wave = Math.sin(t * Math.PI * 2 * (CAMERA_SHAKE_FREQ / 42));
  const mag = CAMERA_SHAKE_AMP * decay * wave;
  return {
    offsetX: mag * state.dirX,
    offsetZ: mag * state.dirZ,
    active: true,
  };
}
