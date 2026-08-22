/**
 * Ambient sound stub headless — niveles 0–1 por capa, sin assets ni AudioContext.
 * WebAudio opcional vive aparte (browserAmbient); tests solo tocan este core.
 */

export type AmbientLayer = "rain" | "night" | "indoor" | "threat";

export type AmbientLevels = Record<AmbientLayer, number>;

export type AmbientState = {
  raining: boolean;
  isNight: boolean;
  indoor: boolean;
  threatNearby: boolean;
  muted?: boolean;
};

export type AmbientBus = {
  muted: boolean;
  /** Niveles suavizados (pre-mute). */
  levels: AmbientLevels;
  /** Fase del pulso de amenaza (radianes). */
  threatPhase: number;
};

const LAYERS: readonly AmbientLayer[] = ["rain", "night", "indoor", "threat"];

/**
 * HAS MUERTO / F9 load-muerto: no avanzar threatPhase ni lerp rain/night/indoor.
 * Vivo (incl. F9 load-vivo): tick/dt de hoy.
 * No mutea; solo gate de dt. gameOver no inventa mute.
 */
export function ambientTickApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** Velocidad de fade hacia targets (~4 → settle ~1s). */
const LERP_RATE = 4;

export function createAmbientBus(muted = false): AmbientBus {
  return {
    muted,
    levels: { rain: 0, night: 0, indoor: 0, threat: 0 },
    threatPhase: 0,
  };
}

/**
 * R / softReset: mix fresco (threatPhase 0, levels 0). Mute se queda.
 * Game.ambient debe coincidir (night/indoor/threat de la vida anterior no filtra).
 * F9 load no usa esto — el mix persiste (misma carrera).
 */
export function resetAmbientAfterRestart(bus: AmbientBus): void {
  const fresh = createAmbientBus(bus.muted);
  bus.threatPhase = fresh.threatPhase;
  bus.levels = { ...fresh.levels };
}

/** Targets lógicos 0–1 a partir del estado de mundo (sin suavizado). */
export function ambientTargets(state: AmbientState, threatPhase = 0): AmbientLevels {
  const rain = state.raining
    ? state.indoor
      ? 0.22
      : 0.9
    : 0;
  const night = state.isNight
    ? state.indoor
      ? 0.12
      : 0.45
    : 0;
  const indoor = state.indoor ? 0.4 : 0;
  const threat = state.threatNearby
    ? 0.55 + 0.25 * Math.sin(threatPhase)
    : 0;
  return { rain, night, indoor, threat };
}

/**
 * Avanza capas hacia targets. Determinista (sin RNG).
 * `state.muted` sincroniza el flag del bus si se pasa.
 * gameOver → dt 0 (congela threatPhase / lerp; no mutea).
 */
export function tickAmbient(
  bus: AmbientBus,
  state: AmbientState,
  dt: number,
  gameOver = false,
): void {
  if (state.muted !== undefined) bus.muted = state.muted;
  if (!ambientTickApplies(gameOver)) dt = 0;
  if (dt < 0) dt = 0;

  if (state.threatNearby) {
    bus.threatPhase += dt * 2.4;
  }

  const targets = ambientTargets(state, bus.threatPhase);
  const k = dt <= 0 ? 0 : 1 - Math.exp(-dt * LERP_RATE);
  for (const layer of LAYERS) {
    const cur = bus.levels[layer];
    const next = cur + (targets[layer] - cur) * k;
    bus.levels[layer] =
      Math.abs(next - targets[layer]) < 0.002 ? targets[layer] : next;
  }
}

/** Niveles audibles: todo 0 si muted. */
export function ambientLevels(bus: AmbientBus): AmbientLevels {
  if (bus.muted) {
    return { rain: 0, night: 0, indoor: 0, threat: 0 };
  }
  return {
    rain: bus.levels.rain,
    night: bus.levels.night,
    indoor: bus.levels.indoor,
    threat: bus.levels.threat,
  };
}

/** Copy HUD de M mute (reusa el token de describeAmbient). */
export const MUTE_HUD_MSG = "mute";
/** Copy HUD de M unmute. */
export const SOUND_HUD_MSG = "sonido";

/** lastLootMsg de M según el estado nuevo (muted → mute, no muted → sonido). */
export function muteHudMsg(muted: boolean): string {
  return muted ? MUTE_HUD_MSG : SOUND_HUD_MSG;
}

/**
 * Hint compacto HUD: "mute" | "lluvia♪" | "♪" | null (silencio).
 */
export function describeAmbient(bus: AmbientBus): string | null {
  if (bus.muted) return MUTE_HUD_MSG;
  const L = ambientLevels(bus);
  if (L.rain >= 0.35) return "lluvia♪";
  if (L.threat >= 0.2 || L.night >= 0.12 || L.indoor >= 0.15) return "♪";
  return null;
}

export function toggleAmbientMute(bus: AmbientBus): boolean {
  bus.muted = !bus.muted;
  return bus.muted;
}
