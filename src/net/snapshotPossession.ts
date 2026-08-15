/**
 * Collector possession gated → snapshot wire F7.
 * Solo efectos ya validados (trust + TTLs + lastApplied / lastRejected / gateLine / moodBias / toneBias / memorySummary / lineSource / line / tone / trigger); no intents crudos.
 */
import {
  isPacified,
  type TrustLedger,
} from "../possession/trust";
import {
  compactGateLine,
  compactKnownGateTags,
  type DialogueBehaviorGates,
} from "../possession/gates";
import {
  compactLlmLine,
  compactMoodBias,
  type LineSource,
} from "../possession/llmBridge";
import {
  formatMemorySummary,
  type MemoryEntry,
} from "../possession/memory";
import type { SpeechTrigger } from "../possession/speech";
import type { NetPossessionSnap } from "./session";

/** Fuente opcional de sesgo ya validado (`speech.getMoodBias`). */
export type MoodBiasLookup =
  | ((id: string) => string | null | undefined)
  | { getMoodBias(id: string): string | null | undefined };

/** Fuente opcional de sesgo de memoria ya validado (`memory.toneBias`). */
export type ToneBiasLookup =
  | ((id: string) => string | null | undefined)
  | { toneBias(id: string): string | null | undefined };

/** Fuente opcional de resumen compacto ya validado (`formatMemorySummary` / `memory.recent`). */
export type MemorySummaryLookup =
  | ((id: string) => string | readonly MemoryEntry[] | null | undefined)
  | { recent(id: string): readonly MemoryEntry[] | null | undefined };

/** Fuente opcional de origen ya validado (`speech.getActive.lineSource`). */
export type LineSourceLookup =
  | ((id: string) => LineSource | string | null | undefined)
  | {
      getActive(
        id: string,
      ): { lineSource?: LineSource | string | null } | null | undefined;
    };

/** Fuente opcional de línea hablada ya validada (`speech.getActive.line`). */
export type LineLookup =
  | ((id: string) => string | null | undefined)
  | {
      getActive(id: string): { line?: string | null } | null | undefined;
    };

/** Fuente opcional de tono de utterance ya validado (`speech.getActive.tone`). */
export type ToneLookup =
  | ((id: string) => string | null | undefined)
  | {
      getActive(id: string): { tone?: string | null } | null | undefined;
    };

/** Fuente opcional de trigger de utterance ya validado (`speech.getActive.trigger`). */
export type TriggerLookup =
  | ((id: string) => SpeechTrigger | string | null | undefined)
  | {
      getActive(
        id: string,
      ): { trigger?: SpeechTrigger | string | null } | null | undefined;
    };

function readMoodBias(
  source: MoodBiasLookup | undefined,
  id: string,
): ReturnType<typeof compactMoodBias> {
  if (!source) return "";
  const raw = typeof source === "function" ? source(id) : source.getMoodBias(id);
  return compactMoodBias(raw);
}

function readToneBias(
  source: ToneBiasLookup | undefined,
  id: string,
): ReturnType<typeof compactMoodBias> {
  if (!source) return "";
  const raw = typeof source === "function" ? source(id) : source.toneBias(id);
  return compactMoodBias(raw);
}

/**
 * Compacta el resumen: string ya formateado → trim (omit whitespace);
 * entradas pasan por `formatMemorySummary` (único cap MEMORY_SUMMARY_MAX_LEN).
 */
function readMemorySummary(
  source: MemorySummaryLookup | undefined,
  id: string,
): string {
  if (!source) return "";
  const raw = typeof source === "function" ? source(id) : source.recent(id);
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (!Array.isArray(raw)) return "";
  return formatMemorySummary(raw);
}

/** Fuente ya validada; vacío / desconocido / sin utterance se omite. No mapea STUB/BANCO. */
function compactLineSource(raw?: string | null): LineSource | "" {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  return t === "llm" || t === "bank" ? t : "";
}

function readLineSource(
  source: LineSourceLookup | undefined,
  id: string,
): LineSource | "" {
  if (!source) return "";
  const raw =
    typeof source === "function" ? source(id) : source.getActive(id)?.lineSource;
  return compactLineSource(raw);
}

/** Línea ya validada; vacío / whitespace / sin utterance / compactLlmLine reject se omite. */
function readLine(source: LineLookup | undefined, id: string): string {
  if (!source) return "";
  const raw =
    typeof source === "function" ? source(id) : source.getActive(id)?.line;
  return compactLlmLine(raw) ?? "";
}

/** Tono de utterance ya validado; vacío / desconocido / sin utterance se omite. */
function readTone(
  source: ToneLookup | undefined,
  id: string,
): ReturnType<typeof compactMoodBias> {
  if (!source) return "";
  const raw =
    typeof source === "function" ? source(id) : source.getActive(id)?.tone;
  return compactMoodBias(raw);
}

/** Trigger ya validado; vacío / desconocido / sin utterance se omite. No inventa enum. */
function compactSpeechTrigger(raw?: string | null): SpeechTrigger | "" {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  return t === "periodic" || t === "see_player" || t === "dialogue" ? t : "";
}

function readTrigger(
  source: TriggerLookup | undefined,
  id: string,
): SpeechTrigger | "" {
  if (!source) return "";
  const raw =
    typeof source === "function" ? source(id) : source.getActive(id)?.trigger;
  return compactSpeechTrigger(raw);
}

/**
 * Serializa estado gated de poseídos.
 * `hostileIds` = ids a incluir; si se omite, todos los del ledger.
 * `moodBiasOf` = getter o SpeechDirector; si se omite, no se pinta moodBias.
 * `toneBiasOf` = getter o ShortMemory; si se omite, no se pinta toneBias.
 * `memoryOf` = getter o ShortMemory; si se omite, no se pinta memorySummary.
 * `lineSourceOf` = getter o SpeechDirector; si se omite, no se pinta lineSource.
 * `lineOf` = getter o SpeechDirector; si se omite, no se pinta line.
 * `toneOf` = getter o SpeechDirector; si se omite, no se pinta tone.
 * `triggerOf` = getter o SpeechDirector; si se omite, no se pinta trigger.
 */
export function collectPossessionFrom(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  hostileIds?: readonly string[],
  moodBiasOf?: MoodBiasLookup,
  toneBiasOf?: ToneBiasLookup,
  memoryOf?: MemorySummaryLookup,
  lineSourceOf?: LineSourceLookup,
  lineOf?: LineLookup,
  toneOf?: ToneLookup,
  triggerOf?: TriggerLookup,
): NetPossessionSnap[] {
  const ids = hostileIds ?? ledger.ids();
  const out: NetPossessionSnap[] = [];
  for (const id of ids) {
    const trust = ledger.get(id);
    const pacifiedLeft = gates.pacifiedLeft(id);
    const speedBumpLeft = gates.speedBumpLeft(id);
    const speedBumpMul = gates.speedBumpMul(id);
    const pacified = isPacified(trust) || gates.isPacifiedByGate(id);
    const lastApplied = compactKnownGateTags(gates.lastApplied(id));
    const lastRejected = compactKnownGateTags(gates.lastRejected(id));
    const gateLine = compactGateLine(gates.gateLine(id));
    const moodBias = readMoodBias(moodBiasOf, id);
    const toneBias = readToneBias(toneBiasOf, id);
    const memorySummary = readMemorySummary(memoryOf, id);
    const lineSource = readLineSource(lineSourceOf, id);
    const line = readLine(lineOf, id);
    const tone = readTone(toneOf, id);
    const trigger = readTrigger(triggerOf, id);
    out.push({
      id,
      trust,
      pacifiedLeft,
      speedBumpLeft,
      speedBumpMul,
      pacified,
      ...(lastApplied.length > 0 ? { lastApplied } : {}),
      ...(lastRejected.length > 0 ? { lastRejected } : {}),
      ...(gateLine ? { gateLine } : {}),
      ...(moodBias ? { moodBias } : {}),
      ...(toneBias ? { toneBias } : {}),
      ...(memorySummary ? { memorySummary } : {}),
      ...(lineSource ? { lineSource } : {}),
      ...(line ? { line } : {}),
      ...(tone ? { tone } : {}),
      ...(trigger ? { trigger } : {}),
    });
  }
  return out;
}

/**
 * Host/game: un call site que pasa SpeechDirector + ShortMemory existentes.
 * speech → moodBiasOf / lineSourceOf / lineOf / toneOf / triggerOf;
 * memory → toneBiasOf / memoryOf. No inventa lookups ni campos.
 * Path 3-arg (`collectPossessionFrom`) sigue omitiendo esos campos.
 */
export function collectHostPossessionFrom(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  hostileIds: readonly string[] | undefined,
  speech: MoodBiasLookup &
    LineSourceLookup &
    LineLookup &
    ToneLookup &
    TriggerLookup,
  memory: ToneBiasLookup & MemorySummaryLookup,
): NetPossessionSnap[] {
  return collectPossessionFrom(
    ledger,
    gates,
    hostileIds,
    speech,
    memory,
    memory,
    speech,
    speech,
    speech,
    speech,
  );
}
