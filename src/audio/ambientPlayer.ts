/**
 * Ambient WebAudio player — capas looping desde niveles de ambientStub.
 * Headless: `computeLayerGain` / `shouldBeSilent` sin AudioContext.
 * Browser: AudioContext lazy (solo al primer sync audible).
 */

import {
  ambientLevels,
  type AmbientBus,
  type AmbientLayer,
  type AmbientLevels,
} from "./ambientStub";

const LAYERS: readonly AmbientLayer[] = ["rain", "night", "indoor", "threat"];

/** Master por capa (noise/saw más bajos; sine/triangle más suaves). */
const LAYER_MASTER: Record<AmbientLayer, number> = {
  rain: 0.14,
  night: 0.045,
  indoor: 0.055,
  threat: 0.07,
};

const RAIN_BANDPASS_HZ = 2800;
const NIGHT_SINE_HZ = 62;
const INDOOR_OSC_HZ = 95;
const INDOOR_LOWPASS_HZ = 190;
const THREAT_OSC_HZ = 36;
const THREAT_LOWPASS_HZ = 48;

const GAIN_RAMP_SEC = 0.08;
const SILENT_EPS = 0.0005;
const NOISE_SEC = 2;

type LayerVoice = {
  gain: GainNode;
};

export type AmbientPlayer = {
  /** null hasta el primer sync audible, o si no hay AudioContext. */
  ctx: AudioContext | null;
  voices: Record<AmbientLayer, LayerVoice> | null;
};

/**
 * Gain audible 0–master. Mute o level ≤ 0 → 0.
 * Headless / determinista — sin audio.
 */
export function computeLayerGain(
  layer: AmbientLayer,
  level: number,
  muted: boolean,
): number {
  if (muted) return 0;
  if (!Number.isFinite(level) || level <= 0) return 0;
  return Math.min(1, level) * LAYER_MASTER[layer];
}

/** True si mute o todas las capas quedan en 0. */
export function shouldBeSilent(levels: AmbientLevels, muted: boolean): boolean {
  if (muted) return true;
  for (const layer of LAYERS) {
    if (computeLayerGain(layer, levels[layer], false) > SILENT_EPS) return false;
  }
  return true;
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

/** Crea player stub; no abre AudioContext (lazy en sync). */
export function createAmbientPlayer(): AmbientPlayer {
  return { ctx: null, voices: null };
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * NOISE_SEC));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function connectOut(
  ctx: AudioContext,
  source: AudioNode,
  filter: BiquadFilterNode | null,
  gain: GainNode,
): void {
  if (filter) {
    source.connect(filter);
    filter.connect(gain);
  } else {
    source.connect(gain);
  }
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, ctx.currentTime);
}

function buildVoices(ctx: AudioContext): Record<AmbientLayer, LayerVoice> {
  const t0 = ctx.currentTime;

  const rainGain = ctx.createGain();
  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = "bandpass";
  rainFilter.frequency.setValueAtTime(RAIN_BANDPASS_HZ, t0);
  rainFilter.Q.setValueAtTime(0.9, t0);
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;
  connectOut(ctx, noise, rainFilter, rainGain);
  noise.start(t0);

  const nightGain = ctx.createGain();
  const nightOsc = ctx.createOscillator();
  nightOsc.type = "sine";
  nightOsc.frequency.setValueAtTime(NIGHT_SINE_HZ, t0);
  connectOut(ctx, nightOsc, null, nightGain);
  nightOsc.start(t0);

  const indoorGain = ctx.createGain();
  const indoorFilter = ctx.createBiquadFilter();
  indoorFilter.type = "lowpass";
  indoorFilter.frequency.setValueAtTime(INDOOR_LOWPASS_HZ, t0);
  const indoorOsc = ctx.createOscillator();
  indoorOsc.type = "triangle";
  indoorOsc.frequency.setValueAtTime(INDOOR_OSC_HZ, t0);
  connectOut(ctx, indoorOsc, indoorFilter, indoorGain);
  indoorOsc.start(t0);

  const threatGain = ctx.createGain();
  const threatFilter = ctx.createBiquadFilter();
  threatFilter.type = "lowpass";
  threatFilter.frequency.setValueAtTime(THREAT_LOWPASS_HZ, t0);
  const threatOsc = ctx.createOscillator();
  threatOsc.type = "sawtooth";
  threatOsc.frequency.setValueAtTime(THREAT_OSC_HZ, t0);
  connectOut(ctx, threatOsc, threatFilter, threatGain);
  threatOsc.start(t0);

  return {
    rain: { gain: rainGain },
    night: { gain: nightGain },
    indoor: { gain: indoorGain },
    threat: { gain: threatGain },
  };
}

function rampGain(gain: GainNode, value: number, ctx: AudioContext): void {
  const t = ctx.currentTime;
  const param = gain.gain;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(Math.max(0, value), t + GAIN_RAMP_SEC);
}

function applyGains(
  player: AmbientPlayer,
  levels: AmbientLevels,
  muted: boolean,
): void {
  const ctx = player.ctx;
  const voices = player.voices;
  if (!ctx || !voices) return;
  for (const layer of LAYERS) {
    rampGain(voices[layer].gain, computeLayerGain(layer, levels[layer], muted), ctx);
  }
}

function ensureGraph(player: AmbientPlayer): boolean {
  if (!player.ctx) {
    player.ctx = tryCreateAudioContext();
  }
  const ctx = player.ctx;
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }

  if (!player.voices) {
    try {
      player.voices = buildVoices(ctx);
    } catch {
      player.voices = null;
      return false;
    }
  }
  return player.voices !== null;
}

/**
 * Sincroniza player con el bus tras `tickAmbient`.
 * Mute → gains 0. Sin AudioContext / silencio → no abre ctx (lazy).
 */
export function syncAmbientPlayer(
  player: AmbientPlayer,
  bus: AmbientBus,
): void {
  const levels = ambientLevels(bus);
  const muted = bus.muted;

  if (shouldBeSilent(levels, muted)) {
    if (player.voices) applyGains(player, levels, muted);
    return;
  }

  if (!ensureGraph(player)) return;
  applyGains(player, levels, muted);
}
