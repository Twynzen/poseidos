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

export type InteractVoice = {
  kind: InteractSfxKind;
  osc: OscillatorNode | null;
  gain: GainNode | null;
};

export type InteractPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
  /** One-shots scheduled. Vacío al boot / tras R. */
  voices: InteractVoice[];
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
  return { ctx: null, voices: [] };
}

/**
 * R / softReset: scheduled vacío (boot). Mute se queda (vive en ambient).
 * Game.interactPlayer debe coincidir (door/loot/use leftover no suena en el barrio nuevo).
 * F9 load no usa esto — el player persiste (misma carrera).
 */
export function interactBeepsAfterRestart(): InteractSfxKind[] {
  return [];
}

/** Kinds scheduled (headless / leftover). */
export function interactPlayerScheduled(player: InteractPlayer): InteractSfxKind[] {
  return player.voices.map((v) => v.kind);
}

function snapStopVoice(voice: InteractVoice, currentTime: number): void {
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
export function resetInteractPlayerAfterRestart(player: InteractPlayer): void {
  const t = player.ctx?.currentTime ?? 0;
  for (const voice of player.voices) {
    snapStopVoice(voice, t);
  }
  player.voices = [];
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

function startBeep(
  player: InteractPlayer,
  voice: InteractVoice,
  ctx: AudioContext,
  spec: InteractBeepSpec,
): void {
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
  voice.osc = osc;
  voice.gain = gain;
  osc.onended = () => {
    const i = player.voices.indexOf(voice);
    if (i >= 0) player.voices.splice(i, 1);
  };
}

function playInteractSfx(
  player: InteractPlayer,
  kind: InteractSfxKind,
  muted: boolean,
): void {
  if (!shouldPlayInteractSfx(muted)) return;
  const voice: InteractVoice = { kind, osc: null, gain: null };
  const ctx = ensureCtx(player);
  if (ctx) {
    try {
      startBeep(player, voice, ctx, interactBeepSpec(kind));
    } catch {
      // Autoplay / context cerrado — silencioso.
    }
  }
  player.voices.push(voice);
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
