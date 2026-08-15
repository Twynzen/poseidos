/**
 * Snapshot/restore headless del runtime possession (F5/F9).
 * Solo consecuencias ya validadas: trust, TTLs de gates, mood bias, memoria corta.
 * No burbujas, timers de display ni LLM.
 */

import { clampTrust, type TrustLedger } from "./trust";
import type { DialogueBehaviorGates } from "./gates";
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
}

const TONE_SET = new Set<string>(POSSESSION_TONES);
const INTENT_SET = new Set<string>(DIALOGUE_OPTIONS.map((o) => o.intent));

function isTone(value: unknown): value is PossessionTone {
  return typeof value === "string" && TONE_SET.has(value);
}

function isIntent(value: unknown): value is DialogueIntent {
  return typeof value === "string" && INTENT_SET.has(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function emptyPossession(): SavePossession {
  return { trust: {}, gates: {}, moodBias: {}, memory: {} };
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

  return { trust, gates: gateOut, moodBias, memory: memoryOut };
}

/**
 * Clamp/valida blob de save.
 * Trust: mismo clamp que el ledger. Tonos desconocidos se descartan.
 * TTL ≤ 0 se omite (id entero si ambos ≤ 0).
 * Memory: intents/tonos desconocidos, who vacío y trustDelta no finito se descartan;
 * listas vacías se omiten; cada lista se recorta a MEMORY_CAPACITY (más recientes).
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

  return out;
}

/** Reemplaza trust + gates + memory; aplica mood bias (no toca burbujas ajenas al snap). */
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
  for (const [id, tone] of Object.entries(parsed.moodBias)) {
    speech.setMoodBias(id, tone);
  }
  for (const [id, entries] of Object.entries(parsed.memory)) {
    memory.restore(id, entries);
  }
}
