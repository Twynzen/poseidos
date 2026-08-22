/**
 * Low-HP heartbeat WebAudio SFX — one-shot ~55Hz sine.
 * Headless: `shouldPlayHeartbeatSfx` / `heartbeatBeepSpec` sin AudioContext.
 * Browser: AudioContext lazy (solo al primer play audible). Mute → no-op.
 */

export type HeartbeatBeepSpec = {
  hz: number;
  type: OscillatorType;
  durationSec: number;
  gain: number;
};

export type HeartbeatVoice = {
  osc: OscillatorNode | null;
  gain: GainNode | null;
};

export type HeartbeatPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
  /** One-shots scheduled. Vacío al boot / tras R. */
  voices: HeartbeatVoice[];
};

const SPEC: HeartbeatBeepSpec = {
  hz: 55,
  type: "sine",
  durationSec: 0.08,
  gain: 0.08,
};

/**
 * Spec determinista. Headless — sin audio.
 */
export function heartbeatBeepSpec(): HeartbeatBeepSpec {
  return SPEC;
}

/**
 * Mute → no reproduce. Headless / determinista — sin audio.
 */
export function shouldPlayHeartbeatSfx(muted: boolean): boolean {
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
export function createHeartbeatPlayer(): HeartbeatPlayer {
  return { ctx: null, voices: [] };
}

/**
 * R / softReset: scheduled vacío (boot). Mute se queda (vive en ambient).
 * Game.heartbeatPlayer debe coincidir (sine leftover no suena en el barrio nuevo).
 * F9 load no usa esto — el player persiste (misma carrera).
 */
export function heartbeatBeepsAfterRestart(): number {
  return 0;
}

/** Beeps scheduled (headless / leftover). */
export function heartbeatPlayerScheduled(player: HeartbeatPlayer): number {
  return player.voices.length;
}

function snapStopVoice(voice: HeartbeatVoice, currentTime: number): void {
  const gain = voice.gain;
  if (gain) {
    const param = gain.gain;
    try {
      param.cancelScheduledValues(currentTime);
      param.setValueAtTime(0, currentTime);
    } catch {
      // mock / context cerrado
    }
    param.value = 0;
    try {
      gain.disconnect();
    } catch {
      // ya desconectado
    }
  }
  const osc = voice.osc;
  if (osc) {
    try {
      osc.stop(currentTime);
    } catch {
      // ya parado
    }
    try {
      osc.disconnect();
    } catch {
      // ya desconectado
    }
  }
  voice.osc = null;
  voice.gain = null;
}

/**
 * R / softReset: corta / cancela osc scheduled. Mute se queda (vive en ambient).
 * Sin voices (lazy/headless vacío) = no-op. F9 load no usa esto.
 */
export function resetHeartbeatPlayerAfterRestart(player: HeartbeatPlayer): void {
  const t = player.ctx?.currentTime ?? 0;
  for (const voice of player.voices) {
    snapStopVoice(voice, t);
  }
  player.voices = [];
}

function ensureCtx(player: HeartbeatPlayer): AudioContext | null {
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

function startBeep(
  player: HeartbeatPlayer,
  voice: HeartbeatVoice,
  ctx: AudioContext,
  spec: HeartbeatBeepSpec,
): void {
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.hz, t0);
  gain.gain.setValueAtTime(spec.gain, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + spec.durationSec + 0.01);
  voice.osc = osc;
  voice.gain = gain;
  osc.onended = () => {
    const i = player.voices.indexOf(voice);
    if (i >= 0) player.voices.splice(i, 1);
  };
}

/** ~55Hz sine 80ms, gain 0.08. Mute → no-op (no abre ctx). */
export function playHeartbeat(player: HeartbeatPlayer, muted: boolean): void {
  if (!shouldPlayHeartbeatSfx(muted)) return;
  const voice: HeartbeatVoice = { osc: null, gain: null };
  const ctx = ensureCtx(player);
  if (ctx) {
    try {
      startBeep(player, voice, ctx, heartbeatBeepSpec());
    } catch {
      // Autoplay / context cerrado — silencioso.
    }
  }
  player.voices.push(voice);
}
