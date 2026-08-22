/**
 * Combat WebAudio SFX — beeps one-shot (melee / hit / gun / dry).
 * Headless: `shouldPlayCombatSfx` / `combatBeepSpec` sin AudioContext.
 * Browser: AudioContext lazy (solo al primer play audible). Mute → no-op.
 */

export type CombatSfxKind = "melee" | "hit" | "gun" | "dry";

export type CombatBeepSpec = {
  hz: number;
  type: OscillatorType;
  durationSec: number;
  gain: number;
};

export type CombatVoice = {
  kind: CombatSfxKind;
  osc: OscillatorNode | null;
  gain: GainNode | null;
};

export type CombatPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
  /** One-shots scheduled. Vacío al boot / tras R. */
  voices: CombatVoice[];
};

const SPECS: Record<CombatSfxKind, CombatBeepSpec> = {
  melee: { hz: 200, type: "square", durationSec: 0.08, gain: 0.09 },
  hit: { hz: 90, type: "triangle", durationSec: 0.1, gain: 0.09 },
  gun: { hz: 400, type: "sawtooth", durationSec: 0.06, gain: 0.09 },
  dry: { hz: 1100, type: "square", durationSec: 0.035, gain: 0.06 },
};

/**
 * Spec determinista por kind. Headless — sin audio.
 */
export function combatBeepSpec(kind: CombatSfxKind): CombatBeepSpec {
  return SPECS[kind];
}

/**
 * Mute → no reproduce. Headless / determinista — sin audio.
 */
export function shouldPlayCombatSfx(muted: boolean): boolean {
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
export function createCombatPlayer(): CombatPlayer {
  return { ctx: null, voices: [] };
}

/**
 * R / softReset: scheduled vacío (boot). Mute se queda (vive en ambient).
 * Game.combatPlayer debe coincidir (hit/gun/melee leftover no suena en el barrio nuevo).
 * F9 load no usa esto — el player persiste (misma carrera).
 */
export function combatBeepsAfterRestart(): CombatSfxKind[] {
  return [];
}

/** Kinds scheduled (headless / leftover). */
export function combatPlayerScheduled(player: CombatPlayer): CombatSfxKind[] {
  return player.voices.map((v) => v.kind);
}

function snapStopVoice(voice: CombatVoice, currentTime: number): void {
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
export function resetCombatPlayerAfterRestart(player: CombatPlayer): void {
  const t = player.ctx?.currentTime ?? 0;
  for (const voice of player.voices) {
    snapStopVoice(voice, t);
  }
  player.voices = [];
}

function ensureCtx(player: CombatPlayer): AudioContext | null {
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
  player: CombatPlayer,
  voice: CombatVoice,
  ctx: AudioContext,
  spec: CombatBeepSpec,
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

function playKind(
  player: CombatPlayer,
  kind: CombatSfxKind,
  muted: boolean,
): void {
  if (!shouldPlayCombatSfx(muted)) return;
  const voice: CombatVoice = { kind, osc: null, gain: null };
  const ctx = ensureCtx(player);
  if (ctx) {
    try {
      startBeep(player, voice, ctx, combatBeepSpec(kind));
    } catch {
      // Autoplay / context cerrado — silencioso.
    }
  }
  player.voices.push(voice);
}

/** 200Hz square 80ms, gain 0.09. Mute → no-op (no abre ctx). */
export function playMelee(player: CombatPlayer, muted: boolean): void {
  playKind(player, "melee", muted);
}

/** 90Hz triangle 100ms, gain 0.09. Mute → no-op (no abre ctx). */
export function playHit(player: CombatPlayer, muted: boolean): void {
  playKind(player, "hit", muted);
}

/** 400Hz saw 60ms, gain 0.09. Mute → no-op (no abre ctx). */
export function playGun(player: CombatPlayer, muted: boolean): void {
  playKind(player, "gun", muted);
}

/** 1100Hz square 35ms, gain 0.06. Mute → no-op (no abre ctx). */
export function playDryFire(player: CombatPlayer, muted: boolean): void {
  playKind(player, "dry", muted);
}
