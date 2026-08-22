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

/** Transparent del marker-ring mesh. Ctor ringMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_RING_TRANSPARENT = true;

/** Idle marker-ring mesh transparent. Ctor ringMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_RING_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * attach no escribe transparent (ctor constant).
 */
export function markerRingTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace ringMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach no escribe transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerRingTransparentAfterRestart(): boolean {
  return markerRingTransparentFromLook(MARKER_RING_TRANSPARENT_SPAWN);
}

/** DepthWrite del marker-ring mesh. Ctor ringMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_RING_DEPTH_WRITE = false;

/** Idle marker-ring mesh depthWrite. Ctor ringMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_RING_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach no escribe depthWrite (ctor constant).
 */
export function markerRingDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace ringMat.depthWrite AfterRestart; leftover mid-life no filtra.
 * attach no escribe depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerRingDepthWriteAfterRestart(): boolean {
  return markerRingDepthWriteFromLook(MARKER_RING_DEPTH_WRITE_SPAWN);
}

/** Side del marker-ring mesh. Ctor ringMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_RING_SIDE = 2;

/** Idle marker-ring mesh side. Ctor ringMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_RING_SIDE_SPAWN = 2;

/**
 * Side que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.DoubleSide / 2).
 * attach no escribe side (ctor constant).
 */
export function markerRingSideFromLook(side: number): number {
  return side;
}

/**
 * R / softReset: side fresco (idle THREE.DoubleSide / 2).
 * WorldView nace ringMat.side AfterRestart; leftover mid-life no filtra.
 * attach no escribe side (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerRingSideAfterRestart(): number {
  return markerRingSideFromLook(MARKER_RING_SIDE_SPAWN);
}

/** Transparent del marker-icon mesh. Ctor iconMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_TRANSPARENT = true;

/** Idle marker-icon mesh transparent. Ctor iconMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * attach no escribe transparent (ctor constant).
 */
export function markerIconTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace iconMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach no escribe transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerIconTransparentAfterRestart(): boolean {
  return markerIconTransparentFromLook(MARKER_ICON_TRANSPARENT_SPAWN);
}

/** DepthWrite del marker-icon mesh. Ctor iconMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_DEPTH_WRITE = false;

/** Idle marker-icon mesh depthWrite. Ctor iconMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach no escribe depthWrite (ctor constant).
 */
export function markerIconDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace iconMat.depthWrite AfterRestart; leftover mid-life no filtra.
 * attach no escribe depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerIconDepthWriteAfterRestart(): boolean {
  return markerIconDepthWriteFromLook(MARKER_ICON_DEPTH_WRITE_SPAWN);
}

/** Opacity del marker-icon mesh. Ctor iconMat.opacity 0.92 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_OPACITY = 0.92;

/** Idle marker-icon mesh opacity. Ctor iconMat.opacity 0.92 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_OPACITY_SPAWN = 0.92;

/**
 * Opacity que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.92).
 * attach no escribe opacity (ctor constant).
 */
export function markerIconOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 0.92).
 * WorldView nace iconMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach no escribe opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerIconOpacityAfterRestart(): number {
  return markerIconOpacityFromLook(MARKER_ICON_OPACITY_SPAWN);
}

/** Color del marker-icon mesh. Ctor iconMat.color 0xffffff = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_COLOR = 0xffffff;

/** Idle marker-icon mesh color. Ctor iconMat.color 0xffffff = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_COLOR_SPAWN = 0xffffff;

/**
 * Color que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0xffffff).
 * attach no escribe color (ctor constant).
 */
export function markerIconColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle 0xffffff).
 * WorldView nace iconMat.color AfterRestart; leftover mid-life no filtra.
 * attach no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerIconColorAfterRestart(): number {
  return markerIconColorFromLook(MARKER_ICON_COLOR_SPAWN);
}

/** Side del marker-icon mesh. Ctor iconMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_SIDE = 2;

/** Idle marker-icon mesh side. Ctor iconMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_ICON_SIDE_SPAWN = 2;

/**
 * Side que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.DoubleSide / 2).
 * attach no escribe side (ctor constant).
 */
export function markerIconSideFromLook(side: number): number {
  return side;
}

/**
 * R / softReset: side fresco (idle THREE.DoubleSide / 2).
 * WorldView nace iconMat.side AfterRestart; leftover mid-life no filtra.
 * attach no escribe side (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerIconSideAfterRestart(): number {
  return markerIconSideFromLook(MARKER_ICON_SIDE_SPAWN);
}

/** Side del marker-badge mesh. Ctor badgeMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_SIDE = 2;

/** Idle marker-badge mesh side. Ctor badgeMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_SIDE_SPAWN = 2;

/**
 * Side que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.DoubleSide / 2).
 * attach no escribe side (ctor constant).
 */
export function markerBadgeSideFromLook(side: number): number {
  return side;
}

/**
 * R / softReset: side fresco (idle THREE.DoubleSide / 2).
 * WorldView nace badgeMat.side AfterRestart; leftover mid-life no filtra.
 * attach no escribe side (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerBadgeSideAfterRestart(): number {
  return markerBadgeSideFromLook(MARKER_BADGE_SIDE_SPAWN);
}

/** Intensidad del marker-badge mesh. Ctor badgeMat.emissiveIntensity: 0.65 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_EMISSIVE_INTENSITY = 0.65;

/** Idle marker-badge mesh emissiveIntensity. Ctor badgeMat.emissiveIntensity: 0.65 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_EMISSIVE_INTENSITY_SPAWN = 0.65;

/**
 * Intensidad que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.65).
 * attach no escribe emissiveIntensity (ctor constant).
 */
export function markerBadgeEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 0.65).
 * WorldView nace badgeMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach no escribe emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerBadgeEmissiveIntensityAfterRestart(): number {
  return markerBadgeEmissiveIntensityFromLook(MARKER_BADGE_EMISSIVE_INTENSITY_SPAWN);
}

/** Roughness del marker-badge mesh. Ctor badgeMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_ROUGHNESS = 0.45;

/** Idle marker-badge mesh roughness. Ctor badgeMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_ROUGHNESS_SPAWN = 0.45;

/**
 * Roughness que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.45).
 * attach no escribe roughness (ctor constant).
 */
export function markerBadgeRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.45).
 * WorldView nace badgeMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach no escribe roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerBadgeRoughnessAfterRestart(): number {
  return markerBadgeRoughnessFromLook(MARKER_BADGE_ROUGHNESS_SPAWN);
}

/** Metalness del marker-badge mesh. Ctor badgeMat.metalness: 0.1 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_METALNESS = 0.1;

/** Idle marker-badge mesh metalness. Ctor badgeMat.metalness: 0.1 = fresco. Mid-life leftover ≠ fresco. */
export const MARKER_BADGE_METALNESS_SPAWN = 0.1;

/**
 * Metalness que leería attach (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.1).
 * attach no escribe metalness (ctor constant).
 */
export function markerBadgeMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0.1).
 * WorldView nace badgeMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach no escribe metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function markerBadgeMetalnessAfterRestart(): number {
  return markerBadgeMetalnessFromLook(MARKER_BADGE_METALNESS_SPAWN);
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
