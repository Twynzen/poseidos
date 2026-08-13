/**
 * Moodles / needs UI thresholds (headless).
 * Needs: 0 = ok, 100 = crítico. HP: 100 = ok, 0 = muerto.
 * Colores/CSS viven en UI; aquí solo nivel + labels.
 */

import type { NeedsState } from "./needs";

export type MoodleLevel = "ok" | "warn" | "critical";

export type MoodleId =
  | "hunger"
  | "thirst"
  | "fatigue"
  | "health"
  | "ammo"
  | "clock";

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

/** Munición: por encima = ok; entre = warn; <= critical. */
export const AMMO_WARN = 2;
export const AMMO_CRITICAL = 0;

/** Noche: phasePct < este umbral = warn; >= = critical. */
export const CLOCK_NIGHT_DARK = 30;

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

export function moodleLevelForAmmo(qty: number): MoodleLevel {
  if (qty <= AMMO_CRITICAL) return "critical";
  if (qty <= AMMO_WARN) return "warn";
  return "ok";
}

const LABELS: Record<MoodleId, { label: string; glyph: string }> = {
  hunger: { label: "Hambre", glyph: "⬡" },
  thirst: { label: "Sed", glyph: "◈" },
  fatigue: { label: "Cansancio", glyph: "◌" },
  health: { label: "Vida", glyph: "✚" },
  ammo: { label: "Balas", glyph: "◉" },
  clock: { label: "DIA", glyph: "☀" },
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

/** Pill BAL solo si hay pistola (qty>0). Sin pistola → null (HUD no muestra). */
export function ammoMoodle(
  hasPistol: boolean,
  ammoQty: number,
): MoodleView | null {
  if (!hasPistol) return null;
  return {
    id: "ammo",
    ...LABELS.ammo,
    value: Math.round(ammoQty),
    level: moodleLevelForAmmo(ammoQty),
  };
}

/** Pill DIA (día ok) / NOC (noche warn si pct<30, si no critical). */
export function clockMoodle(isNight: boolean, phasePct: number): MoodleView {
  const value = Math.round(phasePct);
  if (!isNight) {
    return {
      id: "clock",
      label: "DIA",
      glyph: "☀",
      value,
      level: "ok",
    };
  }
  return {
    id: "clock",
    label: "NOC",
    glyph: "☾",
    value,
    level: value < CLOCK_NIGHT_DARK ? "warn" : "critical",
  };
}

/** 4 pills de needs/HP + BAL si hay pistola + clock al final. */
export function buildHudMoodles(
  needs: NeedsState,
  health: number,
  hasPistol: boolean,
  ammoQty: number,
  isNight: boolean,
  phasePct: number,
): MoodleView[] {
  const pills = buildMoodles(needs, health);
  const ammo = ammoMoodle(hasPistol, ammoQty);
  const clock = clockMoodle(isNight, phasePct);
  return ammo ? [...pills, ammo, clock] : [...pills, clock];
}
