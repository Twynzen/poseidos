/**
 * HUD de estado compacto (texto) — sin muro de controles por defecto.
 * F1 (showHelp) revela CONTROLS_HELP y tokens de debug (tile / chunks / fov).
 */

import type { GateTag, LineSource, PossessionTone } from "../possession";

export const CONTROLS_HELP = [
  "Mover: WASD · Shift correr · +/- zoom",
  "Combate: Espacio/V melee · X disparar",
  "Loot: E puerta/loot · G loot · Shift+G stack · U tirar · Shift+U stack · Q usar slot / rellenar botella (lluvia)",
  "Inventario: 1-5 hotbar · rueda hotbar · clic hotbar · arrastrar hotbar · doble clic usar · clic der. info · Shift+clic hotbar partir · Ctrl+clic hotbar juntar · I inv · clic inv usar · doble clic inv · arrastrar inv · Shift+clic inv partir · Ctrl+clic inv juntar · clic der. inv · U inv tirar",
  "Mundo: B barricada · C vendaje · H cocinar · T diálogo (calmar / preguntar / amenazar / ofrecer comida / Distraer) · L linterna · Z cama o suelo indoor · R descanso/reinicio · M mute · F1 ayuda · F5 guardar · F9 cargar",
].join("\n");

export type HudStatusInput = {
  modo: string;
  /** 0–100 */
  phasePct: number;
  muteN: number;
  possN: number;
  invLine: string;
  /** Sin separador inicial, p.ej. "cerca: chest […] G/E recoger" */
  nearHint?: string;
  /** p.ej. "ruido run r6" */
  noiseHint?: string;
  talkHint?: string;
  dlgHint?: string;
  indoor?: boolean;
  /** "safehouse" | "safehouse cama" */
  safeHint?: string;
  raining?: boolean;
  flashlight?: boolean;
  /** Ambient stub: "♪" | "mute" | "lluvia♪" */
  audioHint?: string;
  /** Mensaje contextual (loot, daño, etc.) sin separador */
  msg?: string;
  /** "I cerrar inv" cuando el panel está abierto */
  invDetailHint?: string;
  /** Segundos de pacify del poseído relevante (`gates.pacifiedLeft`). 0/omitido = no pintar. */
  pacifyLeft?: number;
  /** Segundos de speed-bump del poseído relevante (`gates.speedBumpLeft`). 0/omitido = no pintar. */
  speedBumpLeft?: number;
  /** Sesgo de tono del poseído relevante (`speech.getMoodBias`). Null/omitido = no pintar. */
  moodBias?: PossessionTone | null;
  /** Tono recordado del poseído relevante (`memory.toneBias`). Null/omitido = no pintar. */
  memoryTone?: PossessionTone | null;
  /** Últimos tags aplicados del poseído relevante (`gates.lastApplied`). Vacío/omitido = no pintar. */
  lastApplied?: readonly GateTag[] | null;
  /** Últimos tags rechazados del poseído relevante (`gates.lastRejected`). Vacío/omitido = no pintar. */
  lastRejected?: readonly GateTag[] | null;
  /** Fuente de la última línea (`speech.getActive.lineSource`). Null/omitido = no pintar. */
  lineSource?: LineSource | null;
  tileX: number;
  tileY: number;
  chunksLoaded: number;
  chunksTotal: number;
  fov: number;
  gameOver?: boolean;
  showHelp?: boolean;
};

function joinParts(parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" · ");
}

export type HudDebugInput = Pick<
  HudStatusInput,
  "tileX" | "tileY" | "chunksLoaded" | "chunksTotal" | "fov"
>;

/** Tokens de debug: tile / chunks / fov. Solo van al HUD con showHelp. */
export function formatHudDebugTokens(input: HudDebugInput): string {
  return joinParts([
    `tile ${input.tileX},${input.tileY}`,
    `chunks ${input.chunksLoaded}/${input.chunksTotal}`,
    `fov ${input.fov}`,
  ]);
}

/**
 * TTL de pacify en HUD. Entero corto ES; oculto si ≤ 0 / ausente.
 * Countdown: 7.2s → `CALMA 8` (ceil para que el último segundo no desaparezca).
 */
export function formatPacifyHud(pacifyLeft: number | undefined): string | null {
  if (pacifyLeft == null || pacifyLeft <= 0) return null;
  return `CALMA ${Math.ceil(pacifyLeft)}`;
}

/**
 * TTL de speed-bump en HUD. Entero corto ES; oculto si ≤ 0 / ausente.
 * Countdown: 3.5s → `FURIA 4` (ceil para que el último segundo no desaparezca).
 */
export function formatSpeedBumpHud(
  speedBumpLeft: number | undefined,
): string | null {
  if (speedBumpLeft == null || speedBumpLeft <= 0) return null;
  return `FURIA ${Math.ceil(speedBumpLeft)}`;
}

const MOOD_BIAS_HUD: Record<PossessionTone, string> = {
  lucidez: "LUCIDEZ",
  demonio: "DEMONIO",
  ruega: "RUEGA",
};

/**
 * Sesgo de tono en HUD. Token corto ES; oculto si no hay bias.
 * No es un TTL: es el bias vivo de `speech.getMoodBias`.
 */
export function formatMoodBiasHud(
  bias: PossessionTone | null | undefined,
): string | null {
  if (bias == null) return null;
  return MOOD_BIAS_HUD[bias] ?? null;
}

/**
 * Tono de ShortMemory en HUD. Prefijo MEMORIA para no chocar con
 * `formatMoodBiasHud` (speech mood). Oculto si no hay bias.
 */
export function formatMemoryToneHud(
  bias: PossessionTone | null | undefined,
): string | null {
  if (bias == null) return null;
  const token = MOOD_BIAS_HUD[bias];
  return token ? `MEMORIA ${token}` : null;
}

/**
 * Últimos tags de gate aplicados. Prefijo CÓDIGO para no chocar con
 * CALMA / FURIA / LUCIDEZ / MEMORIA. Oculto si no hay tags.
 * Reusa los strings de `GateTag` (no inventa nombres).
 */
export function formatLastGateHud(
  tags: readonly GateTag[] | null | undefined,
): string | null {
  if (tags == null || tags.length === 0) return null;
  return `CÓDIGO ${tags.join(",")}`;
}

/**
 * Últimos tags de gate rechazados. Prefijo RECHAZO para no chocar con
 * CÓDIGO / CALMA / FURIA / LUCIDEZ / MEMORIA. Oculto si no hay tags.
 * Reusa los strings de `GateTag` (no inventa nombres).
 */
export function formatLastRejectedHud(
  tags: readonly GateTag[] | null | undefined,
): string | null {
  if (tags == null || tags.length === 0) return null;
  return `RECHAZO ${tags.join(",")}`;
}

const LINE_SOURCE_HUD: Record<LineSource, string> = {
  llm: "STUB",
  bank: "BANCO",
};

/**
 * Fuente de la última línea. Token corto ES; oculto si no hay utterance / source.
 * Distinto de CÓDIGO / RECHAZO / CALMA / FURIA / LUCIDEZ / MEMORIA.
 */
export function formatLineSourceHud(
  source: LineSource | null | undefined,
): string | null {
  if (source == null) return null;
  return LINE_SOURCE_HUD[source] ?? null;
}

/**
 * Formato compacto por defecto (sin muro WASD ni dump tile/chunks/fov).
 * Con showHelp: CONTROLS_HELP + línea de estado (debug tokens) + F1 cerrar.
 * Con gameOver: mensaje de muerte.
 */
export function formatHudStatus(input: HudStatusInput): string {
  if (input.gameOver) {
    const base = "HAS MUERTO — R reiniciar · F9 cargar";
    const msg = input.msg?.trim();
    return msg ? `${base} · ${msg}` : base;
  }

  const status = joinParts([
    `${input.modo} (${input.phasePct}%)`,
    input.raining ? "lluvia" : null,
    input.indoor ? "indoor" : null,
    input.safeHint?.trim() || null,
    input.flashlight ? "linterna" : null,
    input.audioHint?.trim() || null,
    `mudos ${input.muteN}`,
    `poseídos ${input.possN}`,
    formatPacifyHud(input.pacifyLeft),
    formatSpeedBumpHud(input.speedBumpLeft),
    formatMoodBiasHud(input.moodBias),
    formatMemoryToneHud(input.memoryTone),
    formatLastGateHud(input.lastApplied),
    formatLastRejectedHud(input.lastRejected),
    formatLineSourceHud(input.lineSource),
    input.noiseHint?.trim() || null,
    input.invLine?.trim() || null,
    input.nearHint?.trim() || null,
    input.invDetailHint?.trim() || null,
    input.talkHint?.trim() || null,
    input.dlgHint?.trim() || null,
    input.msg?.trim() || null,
    input.showHelp ? formatHudDebugTokens(input) : null,
    input.showHelp ? "F1 cerrar ayuda" : "F1 ayuda",
  ]);

  if (input.showHelp) {
    return `${CONTROLS_HELP}\n${status}`;
  }
  return status;
}
