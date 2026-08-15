/**
 * Collector possession gated → snapshot wire F7.
 * Solo efectos ya validados (trust + TTLs + lastApplied); no intents crudos.
 */
import {
  isPacified,
  type TrustLedger,
} from "../possession/trust";
import {
  compactKnownGateTags,
  type DialogueBehaviorGates,
} from "../possession/gates";
import type { NetPossessionSnap } from "./session";

/**
 * Serializa estado gated de poseídos.
 * `hostileIds` = ids a incluir; si se omite, todos los del ledger.
 */
export function collectPossessionFrom(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  hostileIds?: readonly string[],
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
    out.push({
      id,
      trust,
      pacifiedLeft,
      speedBumpLeft,
      speedBumpMul,
      pacified,
      ...(lastApplied.length > 0 ? { lastApplied } : {}),
    });
  }
  return out;
}
