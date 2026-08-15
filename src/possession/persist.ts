/**
 * Snapshot/restore headless del runtime possession (F5/F9).
 * Solo consecuencias ya validadas: trust, TTLs de gates, mood bias.
 * No burbujas, timers de display, LLM ni memoria corta.
 */

import { clampTrust, type TrustLedger } from "./trust";
import type { DialogueBehaviorGates } from "./gates";
import type { SpeechDirector } from "./speech";
import { POSSESSION_TONES, type PossessionTone } from "./lineBank";

export interface SaveGateState {
  pacifiedLeft: number;
  speedBumpLeft: number;
  speedBumpMul: number;
}

export interface SavePossession {
  trust: Record<string, number>;
  gates: Record<string, SaveGateState>;
  moodBias: Record<string, PossessionTone>;
}

const TONE_SET = new Set<string>(POSSESSION_TONES);

function isTone(value: unknown): value is PossessionTone {
  return typeof value === "string" && TONE_SET.has(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function emptyPossession(): SavePossession {
  return { trust: {}, gates: {}, moodBias: {} };
}

/** Serializa solo ids con estado. */
export function capturePossession(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  speech: SpeechDirector,
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

  return { trust, gates: gateOut, moodBias };
}

/**
 * Clamp/valida blob de save.
 * Trust: mismo clamp que el ledger. Tonos desconocidos se descartan.
 * TTL ≤ 0 se omite (id entero si ambos ≤ 0).
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

  return out;
}

/** Reemplaza trust + gates; aplica mood bias (no toca burbujas ajenas al snap). */
export function applyPossession(
  ledger: TrustLedger,
  gates: DialogueBehaviorGates,
  speech: SpeechDirector,
  snap: unknown,
): void {
  const parsed = normalizePossession(snap);
  ledger.clear();
  gates.clear();
  for (const [id, value] of Object.entries(parsed.trust)) {
    ledger.set(id, value);
  }
  for (const [id, g] of Object.entries(parsed.gates)) {
    gates.restore(id, g);
  }
  for (const [id, tone] of Object.entries(parsed.moodBias)) {
    speech.setMoodBias(id, tone);
  }
}
