/**
 * Footsteps WebAudio player — beeps de oscilador en cada paso (floor de phase).
 * Headless: `shouldEmitFootstep` sin AudioContext. Browser: no-op sin `window`.
 */

import {
  footstepsLevel,
  type FootstepsBus,
} from "./footstepsStub";

/** Hz caminata / sprint (beep corto). */
const WALK_HZ = 180;
const SPRINT_HZ = 240;
/** Duración del beep (s). */
const BEEP_SEC = 0.045;
/** Gain pico (pre-mute ya filtrado). */
const BEEP_GAIN = 0.07;

export type FootstepPlayer = {
  /** null fuera de browser o si AudioContext no existe. */
  ctx: AudioContext | null;
  /** Última phase vista (para detectar floor cross). */
  prevPhase: number;
};

export type FootstepPlayerSync = {
  /** Si se pasa, sprint → Hz más alto. */
  sprint?: boolean;
};

/**
 * Emite paso cuando `phase` cruza un entero (floor).
 * Headless / determinista — sin audio.
 */
export function shouldEmitFootstep(prevPhase: number, phase: number): boolean {
  if (!Number.isFinite(prevPhase) || !Number.isFinite(phase)) return false;
  if (phase <= prevPhase) return false;
  return Math.floor(phase) > Math.floor(prevPhase);
}

function tryCreateAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  try {
    return new AC();
  } catch {
    return null;
  }
}

/** Crea player; sin `window` → stub (ctx null). */
export function createFootstepPlayer(): FootstepPlayer {
  return {
    ctx: tryCreateAudioContext(),
    prevPhase: 0,
  };
}

function playBeep(ctx: AudioContext, hz: number, level: number): void {
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(hz, t0);
  const peak = Math.max(0.0001, BEEP_GAIN * Math.min(1, Math.max(0, level)));
  gain.gain.setValueAtTime(peak, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + BEEP_SEC);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + BEEP_SEC + 0.01);
}

/**
 * Sincroniza player con el bus tras `tickFootsteps`.
 * Respeta mute (`footstepsLevel` → 0). Sin AudioContext → solo avanza prevPhase.
 */
export function syncFootstepPlayer(
  player: FootstepPlayer,
  bus: FootstepsBus,
  sync: FootstepPlayerSync = {},
): void {
  const emit = shouldEmitFootstep(player.prevPhase, bus.phase);
  player.prevPhase = bus.phase;
  if (!emit) return;

  const level = footstepsLevel(bus);
  if (level <= 0 || bus.muted) return;

  const ctx = player.ctx;
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }

  const hz = sync.sprint ? SPRINT_HZ : WALK_HZ;
  try {
    playBeep(ctx, hz, level);
  } catch {
    // Autoplay / context cerrado — silencioso.
  }
}
