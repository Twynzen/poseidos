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
    ring: 0x4392f4,
    badge: 0x91d1ff,
    emissive: 0x1e4a6e,
    glyph: "●",
  },
  mute: {
    ring: 0xe14545,
    badge: 0xff7b7b,
    emissive: 0x4a1212,
    glyph: "✕",
  },
  possessed: {
    ring: 0xa046d4,
    badge: 0xe590ff,
    emissive: 0x30124a,
    glyph: "◆",
  },
  loot: {
    ring: 0xf4b843,
    badge: 0xffdd6e,
    emissive: 0x4a3712,
    glyph: "▣",
  },
  door: {
    ring: 0x6a849c,
    badge: 0x9fbdd4,
    emissive: 0x1c252e,
    glyph: "⊓",
  },
  bed: {
    ring: 0x8c73a6,
    badge: 0xc1a6d4,
    emissive: 0x251c2e,
    glyph: "▭",
  },
};

/** Solo mostrar marcador de amenaza si está en FOV del player. */
export function markerVisibleInFov(inFov: boolean): boolean {
  return inFov;
}

/** Opacidad del anillo de suelo para roles no-player (loot/door/bed/mute/possessed). 0.598 × 1.15 para leerse de noche. */
export const MARKER_RING_OPACITY = 0.6877;

/** Opacidad del foot ring del player (0 = oculto; el chevron queda). */
export const PLAYER_FOOT_RING_OPACITY = 0;

/** Anillo player 0 (oculto); resto 0.6877. */
export function markerRingOpacity(role: MarkerRole): number {
  return role === "player" ? PLAYER_FOOT_RING_OPACITY : MARKER_RING_OPACITY;
}

/** Radio interior del aro loot/puerta/cama. 0.4785 × 0.87 para leerse de noche. */
export const INTERACT_RING_INNER = 0.416295;

/** Radio exterior del aro loot/puerta/cama. 0.897 × 1.15 para leerse de noche. */
export const INTERACT_RING_OUTER = 1.03155;

/** Radio interior del aro mute/possessed. 0.435 × 0.87 para leerse de noche. */
export const THREAT_RING_INNER = 0.37845;

/** Radio exterior del aro mute/possessed. 0.782 × 1.15 para leerse de noche. */
export const THREAT_RING_OUTER = 0.8993;

/**
 * Aros mute/possessed estáticos: sin pulso (no hay threatFocus).
 * 0 = lock; no inventar seno. loot/door/bed siguen en 0.05.
 */
export const THREAT_RING_PULSE_AMP = 0;

export interface MarkerRingRadii {
  inner: number;
  outer: number;
}

/** loot/door/bed usan el aro más grande; player/mute/possessed no. */
export function markerUsesInteractRing(role: MarkerRole): boolean {
  return role === "loot" || role === "door" || role === "bed";
}

/** Radios del aro de suelo. Player no monta mesh (opacity 0). */
export function markerRingRadii(role: MarkerRole): MarkerRingRadii {
  if (markerUsesInteractRing(role)) {
    return { inner: INTERACT_RING_INNER, outer: INTERACT_RING_OUTER };
  }
  return { inner: THREAT_RING_INNER, outer: THREAT_RING_OUTER };
}

/** Altura world del floatBadge mute (2.3 × 1.15, misma banda door/bed/loot; queda por encima del Soldier 1.5). */
export const muteBadgeY = 2.645;

/** Altura world del floatBadge poseído (2.3 × 1.15, misma banda door/bed/loot; queda por encima del Soldier 1.5). */
export const possessedBadgeY = 2.645;

/** Escala world del glifo mute (0.7 × 1.15, misma convención door/bed letter/disc; mute más angular). */
export const muteBadgeIconScale = 0.805;

/** Escala world del glifo poseído (0.85 × 1.15, misma convención door/bed letter/disc). */
export const possessedBadgeIconScale = 0.9775;

/** Opacidad del badge flotante para door/bed (E/Z). */
export const MARKER_BADGE_OPACITY = 1;

/** Opacidad del badge del player (0 = oculto; el chevron queda). */
export const PLAYER_BADGE_OPACITY = 0;

/** Opacidad del badge flotante de loot (0 = oculto; queda el nameplate). */
export const LOOT_BADGE_OPACITY = 0;

/** Opacidad del badge flotante mute (0 = oculto; quedan look + aro). */
export const MUTE_BADGE_OPACITY = 0;

/** Opacidad del badge flotante poseído (0 = oculto; quedan look + aro). */
export const POSSESSED_BADGE_OPACITY = 0;

/** Badge player/loot/mute/possessed 0 (oculto); door/bed 1. */
export function markerBadgeOpacity(role: MarkerRole): number {
  if (role === "player") return PLAYER_BADGE_OPACITY;
  if (role === "loot") return LOOT_BADGE_OPACITY;
  if (role === "mute") return MUTE_BADGE_OPACITY;
  if (role === "possessed") return POSSESSED_BADGE_OPACITY;
  return MARKER_BADGE_OPACITY;
}

export function paletteFor(role: MarkerRole): MarkerPalette {
  return MARKER_PALETTE[role];
}

export function roleFromHostileKind(kind: "mute" | "possessed"): MarkerRole {
  return kind;
}
