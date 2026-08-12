/**
 * Banco de líneas en español (F4) — tono horror.
 * Determinista vía RNG; sin LLM.
 */

export type PossessionTone = "lucidez" | "demonio" | "ruega";

export const POSSESSION_TONES: readonly PossessionTone[] = [
  "lucidez",
  "demonio",
  "ruega",
] as const;

/** Líneas por tono. Lucidez = humano asoma; demonio = posesión plena; ruega = pide ayuda/muerte. */
export const LINE_BANK: Readonly<Record<PossessionTone, readonly string[]>> = {
  lucidez: [
    "Sé quién soy… todavía. Ayúdame.",
    "Hay algo detrás de mis ojos. No lo dejes hablar.",
    "Recuerdo mi nombre. Dímelo otra vez… por favor.",
    "No soy yo cuando sonrío así.",
    "El frío viene de adentro. Corre antes de que vuelva.",
  ],
  demonio: [
    "Tu miedo tiene buen sabor.",
    "Abre la puerta. Ya estamos dentro.",
    "Ruega más fuerte. Nos gusta.",
    "Esta carne es prestada. La tuya será nuestra.",
    "Silencio. Solo queremos oírte gritar.",
    "¡Eh! ¡Mirad allá! El ruido viene de lejos…",
    "Grito lejos. Que corran los mudos hacia la sombra, no hacia ti.",
  ],
  ruega: [
    "¡Máteme antes de que vuelva!",
    "No me escuches… ¡no me escuches!",
    "Por favor… no te acerques. Duele cuando habla.",
    "Si me tocas, él te ve. ¡Vete!",
    "No soy yo. No soy yo. No soy yo.",
    "Dame de comer… antes de que él pida otra cosa.",
    "El hambre no es mía. Dale algo y se calla un rato.",
  ],
};

/** Elige tono; si hay bias, ~60% bias / ~20% cada otro. */
export function pickTone(rng: () => number, bias?: PossessionTone): PossessionTone {
  if (!bias) {
    const i = Math.floor(rng() * POSSESSION_TONES.length);
    return POSSESSION_TONES[Math.min(i, POSSESSION_TONES.length - 1)]!;
  }
  const r = rng();
  if (r < 0.6) return bias;
  const others = POSSESSION_TONES.filter((t) => t !== bias);
  const i = Math.floor(rng() * others.length);
  return others[Math.min(i, others.length - 1)]!;
}

/** Línea del banco para el tono. */
export function pickLine(tone: PossessionTone, rng: () => number): string {
  const lines = LINE_BANK[tone];
  if (lines.length === 0) return "…";
  const i = Math.floor(rng() * lines.length);
  return lines[Math.min(i, lines.length - 1)]!;
}

export function lineCount(tone?: PossessionTone): number {
  if (tone) return LINE_BANK[tone].length;
  return POSSESSION_TONES.reduce((n, t) => n + LINE_BANK[t].length, 0);
}
