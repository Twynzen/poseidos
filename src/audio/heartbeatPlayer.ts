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

export type HeartbeatPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
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
  return { ctx: null };
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

function playBeep(ctx: AudioContext, spec: HeartbeatBeepSpec): void {
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
}

/** ~55Hz sine 80ms, gain 0.08. Mute → no-op (no abre ctx). */
export function playHeartbeat(player: HeartbeatPlayer, muted: boolean): void {
  if (!shouldPlayHeartbeatSfx(muted)) return;
  const ctx = ensureCtx(player);
  if (!ctx) return;
  try {
    playBeep(ctx, heartbeatBeepSpec());
  } catch {
    // Autoplay / context cerrado — silencioso.
  }
}
