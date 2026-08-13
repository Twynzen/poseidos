/**
 * Combat WebAudio SFX — beeps one-shot (melee / hit / gun).
 * Headless: `shouldPlayCombatSfx` / `combatBeepSpec` sin AudioContext.
 * Browser: AudioContext lazy (solo al primer play audible). Mute → no-op.
 */

export type CombatSfxKind = "melee" | "hit" | "gun";

export type CombatBeepSpec = {
  hz: number;
  type: OscillatorType;
  durationSec: number;
};

export type CombatPlayer = {
  /** null hasta el primer play audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
};

/** Gain pico (pre-mute ya filtrado). */
const BEEP_GAIN = 0.09;

const SPECS: Record<CombatSfxKind, CombatBeepSpec> = {
  melee: { hz: 200, type: "square", durationSec: 0.08 },
  hit: { hz: 90, type: "triangle", durationSec: 0.1 },
  gun: { hz: 400, type: "sawtooth", durationSec: 0.06 },
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
  return { ctx: null };
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

function playBeep(ctx: AudioContext, spec: CombatBeepSpec): void {
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

function playCombatSfx(
  player: CombatPlayer,
  kind: CombatSfxKind,
  muted: boolean,
): void {
  if (!shouldPlayCombatSfx(muted)) return;
  const ctx = ensureCtx(player);
  if (!ctx) return;
  try {
    playBeep(ctx, combatBeepSpec(kind));
  } catch {
    // Autoplay / context cerrado — silencioso.
  }
}

/** 200Hz square 80ms. Mute → no-op (no abre ctx). */
export function playMelee(player: CombatPlayer, muted: boolean): void {
  playCombatSfx(player, "melee", muted);
}

/** 90Hz triangle 100ms. Mute → no-op (no abre ctx). */
export function playHit(player: CombatPlayer, muted: boolean): void {
  playCombatSfx(player, "hit", muted);
}

/** 400Hz saw 60ms. Mute → no-op (no abre ctx). */
export function playGun(player: CombatPlayer, muted: boolean): void {
  playCombatSfx(player, "gun", muted);
}
