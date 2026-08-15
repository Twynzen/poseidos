/**
 * Gates diálogo → comportamiento (F5).
 * Diálogo propone intent; este código valida umbrales y aplica efectos jugables.
 * Headless — sin Three / sin LLM.
 */

import type { DialogueIntent } from "./dialogue";
import {
  TRUST_PACIFY,
  TRUST_AGGRO,
  type HostileAttitude,
} from "./trust";
import type { HostileAttitudeMod } from "../ai/hostile";

/** Cap de la última línea de gate persistida (`formatGateLine` cabe holgado). */
export const GATE_LINE_MAX_LEN = 120;

/** Tras calmar: trust mínimo (post-delta) para TTL de alivio. */
export const GATE_CALM_MIN_TRUST = 60;
/** Segundos sin chase/ataque aunque vea al player. */
export const GATE_CALM_PACIFY_TTL = 8;

/** Tras amenazar: trust máximo (post-delta) para noise + aggro. */
export const GATE_THREAT_MAX_TRUST = 40;
/** Speed bump corto al amenazar con trust bajo. */
export const GATE_THREAT_SPEED_TTL = 3.5;
export const GATE_THREAT_SPEED_MUL = 1.55;

/** Tras preguntar: trust medio+ → heal extra + lucidez. */
export const GATE_ASK_MIN_TRUST = 50;
export const GATE_ASK_EXTRA_TRUST = 4;

/** Ofrecer comida: trust mínimo + item en inventario para pacify largo. */
export const GATE_OFFER_MIN_TRUST = 45;
/** Segundos de alivio tras ofrecer comida válida. */
export const GATE_OFFER_PACIFY_TTL = 12;

/** Tras distraer: trust mínimo (post-delta) para ruido señuelo lejos. */
export const GATE_DISTRACT_MIN_TRUST = 35;
/** Conceptual: el gate emite ruido (no silencio). */
export const GATE_DISTRACT_NOISE = true;
/** Offset por defecto (tiles) desde el poseído; el game puede recalcular lejos del player. */
export const GATE_DISTRACT_DEFAULT_OFFSET = { dx: 0, dy: 6 } as const;

export type GateTag =
  | "pacify_ttl"
  | "threat_noise"
  | "threat_chase"
  | "threat_speed"
  | "ask_heal"
  | "ask_lucidity"
  | "offer_food"
  | "offer_pacify"
  | "distract_noise"
  | "distract_lure";

/** Tags conocidos (filtro / cap para snapshot LLM; no cambia umbrales). */
export const GATE_TAGS: readonly GateTag[] = [
  "pacify_ttl",
  "threat_noise",
  "threat_chase",
  "threat_speed",
  "ask_heal",
  "ask_lucidity",
  "offer_food",
  "offer_pacify",
  "distract_noise",
  "distract_lure",
] as const;

const GATE_TAG_SET = new Set<string>(GATE_TAGS);

export function isGateTag(value: unknown): value is GateTag {
  return typeof value === "string" && GATE_TAG_SET.has(value);
}

/** Tags conocidos nonempty; desconocidos / vacíos / null se omiten. Cap = set conocido. */
export function compactKnownGateTags(
  tags?: readonly string[] | null,
): GateTag[] {
  if (!tags || tags.length === 0) return [];
  const out: GateTag[] = [];
  for (const t of tags) {
    if (isGateTag(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

/**
 * Propuesta de efectos (aún no aplicada).
 * `applied` = gates que pasan umbral; `rejected` = intent sin umbral.
 */
export interface GateProposal {
  intent: DialogueIntent;
  trustAfter: number;
  /** TTL pacify (calmar / ofrecer + trust alto). */
  pacifyTtl: number;
  /** Emitir ruido en posición del poseído (atrae mudos). */
  emitThreatNoise: boolean;
  /** Forzar mode chase hacia el player. */
  forceChase: boolean;
  /** Speed bump TTL / mul. */
  speedBumpTtl: number;
  speedBumpMul: number;
  /** Heal trust extra (preguntar gated). */
  extraTrustHeal: number;
  /** Sesgar speech a lucidez. */
  lucidityBoost: boolean;
  /** Consumir 1 comida del inventario (ofrecer gated). */
  consumeFood: boolean;
  /** Emitir ruido señuelo lejos del player (distraer gated). */
  emitDistractNoise: boolean;
  /** Offset en tiles desde el poseído hacia el señuelo (default 0,6). */
  distractOffset: { dx: number; dy: number };
  applied: GateTag[];
  rejected: GateTag[];
}

export interface DialogueGateContext {
  /** Hay canned_food o hot_meal ofrecible en inventario. */
  hasOfferFood?: boolean;
}

/**
 * Valida intent + trustAfter → efectos concretos.
 * No muta ledger ni AI; solo propone.
 * `ctx` solo aplica a intent "ofrecer"; otros intents lo ignoran.
 */
export function proposeDialogueGates(
  intent: DialogueIntent,
  trustAfter: number,
  ctx?: DialogueGateContext,
): GateProposal {
  const applied: GateTag[] = [];
  const rejected: GateTag[] = [];
  let pacifyTtl = 0;
  let emitThreatNoise = false;
  let forceChase = false;
  let speedBumpTtl = 0;
  let speedBumpMul = 1;
  let extraTrustHeal = 0;
  let lucidityBoost = false;
  let consumeFood = false;
  let emitDistractNoise = false;
  let distractOffset = { dx: 0, dy: 0 };

  if (intent === "calmar") {
    if (trustAfter >= GATE_CALM_MIN_TRUST) {
      pacifyTtl = GATE_CALM_PACIFY_TTL;
      applied.push("pacify_ttl");
    } else {
      rejected.push("pacify_ttl");
    }
  }

  if (intent === "amenazar") {
    if (trustAfter <= GATE_THREAT_MAX_TRUST) {
      emitThreatNoise = true;
      forceChase = true;
      speedBumpTtl = GATE_THREAT_SPEED_TTL;
      speedBumpMul = GATE_THREAT_SPEED_MUL;
      applied.push("threat_noise", "threat_chase", "threat_speed");
    } else {
      rejected.push("threat_noise", "threat_chase", "threat_speed");
    }
  }

  if (intent === "preguntar") {
    if (trustAfter >= GATE_ASK_MIN_TRUST) {
      extraTrustHeal = GATE_ASK_EXTRA_TRUST;
      lucidityBoost = true;
      applied.push("ask_heal", "ask_lucidity");
    } else {
      rejected.push("ask_heal", "ask_lucidity");
    }
  }

  if (intent === "ofrecer") {
    const hasFood = ctx?.hasOfferFood === true;
    if (hasFood && trustAfter >= GATE_OFFER_MIN_TRUST) {
      consumeFood = true;
      pacifyTtl = GATE_OFFER_PACIFY_TTL;
      applied.push("offer_food", "offer_pacify");
    } else {
      rejected.push("offer_food", "offer_pacify");
    }
  }

  if (intent === "distraer") {
    if (trustAfter >= GATE_DISTRACT_MIN_TRUST) {
      emitDistractNoise = GATE_DISTRACT_NOISE;
      distractOffset = {
        dx: GATE_DISTRACT_DEFAULT_OFFSET.dx,
        dy: GATE_DISTRACT_DEFAULT_OFFSET.dy,
      };
      applied.push("distract_noise", "distract_lure");
    } else {
      rejected.push("distract_noise", "distract_lure");
    }
  }

  return {
    intent,
    trustAfter,
    pacifyTtl,
    emitThreatNoise,
    forceChase,
    speedBumpTtl,
    speedBumpMul,
    extraTrustHeal,
    lucidityBoost,
    consumeFood,
    emitDistractNoise,
    distractOffset,
    applied,
    rejected,
  };
}

interface GateEntityState {
  pacifiedLeft: number;
  speedBumpLeft: number;
  speedBumpMul: number;
}

/**
 * Estado runtime de TTLs de gates (por entityId).
 * Se mergea con attitudeFromTrust para HostileSim.
 */
export class DialogueBehaviorGates {
  private readonly states = new Map<string, GateEntityState>();
  /** Últimos tags aplicados por id. No es TTL — sobrevive tick(); F5/F9 vía persist. */
  private readonly lastAppliedTags = new Map<string, GateTag[]>();
  /** Últimos tags rechazados por id. No es TTL — sobrevive tick(); F5/F9 vía persist. */
  private readonly lastRejectedTags = new Map<string, GateTag[]>();
  /**
   * Última línea formateada de gate por id (`formatGateLine`).
   * No es TTL — sobrevive tick(); F5/F9 vía persist. No reconstruye desde tags.
   */
  private readonly lastGateLines = new Map<string, string>();

  clear(): void {
    this.states.clear();
    this.lastAppliedTags.clear();
    this.lastRejectedTags.clear();
    this.lastGateLines.clear();
  }

  unregister(id: string): void {
    this.states.delete(id);
    this.lastAppliedTags.delete(id);
    this.lastRejectedTags.delete(id);
    this.lastGateLines.delete(id);
  }

  /** Ids con TTL activo. */
  ids(): readonly string[] {
    return [...this.states.keys()];
  }

  /** Ids con lastApplied nonempty (puede existir tras TTL 0). */
  lastAppliedIds(): readonly string[] {
    const out: string[] = [];
    for (const [id, tags] of this.lastAppliedTags) {
      if (tags.length > 0) out.push(id);
    }
    return out;
  }

  /** Ids con lastRejected nonempty (puede existir tras TTL 0). */
  lastRejectedIds(): readonly string[] {
    const out: string[] = [];
    for (const [id, tags] of this.lastRejectedTags) {
      if (tags.length > 0) out.push(id);
    }
    return out;
  }

  /** Ids con última línea de gate nonempty (puede existir tras TTL 0). */
  gateLineIds(): readonly string[] {
    const out: string[] = [];
    for (const [id, line] of this.lastGateLines) {
      if (line) out.push(id);
    }
    return out;
  }

  /**
   * Restaura TTLs (F5/F9). Omite si ambos TTL ≤ 0.
   * No mergea: reemplaza el estado de ese id.
   */
  restore(
    id: string,
    state: { pacifiedLeft: number; speedBumpLeft: number; speedBumpMul: number },
  ): void {
    const pacifiedLeft = Number.isFinite(state.pacifiedLeft)
      ? Math.max(0, state.pacifiedLeft)
      : 0;
    const speedBumpLeft = Number.isFinite(state.speedBumpLeft)
      ? Math.max(0, state.speedBumpLeft)
      : 0;
    if (pacifiedLeft <= 0 && speedBumpLeft <= 0) return;
    const mulRaw = state.speedBumpMul;
    const speedBumpMul =
      speedBumpLeft > 0 && Number.isFinite(mulRaw) && mulRaw > 0 ? mulRaw : 1;
    this.states.set(id, { pacifiedLeft, speedBumpLeft, speedBumpMul });
  }

  pacifiedLeft(id: string): number {
    return this.states.get(id)?.pacifiedLeft ?? 0;
  }

  speedBumpLeft(id: string): number {
    return this.states.get(id)?.speedBumpLeft ?? 0;
  }

  /** Mul activo del speed bump; 1 si inactivo. */
  speedBumpMul(id: string): number {
    const st = this.states.get(id);
    if (!st || st.speedBumpLeft <= 0) return 1;
    return st.speedBumpMul;
  }

  isPacifiedByGate(id: string): boolean {
    return this.pacifiedLeft(id) > 0;
  }

  /** Últimos tags validados (`proposal.applied`); vacío si nunca aplicó. */
  lastApplied(id: string): readonly GateTag[] {
    const tags = this.lastAppliedTags.get(id);
    return tags ? [...tags] : [];
  }

  /** Últimos tags rechazados (`proposal.rejected`); vacío si nunca rechazó. */
  lastRejected(id: string): readonly GateTag[] {
    const tags = this.lastRejectedTags.get(id);
    return tags ? [...tags] : [];
  }

  /**
   * Restaura lastApplied (F5/F9). Reemplaza el id; omite lista vacía.
   * No toca TTLs ni lastRejected.
   */
  restoreLastApplied(id: string, tags: readonly GateTag[]): void {
    if (!id || tags.length === 0) return;
    this.lastAppliedTags.set(id, [...tags]);
  }

  /**
   * Restaura lastRejected (F5/F9). Reemplaza el id; omite lista vacía.
   * No toca TTLs ni lastApplied.
   */
  restoreLastRejected(id: string, tags: readonly GateTag[]): void {
    if (!id || tags.length === 0) return;
    this.lastRejectedTags.set(id, [...tags]);
  }

  /** Última línea formateada (`formatGateLine`); null si nunca se guardó. */
  gateLine(id: string): string | null {
    return this.lastGateLines.get(id) ?? null;
  }

  /**
   * Restaura la última línea de gate (F5/F9 / tras formatGateLine).
   * Reemplaza el id; omite vacío. No toca TTLs ni lastApplied/lastRejected.
   */
  restoreGateLine(id: string, line: string): void {
    if (!id || typeof line !== "string") return;
    const trimmed = line.trim();
    if (!trimmed) return;
    this.lastGateLines.set(
      id,
      trimmed.length > GATE_LINE_MAX_LEN
        ? trimmed.slice(0, GATE_LINE_MAX_LEN)
        : trimmed,
    );
  }

  /** Aplica propuesta validada (refuerza TTL si ya había). */
  apply(entityId: string, proposal: GateProposal): void {
    let st = this.states.get(entityId);
    if (!st) {
      st = { pacifiedLeft: 0, speedBumpLeft: 0, speedBumpMul: 1 };
      this.states.set(entityId, st);
    }
    if (proposal.pacifyTtl > 0) {
      st.pacifiedLeft = Math.max(st.pacifiedLeft, proposal.pacifyTtl);
    }
    if (proposal.speedBumpTtl > 0) {
      st.speedBumpLeft = Math.max(st.speedBumpLeft, proposal.speedBumpTtl);
      st.speedBumpMul = Math.max(st.speedBumpMul, proposal.speedBumpMul);
    }
    if (proposal.applied.length > 0) {
      this.lastAppliedTags.set(entityId, [...proposal.applied]);
    }
    if (proposal.rejected.length > 0) {
      this.lastRejectedTags.set(entityId, [...proposal.rejected]);
    }
  }

  tick(dt: number): void {
    if (dt <= 0) return;
    for (const [id, st] of this.states) {
      if (st.pacifiedLeft > 0) {
        st.pacifiedLeft = Math.max(0, st.pacifiedLeft - dt);
      }
      if (st.speedBumpLeft > 0) {
        st.speedBumpLeft = Math.max(0, st.speedBumpLeft - dt);
        if (st.speedBumpLeft <= 0) st.speedBumpMul = 1;
      }
      if (st.pacifiedLeft <= 0 && st.speedBumpLeft <= 0) {
        this.states.delete(id);
      }
    }
  }

  /**
   * Combina attitude de trust + TTLs de gates.
   * Pacify por trust O por TTL; speedMul toma el máximo.
   */
  mergeAttitude(id: string, base: HostileAttitude): HostileAttitudeMod {
    const st = this.states.get(id);
    const pacified = base.pacified || (!!st && st.pacifiedLeft > 0);
    let speedMul = base.speedMul;
    if (st && st.speedBumpLeft > 0) {
      speedMul = Math.max(speedMul, st.speedBumpMul);
    }
    // Pacificado: no damage / no chase (speedMul irrelevante para chase)
    return {
      pacified,
      speedMul: pacified ? base.speedMul : speedMul,
      attackCdMul: base.attackCdMul,
      damageMul: pacified ? 0 : base.damageMul,
    };
  }

  /** Snapshot attitudes listos para HostileSim.tick. */
  mergeAttitudes(
    base: ReadonlyMap<string, HostileAttitude>,
  ): Map<string, HostileAttitudeMod> {
    const out = new Map<string, HostileAttitudeMod>();
    const ids = new Set<string>([...base.keys(), ...this.states.keys()]);
    for (const id of ids) {
      const b = base.get(id) ?? {
        pacified: false,
        speedMul: 1,
        attackCdMul: 1,
        damageMul: 1,
      };
      out.set(id, this.mergeAttitude(id, b));
    }
    return out;
  }
}

/** Helpers de umbral (tests / docs). */
export const GATE_THRESHOLDS = {
  calmMinTrust: GATE_CALM_MIN_TRUST,
  calmPacifyTtl: GATE_CALM_PACIFY_TTL,
  threatMaxTrust: GATE_THREAT_MAX_TRUST,
  threatSpeedTtl: GATE_THREAT_SPEED_TTL,
  threatSpeedMul: GATE_THREAT_SPEED_MUL,
  askMinTrust: GATE_ASK_MIN_TRUST,
  askExtraTrust: GATE_ASK_EXTRA_TRUST,
  offerMinTrust: GATE_OFFER_MIN_TRUST,
  offerPacifyTtl: GATE_OFFER_PACIFY_TTL,
  distractMinTrust: GATE_DISTRACT_MIN_TRUST,
  distractNoise: GATE_DISTRACT_NOISE,
  distractDefaultOffset: GATE_DISTRACT_DEFAULT_OFFSET,
  trustPacify: TRUST_PACIFY,
  trustAggro: TRUST_AGGRO,
} as const;
