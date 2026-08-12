/**
 * Moodles / needs UI thresholds (headless).
 * Needs: 0 = ok, 100 = crítico. HP: 100 = ok, 0 = muerto.
 * Colores/CSS viven en UI; aquí solo nivel + labels.
 */

import type { NeedsState } from "./needs";

export type MoodleLevel = "ok" | "warn" | "critical";

export type MoodleId = "hunger" | "thirst" | "fatigue" | "health";

export interface MoodleView {
  id: MoodleId;
  /** Label corto técnico (Skills P1). */
  label: string;
  /** Glifo compacto. */
  glyph: string;
  /** Valor 0–100 redondeado para UI. */
  value: number;
  level: MoodleLevel;
}

/**
 * Needs: por debajo = ok; entre = warn; >= critical.
 * NEED_CRITICAL (70) es umbral UI temprano — el daño HP por hambre/sed
 * usa NEED_DAMAGE_THRESHOLD=100 en needsDamage.ts (tope de needs).
 */
export const NEED_WARN = 35;
export const NEED_CRITICAL = 70;

/** HP: por encima = ok; entre = warn; <= critical. */
export const HP_WARN = 60;
export const HP_CRITICAL = 30;

export function moodleLevelForNeed(value: number): MoodleLevel {
  if (value >= NEED_CRITICAL) return "critical";
  if (value >= NEED_WARN) return "warn";
  return "ok";
}

export function moodleLevelForHealth(hp: number): MoodleLevel {
  if (hp <= HP_CRITICAL) return "critical";
  if (hp <= HP_WARN) return "warn";
  return "ok";
}

const LABELS: Record<MoodleId, { label: string; glyph: string }> = {
  hunger: { label: "HMB", glyph: "⬡" },
  thirst: { label: "SED", glyph: "◈" },
  fatigue: { label: "CAN", glyph: "◌" },
  health: { label: "HP", glyph: "✚" },
};

/** Construye las 4 pills (hambre/sed/cansancio/HP) para el HUD. */
export function buildMoodles(needs: NeedsState, health: number): MoodleView[] {
  return [
    {
      id: "hunger",
      ...LABELS.hunger,
      value: Math.round(needs.hunger),
      level: moodleLevelForNeed(needs.hunger),
    },
    {
      id: "thirst",
      ...LABELS.thirst,
      value: Math.round(needs.thirst),
      level: moodleLevelForNeed(needs.thirst),
    },
    {
      id: "fatigue",
      ...LABELS.fatigue,
      value: Math.round(needs.fatigue),
      level: moodleLevelForNeed(needs.fatigue),
    },
    {
      id: "health",
      ...LABELS.health,
      value: Math.round(health),
      level: moodleLevelForHealth(health),
    },
  ];
}
