/**
 * Collector possession gated → snapshot wire F7.
 * Solo efectos ya validados (trust + TTLs + lastApplied / lastRejected / gateLine / moodBias / toneBias / memorySummary / lineSource); no intents crudos.
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
import { compactMoodBias, type LineSource } from "../possession/llmBridge";
import {
  formatMemorySummary,
  type MemoryEntry,
} from "../possession/memory";
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

/**
 * Serializa estado gated de poseídos.
 * `hostileIds` = ids a incluir; si se omite, todos los del ledger.
 * `moodBiasOf` = getter o SpeechDirector; si se omite, no se pinta moodBias.
 * `toneBiasOf` = getter o ShortMemory; si se omite, no se pinta toneBias.
 * `memoryOf` = getter o ShortMemory; si se omite, no se pinta memorySummary.
 * `lineSourceOf` = getter o SpeechDirector; si se omite, no se pinta lineSource.
 */
export function collectPossessionFrom(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  hostileIds?: readonly string[],
  moodBiasOf?: MoodBiasLookup,
  toneBiasOf?: ToneBiasLookup,
  memoryOf?: MemorySummaryLookup,
  lineSourceOf?: LineSourceLookup,
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
    });
  }
  return out;
}
