/**
 * Diálogo jugador → poseído (arranque F5).
 * Opciones proponen; código aplica trust y elige línea del banco (o LLM stub).
 */

import { pickLine, type PossessionTone } from "./lineBank";
import { TrustLedger } from "./trust";
import type { ShortMemory } from "./memory";
import {
  resolveLineWithBridge,
  type LlmBridge,
  type LineSource,
} from "./llmBridge";

export type DialogueIntent = "calmar" | "amenazar" | "preguntar" | "ofrecer" | "distraer";

export interface DialogueOption {
  intent: DialogueIntent;
  /** Texto del botón (ES). */
  label: string;
  trustDelta: number;
  /** Categoría de respuesta del banco. */
  tone: PossessionTone;
}

/** Alcance para abrir diálogo (tile-world). */
export const DIALOGUE_REACH = 2.2;

/**
 * Calmar → ruega · Amenazar → demonio · Preguntar → lucidez · Ofrecer → ruega · Distraer → demonio.
 * Deltas calibrados para cruzar umbrales en ~2–3 interacciones.
 */
export const DIALOGUE_OPTIONS: readonly DialogueOption[] = [
  {
    intent: "calmar",
    label: "Calmar (hablar bajo)",
    trustDelta: 14,
    tone: "ruega",
  },
  {
    intent: "preguntar",
    label: "Preguntar quién eres",
    trustDelta: 6,
    tone: "lucidez",
  },
  {
    intent: "amenazar",
    label: "Amenazar",
    trustDelta: -20,
    tone: "demonio",
  },
  {
    intent: "ofrecer",
    label: "Ofrecer comida",
    trustDelta: 10,
    tone: "ruega",
  },
  {
    intent: "distraer",
    label: "Distraer (gritar lejos)",
    trustDelta: -4,
    tone: "demonio",
  },
] as const;

export function optionFor(intent: DialogueIntent): DialogueOption {
  const opt = DIALOGUE_OPTIONS.find((o) => o.intent === intent);
  if (!opt) throw new Error(`intent desconocido: ${intent}`);
  return opt;
}

export interface DialogueResult {
  entityId: string;
  intent: DialogueIntent;
  trustBefore: number;
  trustAfter: number;
  tone: PossessionTone;
  line: string;
  trustDelta: number;
  /** Origen de la línea (banco por defecto). */
  lineSource?: LineSource;
}

export interface NearbyPossessed {
  id: string;
  x: number;
  y: number;
  dist: number;
}

/** Poseído más cercano dentro de reach (kind === "possessed"). */
export function nearestPossessed(
  hostiles: ReadonlyArray<{
    id: string;
    x: number;
    y: number;
    kind: string;
  }>,
  px: number,
  py: number,
  reach: number = DIALOGUE_REACH,
): NearbyPossessed | null {
  let best: NearbyPossessed | null = null;
  for (const h of hostiles) {
    if (h.kind !== "possessed") continue;
    const dist = Math.hypot(h.x - px, h.y - py);
    if (dist <= reach && (!best || dist < best.dist)) {
      best = { id: h.id, x: h.x, y: h.y, dist };
    }
  }
  return best;
}

export interface DialogueLlmOpts {
  enabled: boolean;
  bridge?: LlmBridge | null;
}

/**
 * Aplica opción: ajusta trust + elige línea del tono fijado (solo banco).
 * El intent propone; este gate es la autoridad.
 * Si hay `memory`, registra la interacción (no cambia el tono de esta respuesta).
 */
export function applyDialogueChoice(
  ledger: TrustLedger,
  entityId: string,
  intent: DialogueIntent,
  rng: () => number = Math.random,
  memory?: ShortMemory,
): DialogueResult {
  ledger.register(entityId);
  const opt = optionFor(intent);
  const trustBefore = ledger.get(entityId);
  const trustAfter = ledger.adjust(entityId, opt.trustDelta);
  const line = pickLine(opt.tone, rng);
  memory?.remember(entityId, {
    who: "player",
    intent,
    trustDelta: opt.trustDelta,
    tone: opt.tone,
  });
  return {
    entityId,
    intent,
    trustBefore,
    trustAfter,
    tone: opt.tone,
    line,
    trustDelta: opt.trustDelta,
    lineSource: "bank",
  };
}

/**
 * Igual que applyDialogueChoice, pero si `llm.enabled` pide línea al bridge.
 * null / error / deshabilitado → banco. Trust siempre lo decide el código.
 */
export async function applyDialogueChoiceAsync(
  ledger: TrustLedger,
  entityId: string,
  intent: DialogueIntent,
  rng: () => number = Math.random,
  memory?: ShortMemory,
  llm?: DialogueLlmOpts,
): Promise<DialogueResult> {
  ledger.register(entityId);
  const opt = optionFor(intent);
  const trustBefore = ledger.get(entityId);
  const trustAfter = ledger.adjust(entityId, opt.trustDelta);
  const resolved = await resolveLineWithBridge({
    enabled: llm?.enabled ?? false,
    bridge: llm?.bridge ?? null,
    snapshot: {
      entityId,
      tone: opt.tone,
      trigger: "dialogue",
      intent,
      trust: trustAfter,
    },
    fallback: () => pickLine(opt.tone, rng),
  });
  memory?.remember(entityId, {
    who: "player",
    intent,
    trustDelta: opt.trustDelta,
    tone: opt.tone,
  });
  return {
    entityId,
    intent,
    trustBefore,
    trustAfter,
    tone: opt.tone,
    line: resolved.line,
    trustDelta: opt.trustDelta,
    lineSource: resolved.source,
  };
}

/** Sesión UI simple: abierto con un target. */
export class DialogueSession {
  private targetId: string | null = null;

  get open(): boolean {
    return this.targetId !== null;
  }

  get target(): string | null {
    return this.targetId;
  }

  begin(entityId: string): void {
    this.targetId = entityId;
  }

  close(): void {
    this.targetId = null;
  }

  /** Cierra si el target se alejó / murió. */
  validate(
    hostiles: ReadonlyArray<{ id: string; x: number; y: number; kind: string }>,
    px: number,
    py: number,
    reach: number = DIALOGUE_REACH,
  ): boolean {
    if (!this.targetId) return false;
    const h = hostiles.find((x) => x.id === this.targetId);
    if (!h || h.kind !== "possessed") {
      this.close();
      return false;
    }
    if (Math.hypot(h.x - px, h.y - py) > reach * 1.35) {
      this.close();
      return false;
    }
    return true;
  }
}
