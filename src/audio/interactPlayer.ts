/**
 * Interact WebAudio SFX — beeps one-shot (door / loot / use).
 * Headless: `shouldPlayInteractSfx` / `interactBeepSpec` sin AudioContext.
 * Browser: AudioContext lazy (solo al primer play audible). Mute → no-op.
 */

export type InteractSfxKind = "door" | "loot" | "use";

export type InteractBeepSpec = {
  hz: number;
  type: OscillatorType;
  durationSec: number;
};

export type InteractPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
};

/** Gain pico (pre-mute ya filtrado). */
const BEEP_GAIN = 0.09;

const SPECS: Record<InteractSfxKind, InteractBeepSpec> = {
  door: { hz: 140, type: "square", durationSec: 0.09 },
  loot: { hz: 520, type: "sine", durationSec: 0.07 },
  use: { hz: 300, type: "triangle", durationSec: 0.08 },
};

/**
 * Spec determinista por kind. Headless — sin audio.
 */
export function interactBeepSpec(kind: InteractSfxKind): InteractBeepSpec {
  return SPECS[kind];
}

/**
 * Mute → no reproduce. Headless / determinista — sin audio.
 */
export function shouldPlayInteractSfx(muted: boolean): boolean {
  return !muted;
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

/** Crea player stub; no abre AudioContext (lazy en play). */
export function createInteractPlayer(): InteractPlayer {
  return { ctx: null };
}

function ensureCtx(player: InteractPlayer): AudioContext | null {
  if (!player.ctx) {
    player.ctx = tryCreateAudioContext();
  }
  const ctx = player.ctx;
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  return ctx;
}

function playBeep(ctx: AudioContext, spec: InteractBeepSpec): void {
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.hz, t0);
  gain.gain.setValueAtTime(BEEP_GAIN, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + spec.durationSec + 0.01);
}

function playInteractSfx(
  player: InteractPlayer,
  kind: InteractSfxKind,
  muted: boolean,
): void {
  if (!shouldPlayInteractSfx(muted)) return;
  const ctx = ensureCtx(player);
  if (!ctx) return;
  try {
    playBeep(ctx, interactBeepSpec(kind));
  } catch {
    // Autoplay / context cerrado — silencioso.
  }
}

/** 140Hz square 90ms. Mute → no-op (no abre ctx). */
export function playDoor(player: InteractPlayer, muted: boolean): void {
  playInteractSfx(player, "door", muted);
}

/** 520Hz sine 70ms. Mute → no-op (no abre ctx). */
export function playLoot(player: InteractPlayer, muted: boolean): void {
  playInteractSfx(player, "loot", muted);
}

/** 300Hz triangle 80ms. Mute → no-op (no abre ctx). */
export function playUse(player: InteractPlayer, muted: boolean): void {
  playInteractSfx(player, "use", muted);
}
