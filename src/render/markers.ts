/**
 * Marcadores visuales (inspirado chess): anillo de suelo + badge flotante.
 * Colores/roles headless — la geometría vive en worldView.
 */

export type MarkerRole = "player" | "mute" | "possessed" | "loot" | "door" | "bed";

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

/** mute=rojo · poseído=púrpura · player=azul · loot=ámbar · door=steel · bed=púrpura sleep */
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
  loot: {
    ring: 0xd4a03a,
    badge: 0xf0c060,
    emissive: 0x403010,
    glyph: "▣",
  },
  door: {
    ring: 0x5c7388,
    badge: 0x8aa4b8,
    emissive: 0x182028,
    glyph: "⊓",
  },
  bed: {
    ring: 0x7a6490,
    badge: 0xa890b8,
    emissive: 0x201828,
    glyph: "▭",
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
