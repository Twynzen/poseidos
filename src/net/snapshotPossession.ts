/**
 * Collector possession gated → snapshot wire F7.
 * Solo efectos ya validados (trust + TTLs + lastApplied / lastRejected / gateLine); no intents crudos.
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
    const lastRejected = compactKnownGateTags(gates.lastRejected(id));
    const gateLine = compactGateLine(gates.gateLine(id));
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
    });
  }
  return out;
}
