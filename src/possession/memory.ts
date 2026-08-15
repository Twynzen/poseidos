/**
 * Memoria corta por poseído: últimas N interacciones de diálogo.
 * Puede sesgar la próxima categoría de línea (tono).
 */

import type { DialogueIntent } from "./dialogue";
import type { PossessionTone } from "./lineBank";

export const MEMORY_CAPACITY = 5;

export interface MemoryEntry {
  /** Interlocutor (hoy: "player"). */
  who: string;
  intent: DialogueIntent;
  trustDelta: number;
  tone: PossessionTone;
}

const INTENT_TONE: Record<DialogueIntent, PossessionTone> = {
  calmar: "ruega",
  amenazar: "demonio",
  preguntar: "lucidez",
  ofrecer: "ruega",
  distraer: "demonio",
};

/** Tono sugerido a partir de entradas recientes (recencia ponderada). */
export function toneBiasFromEntries(
  entries: ReadonlyArray<MemoryEntry>,
): PossessionTone | undefined {
  if (entries.length === 0) return undefined;

  const scores: Record<PossessionTone, number> = {
    lucidez: 0,
    demonio: 0,
    ruega: 0,
  };

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    // Más reciente = mayor peso (última entrada peso N)
    const weight = i + 1;
    const tone = e.tone || INTENT_TONE[e.intent];
    scores[tone] += weight;
    // Trust delta refuerza: negativo → demonio; positivo fuerte → ruega
    if (e.trustDelta <= -10) scores.demonio += weight * 0.5;
    else if (e.trustDelta >= 10) scores.ruega += weight * 0.35;
  }

  let best: PossessionTone = "lucidez";
  let bestScore = -1;
  for (const t of ["demonio", "ruega", "lucidez"] as const) {
    if (scores[t] > bestScore) {
      bestScore = scores[t];
      best = t;
    }
  }
  return best;
}

/**
 * Buffer circular por entityId (solo poseídos en la práctica).
 */
export class ShortMemory {
  private readonly byId = new Map<string, MemoryEntry[]>();
  readonly capacity: number;

  constructor(capacity: number = MEMORY_CAPACITY) {
    this.capacity = Math.max(1, capacity);
  }

  remember(entityId: string, entry: MemoryEntry): void {
    let list = this.byId.get(entityId);
    if (!list) {
      list = [];
      this.byId.set(entityId, list);
    }
    list.push({ ...entry });
    while (list.length > this.capacity) list.shift();
  }

  recent(entityId: string): readonly MemoryEntry[] {
    return this.byId.get(entityId) ?? [];
  }

  /** Sesgo de tono para la próxima línea; undefined si no hay historial. */
  toneBias(entityId: string): PossessionTone | undefined {
    return toneBiasFromEntries(this.recent(entityId));
  }

  has(entityId: string): boolean {
    return (this.byId.get(entityId)?.length ?? 0) > 0;
  }

  /** Ids con al menos una entrada. */
  ids(): readonly string[] {
    const out: string[] = [];
    for (const [id, list] of this.byId) {
      if (list.length > 0) out.push(id);
    }
    return out;
  }

  /**
   * Restaura entradas (F5/F9). Reemplaza el buffer de ese id.
   * Omite who vacío; recorta a capacity (más recientes).
   */
  restore(entityId: string, entries: readonly MemoryEntry[]): void {
    if (!entityId) return;
    const list: MemoryEntry[] = [];
    for (const e of entries) {
      if (!e || typeof e.who !== "string" || !e.who) continue;
      list.push({
        who: e.who,
        intent: e.intent,
        trustDelta: e.trustDelta,
        tone: e.tone,
      });
    }
    while (list.length > this.capacity) list.shift();
    if (list.length === 0) {
      this.byId.delete(entityId);
      return;
    }
    this.byId.set(entityId, list);
  }

  unregister(entityId: string): void {
    this.byId.delete(entityId);
  }

  clear(): void {
    this.byId.clear();
  }
}
