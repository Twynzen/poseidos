/**
 * Snapshot/restore headless del runtime possession (F5/F9).
 * Solo consecuencias ya validadas: trust, TTLs de gates, lastApplied, lastRejected,
 * última línea de gate, mood bias, memoria corta.
 * No burbujas, timers de display ni LLM.
 */

import { clampTrust, type TrustLedger } from "./trust";
import {
  GATE_LINE_MAX_LEN,
  type DialogueBehaviorGates,
  type GateTag,
} from "./gates";
import type { SpeechDirector } from "./speech";
import { POSSESSION_TONES, type PossessionTone } from "./lineBank";
import { DIALOGUE_OPTIONS, type DialogueIntent } from "./dialogue";
import {
  MEMORY_CAPACITY,
  type MemoryEntry,
  type ShortMemory,
} from "./memory";

export interface SaveGateState {
  pacifiedLeft: number;
  speedBumpLeft: number;
  speedBumpMul: number;
}

export interface SavePossession {
  trust: Record<string, number>;
  gates: Record<string, SaveGateState>;
  moodBias: Record<string, PossessionTone>;
  /** Últimas interacciones validadas; solo ids con entradas. */
  memory: Record<string, MemoryEntry[]>;
  /**
   * Últimos tags aplicados por id (hermano de `gates`, no TTL).
   * Solo ids con tags conocidos nonempty. Puede existir tras TTL 0.
   */
  lastApplied: Record<string, GateTag[]>;
  /**
   * Últimos tags rechazados por id (hermano de `gates` / `lastApplied`, no TTL).
   * Solo ids con tags conocidos nonempty. Puede existir tras TTL 0.
   */
  lastRejected: Record<string, GateTag[]>;
  /**
   * Última línea formateada de gate por id (`formatGateLine`).
   * Hermano de lastApplied / lastRejected; no se reconstruye desde tags.
   * Solo ids con string nonempty (cap GATE_LINE_MAX_LEN).
   */
  gateLine: Record<string, string>;
}

const TONE_SET = new Set<string>(POSSESSION_TONES);
const INTENT_SET = new Set<string>(DIALOGUE_OPTIONS.map((o) => o.intent));
const GATE_TAG_SET = new Set<string>([
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
] satisfies GateTag[]);

function isTone(value: unknown): value is PossessionTone {
  return typeof value === "string" && TONE_SET.has(value);
}

function isIntent(value: unknown): value is DialogueIntent {
  return typeof value === "string" && INTENT_SET.has(value);
}

function isGateTag(value: unknown): value is GateTag {
  return typeof value === "string" && GATE_TAG_SET.has(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function emptyPossession(): SavePossession {
  return {
    trust: {},
    gates: {},
    moodBias: {},
    memory: {},
    lastApplied: {},
    lastRejected: {},
    gateLine: {},
  };
}

/** Serializa solo ids con estado. */
export function capturePossession(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  speech: SpeechDirector,
  memory: ShortMemory,
): SavePossession {
  const trust: Record<string, number> = {};
  for (const id of ledger.ids()) {
    trust[id] = ledger.get(id);
  }

  const gateOut: Record<string, SaveGateState> = {};
  for (const id of gates.ids()) {
    const pacifiedLeft = gates.pacifiedLeft(id);
    const speedBumpLeft = gates.speedBumpLeft(id);
    if (pacifiedLeft <= 0 && speedBumpLeft <= 0) continue;
    gateOut[id] = {
      pacifiedLeft,
      speedBumpLeft,
      speedBumpMul: gates.speedBumpMul(id),
    };
  }

  const moodBias: Record<string, PossessionTone> = {};
  for (const id of speech.ids()) {
    const bias = speech.getMoodBias(id);
    if (bias) moodBias[id] = bias;
  }

  const memoryOut: Record<string, MemoryEntry[]> = {};
  for (const id of memory.ids()) {
    const entries = memory.recent(id);
    if (entries.length === 0) continue;
    memoryOut[id] = entries.slice(-MEMORY_CAPACITY).map((e) => ({ ...e }));
  }

  const lastApplied: Record<string, GateTag[]> = {};
  for (const id of gates.lastAppliedIds()) {
    const tags = gates.lastApplied(id);
    if (tags.length === 0) continue;
    lastApplied[id] = [...tags];
  }

  const lastRejected: Record<string, GateTag[]> = {};
  for (const id of gates.lastRejectedIds()) {
    const tags = gates.lastRejected(id);
    if (tags.length === 0) continue;
    lastRejected[id] = [...tags];
  }

  const gateLine: Record<string, string> = {};
  for (const id of gates.gateLineIds()) {
    const line = normalizeGateLine(gates.gateLine(id));
    if (!line) continue;
    gateLine[id] = line;
  }

  return {
    trust,
    gates: gateOut,
    moodBias,
    memory: memoryOut,
    lastApplied,
    lastRejected,
    gateLine,
  };
}

/**
 * Clamp/valida blob de save.
 * Trust: mismo clamp que el ledger. Tonos desconocidos se descartan.
 * TTL ≤ 0 se omite (id entero si ambos ≤ 0).
 * Memory: intents/tonos desconocidos, who vacío y trustDelta no finito se descartan;
 * listas vacías se omiten; cada lista se recorta a MEMORY_CAPACITY (más recientes).
 * lastApplied / lastRejected: tags desconocidos se descartan; listas vacías se omiten.
 * gateLine: no-string / vacío se omite; se recorta a GATE_LINE_MAX_LEN.
 */
export function normalizePossession(raw: unknown): SavePossession {
  const out = emptyPossession();
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;

  if (o.trust && typeof o.trust === "object" && !Array.isArray(o.trust)) {
    for (const [id, value] of Object.entries(o.trust as Record<string, unknown>)) {
      if (!id || typeof value !== "number") continue;
      out.trust[id] = clampTrust(value);
    }
  }

  if (o.gates && typeof o.gates === "object" && !Array.isArray(o.gates)) {
    for (const [id, g] of Object.entries(o.gates as Record<string, unknown>)) {
      if (!id || !g || typeof g !== "object" || Array.isArray(g)) continue;
      const rec = g as Record<string, unknown>;
      const pac = finiteNumber(rec.pacifiedLeft) ?? 0;
      const bump = finiteNumber(rec.speedBumpLeft) ?? 0;
      const pacifiedLeft = pac > 0 ? pac : 0;
      const speedBumpLeft = bump > 0 ? bump : 0;
      if (pacifiedLeft <= 0 && speedBumpLeft <= 0) continue;
      let speedBumpMul = finiteNumber(rec.speedBumpMul);
      if (speedBumpMul == null || speedBumpMul <= 0) speedBumpMul = 1;
      if (speedBumpLeft <= 0) speedBumpMul = 1;
      out.gates[id] = { pacifiedLeft, speedBumpLeft, speedBumpMul };
    }
  }

  if (o.moodBias && typeof o.moodBias === "object" && !Array.isArray(o.moodBias)) {
    for (const [id, tone] of Object.entries(o.moodBias as Record<string, unknown>)) {
      if (!id || !isTone(tone)) continue;
      out.moodBias[id] = tone;
    }
  }

  if (o.memory && typeof o.memory === "object" && !Array.isArray(o.memory)) {
    for (const [id, rawList] of Object.entries(
      o.memory as Record<string, unknown>,
    )) {
      if (!id || !Array.isArray(rawList)) continue;
      const list: MemoryEntry[] = [];
      for (const rawEntry of rawList) {
        if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
          continue;
        }
        const rec = rawEntry as Record<string, unknown>;
        if (typeof rec.who !== "string" || !rec.who) continue;
        if (!isIntent(rec.intent) || !isTone(rec.tone)) continue;
        const trustDelta = finiteNumber(rec.trustDelta);
        if (trustDelta == null) continue;
        list.push({
          who: rec.who,
          intent: rec.intent,
          trustDelta,
          tone: rec.tone,
        });
      }
      if (list.length === 0) continue;
      out.memory[id] = list.slice(-MEMORY_CAPACITY);
    }
  }

  if (
    o.lastApplied &&
    typeof o.lastApplied === "object" &&
    !Array.isArray(o.lastApplied)
  ) {
    for (const [id, rawTags] of Object.entries(
      o.lastApplied as Record<string, unknown>,
    )) {
      if (!id || !Array.isArray(rawTags)) continue;
      const tags: GateTag[] = [];
      for (const rawTag of rawTags) {
        if (isGateTag(rawTag)) tags.push(rawTag);
      }
      if (tags.length === 0) continue;
      out.lastApplied[id] = tags;
    }
  }

  if (
    o.lastRejected &&
    typeof o.lastRejected === "object" &&
    !Array.isArray(o.lastRejected)
  ) {
    for (const [id, rawTags] of Object.entries(
      o.lastRejected as Record<string, unknown>,
    )) {
      if (!id || !Array.isArray(rawTags)) continue;
      const tags: GateTag[] = [];
      for (const rawTag of rawTags) {
        if (isGateTag(rawTag)) tags.push(rawTag);
      }
      if (tags.length === 0) continue;
      out.lastRejected[id] = tags;
    }
  }

  if (o.gateLine && typeof o.gateLine === "object" && !Array.isArray(o.gateLine)) {
    for (const [id, rawLine] of Object.entries(
      o.gateLine as Record<string, unknown>,
    )) {
      if (!id) continue;
      const line = normalizeGateLine(rawLine);
      if (!line) continue;
      out.gateLine[id] = line;
    }
  }

  return out;
}

function normalizeGateLine(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > GATE_LINE_MAX_LEN
    ? trimmed.slice(0, GATE_LINE_MAX_LEN)
    : trimmed;
}

/** Reemplaza trust + gates + lastApplied + lastRejected + gateLine + memory; aplica mood bias (no toca burbujas ajenas al snap). */
export function applyPossession(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  speech: SpeechDirector,
  memory: ShortMemory,
  snap: unknown,
): void {
  const parsed = normalizePossession(snap);
  ledger.clear();
  gates.clear();
  memory.clear();
  for (const [id, value] of Object.entries(parsed.trust)) {
    ledger.set(id, value);
  }
  for (const [id, g] of Object.entries(parsed.gates)) {
    gates.restore(id, g);
  }
  for (const [id, tags] of Object.entries(parsed.lastApplied)) {
    gates.restoreLastApplied(id, tags);
  }
  for (const [id, tags] of Object.entries(parsed.lastRejected)) {
    gates.restoreLastRejected(id, tags);
  }
  for (const [id, line] of Object.entries(parsed.gateLine)) {
    gates.restoreGateLine(id, line);
  }
  for (const [id, tone] of Object.entries(parsed.moodBias)) {
    speech.setMoodBias(id, tone);
  }
  for (const [id, entries] of Object.entries(parsed.memory)) {
    memory.restore(id, entries);
  }
}
