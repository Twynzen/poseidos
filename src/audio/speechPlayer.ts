/**
 * Possessed speech WebAudio SFX — one-shot 240Hz sine + 480Hz harmonic.
 * Headless: `shouldPlaySpeechSfx` / `speechBeepSpec` sin AudioContext.
 * Browser: AudioContext lazy (solo al primer play audible). Mute → no-op.
 */

export type SpeechBeepSpec = {
  hz: number;
  harmonicHz: number;
  type: OscillatorType;
  durationSec: number;
  gain: number;
};

export type SpeechPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
};

const SPEC: SpeechBeepSpec = {
  hz: 240,
  harmonicHz: 480,
  type: "sine",
  durationSec: 0.12,
  gain: 0.07,
};

/** Gain del armónico relativo al fundamental (misma envelope). */
const HARMONIC_GAIN_RATIO = 0.45;

/**
 * Spec determinista. Headless — sin audio.
 */
export function speechBeepSpec(): SpeechBeepSpec {
  return SPEC;
}

/**
 * Mute → no reproduce. Headless / determinista — sin audio.
 */
export function shouldPlaySpeechSfx(muted: boolean): boolean {
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
export function createSpeechPlayer(): SpeechPlayer {
  return { ctx: null };
}

function ensureCtx(player: SpeechPlayer): AudioContext | null {
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

function playBeep(ctx: AudioContext, spec: SpeechBeepSpec): void {
  const t0 = ctx.currentTime;
  const stopAt = t0 + spec.durationSec + 0.01;

  const master = ctx.createGain();
  master.gain.setValueAtTime(spec.gain, t0);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.durationSec);
  master.connect(ctx.destination);

  const fund = ctx.createOscillator();
  fund.type = spec.type;
  fund.frequency.setValueAtTime(spec.hz, t0);
  fund.connect(master);
  fund.start(t0);
  fund.stop(stopAt);

  const harmGain = ctx.createGain();
  harmGain.gain.setValueAtTime(HARMONIC_GAIN_RATIO, t0);
  const harm = ctx.createOscillator();
  harm.type = spec.type;
  harm.frequency.setValueAtTime(spec.harmonicHz, t0);
  harm.connect(harmGain);
  harmGain.connect(master);
  harm.start(t0);
  harm.stop(stopAt);
}

/** 240Hz sine + 480Hz harmonic, 120ms, gain ~0.07. Mute → no-op (no abre ctx). */
export function playSpeech(player: SpeechPlayer, muted: boolean): void {
  if (!shouldPlaySpeechSfx(muted)) return;
  const ctx = ensureCtx(player);
  if (!ctx) return;
  try {
    playBeep(ctx, speechBeepSpec());
  } catch {
    // Autoplay / context cerrado — silencioso.
  }
}
