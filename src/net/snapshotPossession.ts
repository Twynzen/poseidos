/**
 * Collector possession gated → snapshot wire F7.
 * Solo efectos ya validados (trust + TTLs + lastApplied / lastRejected / gateLine / moodBias / toneBias); no intents crudos.
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
import { compactMoodBias } from "../possession/llmBridge";
import type { NetPossessionSnap } from "./session";

/** Fuente opcional de sesgo ya validado (`speech.getMoodBias`). */
export type MoodBiasLookup =
  | ((id: string) => string | null | undefined)
  | { getMoodBias(id: string): string | null | undefined };

/** Fuente opcional de sesgo de memoria ya validado (`memory.toneBias`). */
export type ToneBiasLookup =
  | ((id: string) => string | null | undefined)
  | { toneBias(id: string): string | null | undefined };

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
 * Serializa estado gated de poseídos.
 * `hostileIds` = ids a incluir; si se omite, todos los del ledger.
 * `moodBiasOf` = getter o SpeechDirector; si se omite, no se pinta moodBias.
 * `toneBiasOf` = getter o ShortMemory; si se omite, no se pinta toneBias.
 */
export function collectPossessionFrom(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  hostileIds?: readonly string[],
  moodBiasOf?: MoodBiasLookup,
  toneBiasOf?: ToneBiasLookup,
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
    });
  }
  return out;
}
