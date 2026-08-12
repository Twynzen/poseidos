/**
 * Marcadores visuales (inspirado chess): anillo de suelo + badge flotante.
 * Colores/roles headless — la geometría vive en worldView.
 */

export type MarkerRole = "player" | "mute" | "possessed";

export interface MarkerPalette {
  /** Anillo de suelo (hex). */
  ring: number;
  /** Badge / icono flotante (hex). */
  badge: number;
  /** Emissive suave del badge. */
  emissive: number;
  /** Glifo simple para canvas/HTML (opcional). */
  glyph: string;
}

/** mute=rojo · poseído=púrpura · player=azul */
export const MARKER_PALETTE: Readonly<Record<MarkerRole, MarkerPalette>> = {
  player: {
    ring: 0x3a7fd4,
    badge: 0x7eb6ef,
    emissive: 0x1a4060,
    glyph: "●",
  },
  mute: {
    ring: 0xc43c3c,
    badge: 0xff6b6b,
    emissive: 0x401010,
    glyph: "✕",
  },
  possessed: {
    ring: 0x8b3db8,
    badge: 0xc77dff,
    emissive: 0x2a1040,
    glyph: "◆",
  },
};

/** Solo mostrar marcador de amenaza si está en FOV del player. */
export function markerVisibleInFov(inFov: boolean): boolean {
  return inFov;
}

export function paletteFor(role: MarkerRole): MarkerPalette {
  return MARKER_PALETTE[role];
}

export function roleFromHostileKind(kind: "mute" | "possessed"): MarkerRole {
  return kind;
}
