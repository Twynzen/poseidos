import * as THREE from "three";
import {
  markerBadgeEmissiveIntensityAfterRestart,
  markerBadgeMetalnessAfterRestart,
  markerBadgeOpacity,
  markerBadgeRoughnessAfterRestart,
  markerBadgeSideAfterRestart,
  markerIconColorAfterRestart,
  markerIconDepthWriteAfterRestart,
  markerIconOpacityAfterRestart,
  markerIconSideAfterRestart,
  markerIconTransparentAfterRestart,
  markerRingDepthWriteAfterRestart,
  markerRingOpacity,
  markerRingRadii,
  markerRingSideAfterRestart,
  markerRingTransparentAfterRestart,
  markerUsesInteractRing,
  muteBadgeIconScale,
  muteBadgeY,
  paletteFor,
  possessedBadgeIconScale,
  possessedBadgeY,
  type MarkerRole,
} from "./markers";
import {
  FACING_CHEVRON_HW,
  FACING_CHEVRON_LEN,
  facingChevronColorAfterRestart,
  facingChevronDepthWriteAfterRestart,
  facingChevronOpacityAfterRestart,
  facingChevronRenderOrderAfterRestart,
  facingChevronSideAfterRestart,
  facingChevronTransparentAfterRestart,
  facingChevronOffset,
  facingChevronOffsetXAfterRestart,
  facingChevronOffsetXFromLook,
  facingChevronOffsetZAfterRestart,
  facingChevronOffsetZFromLook,
  facingChevronVisible,
  facingChevronYawAfterRestart,
  facingChevronYawFromLook,
} from "./facingChevron";
import {
  FLASHLIGHT_CONE_HALF_WIDTH,
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_CONE_Y,
  FLASHLIGHT_FILL_INTENSITY_MUL,
  FLASHLIGHT_SPOT_COLOR,
  FLASHLIGHT_SPOT_INTENSITY_MUL,
  flashlightConeColorAfterRestart,
  flashlightConeVertexColorsAfterRestart,
  flashlightConeSideAfterRestart,
  flashlightConeBlendingAfterRestart,
  flashlightConeOffsetXFromLook,
  flashlightConeOffsetZFromLook,
  flashlightConeTip,
  flashlightConeVisible,
  flashlightConeOpacityAfterRestart,
  flashlightConeOpacityFromLook,
  flashlightConeDepthWriteAfterRestart,
  flashlightConeRenderOrderAfterRestart,
  flashlightConeTransparentAfterRestart,
  flashlightConeVisibleAfterRestart,
  flashlightConeVisibleFromLook,
  flashlightConeYawAfterRestart,
  flashlightConeYawFromLook,
  flashlightFillDistanceAfterRestart,
  flashlightFillDistanceFromLook,
  flashlightFillIntensityAfterRestart,
  flashlightFillIntensityFromLook,
  flashlightFillOriginXAfterRestart,
  flashlightFillOriginXFromLook,
  flashlightFillOriginZAfterRestart,
  flashlightFillOriginZFromLook,
  flashlightFillVisibleAfterRestart,
  flashlightFillVisibleFromLook,
  flashlightFillDecayAfterRestart,
  flashlightSpotOriginXAfterRestart,
  flashlightSpotOriginXFromLook,
  flashlightSpotOriginZAfterRestart,
  flashlightSpotOriginZFromLook,
  flashlightSpotVisibleAfterRestart,
  flashlightSpotVisibleFromLook,
  flashlightSpotTargetXAfterRestart,
  flashlightSpotTargetXFromLook,
  flashlightSpotTargetZAfterRestart,
  flashlightSpotTargetZFromLook,
  flashlightSpotDistanceAfterRestart,
  flashlightSpotDistanceFromLook,
  flashlightSpotIntensityAfterRestart,
  flashlightSpotIntensityFromLook,
  flashlightSpotAngleAfterRestart,
  flashlightSpotPenumbraAfterRestart,
  flashlightSpotDecayAfterRestart,
  flashlightWedgeOpacity,
  flashlightWedgeVertexColors,
} from "./flashlightCone";
import {
  DEFAULT_TRACER_TTL,
  TRACER_HEIGHT,
  TRACER_WIDTH,
  clampTracerTtl,
  tickTracerAge,
  tracerColorAfterRestart,
  tracerCountAfterRestart,
  tracerDepthWriteAfterRestart,
  tracerTransparentAfterRestart,
  tracerFlashColorAfterRestart,
  tracerFlashDecayAfterRestart,
  tracerFlashDistanceAfterRestart,
  tracerLength,
  tracerMidpoint,
  tracerOpacity,
  tracerOpacityAfterRestart,
  tracerOpacityFromLook,
  tracerOverlayApplies,
  tracerYaw,
  type TracerPoint,
} from "./tracers";
import {
  NOISE_RING_INNER,
  applyNoiseRingTick,
  createNoiseRing,
  noiseRingActiveAfterRestart,
  noiseRingApplies,
  noiseRingCountAfterRestart,
  noiseRingDepthWriteAfterRestart,
  noiseRingOpacityAfterRestart,
  noiseRingOpacityFromLook,
  noiseRingScaleAfterRestart,
  noiseRingScaleFromLook,
  noiseRingSideAfterRestart,
  noiseRingTransparentAfterRestart,
  ringColorHex,
  ringOpacity,
  ringScale,
  type NoiseRingState,
} from "./noiseRings";
import {
  createLocoBobState,
  locoBobApplies,
  locoBobLeanZAfterRestart,
  locoBobLeanZFromLook,
  locoBobSwayXAfterRestart,
  locoBobSwayXFromLook,
  locoBobYAfterRestart,
  locoBobYFromLook,
  tickLocoBob as stepLocoBob,
  type LocoBobOutput,
} from "./locoBob";
import {
  createCharacterAnimator,
  currentRole,
  setAction,
  setLocomotion,
  tickCharacterAnimator,
  type CharacterAnimator,
} from "./characterAnimator";
import {
  MUTE_SOLDIER_MANIFEST,
  POSSESSED_SOLDIER_MANIFEST,
  playerManifestCandidates,
  shouldApplySurvivorLook,
  type PlayerOneShotRole,
} from "./characterManifest";
import {
  CAMERA_LOOK_X_SPAWN,
  CAMERA_LOOK_Z_SPAWN,
  ISO_FRUSTUM,
  cameraFollowLookXAfterRestart,
  cameraFollowLookXFromLook,
  cameraFollowLookZAfterRestart,
  cameraFollowLookZFromLook,
  cameraFollowPosXAfterRestart,
  cameraFollowPosXFromLook,
  cameraFollowPosYAfterRestart,
  cameraFollowPosYFromLook,
  cameraFollowPosZAfterRestart,
  cameraFollowPosZFromLook,
} from "./cameraConfig";
import { HOSTILE_VISUAL_SCALE, hostileYaw } from "./hostileFigure";
import {
  hostileIdleApplies,
  hostileLocoFromDelta,
  hostileMixerDt,
} from "./hostileLoco";
import {
  playerGltfYawFromMove,
  playerPosXAfterRestart,
  playerPosXFromLook,
  playerPosZAfterRestart,
  playerPosZFromLook,
} from "./playerFacing";
import { applySurvivorLook } from "./survivorLook";
import { applyPossessedLook } from "./possessedLook";
import { applyMuteLook } from "./muteLook";
import {
  loadCharacterGltf,
  maybeAttachCharacterGltf,
  type LoadedCharacterGltf,
} from "./characterGltf";
import {
  bindMixer,
  type CharacterMixerHandle,
} from "./characterMixer";
import {
  createMeleeSwingState,
  meleeSwingActiveAfterRestart,
  meleeSwingActiveFromLook,
  meleeSwingPitchAfterRestart,
  meleeSwingPitchFromLook,
  meleeSwingYawBiasAfterRestart,
  meleeSwingYawBiasFromLook,
  swingPoseApplies,
  tickMeleeSwing as stepMeleeSwing,
  triggerMeleeSwing,
  type MeleeSwingOutput,
} from "./meleeSwing";
import {
  createHitLeanState,
  hitLeanActiveAfterRestart,
  hitLeanActiveFromLook,
  hitLeanApplies,
  hitLeanPitchAfterRestart,
  hitLeanPitchFromLook,
  hitLeanYawBiasAfterRestart,
  hitLeanYawBiasFromLook,
  tickHitLean as stepHitLean,
  triggerHitLean,
  type HitLeanOutput,
} from "./hitLean";
import {
  cameraShakeActiveAfterRestart,
  cameraShakeActiveFromLook,
  cameraShakeApplies,
  cameraShakeOffsetXAfterRestart,
  cameraShakeOffsetXFromLook,
  cameraShakeOffsetZAfterRestart,
  cameraShakeOffsetZFromLook,
  createCameraShakeState,
  tickCameraShake as stepCameraShake,
  triggerCameraShake,
  type CameraShakeOutput,
} from "./cameraShake";
import {
  MUZZLE_FLASH_RADIUS,
  MUZZLE_LIGHT_PEAK,
  createMuzzleFlash,
  muzzleFlashActiveAfterRestart,
  muzzleFlashActiveFromLook,
  muzzleFlashApplies,
  muzzleFlashBlendingAfterRestart,
  muzzleFlashColorAfterRestart,
  muzzleFlashDepthWriteAfterRestart,
  muzzleFlashTransparentAfterRestart,
  muzzleFlashIntensityAfterRestart,
  muzzleFlashIntensityFromLook,
  muzzleFlashPosXAfterRestart,
  muzzleFlashPosXFromLook,
  muzzleFlashPosYAfterRestart,
  muzzleFlashPosZAfterRestart,
  muzzleFlashPosZFromLook,
  muzzleLightColorAfterRestart,
  muzzleLightDecayAfterRestart,
  muzzleLightDistanceAfterRestart,
  tickMuzzleFlash as stepMuzzleFlash,
  triggerMuzzleFlash as startMuzzleFlash,
} from "./muzzleFlash";
import {
  IMPACT_SPARK_LIGHT_PEAK,
  IMPACT_SPARK_RADIUS,
  createImpactSpark,
  impactSparkActiveAfterRestart,
  impactSparkActiveFromLook,
  impactSparkApplies,
  impactSparkBlendingAfterRestart,
  impactSparkIntensityAfterRestart,
  impactSparkIntensityFromLook,
  impactSparkPosXAfterRestart,
  impactSparkPosXFromLook,
  impactSparkPosYAfterRestart,
  impactSparkPosZAfterRestart,
  impactSparkPosZFromLook,
  impactSparkColorAfterRestart,
  impactSparkDepthWriteAfterRestart,
  impactSparkTransparentAfterRestart,
  impactSparkLightColorAfterRestart,
  impactSparkLightDecayAfterRestart,
  impactSparkLightDistanceAfterRestart,
  tickImpactSpark as stepImpactSpark,
  triggerImpactSpark as startImpactSpark,
} from "./impactSpark";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import {
  applyNightGroundLift,
  BARRICADE_COLOR,
  BARRICADE_EDGE,
  BED_COLOR,
  countAoNeighbors,
  DOOR_CLOSED,
  DOOR_OPEN,
  floorColorAt,
  FURNITURE_COLOR,
  WALL_BASE_COLOR,
  WALL_COLOR,
} from "./floorStyle";
import {
  atmosphereFromClock,
  fogColorAfterRestart,
  fogDepthWriteAfterRestart,
  fogOpacityAfterRestart,
  fogRotXAfterRestart,
  fogRotYAfterRestart,
  fogRotZAfterRestart,
  fogScaleXAfterRestart,
  fogScaleYAfterRestart,
  fogScaleZAfterRestart,
  fogTransparentAfterRestart,
  fogYAfterRestart,
  nightAmbientIntensity,
  nightSunIntensity,
} from "./fogAtmosphere";
import {
  bladePoseFromWindTime,
  BLADE_COLOR,
  grassAnchorTxAfterRestart,
  grassEmissiveAfterRestart,
  grassEmissiveIntensityAfterRestart,
  grassOpacityAfterRestart,
  grassMetalnessAfterRestart,
  grassRoughnessAfterRestart,
  grassAnchorTxFromLook,
  grassAnchorTyAfterRestart,
  grassAnchorTyFromLook,
  grassTilesAfterRestart,
  grassTilesFromLook,
  grassVisibleFromCount,
  grassWindTimeAfterRestart,
  GRASS_RADIUS,
  MAX_GRASS_INSTANCES,
  BLADES_PER_TILE,
  tickGrassWindTime,
  type GrassTile,
} from "./windGrass";
import {
  RAIN_COUNT,
  RAIN_STREAK_LENGTH_DAY,
  RAIN_STREAK_WIDTH,
  rainActiveCountAfterRestart,
  rainActiveCountFromLook,
  rainAnchorXAfterRestart,
  rainAnchorXFromLook,
  rainAnchorZAfterRestart,
  rainAnchorZFromLook,
  rainColorAfterRestart,
  rainDepthWriteAfterRestart,
  rainTransparentAfterRestart,
  rainStreakOpacityAfterRestart,
  rainStreakOpacityFromLook,
  rainStreakScaleYAfterRestart,
  rainStreakScaleYFromLook,
  rainStreaksHiddenAfterRestart,
  rainStreaksHiddenFromLook,
  rainStreakNeedsWrap,
  rainStreakVxAfterRestart,
  rainStreakVxFromDrift,
  rainStreakVxFromPhase,
  rainStreakVyAfterRestart,
  rainStreakVyFromSpeed,
  rainStreakVzAfterRestart,
  rainStreakVzFromPhase,
  rainStreakVzFromZ,
  rainStreakYAfterRestart,
  rainStreakYFromFall,
  rainStreakYFromWrap,
} from "./rainStreaks";
import {
  lootBadgeIconScale,
  lootBadgeY,
  lootFocusDistFromLook,
  lootFocusElapsedAfterRestart,
  lootFocusLookXAfterRestart,
  lootFocusLookZAfterRestart,
  lootFocusMulFromLook,
  lootRingVisibleFromLook,
} from "./lootFocus";
import {
  LOOT_NAMEPLATE_FILL,
  LOOT_NAMEPLATE_FONT_PX,
  LOOT_NAMEPLATE_ICON_PAD,
  LOOT_NAMEPLATE_ICON_SIZE,
  LOOT_NAMEPLATE_PLATE_FILL,
  LOOT_NAMEPLATE_SCALE_X,
  LOOT_NAMEPLATE_SCALE_Y,
  LOOT_NAMEPLATE_STROKE_PX,
  LOOT_NAMEPLATE_TEXT_STROKE,
  LOOT_NAMEPLATE_Y,
  lootNameplateDistFromLook,
  lootNameplateInvEmpty,
  lootNameplateLabel,
  lootNameplateLeadId,
  lootNameplateLookXAfterRestart,
  lootNameplateLookZAfterRestart,
  lootNameplateOpacityFromLook,
  lootNameplateScaleFromLook,
  lootNameplateColorAfterRestart,
  lootNameplateDepthWriteAfterRestart,
  lootNameplateRenderOrderAfterRestart,
  lootNameplateTransparentAfterRestart,
  lootNameplateVisible,
  lootNameplateVisibleFromLook,
  paintLootNameplateIcon,
} from "./lootNameplate";
import {
  doorBadgeDiscScale,
  doorBadgeFontPx,
  doorBadgeLabel,
  doorBadgeLetterScale,
  doorBadgeY,
  doorFocusDistFromLook,
  doorFocusElapsedAfterRestart,
  doorFocusLookXAfterRestart,
  doorFocusLookZAfterRestart,
  doorFocusMulFromLook,
  doorRingVisibleFromLook,
} from "./doorFocus";
import {
  bedBadgeDiscScale,
  bedBadgeFontPx,
  bedBadgeLabel,
  bedBadgeLetterScale,
  bedBadgeY,
  bedFocusDistFromLook,
  bedFocusElapsedAfterRestart,
  bedFocusLookXAfterRestart,
  bedFocusLookZAfterRestart,
  bedFocusMulFromLook,
  bedRingVisibleFromLook,
} from "./bedFocus";
import type { TileMap } from "../world/tilemap";
import type { Tile } from "../world/tile";
import type { Chunk } from "../world/chunk";
import { chunkKey } from "../world/chunk";
import { tileKey } from "../world/los";
import {
  isIndoor,
  warmLightDistanceAfterRestart,
  warmLightDistanceFromLook,
  warmLightIntensityAfterRestart,
  warmLightIntensityFromLook,
  warmLightOriginXAfterRestart,
  warmLightOriginXFromLook,
  warmLightOriginZAfterRestart,
  warmLightOriginZFromLook,
  warmLightVisibleAfterRestart,
  warmLightVisibleFromLook,
  warmLightYAfterRestart,
  warmLightYFromLook,
  warmLightColorGAfterRestart,
  warmLightColorGFromLook,
  warmLightColorBAfterRestart,
  warmLightColorBFromLook,
  warmLightDecayAfterRestart,
} from "../world/indoor";
import type { GameClock } from "../core/clock";
import {
  lootPileLabel,
  type ContainerRegistry,
} from "../items";

/** Color de la silueta fallback (cuerpo). 0x4a8fd4 × 1.15/canal para leerse de noche. */
export const PLAYER_COLOR = 0x55a4f4;

/** Color del player body mesh. Ctor playerBodyMat.color: PLAYER_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_COLOR = 0x55a4f4;

/** Idle player body mesh color. Ctor playerBodyMat.color: PLAYER_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_COLOR_SPAWN = 0x55a4f4;

/**
 * Color que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle PLAYER_COLOR 0x55a4f4).
 * attach/tick no escriben color (ctor constant).
 */
export function playerBodyColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle PLAYER_COLOR 0x55a4f4).
 * WorldView nace playerBodyMat.color AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyColorAfterRestart(): number {
  return playerBodyColorFromLook(PLAYER_BODY_COLOR_SPAWN);
}

/** Roughness del player body mesh. Ctor playerBodyMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_MESH_ROUGHNESS = 0.45;

/** Idle player body mesh roughness. Ctor playerBodyMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_ROUGHNESS_SPAWN = 0.45;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.45).
 * attach/tick no escriben roughness (ctor constant).
 */
export function playerBodyRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.45).
 * WorldView nace playerBodyMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyRoughnessAfterRestart(): number {
  return playerBodyRoughnessFromLook(PLAYER_BODY_ROUGHNESS_SPAWN);
}

/** Metalness del player-body mesh. Ctor playerBodyMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_METALNESS = 0;

/** Idle player-body mesh metalness. Ctor playerBodyMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function playerBodyMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace playerBodyMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyMetalnessAfterRestart(): number {
  return playerBodyMetalnessFromLook(PLAYER_BODY_METALNESS_SPAWN);
}

/** Emisivo del player-body mesh. Ctor playerBodyMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_EMISSIVE = 0x000000;

/** Idle player-body mesh emissive. Ctor playerBodyMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function playerBodyEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace playerBodyMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyEmissiveAfterRestart(): number {
  return playerBodyEmissiveFromLook(PLAYER_BODY_EMISSIVE_SPAWN);
}

/** Intensidad del player-body mesh. Ctor playerBodyMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_EMISSIVE_INTENSITY = 1;

/** Idle player-body mesh emissiveIntensity. Ctor playerBodyMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function playerBodyEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace playerBodyMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyEmissiveIntensityAfterRestart(): number {
  return playerBodyEmissiveIntensityFromLook(PLAYER_BODY_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del player-body mesh. Ctor playerBodyMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_OPACITY = 1;

/** Idle player-body mesh opacity. Ctor playerBodyMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function playerBodyOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace playerBodyMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyOpacityAfterRestart(): number {
  return playerBodyOpacityFromLook(PLAYER_BODY_OPACITY_SPAWN);
}

/** Transparent del player-body mesh. Ctor playerBodyMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_TRANSPARENT = false;

/** Idle player-body mesh transparent. Ctor playerBodyMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_BODY_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function playerBodyTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace playerBodyMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerBodyTransparentAfterRestart(): boolean {
  return playerBodyTransparentFromLook(PLAYER_BODY_TRANSPARENT_SPAWN);
}

/** Color de la silueta fallback (cabeza). 0x7eb6ef × 1.15/canal (b clamp) para leerse de noche. */
export const PLAYER_HEAD_COLOR = 0x91d1ff;

/** Color del player head mesh. Ctor playerHeadMat.color: PLAYER_HEAD_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_MESH_COLOR = 0x91d1ff;

/** Idle player head mesh color. Ctor playerHeadMat.color: PLAYER_HEAD_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_COLOR_SPAWN = 0x91d1ff;

/**
 * Color que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle PLAYER_HEAD_COLOR 0x91d1ff).
 * attach/tick no escriben color (ctor constant).
 */
export function playerHeadColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle PLAYER_HEAD_COLOR 0x91d1ff).
 * WorldView nace playerHeadMat.color AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadColorAfterRestart(): number {
  return playerHeadColorFromLook(PLAYER_HEAD_COLOR_SPAWN);
}

/** Emisivo de la silueta fallback (cabeza). 0x102030 × 1.15/canal para leerse de noche. */
export const PLAYER_HEAD_EMISSIVE = 0x122537;

/** Emisivo del player head mesh. Ctor playerHeadMat.emissive: PLAYER_HEAD_EMISSIVE = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_MESH_EMISSIVE = 0x122537;

/** Idle player head mesh emissive. Ctor playerHeadMat.emissive: PLAYER_HEAD_EMISSIVE = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_EMISSIVE_SPAWN = 0x122537;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle PLAYER_HEAD_EMISSIVE 0x122537).
 * attach/tick no escriben emissive (ctor constant).
 */
export function playerHeadEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle PLAYER_HEAD_EMISSIVE 0x122537).
 * WorldView nace playerHeadMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadEmissiveAfterRestart(): number {
  return playerHeadEmissiveFromLook(PLAYER_HEAD_EMISSIVE_SPAWN);
}

/** Intensidad del player head mesh. Ctor playerHeadMat.emissiveIntensity: 0.22 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_MESH_EMISSIVE_INTENSITY = 0.22;

/** Idle player head mesh emissiveIntensity. Ctor playerHeadMat.emissiveIntensity: 0.22 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_EMISSIVE_INTENSITY_SPAWN = 0.22;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.22).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function playerHeadEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 0.22).
 * WorldView nace playerHeadMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadEmissiveIntensityAfterRestart(): number {
  return playerHeadEmissiveIntensityFromLook(PLAYER_HEAD_EMISSIVE_INTENSITY_SPAWN);
}

/** Roughness del player head mesh. Ctor playerHeadMat.roughness: 0.4 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_MESH_ROUGHNESS = 0.4;

/** Idle player head mesh roughness. Ctor playerHeadMat.roughness: 0.4 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_ROUGHNESS_SPAWN = 0.4;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.4).
 * attach/tick no escriben roughness (ctor constant).
 */
export function playerHeadRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.4).
 * WorldView nace playerHeadMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadRoughnessAfterRestart(): number {
  return playerHeadRoughnessFromLook(PLAYER_HEAD_ROUGHNESS_SPAWN);
}

/** Metalness del player-head mesh. Ctor playerHeadMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_METALNESS = 0;

/** Idle player-head mesh metalness. Ctor playerHeadMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function playerHeadMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace playerHeadMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadMetalnessAfterRestart(): number {
  return playerHeadMetalnessFromLook(PLAYER_HEAD_METALNESS_SPAWN);
}

/** Opacity del player-head mesh. Ctor playerHeadMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_OPACITY = 1;

/** Idle player-head mesh opacity. Ctor playerHeadMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function playerHeadOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace playerHeadMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadOpacityAfterRestart(): number {
  return playerHeadOpacityFromLook(PLAYER_HEAD_OPACITY_SPAWN);
}

/** Transparent del player-head mesh. Ctor playerHeadMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_TRANSPARENT = false;

/** Idle player-head mesh transparent. Ctor playerHeadMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const PLAYER_HEAD_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function playerHeadTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace playerHeadMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function playerHeadTransparentAfterRestart(): boolean {
  return playerHeadTransparentFromLook(PLAYER_HEAD_TRANSPARENT_SPAWN);
}

/** Amenaza muda: rojo oscuro. 0x6b1a1a × 1.15/canal para leerse de noche. */
export const HOSTILE_COLOR = 0x7b1e1e;

/** Color del hostile mesh. Ctor hostileMat.color: HOSTILE_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_MESH_COLOR = 0x7b1e1e;

/** Idle hostile mesh color. Ctor hostileMat.color: HOSTILE_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_COLOR_SPAWN = 0x7b1e1e;

/**
 * Color que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle HOSTILE_COLOR 0x7b1e1e).
 * attach/tick no escriben color (ctor constant).
 */
export function hostileColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle HOSTILE_COLOR 0x7b1e1e).
 * WorldView nace hostileMat.color AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileColorAfterRestart(): number {
  return hostileColorFromLook(HOSTILE_COLOR_SPAWN);
}

/** Roughness del hostile mesh. Ctor hostileMat.roughness: 0.55 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_ROUGHNESS = 0.55;

/** Roughness del hostile mesh. Ctor hostileMat.roughness: 0.55 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_MESH_ROUGHNESS = 0.55;

/** Idle hostile mesh roughness. Ctor hostileMat.roughness: 0.55 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_ROUGHNESS_SPAWN = 0.55;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.55).
 * attach/tick no escriben roughness (ctor constant).
 */
export function hostileRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.55).
 * WorldView nace hostileMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileRoughnessAfterRestart(): number {
  return hostileRoughnessFromLook(HOSTILE_ROUGHNESS_SPAWN);
}

/** Metalness del hostile mesh. Ctor hostileMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_METALNESS = 0;

/** Idle hostile mesh metalness. Ctor hostileMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function hostileMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace hostileMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileMetalnessAfterRestart(): number {
  return hostileMetalnessFromLook(HOSTILE_METALNESS_SPAWN);
}

/** Emisivo del hostile mesh. Ctor hostileMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_EMISSIVE = 0x000000;

/** Idle hostile mesh emissive. Ctor hostileMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function hostileEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace hostileMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileEmissiveAfterRestart(): number {
  return hostileEmissiveFromLook(HOSTILE_EMISSIVE_SPAWN);
}

/** Intensidad del hostile mesh. Ctor hostileMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_EMISSIVE_INTENSITY = 1;

/** Idle hostile mesh emissiveIntensity. Ctor hostileMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function hostileEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace hostileMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileEmissiveIntensityAfterRestart(): number {
  return hostileEmissiveIntensityFromLook(HOSTILE_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del hostile mesh. Ctor hostileMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_OPACITY = 1;

/** Idle hostile mesh opacity. Ctor hostileMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function hostileOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace hostileMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileOpacityAfterRestart(): number {
  return hostileOpacityFromLook(HOSTILE_OPACITY_SPAWN);
}

/** Transparent del hostile mesh. Ctor hostileMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_TRANSPARENT = false;

/** Idle hostile mesh transparent. Ctor hostileMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const HOSTILE_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function hostileTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace hostileMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function hostileTransparentAfterRestart(): boolean {
  return hostileTransparentFromLook(HOSTILE_TRANSPARENT_SPAWN);
}

/** Poseído: púrpura enfermo. 0x5a2d6b × 1.15/canal para leerse de noche. */
export const POSSESSED_COLOR = 0x68347b;

/** Color del possessed mesh. Ctor possessedMat.color: POSSESSED_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_MESH_COLOR = 0x68347b;

/** Idle possessed mesh color. Ctor possessedMat.color: POSSESSED_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_COLOR_SPAWN = 0x68347b;

/**
 * Color que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle POSSESSED_COLOR 0x68347b).
 * attach/tick no escriben color (ctor constant).
 */
export function possessedColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle POSSESSED_COLOR 0x68347b).
 * WorldView nace possessedMat.color AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedColorAfterRestart(): number {
  return possessedColorFromLook(POSSESSED_COLOR_SPAWN);
}

export const POSSESSED_EMISSIVE = 0x1e0925;

/** Emisivo del possessed mesh. Ctor possessedMat.emissive: POSSESSED_EMISSIVE = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_MESH_EMISSIVE = 0x1e0925;

/** Idle possessed mesh emissive. Ctor possessedMat.emissive: POSSESSED_EMISSIVE = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_EMISSIVE_SPAWN = 0x1e0925;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle POSSESSED_EMISSIVE 0x1e0925).
 * attach/tick no escriben emissive (ctor constant).
 */
export function possessedEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle POSSESSED_EMISSIVE 0x1e0925).
 * WorldView nace possessedMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedEmissiveAfterRestart(): number {
  return possessedEmissiveFromLook(POSSESSED_EMISSIVE_SPAWN);
}

/** Intensidad del possessed mesh. Ctor possessedMat.emissiveIntensity: 0.55 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_MESH_EMISSIVE_INTENSITY = 0.55;

/** Idle possessed mesh emissiveIntensity. Ctor possessedMat.emissiveIntensity: 0.55 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_EMISSIVE_INTENSITY_SPAWN = 0.55;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.55).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function possessedEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 0.55).
 * WorldView nace possessedMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedEmissiveIntensityAfterRestart(): number {
  return possessedEmissiveIntensityFromLook(POSSESSED_EMISSIVE_INTENSITY_SPAWN);
}

/** Roughness del possessed mesh. Ctor possessedMat.roughness: 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_ROUGHNESS = 0.5;

/** Roughness del possessed mesh. Ctor possessedMat.roughness: 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_MESH_ROUGHNESS = 0.5;

/** Idle possessed mesh roughness. Ctor possessedMat.roughness: 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_ROUGHNESS_SPAWN = 0.5;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.5).
 * attach/tick no escriben roughness (ctor constant).
 */
export function possessedRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.5).
 * WorldView nace possessedMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedRoughnessAfterRestart(): number {
  return possessedRoughnessFromLook(POSSESSED_ROUGHNESS_SPAWN);
}

/** Metalness del possessed mesh. Ctor possessedMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_METALNESS = 0;

/** Idle possessed mesh metalness. Ctor possessedMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function possessedMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace possessedMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedMetalnessAfterRestart(): number {
  return possessedMetalnessFromLook(POSSESSED_METALNESS_SPAWN);
}

/** Opacity del possessed mesh. Ctor possessedMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_OPACITY = 1;

/** Idle possessed mesh opacity. Ctor possessedMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function possessedOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace possessedMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedOpacityAfterRestart(): number {
  return possessedOpacityFromLook(POSSESSED_OPACITY_SPAWN);
}

/** Transparent del possessed mesh. Ctor possessedMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_TRANSPARENT = false;

/** Idle possessed mesh transparent. Ctor possessedMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function possessedTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace possessedMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedTransparentAfterRestart(): boolean {
  return possessedTransparentFromLook(POSSESSED_TRANSPARENT_SPAWN);
}

/** Color de la silueta fallback poseída (cabeza). 0x7a3d8a × 1.15/canal para leerse de noche. */
export const POSSESSED_HEAD_COLOR = 0x8c469f;

/** Color del possessed head mesh. Ctor possessedHeadMat.color: POSSESSED_HEAD_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_MESH_COLOR = 0x8c469f;

/** Idle possessed head mesh color. Ctor possessedHeadMat.color: POSSESSED_HEAD_COLOR = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_COLOR_SPAWN = 0x8c469f;

/**
 * Color que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle POSSESSED_HEAD_COLOR 0x8c469f).
 * attach/tick no escriben color (ctor constant).
 */
export function possessedHeadColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle POSSESSED_HEAD_COLOR 0x8c469f).
 * WorldView nace possessedHeadMat.color AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadColorAfterRestart(): number {
  return possessedHeadColorFromLook(POSSESSED_HEAD_COLOR_SPAWN);
}

/** Emisivo de la silueta fallback poseída (cabeza). 0x2a1040 × 1.15/canal para leerse de noche. */
export const POSSESSED_HEAD_EMISSIVE = 0x30124a;

/** Emisivo del possessed head mesh. Ctor possessedHeadMat.emissive: POSSESSED_HEAD_EMISSIVE = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_MESH_EMISSIVE = 0x30124a;

/** Idle possessed head mesh emissive. Ctor possessedHeadMat.emissive: POSSESSED_HEAD_EMISSIVE = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_EMISSIVE_SPAWN = 0x30124a;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle POSSESSED_HEAD_EMISSIVE 0x30124a).
 * attach/tick no escriben emissive (ctor constant).
 */
export function possessedHeadEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle POSSESSED_HEAD_EMISSIVE 0x30124a).
 * WorldView nace possessedHeadMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadEmissiveAfterRestart(): number {
  return possessedHeadEmissiveFromLook(POSSESSED_HEAD_EMISSIVE_SPAWN);
}

/** Intensidad del possessed head mesh. Ctor possessedHeadMat.emissiveIntensity: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_MESH_EMISSIVE_INTENSITY = 0.7;

/** Idle possessed head mesh emissiveIntensity. Ctor possessedHeadMat.emissiveIntensity: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_EMISSIVE_INTENSITY_SPAWN = 0.7;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.7).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function possessedHeadEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 0.7).
 * WorldView nace possessedHeadMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadEmissiveIntensityAfterRestart(): number {
  return possessedHeadEmissiveIntensityFromLook(POSSESSED_HEAD_EMISSIVE_INTENSITY_SPAWN);
}

/** Roughness del possessed head mesh. Ctor possessedHeadMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_ROUGHNESS = 0.45;

/** Roughness del possessed head mesh. Ctor possessedHeadMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_MESH_ROUGHNESS = 0.45;

/** Idle possessed head mesh roughness. Ctor possessedHeadMat.roughness: 0.45 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_ROUGHNESS_SPAWN = 0.45;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.45).
 * attach/tick no escriben roughness (ctor constant).
 */
export function possessedHeadRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.45).
 * WorldView nace possessedHeadMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadRoughnessAfterRestart(): number {
  return possessedHeadRoughnessFromLook(POSSESSED_HEAD_ROUGHNESS_SPAWN);
}

/** Metalness del possessed head mesh. Ctor possessedHeadMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_METALNESS = 0;

/** Idle possessed head mesh metalness. Ctor possessedHeadMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function possessedHeadMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace possessedHeadMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadMetalnessAfterRestart(): number {
  return possessedHeadMetalnessFromLook(POSSESSED_HEAD_METALNESS_SPAWN);
}

/** Opacity del possessed head mesh. Ctor possessedHeadMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_OPACITY = 1;

/** Idle possessed head mesh opacity. Ctor possessedHeadMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function possessedHeadOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace possessedHeadMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadOpacityAfterRestart(): number {
  return possessedHeadOpacityFromLook(POSSESSED_HEAD_OPACITY_SPAWN);
}

/** Transparent del possessed head mesh. Ctor possessedHeadMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_TRANSPARENT = false;

/** Idle possessed head mesh transparent. Ctor possessedHeadMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const POSSESSED_HEAD_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function possessedHeadTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace possessedHeadMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function possessedHeadTransparentAfterRestart(): boolean {
  return possessedHeadTransparentFromLook(POSSESSED_HEAD_TRANSPARENT_SPAWN);
}

/** Color del pool cálido indoor de noche. 0xffb070 × 1.15/canal (r clamp) para leerse de noche. */
export const WARM_LIGHT_COLOR = 0xffca81;
/** Multiplicador de intensidad del PointLight cálido indoor. 1.55 × 1.15 para leerse un poco más fuerte de noche. */
export const WARM_LIGHT_INTENSITY_MUL = 1.7825;
/** Altura Y del PointLight cálido indoor. 1.55 × 1.15 para sentarse un poco más alto de noche. */
export const WARM_LIGHT_Y = 1.7825;
/** Distancia base del PointLight cálido indoor. 6.5 × 1.15 para alcanzar un poco más de noche. */
export const WARM_LIGHT_DISTANCE_BASE = 7.475;
/** Ganancia de distancia del PointLight cálido indoor × intensidad. 2.5 × 1.15 para estirar un poco más de noche. */
export const WARM_LIGHT_DISTANCE_GAIN = 2.875;
/** Canal G base del tinte ámbar del PointLight cálido indoor. 0.66 × 1.15 para leerse un poco más ámbar-verde de noche. */
export const WARM_LIGHT_AMBER_G = 0.759;
/** Ganancia del canal G del tinte ámbar del PointLight cálido indoor × intensidad. 0.08 × 1.15 para leerse un poco más ámbar-verde de noche. */
export const WARM_LIGHT_AMBER_G_GAIN = 0.092;
/** Canal B base del tinte ámbar del PointLight cálido indoor. 0.38 × 1.15 para leerse un poco más ámbar-azul de noche. */
export const WARM_LIGHT_AMBER_B = 0.437;
/** Ganancia del canal B del tinte ámbar del PointLight cálido indoor × intensidad. 0.1 × 1.15 para leerse un poco más ámbar-azul de noche. */
export const WARM_LIGHT_AMBER_B_GAIN = 0.115;
/** Umbral de intensidad para mostrar el PointLight cálido indoor. 0.02 × 0.87 para aparecer un poco antes de noche. */
export const WARM_LIGHT_VISIBLE_EPS = 0.0174;
/** Decay del PointLight cálido indoor. 2 × 0.87 para caer un poco más lento de noche. */
export const WARM_LIGHT_DECAY = 1.74;
/** Color de la esfera aditiva de hocico. 0xfff2c0 × 1.15/canal (r/g clamp) para leerse de noche. */
export const MUZZLE_FLASH_COLOR = 0xffffdd;
/** Color del PointLight de hocico. 0xffe8a0 × 1.15/canal (r/g clamp) para leerse de noche. */
export const MUZZLE_LIGHT_COLOR = 0xffffb8;
/** Decay del PointLight de hocico. 2 × 0.87 para caer un poco más lento de noche. */
export const MUZZLE_LIGHT_DECAY = 1.74;
/** Distancia del PointLight de hocico. Ctor = fresco idle; apply escribe intensity, no distance. */
export const MUZZLE_LIGHT_DISTANCE = 2.6;
/** Color de la esfera aditiva de impacto. 0xffd080 × 1.15/canal (r clamp) para leerse de noche. */
export const IMPACT_SPARK_COLOR = 0xffef93;
/** Color del PointLight de impacto. 0xffd080 × 1.15/canal (r clamp) para leerse de noche. */
export const IMPACT_SPARK_LIGHT_COLOR = 0xffef93;
/** Decay del PointLight de impacto. 2 × 0.87 para caer un poco más lento de noche. */
export const IMPACT_SPARK_LIGHT_DECAY = 1.74;
/** Distancia del PointLight de impacto. Ctor = fresco idle; apply escribe intensity, no distance. */
export const IMPACT_SPARK_LIGHT_DISTANCE = 1.8;
/** Color de la malla del tracer. 0xffe8a0 × 1.15/canal (r/g clamp) para leerse de noche. */
export const TRACER_COLOR = 0xffffb8;
/** Color del PointLight del flash del tracer. 0xffc060 × 1.15/canal (r clamp) para leerse de noche. */
export const TRACER_FLASH_COLOR = 0xffdd6e;
/** Intensidad del PointLight del flash del tracer. 2.4 × 1.15 para leerse un poco más fuerte de noche. */
export const TRACER_FLASH_INTENSITY = 2.76;
/** Distancia del PointLight del flash del tracer. 3.2 × 1.15 para alcanzar un poco más de noche. */
export const TRACER_FLASH_DISTANCE = 3.68;
/** Decay del PointLight del flash del tracer. 2 × 0.87 para caer un poco más lento de noche. */
export const TRACER_FLASH_DECAY = 1.74;
/** Offset Y del PointLight del flash del tracer sobre TRACER_HEIGHT. 0.15 × 1.15 para sentarse un poco más alto de noche. */
export const TRACER_FLASH_Y_OFFSET = 0.1725;
/** Color del PointLight fill de la linterna. 0xb0d0ff × 1.15/canal (b clamp) para leerse de noche. */
export const FLASHLIGHT_FILL_COLOR = 0xcaefff;
/** Distancia base del PointLight fill de la linterna. 7 × 1.15 para alcanzar un poco más de noche. */
export const FLASHLIGHT_FILL_DISTANCE_BASE = 8.05;
/** Ganancia de distancia del PointLight fill × intensidad. 3.5 × 1.15 para estirar un poco más de noche. */
export const FLASHLIGHT_FILL_DISTANCE_GAIN = 4.025;
/** Altura Y del PointLight fill de la linterna. 1.35 × 1.15 para sentarse un poco más alto de noche. */
export const FLASHLIGHT_FILL_Y = 1.5525;
/** Decay del PointLight fill de la linterna. 2 × 0.87 para caer un poco más lento de noche. */
export const FLASHLIGHT_FILL_DECAY = 1.74;
/** Altura Y del SpotLight de la linterna. 1.55 × 1.15 para sentarse un poco más alto de noche. */
export const FLASHLIGHT_SPOT_Y = 1.7825;
/** Extra de distancia del SpotLight de la linterna. 1.6 × 1.15 para alcanzar un poco más de noche. */
export const FLASHLIGHT_SPOT_DISTANCE_EXTRA = 1.84;
/** Ganancia de distancia del SpotLight de la linterna × intensidad. 2 × 1.15 para estirar un poco más de noche. */
export const FLASHLIGHT_SPOT_DISTANCE_GAIN = 2.3;
/** Decay del SpotLight de la linterna. 2 × 0.87 para caer un poco más lento de noche. */
export const FLASHLIGHT_SPOT_DECAY = 1.74;
/** Altura Y del target del SpotLight de la linterna. 0.12 × 1.15 para apuntar un poco más alto de noche. */
export const FLASHLIGHT_SPOT_TARGET_Y = 0.138;
/** Offset XZ del flash de hocico (mesh + PointLight) según facing. 0.48 × 1.15 para sentarse un poco más adelante de noche. */
export const MUZZLE_FORWARD = 0.552;
/** Altura Y del chevron de facing. 0.12 × 1.15 para sentarse un poco más alto de noche. */
export const CHEVRON_Y = 0.138;
/** Pitch iso del chevron de facing (rad). -0.35 × 1.15 para inclinarse un poco más de noche. */
export const CHEVRON_TILT = -0.4025;
/** Altura Y del anillo de ruido. 0.05 × 1.15 para sentarse un poco más alto de noche. */
export const NOISE_RING_Y = 0.0575;
/** Altura Y del anillo de suelo de marcador. 0.04 × 1.15 para sentarse un poco más alto de noche. */
export const MARKER_RING_Y = 0.046;
/** Altura Y del icono del badge de marcador. 0.02 × 1.15 para sentarse un poco más alto de noche. */
export const MARKER_ICON_Y = 0.023;
/** Tamaño del icono del badge de marcador. 0.18 × 1.15 para leerse un poco más grande de noche. */
export const MARKER_ICON_SIZE = 0.207;
/** Radio del disco del badge de marcador. 0.16 × 1.15 para leerse un poco más grande de noche. */
export const MARKER_BADGE_RADIUS = 0.184;
/** Pitch iso del disco/icono del badge de marcador (divisor de -π). 2.6 × 1.15 para mirar un poco más de frente a cámara de noche. */
export const MARKER_BADGE_TILT = 2.99;
/** Altura Y del torso fallback del player. 0.56 × 1.15 para sentarse un poco más alto de noche. */
export const PLAYER_BODY_BASE_Y = 0.644;
/** Altura Y de la cabeza fallback del player. 1.32 × 1.15 para sentarse un poco más alto de noche. */
export const PLAYER_HEAD_BASE_Y = 1.518;
/** Altura Y del torso fallback mute/poseído. 0.56 × 1.15 para sentarse un poco más alto de noche. */
export const HOSTILE_BODY_BASE_Y = 0.644;
/** Altura Y de la cabeza fallback poseído. 1.3 × 1.15 para sentarse un poco más alto de noche. */
export const HOSTILE_HEAD_BASE_Y = 1.495;
/** Escala XZ de la silueta fallback mute. 1.05 × 1.15 para leerse un poco más ancha de noche. */
export const HOSTILE_MUTE_XZ_SCALE = 1.2075;
/** Ancho del torso fallback mute/poseído. 0.58 × 1.15 para leerse un poco más ancho de noche. */
export const HOSTILE_BODY_WIDTH = 0.667;
/** Alto del torso fallback mute/poseído. 1.12 × 1.15 para leerse un poco más alto de noche. */
export const HOSTILE_BODY_HEIGHT = 1.288;
/** Profundidad del torso fallback mute/poseído. 0.48 × 1.15 para leerse un poco más grueso de noche. */
export const HOSTILE_BODY_DEPTH = 0.552;
/** Tamaño del cubo de cabeza fallback poseído. 0.34 × 1.15 para leerse un poco más grande de noche. */
export const HOSTILE_HEAD_SIZE = 0.391;
/** Tamaño del cubo de cabeza fallback del player. 0.36 × 1.15 para leerse un poco más grande de noche. */
export const PLAYER_HEAD_SIZE = 0.414;
/** Ancho del torso fallback del player. 0.55 × 1.15 para leerse un poco más ancho de noche. */
export const PLAYER_BODY_WIDTH = 0.6325;
/** Alto del torso fallback del player. 1.12 × 1.15 para leerse un poco más alto de noche. */
export const PLAYER_BODY_HEIGHT = 1.288;
/** Profundidad del torso fallback del player. 0.48 × 1.15 para leerse un poco más grueso de noche. */
export const PLAYER_BODY_DEPTH = 0.552;
/** Alto del muro. 2.2 × 1.15 para leerse un poco más alto de noche. */
export const WALL_HEIGHT = 2.53;
/** Altura Y del muro. 1.1 × 1.15 para sentarse un poco más alto de noche. */
export const WALL_BASE_Y = 1.265;
/** Alto de la puerta. 2.0 × 1.15 para leerse un poco más alta de noche. */
export const DOOR_HEIGHT = 2.3;
/** Altura Y de la puerta. 1.0 × 1.15 para sentarse un poco más alto de noche. */
export const DOOR_BASE_Y = 1.15;
/** Profundidad de la puerta. 0.18 × 1.15 para leerse un poco más gruesa de noche. */
export const DOOR_DEPTH = 0.207;
/** Offset X de la puerta abierta respecto al tile. 0.15 × 1.15 para sentarse un poco más lejos del quicio de noche. */
export const DOOR_OPEN_X = 0.1725;
/** Alto de la cama. 0.35 × 1.15 para leerse un poco más alta de noche. */
export const BED_HEIGHT = 0.4025;
/** Altura Y de la cama. 0.175 × 1.15 para sentarse un poco más alto de noche. */
export const BED_BASE_Y = 0.20125;
/** Profundidad de la cama. 0.7 × 1.15 para leerse un poco más profunda de noche. */
export const BED_DEPTH = 0.805;
/** Alto de la caja/furniture genérico. 0.85 × 1.15 para leerse un poco más alta de noche. */
export const FURNITURE_HEIGHT = 0.9775;
/** Ancho/profundidad XZ de la caja/furniture genérico. 0.7 × 1.15 para leerse un poco más ancha de noche. */
export const FURNITURE_XZ = 0.805;
/** Altura Y de la caja/furniture genérico. 0.425 × 1.15 para sentarse un poco más alto de noche. */
export const FURNITURE_BASE_Y = 0.48875;

/** Roughness del furniture mesh. Ctor furnitureMat.roughness: 0.8 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_ROUGHNESS = 0.8;

/** Roughness del furniture mesh. Ctor furnitureMat.roughness: 0.8 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_MESH_ROUGHNESS = 0.8;

/** Idle furniture mesh roughness. Ctor furnitureMat.roughness: 0.8 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_ROUGHNESS_SPAWN = 0.8;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.8).
 * attach/tick no escriben roughness (ctor constant).
 */
export function furnitureRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.8).
 * WorldView nace furnitureMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function furnitureRoughnessAfterRestart(): number {
  return furnitureRoughnessFromLook(FURNITURE_ROUGHNESS_SPAWN);
}

/** Metalness del furniture mesh. Ctor furnitureMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_METALNESS = 0;

/** Idle furniture mesh metalness. Ctor furnitureMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function furnitureMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace furnitureMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function furnitureMetalnessAfterRestart(): number {
  return furnitureMetalnessFromLook(FURNITURE_METALNESS_SPAWN);
}

/** Emisivo del furniture mesh. Ctor furnitureMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_EMISSIVE = 0x000000;

/** Idle furniture mesh emissive. Ctor furnitureMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function furnitureEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace furnitureMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function furnitureEmissiveAfterRestart(): number {
  return furnitureEmissiveFromLook(FURNITURE_EMISSIVE_SPAWN);
}

/** Intensidad del furniture mesh. Ctor furnitureMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_EMISSIVE_INTENSITY = 1;

/** Idle furniture mesh emissiveIntensity. Ctor furnitureMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function furnitureEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace furnitureMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function furnitureEmissiveIntensityAfterRestart(): number {
  return furnitureEmissiveIntensityFromLook(FURNITURE_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del furniture mesh. Ctor furnitureMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_OPACITY = 1;

/** Idle furniture mesh opacity. Ctor furnitureMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function furnitureOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace furnitureMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function furnitureOpacityAfterRestart(): number {
  return furnitureOpacityFromLook(FURNITURE_OPACITY_SPAWN);
}

/** Transparent del furniture mesh. Ctor furnitureMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_TRANSPARENT = false;

/** Idle furniture mesh transparent. Ctor furnitureMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const FURNITURE_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function furnitureTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace furnitureMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function furnitureTransparentAfterRestart(): boolean {
  return furnitureTransparentFromLook(FURNITURE_TRANSPARENT_SPAWN);
}

/** Roughness del bed mesh. Ctor bedMat.roughness: 0.85 = fresco. Mid-life leftover ≠ fresco. */
export const BED_ROUGHNESS = 0.85;

/** Roughness del bed mesh. Ctor bedMat.roughness: 0.85 = fresco. Mid-life leftover ≠ fresco. */
export const BED_MESH_ROUGHNESS = 0.85;

/** Idle bed mesh roughness. Ctor bedMat.roughness: 0.85 = fresco. Mid-life leftover ≠ fresco. */
export const BED_ROUGHNESS_SPAWN = 0.85;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.85).
 * attach/tick no escriben roughness (ctor constant).
 */
export function bedRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.85).
 * WorldView nace bedMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function bedRoughnessAfterRestart(): number {
  return bedRoughnessFromLook(BED_ROUGHNESS_SPAWN);
}

/** Metalness del bed mesh. Ctor bedMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const BED_METALNESS = 0;

/** Idle bed mesh metalness. Ctor bedMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const BED_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function bedMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace bedMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function bedMetalnessAfterRestart(): number {
  return bedMetalnessFromLook(BED_METALNESS_SPAWN);
}

/** Emisivo del bed mesh. Ctor bedMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const BED_EMISSIVE = 0x000000;

/** Idle bed mesh emissive. Ctor bedMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const BED_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function bedEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace bedMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function bedEmissiveAfterRestart(): number {
  return bedEmissiveFromLook(BED_EMISSIVE_SPAWN);
}

/** Intensidad del bed mesh. Ctor bedMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BED_EMISSIVE_INTENSITY = 1;

/** Idle bed mesh emissiveIntensity. Ctor bedMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BED_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function bedEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace bedMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function bedEmissiveIntensityAfterRestart(): number {
  return bedEmissiveIntensityFromLook(BED_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del bed mesh. Ctor bedMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BED_OPACITY = 1;

/** Idle bed mesh opacity. Ctor bedMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BED_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function bedOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace bedMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function bedOpacityAfterRestart(): number {
  return bedOpacityFromLook(BED_OPACITY_SPAWN);
}

/** Transparent del bed mesh. Ctor bedMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const BED_TRANSPARENT = false;

/** Idle bed mesh transparent. Ctor bedMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const BED_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function bedTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace bedMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function bedTransparentAfterRestart(): boolean {
  return bedTransparentFromLook(BED_TRANSPARENT_SPAWN);
}

/** Roughness del door-closed mesh. Ctor doorClosedMat.roughness: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_ROUGHNESS = 0.7;

/** Roughness del door-closed mesh. Ctor doorClosedMat.roughness: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_MESH_ROUGHNESS = 0.7;

/** Idle door-closed mesh roughness. Ctor doorClosedMat.roughness: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_ROUGHNESS_SPAWN = 0.7;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.7).
 * attach/tick no escriben roughness (ctor constant).
 */
export function doorClosedRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.7).
 * WorldView nace doorClosedMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorClosedRoughnessAfterRestart(): number {
  return doorClosedRoughnessFromLook(DOOR_CLOSED_ROUGHNESS_SPAWN);
}

/** Metalness del door-closed mesh. Ctor doorClosedMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_METALNESS = 0;

/** Idle door-closed mesh metalness. Ctor doorClosedMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function doorClosedMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace doorClosedMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorClosedMetalnessAfterRestart(): number {
  return doorClosedMetalnessFromLook(DOOR_CLOSED_METALNESS_SPAWN);
}

/** Emisivo del door-closed mesh. Ctor doorClosedMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_EMISSIVE = 0x000000;

/** Idle door-closed mesh emissive. Ctor doorClosedMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function doorClosedEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace doorClosedMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorClosedEmissiveAfterRestart(): number {
  return doorClosedEmissiveFromLook(DOOR_CLOSED_EMISSIVE_SPAWN);
}

/** Intensidad del door-closed mesh. Ctor doorClosedMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_EMISSIVE_INTENSITY = 1;

/** Idle door-closed mesh emissiveIntensity. Ctor doorClosedMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function doorClosedEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace doorClosedMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorClosedEmissiveIntensityAfterRestart(): number {
  return doorClosedEmissiveIntensityFromLook(DOOR_CLOSED_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del door-closed mesh. Ctor doorClosedMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_OPACITY = 1;

/** Idle door-closed mesh opacity. Ctor doorClosedMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function doorClosedOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace doorClosedMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorClosedOpacityAfterRestart(): number {
  return doorClosedOpacityFromLook(DOOR_CLOSED_OPACITY_SPAWN);
}

/** Transparent del door-closed mesh. Ctor doorClosedMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_TRANSPARENT = false;

/** Idle door-closed mesh transparent. Ctor doorClosedMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_CLOSED_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function doorClosedTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace doorClosedMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorClosedTransparentAfterRestart(): boolean {
  return doorClosedTransparentFromLook(DOOR_CLOSED_TRANSPARENT_SPAWN);
}

/** Roughness del door-open mesh. Ctor doorOpenMat.roughness: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_ROUGHNESS = 0.7;

/** Roughness del door-open mesh. Ctor doorOpenMat.roughness: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_MESH_ROUGHNESS = 0.7;

/** Idle door-open mesh roughness. Ctor doorOpenMat.roughness: 0.7 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_ROUGHNESS_SPAWN = 0.7;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.7).
 * attach/tick no escriben roughness (ctor constant).
 */
export function doorOpenRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.7).
 * WorldView nace doorOpenMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorOpenRoughnessAfterRestart(): number {
  return doorOpenRoughnessFromLook(DOOR_OPEN_ROUGHNESS_SPAWN);
}

/** Metalness del door-open mesh. Ctor doorOpenMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_METALNESS = 0;

/** Idle door-open mesh metalness. Ctor doorOpenMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function doorOpenMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace doorOpenMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorOpenMetalnessAfterRestart(): number {
  return doorOpenMetalnessFromLook(DOOR_OPEN_METALNESS_SPAWN);
}

/** Emisivo del door-open mesh. Ctor doorOpenMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_EMISSIVE = 0x000000;

/** Idle door-open mesh emissive. Ctor doorOpenMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function doorOpenEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace doorOpenMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorOpenEmissiveAfterRestart(): number {
  return doorOpenEmissiveFromLook(DOOR_OPEN_EMISSIVE_SPAWN);
}

/** Intensidad del door-open mesh. Ctor doorOpenMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_EMISSIVE_INTENSITY = 1;

/** Idle door-open mesh emissiveIntensity. Ctor doorOpenMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function doorOpenEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace doorOpenMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorOpenEmissiveIntensityAfterRestart(): number {
  return doorOpenEmissiveIntensityFromLook(DOOR_OPEN_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del door-open mesh. Ctor doorOpenMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_OPACITY = 1;

/** Idle door-open mesh opacity. Ctor doorOpenMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function doorOpenOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace doorOpenMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorOpenOpacityAfterRestart(): number {
  return doorOpenOpacityFromLook(DOOR_OPEN_OPACITY_SPAWN);
}

/** Transparent del door-open mesh. Ctor doorOpenMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_TRANSPARENT = false;

/** Idle door-open mesh transparent. Ctor doorOpenMat.transparent: false = fresco. Mid-life leftover ≠ fresco. */
export const DOOR_OPEN_TRANSPARENT_SPAWN = false;

/**
 * Transparent que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * attach/tick no escriben transparent (ctor constant).
 */
export function doorOpenTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle false).
 * WorldView nace doorOpenMat.transparent AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function doorOpenTransparentAfterRestart(): boolean {
  return doorOpenTransparentFromLook(DOOR_OPEN_TRANSPARENT_SPAWN);
}

/** Roughness del floor mesh. Ctor floorMat.roughness: 0.95 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_ROUGHNESS = 0.95;

/** Roughness del floor mesh. Ctor floorMat.roughness: 0.95 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_MESH_ROUGHNESS = 0.95;

/** Idle floor mesh roughness. Ctor floorMat.roughness: 0.95 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_ROUGHNESS_SPAWN = 0.95;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.95).
 * attach/tick no escriben roughness (ctor constant).
 */
export function floorRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.95).
 * WorldView nace floorMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function floorRoughnessAfterRestart(): number {
  return floorRoughnessFromLook(FLOOR_ROUGHNESS_SPAWN);
}

/** Metalness del floor mesh. Ctor floorMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_METALNESS = 0;

/** Idle floor mesh metalness. Ctor floorMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function floorMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace floorMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function floorMetalnessAfterRestart(): number {
  return floorMetalnessFromLook(FLOOR_METALNESS_SPAWN);
}

/** Emisivo del floor mesh. Ctor floorMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_EMISSIVE = 0x000000;

/** Idle floor mesh emissive. Ctor floorMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function floorEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace floorMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function floorEmissiveAfterRestart(): number {
  return floorEmissiveFromLook(FLOOR_EMISSIVE_SPAWN);
}

/** Intensidad del floor mesh. Ctor floorMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_EMISSIVE_INTENSITY = 1;

/** Idle floor mesh emissiveIntensity. Ctor floorMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function floorEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace floorMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function floorEmissiveIntensityAfterRestart(): number {
  return floorEmissiveIntensityFromLook(FLOOR_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del floor mesh. Ctor floorMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_OPACITY = 1;

/** Idle floor mesh opacity. Ctor floorMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const FLOOR_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function floorOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace floorMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function floorOpacityAfterRestart(): number {
  return floorOpacityFromLook(FLOOR_OPACITY_SPAWN);
}

/** Roughness del wall mesh. Ctor wallMat.roughness: 0.85 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_ROUGHNESS = 0.85;

/** Roughness del wall mesh. Ctor wallMat.roughness: 0.85 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_MESH_ROUGHNESS = 0.85;

/** Idle wall mesh roughness. Ctor wallMat.roughness: 0.85 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_ROUGHNESS_SPAWN = 0.85;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.85).
 * attach/tick no escriben roughness (ctor constant).
 */
export function wallRoughnessFromLook(roughness: number): number {
  return roughness;
}

/**
 * R / softReset: roughness fresco (idle 0.85).
 * WorldView nace wallMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallRoughnessAfterRestart(): number {
  return wallRoughnessFromLook(WALL_ROUGHNESS_SPAWN);
}

/** Metalness del wall mesh. Ctor wallMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_METALNESS = 0;

/** Idle wall mesh metalness. Ctor wallMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function wallMetalnessFromLook(metalness: number): number {
  return metalness;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace wallMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallMetalnessAfterRestart(): number {
  return wallMetalnessFromLook(WALL_METALNESS_SPAWN);
}

/** Emisivo del wall mesh. Ctor wallMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_EMISSIVE = 0x000000;

/** Idle wall mesh emissive. Ctor wallMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function wallEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace wallMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallEmissiveAfterRestart(): number {
  return wallEmissiveFromLook(WALL_EMISSIVE_SPAWN);
}

/** Intensidad del wall mesh. Ctor wallMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_EMISSIVE_INTENSITY = 1;

/** Idle wall mesh emissiveIntensity. Ctor wallMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function wallEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace wallMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallEmissiveIntensityAfterRestart(): number {
  return wallEmissiveIntensityFromLook(WALL_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del wall mesh. Ctor wallMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_OPACITY = 1;

/** Idle wall mesh opacity. Ctor wallMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function wallOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace wallMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallOpacityAfterRestart(): number {
  return wallOpacityFromLook(WALL_OPACITY_SPAWN);
}

/** Roughness del wall-base mesh. Ctor wallBaseMat.roughness: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_ROUGHNESS = 1;

/** Roughness del wall-base mesh. Ctor wallBaseMat.roughness: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_MESH_ROUGHNESS = 1;

/** Idle wall-base mesh roughness. Ctor wallBaseMat.roughness: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_ROUGHNESS_SPAWN = 1;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben roughness (ctor constant).
 */
export function wallBaseRoughnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: roughness fresco (idle 1).
 * WorldView nace wallBaseMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallBaseRoughnessAfterRestart(): number {
  return wallBaseRoughnessFromLook(WALL_BASE_ROUGHNESS_SPAWN);
}

/** Metalness del wall-base mesh. Ctor wallBaseMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_METALNESS = 0;

/** Idle wall-base mesh metalness. Ctor wallBaseMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function wallBaseMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace wallBaseMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallBaseMetalnessAfterRestart(): number {
  return wallBaseMetalnessFromLook(WALL_BASE_METALNESS_SPAWN);
}

/** Emisivo del wall-base mesh. Ctor wallBaseMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_EMISSIVE = 0x000000;

/** Idle wall-base mesh emissive. Ctor wallBaseMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function wallBaseEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace wallBaseMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallBaseEmissiveAfterRestart(): number {
  return wallBaseEmissiveFromLook(WALL_BASE_EMISSIVE_SPAWN);
}

/** Intensidad del wall-base mesh. Ctor wallBaseMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_EMISSIVE_INTENSITY = 1;

/** Idle wall-base mesh emissiveIntensity. Ctor wallBaseMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function wallBaseEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace wallBaseMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallBaseEmissiveIntensityAfterRestart(): number {
  return wallBaseEmissiveIntensityFromLook(WALL_BASE_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del wall-base mesh. Ctor wallBaseMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_OPACITY = 1;

/** Idle wall-base mesh opacity. Ctor wallBaseMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const WALL_BASE_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function wallBaseOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace wallBaseMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function wallBaseOpacityAfterRestart(): number {
  return wallBaseOpacityFromLook(WALL_BASE_OPACITY_SPAWN);
}

/** Roughness del barricade mesh. Ctor barricadeMat.roughness: 0.75 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_ROUGHNESS = 0.75;

/** Roughness del barricade mesh. Ctor barricadeMat.roughness: 0.75 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_MESH_ROUGHNESS = 0.75;

/** Idle barricade mesh roughness. Ctor barricadeMat.roughness: 0.75 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_ROUGHNESS_SPAWN = 0.75;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.75).
 * attach/tick no escriben roughness (ctor constant).
 */
export function barricadeRoughnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: roughness fresco (idle 0.75).
 * WorldView nace barricadeMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeRoughnessAfterRestart(): number {
  return barricadeRoughnessFromLook(BARRICADE_ROUGHNESS_SPAWN);
}

/** Metalness del barricade mesh. Ctor barricadeMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_METALNESS = 0;

/** Idle barricade mesh metalness. Ctor barricadeMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function barricadeMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace barricadeMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeMetalnessAfterRestart(): number {
  return barricadeMetalnessFromLook(BARRICADE_METALNESS_SPAWN);
}

/** Emisivo del barricade mesh. Ctor barricadeMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EMISSIVE = 0x000000;

/** Idle barricade mesh emissive. Ctor barricadeMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function barricadeEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace barricadeMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEmissiveAfterRestart(): number {
  return barricadeEmissiveFromLook(BARRICADE_EMISSIVE_SPAWN);
}

/** Intensidad del barricade mesh. Ctor barricadeMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EMISSIVE_INTENSITY = 1;

/** Idle barricade mesh emissiveIntensity. Ctor barricadeMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function barricadeEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace barricadeMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEmissiveIntensityAfterRestart(): number {
  return barricadeEmissiveIntensityFromLook(BARRICADE_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del barricade mesh. Ctor barricadeMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_OPACITY = 1;

/** Idle barricade mesh opacity. Ctor barricadeMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function barricadeOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace barricadeMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeOpacityAfterRestart(): number {
  return barricadeOpacityFromLook(BARRICADE_OPACITY_SPAWN);
}

/** Roughness del barricade-edge mesh. Ctor barricadeEdgeMat.roughness: 0.9 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_ROUGHNESS = 0.9;

/** Roughness del barricade-edge mesh. Ctor barricadeEdgeMat.roughness: 0.9 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_MESH_ROUGHNESS = 0.9;

/** Idle barricade-edge mesh roughness. Ctor barricadeEdgeMat.roughness: 0.9 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_ROUGHNESS_SPAWN = 0.9;

/**
 * Roughness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.9).
 * attach/tick no escriben roughness (ctor constant).
 */
export function barricadeEdgeRoughnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: roughness fresco (idle 0.9).
 * WorldView nace barricadeEdgeMat.roughness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben roughness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEdgeRoughnessAfterRestart(): number {
  return barricadeEdgeRoughnessFromLook(BARRICADE_EDGE_ROUGHNESS_SPAWN);
}

/** Metalness del barricade-edge mesh. Ctor barricadeEdgeMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_METALNESS = 0;

/** Idle barricade-edge mesh metalness. Ctor barricadeEdgeMat.metalness: 0 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_METALNESS_SPAWN = 0;

/**
 * Metalness que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * attach/tick no escriben metalness (ctor constant).
 */
export function barricadeEdgeMetalnessFromLook(value: number): number {
  return value;
}

/**
 * R / softReset: metalness fresco (idle 0).
 * WorldView nace barricadeEdgeMat.metalness AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben metalness (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEdgeMetalnessAfterRestart(): number {
  return barricadeEdgeMetalnessFromLook(BARRICADE_EDGE_METALNESS_SPAWN);
}

/** Emisivo del barricade-edge mesh. Ctor barricadeEdgeMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_EMISSIVE = 0x000000;

/** Idle barricade-edge mesh emissive. Ctor barricadeEdgeMat.emissive: 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_EMISSIVE_SPAWN = 0x000000;

/**
 * Emisivo que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * attach/tick no escriben emissive (ctor constant).
 */
export function barricadeEdgeEmissiveFromLook(emissive: number): number {
  return emissive;
}

/**
 * R / softReset: emissive fresco (idle 0x000000).
 * WorldView nace barricadeEdgeMat.emissive AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissive (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEdgeEmissiveAfterRestart(): number {
  return barricadeEdgeEmissiveFromLook(BARRICADE_EDGE_EMISSIVE_SPAWN);
}

/** Intensidad del barricade-edge mesh. Ctor barricadeEdgeMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_EMISSIVE_INTENSITY = 1;

/** Idle barricade-edge mesh emissiveIntensity. Ctor barricadeEdgeMat.emissiveIntensity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_EMISSIVE_INTENSITY_SPAWN = 1;

/**
 * Intensidad que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben emissiveIntensity (ctor constant).
 */
export function barricadeEdgeEmissiveIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 1).
 * WorldView nace barricadeEdgeMat.emissiveIntensity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben emissiveIntensity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEdgeEmissiveIntensityAfterRestart(): number {
  return barricadeEdgeEmissiveIntensityFromLook(BARRICADE_EDGE_EMISSIVE_INTENSITY_SPAWN);
}

/** Opacity del barricade-edge mesh. Ctor barricadeEdgeMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_OPACITY = 1;

/** Idle barricade-edge mesh opacity. Ctor barricadeEdgeMat.opacity: 1 = fresco. Mid-life leftover ≠ fresco. */
export const BARRICADE_EDGE_OPACITY_SPAWN = 1;

/**
 * Opacity que leería attach/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * attach/tick no escriben opacity (ctor constant).
 */
export function barricadeEdgeOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 1).
 * WorldView nace barricadeEdgeMat.opacity AfterRestart; leftover mid-life no filtra.
 * attach/tick no escriben opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function barricadeEdgeOpacityAfterRestart(): number {
  return barricadeEdgeOpacityFromLook(BARRICADE_EDGE_OPACITY_SPAWN);
}

/** Alto de la barricada. 1.35 × 1.15 para leerse un poco más alta de noche. */
export const BARRICADE_HEIGHT = 1.5525;
/** Ancho de la barricada. 0.92 × 1.15 para leerse un poco más ancha de noche. */
export const BARRICADE_WIDTH = 1.058;
/** Profundidad de la barricada. 0.55 × 1.15 para leerse un poco más gruesa de noche. */
export const BARRICADE_DEPTH = 0.6325;
/** Altura Y de las tablas de barricada. 0.7 × 1.15 para sentarse un poco más alto de noche. */
export const BARRICADE_PLANK_Y = 0.805;
/** Altura Y de las cruces de barricada. 0.55 × 1.15 para sentarse un poco más alto de noche. */
export const BARRICADE_CROSS_Y = 0.6325;
/** Escala Y de las cruces de barricada. 0.7 × 1.15 para leerse un poco más altas de noche. */
export const BARRICADE_CROSS_SCALE_Y = 0.805;
/** Escala X de las cruces de barricada. 0.95 × 1.15 para leerse un poco más anchas de noche. */
export const BARRICADE_CROSS_SCALE_X = 1.0925;
/** Escala Z de las cruces de barricada. 0.9 × 1.15 para leerse un poco más gruesas de noche. */
export const BARRICADE_CROSS_SCALE_Z = 1.035;
/** Yaw de las tablas de barricada. (Math.PI / 8) × 1.15 para leerse un poco más rotadas de noche. */
export const BARRICADE_PLANK_ROT_Y = (Math.PI / 8) * 1.15;
/** Yaw de las cruces de barricada. (-Math.PI / 5) × 1.15 para leerse un poco más rotadas de noche. */
export const BARRICADE_CROSS_ROT_Y = (-Math.PI / 5) * 1.15;
/** Radio en chunks alrededor del player para mantener meshes. */
const VISIBLE_CHUNK_RADIUS = 1;

export interface WorldView {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  ambient: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  syncPlayer(x: number, y: number): void;
  /**
   * Anillo/nameplate ámbar para un contenedor (drop al suelo / refresh qty).
   * Si ya hay marcador con ese id, reemplaza el nameplate. `x`/`y` son tiles.
   * `plate.visible` según `lootNameplateInvEmpty` + dist 0 (ctor apply AfterRestart / syncLootFocus aplica fade + scale).
   */
  addLootMarker(
    id: string,
    x: number,
    y: number,
    name: string,
    inv?: { slots: ReadonlyArray<{ id: string; qty: number }> },
  ): void;
  /**
   * Pulso de escala del loot más cercano en reach (anillo+badge visibles).
   * Fuera de reach: scale 1; anillo/badge ocultos. Nameplate sigue (salvo empty).
   * `emptyIds`: contenedores vacíos — grupo oculto, no reciben foco.
   * Nameplate canvas: `plate.visible` + opacity + `plate.scale` (mul dist).
   * `gameOver`: HAS MUERTO / F9 load-muerto — anillo+escala+nameplate off.
   */
  syncLootFocus(
    wx: number,
    wy: number,
    dt: number,
    emptyIds?: ReadonlySet<string>,
    gameOver?: boolean,
  ): void;
  /**
   * Pulso de escala de la puerta más cercana en reach (anillo+badge).
   * Fuera de reach: scale 1; anillo/badge ocultos. `dt` avanza el seno.
   * `gameOver`: HAS MUERTO / F9 load-muerto — anillo+escala off.
   */
  syncDoorFocus(wx: number, wy: number, dt: number, gameOver?: boolean): void;
  /**
   * Pulso de escala de la cama más cercana en reach (anillo+badge).
   * Fuera de reach: scale 1; anillo/badge ocultos. `dt` avanza el seno.
   * `gameOver`: HAS MUERTO / F9 load-muerto — anillo+escala off.
   */
  syncBedFocus(wx: number, wy: number, dt: number, gameOver?: boolean): void;
  /**
   * Locomocion visual: silueta locoBob o mixer GLB (Idle/Walk/Run).
   * No mueve el root mundo — solo locoRoot local (bob) o mixer + yaw.
   * Aplica last locoBob / meleeSwing / hitLean overlay (tick aparte).
   * Hit lean (recoil) overridea el swing mientras está activo.
   * Camera shake avanza en tickCameraShake (offset para followCamera).
   * Coloca el chevron de facing (visible via facingChevronVisible).
   * faceX/faceZ: ejes de facing (x,z Three / mapa); opcional.
   */
  tickPlayerLoco(
    dt: number,
    moving: boolean,
    sprinting: boolean,
    faceX?: number,
    faceZ?: number,
  ): void;
  /**
   * Avanza el bob/sway procedural de silueta (fallback box).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + zero idle offsets.
   */
  tickLocoBob(
    dt: number,
    moving: boolean,
    sprinting: boolean,
    gameOver?: boolean,
  ): void;
  /** Quita bob leftover (HAS MUERTO / F9 load-muerto). Ya en reposo = no-op. */
  hideLocoBob(): void;
  /** Muestra el chevron de facing (vivo / F9 load-vivo). */
  showFacingChevron(): void;
  /** Quita chevron leftover (HAS MUERTO / F9 load-muerto). Ya oculto = no-op. */
  hideFacingChevron(): void;
  /**
   * Avanza el swing melee procedural (lean overlay).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + reset overlay pose.
   */
  tickMeleeSwing(dt: number, gameOver?: boolean): void;
  /** Quita lean leftover (HAS MUERTO / F9 load-muerto). Ya en reposo = no-op. */
  hideMeleeSwing(): void;
  /**
   * Avanza el hit-lean recoil procedural (overridea swing).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + reset lean pose.
   */
  tickHitLean(dt: number, gameOver?: boolean): void;
  /** Quita recoil leftover (HAS MUERTO / F9 load-muerto). Ya en reposo = no-op. */
  hideHitLean(): void;
  /**
   * Avanza el camera shake (offset XZ para followCamera).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + zero offset.
   */
  tickCameraShake(dt: number, gameOver?: boolean): void;
  /** Quita offset leftover (HAS MUERTO / F9 load-muerto). Ya en reposo = no-op. */
  hideCameraShake(): void;
  /**
   * One-shot de vista: melee/disparo ok → primary-attack; toque hostil → hit;
   * game-over → death. setAction + mixer sync (no-op si el GLB no tiene el clip).
   * primary-attack sin clip mapeado (`!hasRole`) → swing procedural.
   * hit → camera shake; sin clip mapeado (`!hasRole`) → lean procedural
   * (no needs-damage).
   */
  triggerPlayerAction(role: PlayerOneShotRole): void;
  /**
   * Flash de hocico al disparar (hit y miss). Re-triggerable.
   * Esfera aditiva + PointLight; avanza en tickMuzzleFlash.
   */
  triggerMuzzleFlash(): void;
  /**
   * Avanza el flash de hocico (esfera + PointLight).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + hide mesh/luz.
   */
  tickMuzzleFlash(dt: number, gameOver?: boolean): void;
  /** Quita flash leftover (HAS MUERTO / F9 load-muerto). Ya oculto = no-op. */
  hideMuzzleFlash(): void;
  /**
   * Spark de impacto al extremo del tracer (hit y miss). Re-triggerable.
   * Esfera aditiva unlit + PointLight en (x, TRACER_HEIGHT, y); hide si idle.
   */
  triggerImpactSpark(x: number, y: number): void;
  /**
   * Avanza el spark de impacto (esfera + PointLight).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + hide mesh/luz.
   */
  tickImpactSpark(dt: number, gameOver?: boolean): void;
  /** Quita spark leftover (HAS MUERTO / F9 load-muerto). Ya oculto = no-op. */
  hideImpactSpark(): void;
  /**
   * Limpia one-shot (incluida death sticky) y resync mixer a loco.
   * softReset (R) y load-alive.
   */
  clearPlayerAction(): void;
  /**
   * Sync meshes de hostiles. `visible` respeta FOV del player (no ver through walls).
   * `dt` avanza loco Idle/Walk/Run de mute/poseído GLB (mapa y → Three z).
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip mixer Idle (dt 0; no hide meshes).
   */
  syncHostiles(
    entities: ReadonlyArray<{
      id: string;
      x: number;
      y: number;
      visible: boolean;
      kind?: "mute" | "possessed";
      /** Facing en ejes mapa/Three (x,z); opcional. */
      faceX?: number;
      faceZ?: number;
    }>,
    dt?: number,
    gameOver?: boolean,
  ): void;
  syncDoor(tx: number, ty: number, open: boolean): void;
  /** Reconstruye mesh de un tile (p.ej. tras colocar barricada). */
  remeshTile(tx: number, ty: number): void;
  /** Descarga chunks cargados y vuelve a cargar visibles (tras load). */
  forceReloadVisible(wx: number, wy: number): void;
  syncDayNight(clock: GameClock): void;
  /**
   * Luz cálida indoor de noche (player/furniture). intensity 0 = apagada.
   * Ambiente frío queda a cargo de syncDayNight.
   */
  syncWarmLight(wx: number, wy: number, intensity: number): void;
  /**
   * Luz fría de linterna (player). intensity 0 = apagada.
   * SpotLight 0xd8eeff + wedge unlit al facing (`playerGltfYaw`);
   * PointLight fill ×0.6325. Separada de warmLight / muzzle flash.
   */
  syncTorchLight(wx: number, wy: number, intensity: number): void;
  /**
   * Iso follow: position = FromLook(x/y) + shake XZ; lookAt FromLook sin shake.
   * R / dispose nace AfterRestart (spawn); leftover ctor origin 0,0 no filtra.
   */
  followCamera(x: number, y: number): void;
  /** Crea/destruye meshes de chunks cerca de (wx, wy). */
  syncVisibleChunks(wx: number, wy: number): void;
  /**
   * Aplica FOV: tiles no visibles se ocultan (content) y se muestra fog plano.
   * No afecta el culling de chunks.
   */
  syncFov(visible: ReadonlySet<string>): void;
  /** Chunks con mesh activo (debug / tests de integración). */
  loadedChunkCount(): number;
  /**
   * Tracer visual corto del disparo (player → target / max range).
   * Desaparece en ~ttl (0.15–0.35s). Opcional: flash en el hocico.
   */
  spawnTracer(from: TracerPoint, to: TracerPoint, ttl?: number): void;
  /**
   * Avanza TTL / opacidad de tracers activos; limpia expirados.
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + hide meshes.
   */
  tickTracers(dt: number, gameOver?: boolean): void;
  /** Quita tracers leftover (HAS MUERTO / F9 load-muerto). Ya vacío = no-op. */
  hideTracers(): void;
  /**
   * Anillo de ruido en el suelo: se expande hasta `radius` (tiles) y se desvanece.
   * `kind` colorea (run blanco, door/loot ámbar, attack/gun/barricade rojo).
   */
  spawnNoiseRing(x: number, y: number, radius: number, kind?: string): void;
  /**
   * Avanza age / scale / opacity de anillos; limpia muertos.
   * `gameOver`: HAS MUERTO / F9 load-muerto — skip tick + hide meshes.
   */
  tickNoiseRings(dt: number, gameOver?: boolean): void;
  /** Quita anillos leftover (HAS MUERTO / F9 load-muerto). Ya vacío = no-op. */
  hideNoiseRings(): void;
  /**
   * Lluvia barata: partículas/líneas alrededor de (wx,wy).
   * intensity 0 = oculto; >0 sync + anima caída.
   * `daylight` (GameClock) alarga / aclara streaks de noche.
   * `dt` 0 (HAS MUERTO / F9 load-muerto): congela streaks; no hide weather.
   */
  syncRain(
    wx: number,
    wy: number,
    intensity: number,
    dt?: number,
    daylight?: number,
  ): void;
  /**
   * Césped instanced outdoor cerca del player.
   * Rebuild al cambiar de tile; viento en cada tick.
   * `dt` 0 (HAS MUERTO / F9 load-muerto): congela viento; no hide césped.
   */
  syncGrass(wx: number, wy: number, dt?: number): void;
  dispose(): void;
}

interface ChunkMeshes {
  group: THREE.Group;
  doorMeshes: Map<string, THREE.Mesh>;
  /** Raíz por tile (content + fog) para FOV. */
  tileRoots: Map<string, THREE.Group>;
}

/**
 * Vista Three del mapa: meshes por chunk con culling + FOV fog.
 * La verdad sigue en TileMap / PlayerSim / los.
 */
export function createWorldView(
  map: TileMap,
  containers?: ContainerRegistry,
): WorldView {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0c);
  // Distance fog (idea little-landscapes): noche más cerca/opaca; día abre el horizonte.
  scene.fog = new THREE.Fog(0x0a0a0c, 30, 78);

  const ambient = new THREE.AmbientLight(0x6a6a78, 0.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xe8e0d0, 1.1);
  sun.position.set(20, 30, 10);
  scene.add(sun);

  // Pool cálido indoor de noche (landscapes / chess board light).
  const warmLight = new THREE.PointLight(WARM_LIGHT_COLOR, warmLightIntensityAfterRestart(), warmLightDistanceAfterRestart(), warmLightDecayAfterRestart());
  // R / dispose: warm fresco (idle origin 0,0 / Y 1.7825 / visible false / intensity 0 / distance BASE 7.475 / color RGB 1 / 0.759 / 0.437 / decay 1.74); leftover ctor 1.6 / ctor 7.5 / ctor 0xffca81 / mid-life no filtra.
  warmLight.position.set(warmLightOriginXAfterRestart(), warmLightYAfterRestart(), warmLightOriginZAfterRestart());
  warmLight.visible = warmLightVisibleAfterRestart();
  warmLight.color.setRGB(1, warmLightColorGAfterRestart(), warmLightColorBAfterRestart());
  scene.add(warmLight);

  // Linterna: PointLight fill + SpotLight al facing (separada de warm / muzzle).
  const torchLight = new THREE.PointLight(FLASHLIGHT_FILL_COLOR, flashlightFillIntensityAfterRestart(), flashlightFillDistanceAfterRestart(), flashlightFillDecayAfterRestart());
  // R / dispose: fill fresco (idle origin 0,0 / visible false / intensity 0 / distance BASE 8.05 / decay 1.74); leftover ctor 10 / mid-life no filtra.
  torchLight.position.set(flashlightFillOriginXAfterRestart(), FLASHLIGHT_FILL_Y, flashlightFillOriginZAfterRestart());
  torchLight.visible = flashlightFillVisibleAfterRestart();
  scene.add(torchLight);
  const torchSpot = new THREE.SpotLight(
    FLASHLIGHT_SPOT_COLOR,
    flashlightSpotIntensityAfterRestart(),
    flashlightSpotDistanceAfterRestart(),
    flashlightSpotAngleAfterRestart(),
    flashlightSpotPenumbraAfterRestart(),
    flashlightSpotDecayAfterRestart(),
  );
  // R / dispose: spot fresco (idle origin 0,0 / visible false / intensity 0 / distance LENGTH+EXTRA 8.227675 / angle flashlightSpotAngle() / penumbra FLASHLIGHT_SPOT_PENUMBRA / decay FLASHLIGHT_SPOT_DECAY); leftover ctor LENGTH+2.4 / mid-life no filtra.
  torchSpot.position.set(flashlightSpotOriginXAfterRestart(), FLASHLIGHT_SPOT_Y, flashlightSpotOriginZAfterRestart());
  torchSpot.visible = flashlightSpotVisibleAfterRestart();
  scene.add(torchSpot);
  scene.add(torchSpot.target);

  // Reutilizados en syncDayNight (evita new Color cada frame).
  const skyColor = new THREE.Color(0x0a0a0c);
  const ambientColor = new THREE.Color(0x6a6a78);
  const sunColor = new THREE.Color(0xe8e0d0);

  const floorGeo = new THREE.PlaneGeometry(1, 1);
  const wallGeo = new THREE.BoxGeometry(1, WALL_HEIGHT, 1);
  const doorGeo = new THREE.BoxGeometry(1, DOOR_HEIGHT, DOOR_DEPTH);
  const furnitureGeo = new THREE.BoxGeometry(FURNITURE_XZ, FURNITURE_HEIGHT, FURNITURE_XZ);
  /** Planchas apiladas: más bajas y estrechas que un muro. */
  const barricadeGeo = new THREE.BoxGeometry(BARRICADE_WIDTH, BARRICADE_HEIGHT, BARRICADE_DEPTH);
  /** Último daylight visto en syncDayNight; mats nuevos nacen ya lifted. */
  let lastDaylight = 1;
  const furnitureMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(FURNITURE_COLOR, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: furnitureRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: furnitureMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: furnitureEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: furnitureEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: furnitureOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: furnitureTransparentAfterRestart(),
  });
  /** Cama: más baja y ancha que furniture genérico (reuse geo/mat). */
  const bedGeo = new THREE.BoxGeometry(1.0, BED_HEIGHT, BED_DEPTH);
  const bedMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(BED_COLOR, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: bedRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: bedMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: bedEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: bedEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: bedOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: bedTransparentAfterRestart(),
  });
  const doorClosedMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(DOOR_CLOSED, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: doorClosedRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: doorClosedMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: doorClosedEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: doorClosedEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: doorClosedOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: doorClosedTransparentAfterRestart(),
  });
  const doorOpenMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(DOOR_OPEN, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: doorOpenRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: doorOpenMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: doorOpenEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: doorOpenEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: doorOpenOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: doorOpenTransparentAfterRestart(),
  });
  /** Cache de materiales de floor por color final (tint+AO) — barato, sin GTAO. */
  const floorMatByColor = new Map<number, THREE.MeshStandardMaterial>();
  function matForFloorColor(color: number): THREE.MeshStandardMaterial {
    const key = color & 0xffffff;
    let m = floorMatByColor.get(key);
    if (m) return m;
    m = new THREE.MeshStandardMaterial({
      color: applyNightGroundLift(key, lastDaylight),
      // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
      roughness: floorRoughnessAfterRestart(),
      // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
      metalness: floorMetalnessAfterRestart(),
      // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
      emissive: floorEmissiveAfterRestart(),
      // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
      emissiveIntensity: floorEmissiveIntensityAfterRestart(),
      // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
      opacity: floorOpacityAfterRestart(),
    });
    floorMatByColor.set(key, m);
    return m;
  }
  function resolveFloorMat(x: number, y: number, tile: Tile): THREE.MeshStandardMaterial {
    // Pasto seeded solo en floor outdoor; door/furniture/barricade = piso indoor + AO.
    const outdoor =
      tile.kind === "floor" && !isIndoor(map, x + 0.5, y + 0.5);
    const { ortho, diag } = countAoNeighbors(
      (nx, ny) => map.getTile(nx, ny)?.kind,
      x,
      y,
    );
    const color = floorColorAt(x, y, outdoor, ortho, diag);
    return matForFloorColor(color);
  }
  const wallMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(WALL_COLOR, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: wallRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: wallMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: wallEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: wallEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: wallOpacityAfterRestart(),
  });
  const wallBaseMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(WALL_BASE_COLOR, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: wallBaseRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: wallBaseMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: wallBaseEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: wallBaseEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: wallBaseOpacityAfterRestart(),
  });
  const barricadeMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(BARRICADE_COLOR, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: barricadeRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: barricadeMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: barricadeEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: barricadeEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: barricadeOpacityAfterRestart(),
  });
  const barricadeEdgeMat = new THREE.MeshStandardMaterial({
    color: applyNightGroundLift(BARRICADE_EDGE, lastDaylight),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: barricadeEdgeRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: barricadeEdgeMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: barricadeEdgeEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: barricadeEdgeEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: barricadeEdgeOpacityAfterRestart(),
  });
  const fogMat = new THREE.MeshBasicMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: fogColorAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: fogTransparentAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: fogOpacityAfterRestart(),
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: fogDepthWriteAfterRestart(),
  });

  const loaded = new Map<string, ChunkMeshes>();
  /** Índice global puerta → mesh (solo chunks cargados). */
  const doorMeshes = new Map<string, THREE.Mesh>();
  /** Índice global tile → root group (solo chunks cargados). */
  const tileRoots = new Map<string, THREE.Group>();

  // Silueta legible a cámara iso: torso + cabeza (create-game-vfx / character silhouette).
  const playerBodyGeo = new THREE.BoxGeometry(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, PLAYER_BODY_DEPTH);
  const playerHeadGeo = new THREE.BoxGeometry(PLAYER_HEAD_SIZE, PLAYER_HEAD_SIZE, PLAYER_HEAD_SIZE);
  const playerBodyMat = new THREE.MeshStandardMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: playerBodyColorAfterRestart(),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: playerBodyRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: playerBodyMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: playerBodyEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: playerBodyEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: playerBodyOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: playerBodyTransparentAfterRestart(),
  });
  const playerHeadMat = new THREE.MeshStandardMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: playerHeadColorAfterRestart(),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: playerHeadRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: playerHeadMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: playerHeadEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: playerHeadEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: playerHeadOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: playerHeadTransparentAfterRestart(),
  });
  const playerMesh = new THREE.Group();
  /** Hijo de silueta: bobY + lean/sway; root queda en suelo (x,0,y). */
  const playerLocoRoot = new THREE.Group();
  // R / dispose: swing fresco (idle 0); leftover mid-swing no filtra.
  playerLocoRoot.rotation.x = meleeSwingPitchAfterRestart();
  playerLocoRoot.rotation.z = meleeSwingYawBiasAfterRestart();
  // R / dispose: lean fresco (idle 0); leftover mid-recoil no filtra.
  playerLocoRoot.rotation.x = hitLeanPitchAfterRestart();
  playerLocoRoot.rotation.z = hitLeanYawBiasAfterRestart();
  // R / dispose: loco fresco (idle 0); leftover mid-stride no filtra.
  playerLocoRoot.position.y = locoBobYAfterRestart();
  const playerBody = new THREE.Mesh(playerBodyGeo, playerBodyMat);
  playerBody.position.y = PLAYER_BODY_BASE_Y;
  const playerHead = new THREE.Mesh(playerHeadGeo, playerHeadMat);
  playerHead.position.y = PLAYER_HEAD_BASE_Y;
  playerLocoRoot.add(playerBody, playerHead);
  playerMesh.add(playerLocoRoot);
  const playerLoco = createLocoBobState();
  /** Swing procedural si el mixer no tiene clip primary-attack. */
  const playerSwing = createMeleeSwingState();
  /** Lean procedural si el mixer no tiene clip hit (recoil; overridea swing). */
  const playerHitLean = createHitLeanState();
  /** Shake de cámara en toque hostil (siempre; independiente del clip hit). */
  const playerCameraShake = createCameraShakeState();
  /** Flash de hocico (disparo X hit/miss). */
  const playerMuzzle = createMuzzleFlash();
  /** Spark de impacto al extremo del tracer (X hit/miss). */
  const impactSpark = createImpactSpark();
  // R / dispose: shake fresco (idle 0); leftover mid-shake no filtra.
  let cameraShakeOut: CameraShakeOutput = {
    offsetX: cameraShakeOffsetXAfterRestart(),
    offsetZ: cameraShakeOffsetZAfterRestart(),
    active: cameraShakeActiveAfterRestart(),
  };
  let meleeSwingOut: MeleeSwingOutput = {
    pitch: meleeSwingPitchAfterRestart(),
    yawBias: meleeSwingYawBiasAfterRestart(),
    active: meleeSwingActiveAfterRestart(),
  };
  let hitLeanOut: HitLeanOutput = {
    pitch: hitLeanPitchAfterRestart(),
    yawBias: hitLeanYawBiasAfterRestart(),
    active: hitLeanActiveAfterRestart(),
  };
  let locoBobOut: LocoBobOutput = {
    bobY: locoBobYAfterRestart(),
    leanZ: locoBobLeanZAfterRestart(),
    swayX: locoBobSwayXAfterRestart(),
    phase: 0,
  };
  /** Roles mixer-agnosticos; GLB opcional via candidates (Soldier first). */
  const playerAnimator = createCharacterAnimator();
  let playerUsesGltfVisual = false;
  let playerMixer: CharacterMixerHandle | null = null;
  /** Yaw GLB: Soldier forward=+Z; player.facingY default=1 → yaw 0. */
  let playerGltfYaw = 0;
  void (async () => {
    for (const candidate of playerManifestCandidates()) {
      const loaded = await maybeAttachCharacterGltf(candidate, {
        parent: playerLocoRoot,
      });
      if (!loaded) continue;
      const handle = bindMixer(loaded, candidate);
      if (!handle) {
        // Clips no mapeados: quitar mesh y probar el siguiente candidate.
        playerLocoRoot.remove(loaded.scene);
        continue;
      }
      // Survivor drop-in: mesh propio. Soldier fallback: tint tierra/visor.
      if (shouldApplySurvivorLook(candidate)) {
        applySurvivorLook(loaded.scene);
      }
      playerMixer = handle;
      playerBody.visible = false;
      playerHead.visible = false;
      playerUsesGltfVisual = true;
      handle.syncFromAnimator("idle");
      return;
    }
  })();
  const markerShared = createMarkerSharedResources();
  attachRoleMarkers(playerMesh, "player", markerShared);
  // R / dispose: pos fresco (spawn); leftover ctor origin 0,0 no filtra.
  playerMesh.position.set(
    playerPosXAfterRestart(),
    0,
    playerPosZAfterRestart(),
  );
  scene.add(playerMesh);

  // Loot: anillo/badge ámbar por contenedor. Anillo solo en reach (no FOV);
  // syncLootFocus oculta ids vacíos. Nameplate canvas hijo (fade dist 5.5).
  interface LootMarkerEntry {
    group: THREE.Group;
    nameplate: THREE.Sprite;
    x: number;
    y: number;
    id: string;
  }
  const lootMarkerGroups: LootMarkerEntry[] = [];
  // R / dispose: elapsed fresco (0); leftover mid-pulse de la vida anterior no filtra.
  let lootFocusElapsed = lootFocusElapsedAfterRestart();

  function makeLootNameplateSprite(
    label: string,
    itemId?: string | null,
  ): THREE.Sprite {
    const text = lootNameplateLabel(label);
    const hasIcon = typeof itemId === "string" && itemId.length > 0;
    const canvas = document.createElement("canvas");
    const ICON_PAD = LOOT_NAMEPLATE_ICON_PAD;
    const iconSize = LOOT_NAMEPLATE_ICON_SIZE;
    const BASE_W = 384;
    const W = hasIcon ? BASE_W + ICON_PAD : BASE_W;
    const H = 80;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = LOOT_NAMEPLATE_PLATE_FILL;
      ctx.beginPath();
      ctx.roundRect(12, 16, W - 24, 48, 10);
      ctx.fill();
      if (hasIcon) {
        const iconX = Math.max(0, (ICON_PAD - iconSize) / 2);
        paintLootNameplateIcon(ctx, itemId, iconX, (H - iconSize) / 2, iconSize);
      }
      ctx.font = `600 ${LOOT_NAMEPLATE_FONT_PX}px ui-monospace, SF Mono, Menlo, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX;
      ctx.strokeStyle = LOOT_NAMEPLATE_TEXT_STROKE;
      const textX = hasIcon ? ICON_PAD + BASE_W / 2 : W / 2;
      ctx.strokeText(text, textX, H / 2);
      ctx.fillStyle = LOOT_NAMEPLATE_FILL;
      ctx.fillText(text, textX, H / 2);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
      map,
      // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
      color: lootNameplateColorAfterRestart(),
      // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
      transparent: lootNameplateTransparentAfterRestart(),
      // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
      depthWrite: lootNameplateDepthWriteAfterRestart(),
    });
    const sprite = new THREE.Sprite(mat);
    sprite.name = "lootNameplate";
    sprite.position.set(0, LOOT_NAMEPLATE_Y, 0);
    sprite.scale.set(LOOT_NAMEPLATE_SCALE_X, LOOT_NAMEPLATE_SCALE_Y, 1);
    // R / dispose: renderOrder fresco (idle); leftover mid-life renderOrder de la vida anterior no filtra.
    sprite.renderOrder = lootNameplateRenderOrderAfterRestart();
    return sprite;
  }

  function addLootMarker(opts: {
    id: string;
    x: number;
    y: number;
    name: string;
    inv?: { slots: ReadonlyArray<{ id: string; qty: number }> };
  }): void {
    const plate = opts.inv
      ? lootNameplateLabel(lootPileLabel(opts.inv, opts.name))
      : lootNameplateLabel(opts.name);
    const leadId = lootNameplateLeadId(opts.inv);
    const empty = lootNameplateInvEmpty(opts.inv);
    const existing = lootMarkerGroups.find((e) => e.id === opts.id);
    if (existing) {
      const old = existing.group.getObjectByName("lootNameplate");
      if (old) {
        existing.group.remove(old);
        if (old instanceof THREE.Sprite) {
          const mat = old.material as THREE.SpriteMaterial;
          mat.map?.dispose();
          mat.dispose();
        }
      }
      const nameplate = makeLootNameplateSprite(plate, leadId);
      nameplate.visible = lootNameplateVisible(empty, 0);
      existing.group.add(nameplate);
      existing.nameplate = nameplate;
      return;
    }
    const group = new THREE.Group();
    group.name = `lootMarker_${opts.id}`;
    const x = opts.x + 0.5;
    const y = opts.y + 0.5;
    group.position.set(x, 0, y);
    attachRoleMarkers(group, "loot", markerShared);
    const nameplate = makeLootNameplateSprite(plate, leadId);
    nameplate.visible = lootNameplateVisible(empty, 0);
    group.add(nameplate);
    scene.add(group);
    lootMarkerGroups.push({ group, nameplate, x, y, id: opts.id });
  }

  if (containers) {
    for (const c of containers.list) {
      addLootMarker({
        id: c.id,
        x: c.x,
        y: c.y,
        name: c.name,
        inv: c.inv,
      });
    }
  }

  function applyLootFocusLook(
    wx: number,
    wy: number,
    elapsed: number,
    emptyIds?: ReadonlySet<string>,
    gameOver = false,
  ): void {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < lootMarkerGroups.length; i++) {
      const e = lootMarkerGroups[i]!;
      const empty = !!emptyIds?.has(e.id);
      const d = lootFocusDistFromLook(wx, wy, e.x, e.y);
      const vis = lootRingVisibleFromLook(empty, d, gameOver);
      e.group.visible = !empty;
      setInteractRingVisible(e.group, vis);
      if (!vis) continue;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    for (let i = 0; i < lootMarkerGroups.length; i++) {
      const e = lootMarkerGroups[i]!;
      if (emptyIds?.has(e.id)) {
        e.group.scale.setScalar(1);
        continue;
      }
      const mul =
        i === best ? lootFocusMulFromLook(bestD, elapsed, gameOver) : 1;
      e.group.scale.setScalar(mul);
    }
  }

  // R / dispose: look fresco (spawn); leftover Three ring visible / scale 1 no filtra.
  {
    const emptyIds = new Set<string>();
    if (containers) {
      for (const c of containers.list) {
        if (lootNameplateInvEmpty(c.inv)) emptyIds.add(c.id);
      }
    }
    applyLootFocusLook(
      lootFocusLookXAfterRestart(),
      lootFocusLookZAfterRestart(),
      lootFocusElapsed,
      emptyIds,
    );
    // R / dispose: nameplate fresco (spawn fade); leftover ctor dist 0 / Three opacity 1 no filtra.
    applyLootNameplateLook(
      lootNameplateLookXAfterRestart(),
      lootNameplateLookZAfterRestart(),
      emptyIds,
    );
  }

  function applyLootNameplateLook(
    wx: number,
    wy: number,
    emptyIds?: ReadonlySet<string>,
    gameOver = false,
  ): void {
    for (let i = 0; i < lootMarkerGroups.length; i++) {
      const e = lootMarkerGroups[i]!;
      const empty = !!emptyIds?.has(e.id);
      const d = lootNameplateDistFromLook(wx, wy, e.x, e.y);
      e.nameplate.visible = lootNameplateVisibleFromLook(empty, d, gameOver);
      const plateMat = e.nameplate.material as THREE.SpriteMaterial;
      plateMat.opacity = lootNameplateOpacityFromLook(d);
      const s = lootNameplateScaleFromLook(d);
      e.nameplate.scale.set(
        LOOT_NAMEPLATE_SCALE_X * s,
        LOOT_NAMEPLATE_SCALE_Y * s,
        1,
      );
    }
  }

  // Door: anillo/badge steel blue-grey por tile door. Anillo solo en reach (no FOV).
  interface DoorMarkerEntry {
    group: THREE.Group;
    x: number;
    y: number;
  }
  const doorMarkerGroups: DoorMarkerEntry[] = [];
  // R / dispose: elapsed fresco (0); leftover mid-pulse de la vida anterior no filtra.
  let doorFocusElapsed = doorFocusElapsedAfterRestart();
  map.forEach((tx, ty, tile) => {
    if (tile.kind !== "door") return;
    const group = new THREE.Group();
    group.name = `doorMarker_${tx}_${ty}`;
    const x = tx + 0.5;
    const y = ty + 0.5;
    group.position.set(x, 0, y);
    attachRoleMarkers(group, "door", markerShared);
    scene.add(group);
    doorMarkerGroups.push({ group, x, y });
  });

  function applyDoorFocusLook(
    wx: number,
    wy: number,
    elapsed: number,
    gameOver = false,
  ): void {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < doorMarkerGroups.length; i++) {
      const e = doorMarkerGroups[i]!;
      const d = doorFocusDistFromLook(wx, wy, e.x, e.y);
      const open = map.get(Math.floor(e.x), Math.floor(e.y))?.open ?? false;
      const vis = doorRingVisibleFromLook(open, d, gameOver);
      setInteractRingVisible(e.group, vis);
      if (vis && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    for (let i = 0; i < doorMarkerGroups.length; i++) {
      const e = doorMarkerGroups[i]!;
      const mul =
        i === best ? doorFocusMulFromLook(bestD, elapsed, gameOver) : 1;
      e.group.scale.setScalar(mul);
    }
  }

  // R / dispose: look fresco (spawn); leftover Three ring visible / dist 0 no filtra.
  applyDoorFocusLook(
    doorFocusLookXAfterRestart(),
    doorFocusLookZAfterRestart(),
    doorFocusElapsed,
  );

  // Bed: anillo/badge púrpura sleep por tile cama. Anillo solo en reach (no FOV).
  // Neighborhood: (6,6) y (24,22).
  interface BedMarkerEntry {
    group: THREE.Group;
    x: number;
    y: number;
  }
  const bedMarkerGroups: BedMarkerEntry[] = [];
  // R / dispose: elapsed fresco (0); leftover mid-pulse de la vida anterior no filtra.
  let bedFocusElapsed = bedFocusElapsedAfterRestart();
  map.forEach((tx, ty, tile) => {
    if (tile.variant !== "bed") return;
    const group = new THREE.Group();
    group.name = `bedMarker_${tx}_${ty}`;
    const x = tx + 0.5;
    const y = ty + 0.5;
    group.position.set(x, 0, y);
    attachRoleMarkers(group, "bed", markerShared);
    scene.add(group);
    bedMarkerGroups.push({ group, x, y });
  });

  function applyBedFocusLook(
    wx: number,
    wy: number,
    elapsed: number,
    gameOver = false,
  ): void {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < bedMarkerGroups.length; i++) {
      const e = bedMarkerGroups[i]!;
      const d = bedFocusDistFromLook(wx, wy, e.x, e.y);
      const vis = bedRingVisibleFromLook(d, gameOver);
      setInteractRingVisible(e.group, vis);
      if (vis && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    for (let i = 0; i < bedMarkerGroups.length; i++) {
      const e = bedMarkerGroups[i]!;
      const mul =
        i === best ? bedFocusMulFromLook(bestD, elapsed, gameOver) : 1;
      e.group.scale.setScalar(mul);
    }
  }

  // R / dispose: look fresco (spawn); leftover Three ring visible / dist 0 no filtra.
  applyBedFocusLook(
    bedFocusLookXAfterRestart(),
    bedFocusLookZAfterRestart(),
    bedFocusElapsed,
  );

  // Muzzle flash: esfera aditiva (radio MUZZLE_FLASH_RADIUS) + PointLight (reutilizable).
  const muzzleGeo = new THREE.SphereGeometry(MUZZLE_FLASH_RADIUS, 10, 8);
  const muzzleMat = new THREE.MeshBasicMaterial({
    color: muzzleFlashColorAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: muzzleFlashTransparentAfterRestart(),
    // R / dispose: opacity fresco (inactive); leftover ctor Three 1 no filtra.
    opacity: muzzleFlashIntensityAfterRestart(),
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: muzzleFlashDepthWriteAfterRestart(),
    // R / dispose: blending fresco (idle); leftover mid-life blending de la vida anterior no filtra.
    blending: muzzleFlashBlendingAfterRestart() as THREE.Blending,
  });
  const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
  // R / dispose: hidden fresco; leftover mid-flash visible no filtra.
  muzzleMesh.visible = muzzleFlashActiveAfterRestart();
  const muzzleLight = new THREE.PointLight(
    muzzleLightColorAfterRestart(),
    0,
    muzzleLightDistanceAfterRestart(),
    muzzleLightDecayAfterRestart(),
  );
  muzzleLight.visible = muzzleFlashActiveAfterRestart();
  // R / dispose: pos fresco (spawn yaw 0); leftover ctor origin 0,0 no filtra.
  muzzleMesh.position.set(
    muzzleFlashPosXAfterRestart(),
    muzzleFlashPosYAfterRestart(),
    muzzleFlashPosZAfterRestart(),
  );
  muzzleLight.position.set(
    muzzleFlashPosXAfterRestart(),
    muzzleFlashPosYAfterRestart(),
    muzzleFlashPosZAfterRestart(),
  );
  playerMesh.add(muzzleMesh, muzzleLight);

  // Chevron de facing: triángulo plano unlit (visible via helper; sin luz extra).
  // Dist/len/hw/color/opacity desde facingChevron knobs; oro HUD; tilt iso.
  const chevronGeo = new THREE.BufferGeometry();
  chevronGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        0, 0, FACING_CHEVRON_LEN * 0.5,
        FACING_CHEVRON_HW, 0, -FACING_CHEVRON_LEN * 0.5,
        -FACING_CHEVRON_HW, 0, -FACING_CHEVRON_LEN * 0.5,
      ]),
      3,
    ),
  );
  const chevronMat = new THREE.MeshBasicMaterial({
    color: facingChevronColorAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: facingChevronTransparentAfterRestart(),
    opacity: facingChevronOpacityAfterRestart(),
    // R / dispose: side fresco (idle); leftover mid-life side de la vida anterior no filtra.
    side: facingChevronSideAfterRestart() as THREE.Side,
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: facingChevronDepthWriteAfterRestart(),
  });
  const chevronMesh = new THREE.Mesh(chevronGeo, chevronMat);
  // R / dispose: renderOrder fresco (idle); leftover mid-life renderOrder de la vida anterior no filtra.
  chevronMesh.renderOrder = facingChevronRenderOrderAfterRestart();
  chevronMesh.visible = facingChevronVisible(false);
  // R / dispose: pos fresco (yaw 0 +Z); leftover ctor origin / mid-life yaw no filtra.
  chevronMesh.position.set(
    facingChevronOffsetXAfterRestart(),
    CHEVRON_Y,
    facingChevronOffsetZAfterRestart(),
  );
  chevronMesh.rotation.y = facingChevronYawAfterRestart();
  chevronMesh.rotation.x = CHEVRON_TILT;
  playerMesh.add(chevronMesh);

  function applyFacingChevronVisible(gameOver = false): void {
    chevronMesh.visible = facingChevronVisible(gameOver);
  }

  function placeFacingChevron(): void {
    const yaw = facingChevronYawFromLook(playerGltfYaw);
    const off = facingChevronOffset(yaw);
    const x = facingChevronOffsetXFromLook(off.x);
    const z = facingChevronOffsetZFromLook(off.z);
    chevronMesh.position.set(x, CHEVRON_Y, z);
    chevronMesh.rotation.y = yaw;
    chevronMesh.rotation.x = CHEVRON_TILT;
  }

  function showFacingChevron(): void {
    applyFacingChevronVisible(false);
  }

  function hideFacingChevron(): void {
    applyFacingChevronVisible(true);
  }
  // R / dispose: apply fresco al boot (FromLook del yaw AfterRestart).
  placeFacingChevron();

  // Wedge unlit del cono de linterna (suelo; visible solo con torch on).
  // Tip brillante → far fade (vertex colors) para que lea como haz, no charco.
  const coneGeo = new THREE.BufferGeometry();
  coneGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        0, 0, 0,
        FLASHLIGHT_CONE_HALF_WIDTH, 0, FLASHLIGHT_CONE_LENGTH,
        -FLASHLIGHT_CONE_HALF_WIDTH, 0, FLASHLIGHT_CONE_LENGTH,
      ]),
      3,
    ),
  );
  coneGeo.setAttribute(
    "color",
    new THREE.BufferAttribute(flashlightWedgeVertexColors(), 3),
  );
  const coneMat = new THREE.MeshBasicMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: flashlightConeColorAfterRestart(),
    // R / dispose: vertexColors fresco (idle); leftover mid-life vertexColors de la vida anterior no filtra.
    vertexColors: flashlightConeVertexColorsAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: flashlightConeTransparentAfterRestart(),
    // R / dispose: cone opacity fresco (idle 0); leftover ctor BASE / mid-life no filtra.
    opacity: flashlightConeOpacityAfterRestart(),
    // R / dispose: side fresco (idle); leftover mid-life side de la vida anterior no filtra.
    side: flashlightConeSideAfterRestart() as THREE.Side,
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: flashlightConeDepthWriteAfterRestart(),
    // R / dispose: blending fresco (idle); leftover mid-life blending de la vida anterior no filtra.
    blending: flashlightConeBlendingAfterRestart() as THREE.Blending,
  });
  const flashlightConeWedge = new THREE.Mesh(coneGeo, coneMat);
  flashlightConeWedge.name = "flashlightConeWedge";
  // R / dispose: renderOrder fresco (idle); leftover mid-life renderOrder de la vida anterior no filtra.
  flashlightConeWedge.renderOrder = flashlightConeRenderOrderAfterRestart();
  // R / dispose: cone visible fresco (idle false); leftover mid-life on no filtra.
  flashlightConeWedge.visible = flashlightConeVisibleAfterRestart();
  flashlightConeWedge.position.set(0, FLASHLIGHT_CONE_Y, 0);
  // R / dispose: yaw fresco (idle 0); leftover mid-life yaw no filtra.
  flashlightConeWedge.rotation.y = flashlightConeYawAfterRestart();
  // R / dispose: target fresco (idle origin 0 + tip +Z); leftover ctor Three origin 0,0 / mid-life no filtra.
  torchSpot.target.position.set(flashlightSpotTargetXAfterRestart(), FLASHLIGHT_SPOT_TARGET_Y, flashlightSpotTargetZAfterRestart());
  playerMesh.add(flashlightConeWedge);

  function applyMuzzleFlashVisual(out: {
    intensity: number;
    active: boolean;
  }): void {
    const ox = muzzleFlashPosXFromLook(Math.sin(playerGltfYaw) * MUZZLE_FORWARD);
    const oz = muzzleFlashPosZFromLook(Math.cos(playerGltfYaw) * MUZZLE_FORWARD);
    muzzleMesh.position.set(ox, TRACER_HEIGHT, oz);
    muzzleLight.position.set(ox, TRACER_HEIGHT, oz);
    muzzleMesh.visible = muzzleFlashActiveFromLook(out.active);
    muzzleLight.visible = muzzleFlashActiveFromLook(out.active);
    muzzleMat.opacity = muzzleFlashIntensityFromLook(out.intensity);
    muzzleLight.intensity = out.active ? MUZZLE_LIGHT_PEAK * out.intensity : 0;
  }

  function tickMuzzle(dt: number, gameOver = false): void {
    if (!muzzleFlashApplies(gameOver)) {
      applyMuzzleFlashVisual({
        intensity: muzzleFlashIntensityFromLook(0),
        active: muzzleFlashActiveFromLook(false),
      });
      return;
    }
    applyMuzzleFlashVisual(stepMuzzleFlash(playerMuzzle, dt, gameOver));
  }

  function hideMuzzle(): void {
    applyMuzzleFlashVisual({
      intensity: muzzleFlashIntensityFromLook(0),
      active: muzzleFlashActiveFromLook(false),
    });
  }

  // R / dispose: look fresco (inactive + pos yaw 0); leftover ctor Three opacity 1 / origin 0,0 no filtra.
  applyMuzzleFlashVisual({
    intensity: muzzleFlashIntensityAfterRestart(),
    active: muzzleFlashActiveAfterRestart(),
  });

  // Impact spark: esfera aditiva unlit (radio IMPACT_SPARK_RADIUS) + PointLight (reutilizable).
  const impactGeo = new THREE.SphereGeometry(IMPACT_SPARK_RADIUS, 10, 8);
  const impactMat = new THREE.MeshBasicMaterial({
    color: impactSparkColorAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: impactSparkTransparentAfterRestart(),
    // R / dispose: opacity fresco (inactive); leftover ctor Three 1 no filtra.
    opacity: impactSparkIntensityAfterRestart(),
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: impactSparkDepthWriteAfterRestart(),
    // R / dispose: blending fresco (idle); leftover mid-life blending de la vida anterior no filtra.
    blending: impactSparkBlendingAfterRestart() as THREE.Blending,
  });
  const impactMesh = new THREE.Mesh(impactGeo, impactMat);
  // R / dispose: hidden fresco; leftover mid-spark visible no filtra.
  impactMesh.visible = impactSparkActiveAfterRestart();
  const impactLight = new THREE.PointLight(
    impactSparkLightColorAfterRestart(),
    0,
    impactSparkLightDistanceAfterRestart(),
    impactSparkLightDecayAfterRestart(),
  );
  impactLight.visible = impactSparkActiveAfterRestart();
  // R / dispose: pos fresco (idle 0 + TRACER_HEIGHT); leftover ctor origin 0,0 no filtra.
  impactMesh.position.set(
    impactSparkPosXAfterRestart(),
    impactSparkPosYAfterRestart(),
    impactSparkPosZAfterRestart(),
  );
  impactLight.position.set(
    impactSparkPosXAfterRestart(),
    impactSparkPosYAfterRestart(),
    impactSparkPosZAfterRestart(),
  );
  scene.add(impactMesh, impactLight);

  function applyImpactSparkVisual(out: {
    intensity: number;
    active: boolean;
    x: number;
    y: number;
  }): void {
    const ox = impactSparkPosXFromLook(out.x);
    const oz = impactSparkPosZFromLook(out.y);
    impactMesh.position.set(ox, TRACER_HEIGHT, oz);
    impactLight.position.set(ox, TRACER_HEIGHT, oz);
    impactMesh.visible = impactSparkActiveFromLook(out.active);
    impactLight.visible = impactSparkActiveFromLook(out.active);
    impactMat.opacity = impactSparkIntensityFromLook(out.intensity);
    impactLight.intensity = out.active
      ? IMPACT_SPARK_LIGHT_PEAK * out.intensity
      : 0;
  }

  function tickImpact(dt: number, gameOver = false): void {
    if (!impactSparkApplies(gameOver)) {
      applyImpactSparkVisual({
        intensity: impactSparkIntensityFromLook(0),
        active: impactSparkActiveFromLook(false),
        x: impactSpark.x,
        y: impactSpark.y,
      });
      return;
    }
    applyImpactSparkVisual(stepImpactSpark(impactSpark, dt, gameOver));
  }

  function hideImpact(): void {
    applyImpactSparkVisual({
      intensity: impactSparkIntensityFromLook(0),
      active: impactSparkActiveFromLook(false),
      x: impactSpark.x,
      y: impactSpark.y,
    });
  }

  // R / dispose: look fresco (inactive + pos idle); leftover ctor Three opacity 1 / origin 0,0 no filtra.
  applyImpactSparkVisual({
    intensity: impactSparkIntensityAfterRestart(),
    active: impactSparkActiveAfterRestart(),
    x: impactSparkPosXAfterRestart(),
    y: impactSparkPosZAfterRestart(),
  });

  function applySwingOverlayPose(swing: MeleeSwingOutput): void {
    const pose = hitLeanOut.active
      ? {
          pitch: hitLeanPitchFromLook(hitLeanOut.pitch),
          yawBias: hitLeanYawBiasFromLook(hitLeanOut.yawBias),
        }
      : {
          pitch: meleeSwingPitchFromLook(swing.pitch),
          yawBias: meleeSwingYawBiasFromLook(swing.yawBias),
        };
    playerLocoRoot.rotation.z = pose.yawBias;
    playerLocoRoot.rotation.x = pose.pitch;
  }

  // R / dispose: look fresco (idle 0); leftover mid-swing no filtra.
  applySwingOverlayPose({
    pitch: meleeSwingPitchAfterRestart(),
    yawBias: meleeSwingYawBiasAfterRestart(),
    active: meleeSwingActiveAfterRestart(),
  });

  function applyLeanOverlayPose(lean: HitLeanOutput): void {
    const pose = lean.active
      ? {
          pitch: hitLeanPitchFromLook(lean.pitch),
          yawBias: hitLeanYawBiasFromLook(lean.yawBias),
        }
      : {
          pitch: meleeSwingPitchFromLook(meleeSwingOut.pitch),
          yawBias: meleeSwingYawBiasFromLook(meleeSwingOut.yawBias),
        };
    playerLocoRoot.rotation.z = pose.yawBias;
    playerLocoRoot.rotation.x = pose.pitch;
  }

  // R / dispose: look fresco (idle 0); leftover mid-recoil no filtra.
  applyLeanOverlayPose({
    pitch: hitLeanPitchAfterRestart(),
    yawBias: hitLeanYawBiasAfterRestart(),
    active: hitLeanActiveAfterRestart(),
  });

  function tickSwing(dt: number, gameOver = false): void {
    if (!swingPoseApplies(gameOver)) {
      hideSwing();
      return;
    }
    const out = stepMeleeSwing(playerSwing, dt, gameOver);
    meleeSwingOut = {
      pitch: meleeSwingPitchFromLook(out.pitch),
      yawBias: meleeSwingYawBiasFromLook(out.yawBias),
      active: meleeSwingActiveFromLook(out.active),
    };
  }

  function hideSwing(): void {
    meleeSwingOut = {
      pitch: meleeSwingPitchFromLook(0),
      yawBias: meleeSwingYawBiasFromLook(0),
      active: meleeSwingActiveFromLook(false),
    };
    applySwingOverlayPose(meleeSwingOut);
  }

  function tickLean(dt: number, gameOver = false): void {
    if (!hitLeanApplies(gameOver)) {
      hideLean();
      return;
    }
    const out = stepHitLean(playerHitLean, dt, gameOver);
    hitLeanOut = {
      pitch: hitLeanPitchFromLook(out.pitch),
      yawBias: hitLeanYawBiasFromLook(out.yawBias),
      active: hitLeanActiveFromLook(out.active),
    };
  }

  function applyLocoBobOffsets(out: LocoBobOutput): void {
    if (playerUsesGltfVisual && playerMixer) {
      playerLocoRoot.position.y = 0;
      return;
    }
    const pose = hitLeanOut.active
      ? {
          pitch: hitLeanPitchFromLook(hitLeanOut.pitch),
          yawBias: hitLeanYawBiasFromLook(hitLeanOut.yawBias),
        }
      : {
          pitch: meleeSwingPitchFromLook(meleeSwingOut.pitch),
          yawBias: meleeSwingYawBiasFromLook(meleeSwingOut.yawBias),
        };
    playerLocoRoot.position.y = locoBobYFromLook(out.bobY);
    playerLocoRoot.rotation.z = locoBobLeanZFromLook(out.leanZ) + pose.yawBias;
    playerLocoRoot.rotation.x = locoBobSwayXFromLook(out.swayX) + pose.pitch;
  }

  // R / dispose: loco fresco (idle 0); leftover mid-stride no filtra.
  applyLocoBobOffsets({
    bobY: locoBobYAfterRestart(),
    leanZ: locoBobLeanZAfterRestart(),
    swayX: locoBobSwayXAfterRestart(),
    phase: 0,
  });

  function tickBob(
    dt: number,
    moving: boolean,
    sprinting: boolean,
    gameOver = false,
  ): void {
    if (!locoBobApplies(gameOver)) {
      hideBob();
      return;
    }
    const out = stepLocoBob(playerLoco, { moving, sprinting }, dt, gameOver);
    locoBobOut = {
      bobY: locoBobYFromLook(out.bobY),
      leanZ: locoBobLeanZFromLook(out.leanZ),
      swayX: locoBobSwayXFromLook(out.swayX),
      phase: out.phase,
    };
  }

  function hideBob(): void {
    locoBobOut = {
      bobY: locoBobYFromLook(0),
      leanZ: locoBobLeanZFromLook(0),
      swayX: locoBobSwayXFromLook(0),
      phase: playerLoco.phase,
    };
    applyLocoBobOffsets(locoBobOut);
  }

  function hideLean(): void {
    hitLeanOut = {
      pitch: hitLeanPitchFromLook(0),
      yawBias: hitLeanYawBiasFromLook(0),
      active: hitLeanActiveFromLook(false),
    };
    applyLeanOverlayPose(hitLeanOut);
  }

  function tickShake(dt: number, gameOver = false): void {
    if (!cameraShakeApplies(gameOver)) {
      hideShake();
      return;
    }
    const out = stepCameraShake(playerCameraShake, dt, gameOver);
    cameraShakeOut = {
      offsetX: cameraShakeOffsetXFromLook(out.offsetX),
      offsetZ: cameraShakeOffsetZFromLook(out.offsetZ),
      active: cameraShakeActiveFromLook(out.active),
    };
  }

  function hideShake(): void {
    cameraShakeOut = {
      offsetX: cameraShakeOffsetXFromLook(0),
      offsetZ: cameraShakeOffsetZFromLook(0),
      active: cameraShakeActiveFromLook(false),
    };
  }

  const hostileGeo = new THREE.BoxGeometry(HOSTILE_BODY_WIDTH, HOSTILE_BODY_HEIGHT, HOSTILE_BODY_DEPTH);
  const hostileHeadGeo = new THREE.BoxGeometry(HOSTILE_HEAD_SIZE, HOSTILE_HEAD_SIZE, HOSTILE_HEAD_SIZE);
  const hostileMat = new THREE.MeshStandardMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: hostileColorAfterRestart(),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: hostileRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: hostileMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: hostileEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: hostileEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: hostileOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: hostileTransparentAfterRestart(),
  });
  const possessedMat = new THREE.MeshStandardMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: possessedColorAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: possessedEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: possessedEmissiveIntensityAfterRestart(),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: possessedRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: possessedMetalnessAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: possessedOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: possessedTransparentAfterRestart(),
  });
  const possessedHeadMat = new THREE.MeshStandardMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: possessedHeadColorAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: possessedHeadEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: possessedHeadEmissiveIntensityAfterRestart(),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: possessedHeadRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: possessedHeadMetalnessAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: possessedHeadOpacityAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: possessedHeadTransparentAfterRestart(),
  });
  const hostileMeshes = new Map<string, THREE.Object3D>();
  const hostileKinds = new Map<string, "mute" | "possessed">();
  /** Mixer Idle/Walk/Run por hostile GLB (clone SkeletonUtils). */
  const hostileMixers = new Map<string, CharacterMixerHandle>();
  /** Animator por hostile (roles loco; mismos clips Soldier que player). */
  const hostileAnimators = new Map<string, CharacterAnimator>();
  /** Última posición mapa (x,y) por hostile GLB — y mapa = Three z. */
  const hostileLastMapPos = new Map<string, { x: number; y: number }>();
  /** Template Soldier compartido (mute + poseído); null mientras carga o si falla. */
  let soldierTemplate: LoadedCharacterGltf | null = null;

  function clearHostileVisual(id: string): void {
    const mixer = hostileMixers.get(id);
    if (mixer) {
      mixer.dispose();
      hostileMixers.delete(id);
    }
    hostileAnimators.delete(id);
    hostileLastMapPos.delete(id);
  }

  // Un solo load: mismo Soldier.glb que poseídos (y player).
  void loadCharacterGltf(POSSESSED_SOLDIER_MANIFEST.url).then((loaded) => {
    if (!loaded) return;
    soldierTemplate = loaded;
    // Invalidar boxes mute+poseído: el próximo syncHostiles reclona GLB.
    for (const id of [...hostileKinds.keys()]) {
      const mesh = hostileMeshes.get(id);
      if (mesh) scene.remove(mesh);
      clearHostileVisual(id);
      hostileMeshes.delete(id);
      hostileKinds.delete(id);
    }
  });

  // Tracers de disparo (línea fina + flash puntual en hocico).
  const tracerGeo = new THREE.BoxGeometry(1, 1, 1);
  const tracerMatBase = new THREE.MeshBasicMaterial({
    color: tracerColorAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: tracerTransparentAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover ctor Three 1 no filtra.
    opacity: tracerOpacityAfterRestart(),
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: tracerDepthWriteAfterRestart(),
  });
  interface LiveTracer {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    flash: THREE.PointLight;
    age: number;
    ttl: number;
  }
  // R / dispose: pool fresco (empty); leftover mid-life count no filtra.
  const liveTracers: LiveTracer[] = new Array(tracerCountAfterRestart());

  function spawnTracer(from: TracerPoint, to: TracerPoint, ttl = DEFAULT_TRACER_TTL): void {
    const life = clampTracerTtl(ttl);
    const len = tracerLength(from, to);
    const mid = tracerMidpoint(from, to);
    const mat = tracerMatBase.clone();
    mat.opacity = tracerOpacityFromLook(tracerOpacity(0, life));
    const mesh = new THREE.Mesh(tracerGeo, mat);
    mesh.position.set(mid.x, TRACER_HEIGHT, mid.y);
    mesh.scale.set(TRACER_WIDTH, TRACER_WIDTH, len);
    mesh.rotation.y = tracerYaw(from, to);
    scene.add(mesh);

    const flash = new THREE.PointLight(tracerFlashColorAfterRestart(), TRACER_FLASH_INTENSITY, tracerFlashDistanceAfterRestart(), tracerFlashDecayAfterRestart());
    flash.position.set(from.x, TRACER_HEIGHT + TRACER_FLASH_Y_OFFSET, from.y);
    scene.add(flash);

    liveTracers.push({ mesh, mat, flash, age: 0, ttl: life });
  }

  function tickTracers(dt: number, gameOver = false): void {
    if (!tracerOverlayApplies(gameOver)) {
      clearTracers();
      return;
    }
    for (let i = liveTracers.length - 1; i >= 0; i--) {
      const t = liveTracers[i]!;
      t.age = tickTracerAge(t.age, dt, gameOver);
      const op = tracerOpacityFromLook(tracerOpacity(t.age, t.ttl));
      t.mat.opacity = op;
      t.flash.intensity = TRACER_FLASH_INTENSITY * op;
      if (t.age >= t.ttl) {
        scene.remove(t.mesh);
        scene.remove(t.flash);
        t.mat.dispose();
        liveTracers.splice(i, 1);
      }
    }
  }

  function clearTracers(): void {
    for (const t of liveTracers) {
      scene.remove(t.mesh);
      scene.remove(t.flash);
      t.mat.dispose();
    }
    liveTracers.length = 0;
  }

  // Noise rings: pool pequeño de anillos en el suelo (feedback de ruido).
  const NOISE_RING_POOL = 8;
  // RingGeometry unitario (outer=1); scale = radius * ringScale.
  const noiseRingGeo = new THREE.RingGeometry(NOISE_RING_INNER, 1, 48);
  noiseRingGeo.rotateX(-Math.PI / 2); // plano XZ
  interface PooledNoiseRing {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    state: NoiseRingState | null;
  }
  // R / dispose: pool fresco (empty); leftover mid-life count no filtra.
  const noiseRingPool: PooledNoiseRing[] = new Array(noiseRingCountAfterRestart());
  for (let i = 0; i < NOISE_RING_POOL; i++) {
    const s = noiseRingScaleAfterRestart();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xe8e8f0,
      // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
      transparent: noiseRingTransparentAfterRestart(),
      // R / dispose: opacity fresco (idle 0); leftover mid-life no filtra.
      opacity: noiseRingOpacityAfterRestart(),
      // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
      depthWrite: noiseRingDepthWriteAfterRestart(),
      // R / dispose: side fresco (idle); leftover mid-life side de la vida anterior no filtra.
      side: noiseRingSideAfterRestart() as THREE.Side,
    });
    const mesh = new THREE.Mesh(noiseRingGeo, mat);
    mesh.visible = noiseRingActiveAfterRestart();
    mesh.scale.set(s, 1, s);
    mesh.position.y = NOISE_RING_Y;
    scene.add(mesh);
    noiseRingPool.push({ mesh, mat, state: null });
  }

  function spawnNoiseRing(
    x: number,
    y: number,
    radius: number,
    kind = "run",
  ): void {
    const state = createNoiseRing({ x, y, radius, kind });
    // Reusar slot libre; si lleno, el más viejo.
    let slot = noiseRingPool.find((p) => p.state === null);
    if (!slot) {
      let oldest = noiseRingPool[0]!;
      for (const p of noiseRingPool) {
        if (p.state && oldest.state && p.state.age > oldest.state.age) {
          oldest = p;
        }
      }
      slot = oldest;
    }
    slot.state = state;
    slot.mat.color.setHex(ringColorHex(state.kind));
    slot.mat.opacity = noiseRingOpacityFromLook(ringOpacity(state));
    const s = Math.max(0.05, state.radius * noiseRingScaleFromLook(ringScale(state)));
    slot.mesh.scale.set(s, 1, s);
    slot.mesh.position.set(state.x, NOISE_RING_Y, state.y);
    slot.mesh.visible = true;
  }

  function tickNoiseRings(dt: number, gameOver = false): void {
    if (!noiseRingApplies(gameOver)) {
      clearNoiseRings();
      return;
    }
    for (const p of noiseRingPool) {
      if (!p.state) continue;
      const alive = applyNoiseRingTick(p.state, dt, gameOver);
      if (!alive) {
        p.state = null;
        p.mesh.visible = false;
        p.mat.opacity = 0;
        continue;
      }
      const s = Math.max(0.05, p.state.radius * noiseRingScaleFromLook(ringScale(p.state)));
      p.mesh.scale.set(s, 1, s);
      p.mat.opacity = noiseRingOpacityFromLook(ringOpacity(p.state));
    }
  }

  function clearNoiseRings(): void {
    for (const p of noiseRingPool) {
      p.state = null;
      p.mesh.visible = false;
      p.mat.opacity = 0;
    }
  }

  // Lluvia: pocas líneas verticales cayendo (barato). Knobs en rainStreaks.
  const rainGeo = new THREE.BoxGeometry(
    RAIN_STREAK_WIDTH,
    RAIN_STREAK_LENGTH_DAY,
    RAIN_STREAK_WIDTH,
  );
  const rainMat = new THREE.MeshBasicMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: rainColorAfterRestart(),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: rainTransparentAfterRestart(),
    // R / dispose: opacity fresco (look); leftover mid-life de la vida anterior no filtra.
    opacity: rainStreakOpacityAfterRestart(),
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: rainDepthWriteAfterRestart(),
  });
  const rainGroup = new THREE.Group();
  // R / dispose: grupo fresco (drizzle visible); leftover mid-life hide no filtra.
  rainGroup.visible = !rainStreaksHiddenAfterRestart();
  // R / dispose: pos fresco (spawn); leftover mid-life origin 0,0 no filtra.
  rainGroup.position.set(
    rainAnchorXAfterRestart(),
    0,
    rainAnchorZAfterRestart(),
  );
  scene.add(rainGroup);
  interface RainDrop {
    mesh: THREE.Mesh;
    vx: number;
    vz: number;
    vy: number;
    y: number;
  }
  const rainDrops: RainDrop[] = [];
  for (let i = 0; i < RAIN_COUNT; i++) {
    const mat = rainMat.clone();
    const mesh = new THREE.Mesh(rainGeo, mat);
    // R / dispose: vx fresco (spawn); leftover mid-drift de la vida anterior no filtra.
    const vx = rainStreakVxAfterRestart(Math.random());
    // R / dispose: vz fresco (spawn); leftover mid-life Z de la vida anterior no filtra.
    const vz = rainStreakVzAfterRestart(Math.random());
    // R / dispose: Y fresco (spawn); leftover mid-fall de la vida anterior no filtra.
    const y = rainStreakYAfterRestart(Math.random());
    // R / dispose: vy fresco (spawn); leftover mid-life speed de la vida anterior no filtra.
    const vy = rainStreakVyAfterRestart(Math.random());
    mesh.position.set(vx, y, vz);
    // R / dispose: scaleY fresco (largo); leftover mid-life scale de la vida anterior no filtra.
    mesh.scale.set(1, rainStreakScaleYAfterRestart(), 1);
    // R / dispose: count fresco (active); leftover mid-life 47/noon de la vida anterior no filtra.
    mesh.visible = i < rainActiveCountAfterRestart();
    rainGroup.add(mesh);
    rainDrops.push({
      mesh,
      vx,
      vz,
      vy,
      y,
    });
  }
  let rainAnchorX = rainAnchorXAfterRestart();
  let rainAnchorZ = rainAnchorZAfterRestart();

  function syncRain(
    wx: number,
    wy: number,
    intensity: number,
    dt = 0.016,
    daylight = 1,
  ): void {
    const i = Math.max(0, Math.min(1, intensity));
    rainAnchorX = rainAnchorXFromLook(wx);
    rainAnchorZ = rainAnchorZFromLook(wy);
    rainGroup.position.set(
      rainAnchorXFromLook(wx),
      0,
      rainAnchorZFromLook(wy),
    );
    if (rainStreaksHiddenFromLook(i)) {
      rainGroup.visible = false;
      return;
    }
    rainGroup.visible = true;
    // R / dispose: look fresco; leftover mid-life opacity de la vida anterior no filtra.
    const op = rainStreakOpacityFromLook(i, daylight);
    const active = rainActiveCountFromLook(i, daylight);
    // R / dispose: largo fresco; leftover mid-life scaleY de la vida anterior no filtra.
    const sy = rainStreakScaleYFromLook(daylight);
    for (let n = 0; n < rainDrops.length; n++) {
      const d = rainDrops[n]!;
      const mat = d.mesh.material as THREE.MeshBasicMaterial;
      if (n >= active) {
        d.mesh.visible = false;
        continue;
      }
      d.mesh.visible = true;
      mat.opacity = op;
      d.mesh.scale.set(1, sy, 1);
      if (dt > 0) {
        d.y = rainStreakYFromFall(d.y, rainStreakVyFromSpeed(d.vy), dt, i);
        // Wrap mid-life: respawn fresco; leftover Y < 0.15 de la vida anterior no filtra (dispose).
        if (rainStreakNeedsWrap(d.y)) {
          d.y = rainStreakYFromWrap(Math.random());
          d.vx = rainStreakVxFromPhase(Math.random());
          d.vz = rainStreakVzFromPhase(Math.random());
        }
        // Drift leve con el viento.
        d.vx = rainStreakVxFromDrift(d.vx, dt);
        d.mesh.position.set(d.vx, d.y, rainStreakVzFromZ(d.vz));
      }
    }
    void rainAnchorX;
    void rainAnchorZ;
  }

  function clearRain(): void {
    for (const d of rainDrops) {
      rainGroup.remove(d.mesh);
      (d.mesh.material as THREE.Material).dispose();
    }
    rainDrops.length = 0;
    scene.remove(rainGroup);
    rainGeo.dispose();
    rainMat.dispose();
  }

  // Césped wind instanced (outdoor cerca del player) — barato, sin shader custom.
  const grassGeo = new THREE.BoxGeometry(0.045, 0.42, 0.02);
  const grassMat = new THREE.MeshStandardMaterial({
    color: BLADE_COLOR,
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: grassRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: grassMetalnessAfterRestart(),
    // R / dispose: emissive fresco (idle); leftover mid-life emissive de la vida anterior no filtra.
    emissive: grassEmissiveAfterRestart(),
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: grassEmissiveIntensityAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: grassOpacityAfterRestart(),
  });
  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, MAX_GRASS_INSTANCES);
  grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  grassMesh.frustumCulled = false;
  scene.add(grassMesh);
  const grassDummy = new THREE.Object3D();
  // R / dispose: tiles fresco (spawn); leftover empty / NaN / far no filtra.
  let grassTiles: GrassTile[] = grassTilesAfterRestart(
    (x, y) => map.getTile(x, y)?.kind,
  );
  let grassAnchorTx = grassAnchorTxAfterRestart();
  let grassAnchorTy = grassAnchorTyAfterRestart();
  // R / dispose: viento fresco (0); leftover sway de la vida anterior no filtra.
  let grassTime = grassWindTimeAfterRestart();

  function rebuildGrassTiles(wx: number, wy: number): void {
    const tx = grassAnchorTxFromLook(wx);
    const ty = grassAnchorTyFromLook(wy);
    if (tx === grassAnchorTx && ty === grassAnchorTy) return;
    grassAnchorTx = tx;
    grassAnchorTy = ty;
    grassTiles = grassTilesFromLook(
      wx,
      wy,
      (x, y) => map.getTile(x, y)?.kind,
      GRASS_RADIUS,
    );
  }

  function applyGrassPoses(): void {
    const max = MAX_GRASS_INSTANCES;
    let n = 0;
    for (const t of grassTiles) {
      for (let b = 0; b < BLADES_PER_TILE; b++) {
        if (n >= max) break;
        const pose = bladePoseFromWindTime(t.tx, t.ty, b, t.seed, grassTime);
        grassDummy.position.set(pose.x, pose.y, pose.z);
        grassDummy.rotation.set(0, pose.yaw, 0);
        grassDummy.scale.set(1, pose.sy, 1);
        grassDummy.updateMatrix();
        grassMesh.setMatrixAt(n, grassDummy.matrix);
        n++;
      }
      if (n >= max) break;
    }
    grassMesh.count = n;
    grassMesh.instanceMatrix.needsUpdate = true;
    grassMesh.visible = grassVisibleFromCount(n);
  }

  // R / dispose: count/visible fresco (spawn outdoor); leftover ctor 0 / hide no filtra.
  applyGrassPoses();

  function syncGrass(wx: number, wy: number, dt = 0.016): void {
    grassTime = tickGrassWindTime(grassTime, dt);
    rebuildGrassTiles(wx, wy);
    applyGrassPoses();
  }

  function clearGrass(): void {
    scene.remove(grassMesh);
    grassGeo.dispose();
    grassMat.dispose();
    grassMesh.dispose();
    grassTiles = [];
  }

  const frustum = ISO_FRUSTUM;
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.OrthographicCamera(
    -frustum * aspect,
    frustum * aspect,
    frustum,
    -frustum,
    0.1,
    200,
  );
  // R / dispose: look fresco (spawn) + shake fresco (idle 0); leftover mid-shake no filtra.
  camera.position.set(
    cameraFollowPosXAfterRestart(
      CAMERA_LOOK_X_SPAWN,
      cameraShakeOffsetXAfterRestart(),
    ),
    cameraFollowPosYAfterRestart(),
    cameraFollowPosZAfterRestart(
      CAMERA_LOOK_Z_SPAWN,
      cameraShakeOffsetZAfterRestart(),
    ),
  );
  camera.lookAt(
    cameraFollowLookXAfterRestart(),
    0,
    cameraFollowLookZAfterRestart(),
  );
  scene.add(camera);

  function unloadChunk(key: string): void {
    const entry = loaded.get(key);
    if (!entry) return;
    scene.remove(entry.group);
    for (const dk of entry.doorMeshes.keys()) doorMeshes.delete(dk);
    for (const tk of entry.tileRoots.keys()) tileRoots.delete(tk);
    loaded.delete(key);
  }

  function loadChunk(chunk: Chunk): void {
    const key = chunkKey(chunk.cx, chunk.cy);
    if (loaded.has(key)) return;

    const group = new THREE.Group();
    group.name = `chunk_${key}`;
    const localDoors = new Map<string, THREE.Mesh>();
    const localTiles = new Map<string, THREE.Group>();

    chunk.forEachTile((x, y, tile) => {
      if (!map.inBounds(x, y)) return;
      const root = addTileMesh(
        group,
        x,
        y,
        tile,
        floorGeo,
        wallGeo,
        doorGeo,
        furnitureGeo,
        bedGeo,
        barricadeGeo,
        resolveFloorMat,
        wallMat,
        wallBaseMat,
        furnitureMat,
        bedMat,
        doorClosedMat,
        doorOpenMat,
        barricadeMat,
        barricadeEdgeMat,
        fogMat,
        localDoors,
      );
      const tk = tileKey(x, y);
      localTiles.set(tk, root);
      tileRoots.set(tk, root);
    });

    for (const [dk, mesh] of localDoors) doorMeshes.set(dk, mesh);
    scene.add(group);
    loaded.set(key, {
      group,
      doorMeshes: localDoors,
      tileRoots: localTiles,
    });
  }

  function syncVisibleChunks(wx: number, wy: number): void {
    const want = new Set<string>();
    map.forEachVisibleChunks(wx, wy, VISIBLE_CHUNK_RADIUS, (chunk) => {
      const key = chunkKey(chunk.cx, chunk.cy);
      want.add(key);
      loadChunk(chunk);
    });
    for (const key of [...loaded.keys()]) {
      if (!want.has(key)) unloadChunk(key);
    }
  }

  function syncFov(visible: ReadonlySet<string>): void {
    for (const [tk, root] of tileRoots) {
      const seen = visible.has(tk);
      const content = root.getObjectByName("content");
      const fog = root.getObjectByName("fog");
      if (content) content.visible = seen;
      if (fog) fog.visible = !seen;
    }
  }

  function remeshTile(tx: number, ty: number): void {
    const tk = tileKey(tx, ty);
    const root = tileRoots.get(tk);
    if (!root) return;
    const tile = map.getTile(tx, ty);
    if (!tile) return;

    // Localizar chunk entry para localDoors
    let entry: ChunkMeshes | undefined;
    for (const e of loaded.values()) {
      if (e.tileRoots.has(tk)) {
        entry = e;
        break;
      }
    }
    if (!entry) return;

    const dk = doorKey(tx, ty);
    doorMeshes.delete(dk);
    entry.doorMeshes.delete(dk);

    const content = root.getObjectByName("content") as THREE.Group | undefined;
    if (!content) return;
    while (content.children.length > 0) {
      content.remove(content.children[0]!);
    }

    fillTileContent(
      content,
      tx,
      ty,
      tile,
      floorGeo,
      wallGeo,
      doorGeo,
      furnitureGeo,
      bedGeo,
      barricadeGeo,
      resolveFloorMat,
      wallMat,
      wallBaseMat,
      furnitureMat,
      bedMat,
      doorClosedMat,
      doorOpenMat,
      barricadeMat,
      barricadeEdgeMat,
      entry.doorMeshes,
    );
    for (const [k, mesh] of entry.doorMeshes) {
      if (k === dk) doorMeshes.set(k, mesh);
    }
    // Re-index door if this tile is a door
    const mesh = entry.doorMeshes.get(dk);
    if (mesh) doorMeshes.set(dk, mesh);
  }

  return {
    scene,
    camera,
    ambient,
    sun,
    syncPlayer(x, y) {
      playerMesh.position.set(
        playerPosXFromLook(x),
        0,
        playerPosZFromLook(y),
      );
      placeFacingChevron();
    },
    addLootMarker(id, x, y, name, inv) {
      addLootMarker({ id, x, y, name, inv });
    },
    syncLootFocus(wx, wy, dt, emptyIds, gameOver = false) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
      lootFocusElapsed += safeDt;
      applyLootNameplateLook(wx, wy, emptyIds, gameOver);
      applyLootFocusLook(wx, wy, lootFocusElapsed, emptyIds, gameOver);
    },
    syncDoorFocus(wx, wy, dt, gameOver = false) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
      doorFocusElapsed += safeDt;
      applyDoorFocusLook(wx, wy, doorFocusElapsed, gameOver);
    },
    syncBedFocus(wx, wy, dt, gameOver = false) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
      bedFocusElapsed += safeDt;
      applyBedFocusLook(wx, wy, bedFocusElapsed, gameOver);
    },
    tickPlayerLoco(dt, moving, sprinting, faceX, faceZ) {
      setLocomotion(playerAnimator, { moving, sprinting });
      tickCharacterAnimator(playerAnimator, dt);
      const swing = meleeSwingOut;
      const lean = hitLeanOut;
      if (faceX != null && faceZ != null) {
        const yaw = playerGltfYawFromMove(faceX, faceZ);
        if (yaw !== null) playerGltfYaw = yaw;
      }
      placeFacingChevron();
      const pose = lean.active
        ? {
            pitch: hitLeanPitchFromLook(lean.pitch),
            yawBias: hitLeanYawBiasFromLook(lean.yawBias),
          }
        : {
            pitch: meleeSwingPitchFromLook(swing.pitch),
            yawBias: meleeSwingYawBiasFromLook(swing.yawBias),
          };
      if (playerUsesGltfVisual && playerMixer) {
        playerLocoRoot.position.y = 0;
        playerLocoRoot.rotation.z = pose.yawBias;
        playerLocoRoot.rotation.x = pose.pitch;
        playerLocoRoot.rotation.y = playerGltfYaw;
        playerMixer.update(dt, currentRole(playerAnimator));
        return;
      }
      const out = locoBobOut;
      playerLocoRoot.position.y = locoBobYFromLook(out.bobY);
      playerLocoRoot.rotation.z = locoBobLeanZFromLook(out.leanZ) + pose.yawBias;
      playerLocoRoot.rotation.x = locoBobSwayXFromLook(out.swayX) + pose.pitch;
    },
    triggerPlayerAction(role) {
      setAction(playerAnimator, role);
      playerMixer?.syncFromAnimator(role);
      if (role === "primary-attack" && !playerMixer?.hasRole("primary-attack")) {
        triggerMeleeSwing(playerSwing);
      }
      if (role === "hit") {
        triggerCameraShake(playerCameraShake);
        if (!playerMixer?.hasRole("hit")) {
          triggerHitLean(playerHitLean);
        }
      }
    },
    triggerMuzzleFlash() {
      startMuzzleFlash(playerMuzzle);
    },
    tickLocoBob: tickBob,
    hideLocoBob: hideBob,
    showFacingChevron,
    hideFacingChevron,
    tickMeleeSwing: tickSwing,
    hideMeleeSwing: hideSwing,
    tickHitLean: tickLean,
    hideHitLean: hideLean,
    tickCameraShake: tickShake,
    hideCameraShake: hideShake,
    tickMuzzleFlash: tickMuzzle,
    hideMuzzleFlash: hideMuzzle,
    triggerImpactSpark(x, y) {
      startImpactSpark(impactSpark, x, y);
    },
    tickImpactSpark: tickImpact,
    hideImpactSpark: hideImpact,
    clearPlayerAction() {
      setAction(playerAnimator, null);
      playerMixer?.syncFromAnimator(currentRole(playerAnimator));
    },
    syncHostiles(entities, dt = 0, gameOver = false) {
      const seen = new Set<string>();
      const safeDt = hostileMixerDt(dt, gameOver);
      for (const e of entities) {
        seen.add(e.id);
        const kind = e.kind ?? "mute";
        let mesh = hostileMeshes.get(e.id);
        if (!mesh || hostileKinds.get(e.id) !== kind) {
          if (mesh) {
            scene.remove(mesh);
            clearHostileVisual(e.id);
          }
          if (soldierTemplate) {
            const built = makeHostileGltfFigure(
              kind,
              soldierTemplate,
              markerShared,
            );
            mesh = built.root;
            if (built.mixer) {
              hostileMixers.set(e.id, built.mixer);
              hostileAnimators.set(e.id, createCharacterAnimator());
            }
          } else {
            mesh = makeHostileFigure(
              kind,
              hostileGeo,
              hostileHeadGeo,
              hostileMat,
              possessedMat,
              possessedHeadMat,
              markerShared,
            );
          }
          hostileMeshes.set(e.id, mesh);
          hostileKinds.set(e.id, kind);
          scene.add(mesh);
        }
        mesh.position.set(e.x, 0, e.y);
        mesh.visible = e.visible;
        if (e.faceX !== undefined && e.faceZ !== undefined) {
          const yaw = hostileYaw(e.faceX, e.faceZ);
          if (yaw !== null) mesh.rotation.y = yaw;
        }

        // Mute/poseído GLB: Idle/Walk/Run vía delta mapa (y → z). Boxes = fallback.
        // gameOver: skip mixer.update (dt 0); meshes / visible / yaw se quedan.
        const mixer = hostileMixers.get(e.id);
        const anim = hostileAnimators.get(e.id);
        if (mixer && anim) {
          if (hostileIdleApplies(gameOver)) {
            const last = hostileLastMapPos.get(e.id);
            let loco: ReturnType<typeof hostileLocoFromDelta> = "idle";
            if (last) {
              // dx/dz: mapa x→x, mapa y→Three z
              loco = hostileLocoFromDelta(e.x - last.x, e.y - last.y, safeDt);
            }
            setLocomotion(anim, {
              moving: loco !== "idle",
              sprinting: loco === "run",
            });
            tickCharacterAnimator(anim, safeDt);
            mixer.update(safeDt, currentRole(anim));
          }
          hostileLastMapPos.set(e.id, { x: e.x, y: e.y });
        }
      }
      for (const [id, mesh] of hostileMeshes) {
        if (!seen.has(id)) {
          scene.remove(mesh);
          clearHostileVisual(id);
          hostileMeshes.delete(id);
          hostileKinds.delete(id);
        }
      }
    },
    syncDoor(tx, ty, open) {
      const mesh = doorMeshes.get(doorKey(tx, ty));
      if (!mesh) return;
      mesh.material = open ? doorOpenMat : doorClosedMat;
      if (open) {
        mesh.rotation.y = Math.PI / 2;
        mesh.position.set(tx + DOOR_OPEN_X, DOOR_BASE_Y, ty + 0.5);
      } else {
        mesh.rotation.y = 0;
        mesh.position.set(tx + 0.5, DOOR_BASE_Y, ty + 0.5);
      }
    },
    remeshTile,
    forceReloadVisible(wx, wy) {
      for (const key of [...loaded.keys()]) unloadChunk(key);
      syncVisibleChunks(wx, wy);
    },
    syncDayNight(clock) {
      const d = clock.daylight;
      lastDaylight = d;
      const atm = atmosphereFromClock(clock);
      ambient.intensity = nightAmbientIntensity(d);
      sun.intensity = nightSunIntensity(d);
      ambientColor.setRGB(atm.ambient.r, atm.ambient.g, atm.ambient.b);
      ambient.color.copy(ambientColor);
      sunColor.setRGB(atm.sun.r, atm.sun.g, atm.sun.b);
      sun.color.copy(sunColor);
      skyColor.setRGB(atm.sky.r, atm.sky.g, atm.sky.b);
      scene.background = skyColor;
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.copy(skyColor);
        scene.fog.near = atm.near;
        scene.fog.far = atm.far;
      }
      // Albedo de suelo/pasto/muro/props: lift de noche; día = paleta intacta.
      for (const [key, m] of floorMatByColor) {
        m.color.setHex(applyNightGroundLift(key, d));
      }
      grassMat.color.setHex(applyNightGroundLift(BLADE_COLOR, d));
      wallMat.color.setHex(applyNightGroundLift(WALL_COLOR, d));
      wallBaseMat.color.setHex(applyNightGroundLift(WALL_BASE_COLOR, d));
      furnitureMat.color.setHex(applyNightGroundLift(FURNITURE_COLOR, d));
      bedMat.color.setHex(applyNightGroundLift(BED_COLOR, d));
      doorClosedMat.color.setHex(applyNightGroundLift(DOOR_CLOSED, d));
      doorOpenMat.color.setHex(applyNightGroundLift(DOOR_OPEN, d));
      barricadeMat.color.setHex(applyNightGroundLift(BARRICADE_COLOR, d));
      barricadeEdgeMat.color.setHex(applyNightGroundLift(BARRICADE_EDGE, d));
    },
    syncWarmLight(wx, wy, intensity) {
      const i = Math.max(0, Math.min(1, intensity));
      warmLight.intensity = warmLightIntensityFromLook(i * WARM_LIGHT_INTENSITY_MUL);
      warmLight.distance = warmLightDistanceFromLook(WARM_LIGHT_DISTANCE_BASE + i * WARM_LIGHT_DISTANCE_GAIN);
      warmLight.position.set(warmLightOriginXFromLook(wx), warmLightYFromLook(WARM_LIGHT_Y), warmLightOriginZFromLook(wy));
      warmLight.visible = warmLightVisibleFromLook(i > WARM_LIGHT_VISIBLE_EPS);
      // Tinte un poco más ámbar cuando está fuerte.
      warmLight.color.setRGB(1, warmLightColorGFromLook(WARM_LIGHT_AMBER_G + i * WARM_LIGHT_AMBER_G_GAIN), warmLightColorBFromLook(WARM_LIGHT_AMBER_B + i * WARM_LIGHT_AMBER_B_GAIN));
    },
    syncTorchLight(wx, wy, intensity) {
      const i = Math.max(0, intensity);
      const on = flashlightConeVisible(i);
      torchLight.intensity = flashlightFillIntensityFromLook(i * FLASHLIGHT_FILL_INTENSITY_MUL);
      torchLight.distance = flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_BASE + i * FLASHLIGHT_FILL_DISTANCE_GAIN);
      torchLight.position.set(flashlightFillOriginXFromLook(wx), FLASHLIGHT_FILL_Y, flashlightFillOriginZFromLook(wy));
      torchLight.visible = flashlightFillVisibleFromLook(on);
      torchLight.color.setHex(FLASHLIGHT_FILL_COLOR);

      const yaw = flashlightConeYawFromLook(playerGltfYaw);
      const tip = flashlightConeTip(yaw);
      tip.x = flashlightConeOffsetXFromLook(tip.x);
      tip.z = flashlightConeOffsetZFromLook(tip.z);
      torchSpot.intensity = flashlightSpotIntensityFromLook(i * FLASHLIGHT_SPOT_INTENSITY_MUL);
      torchSpot.distance = flashlightSpotDistanceFromLook(FLASHLIGHT_CONE_LENGTH + FLASHLIGHT_SPOT_DISTANCE_EXTRA + i * FLASHLIGHT_SPOT_DISTANCE_GAIN);
      torchSpot.position.set(flashlightSpotOriginXFromLook(wx), FLASHLIGHT_SPOT_Y, flashlightSpotOriginZFromLook(wy));
      torchSpot.target.position.set(flashlightSpotTargetXFromLook(wx + tip.x), FLASHLIGHT_SPOT_TARGET_Y, flashlightSpotTargetZFromLook(wy + tip.z));
      torchSpot.target.updateMatrixWorld();
      torchSpot.visible = flashlightSpotVisibleFromLook(on);
      torchSpot.color.setHex(FLASHLIGHT_SPOT_COLOR);

      flashlightConeWedge.rotation.y = yaw;
      flashlightConeWedge.visible = flashlightConeVisibleFromLook(on);
      coneMat.opacity = flashlightConeOpacityFromLook(flashlightWedgeOpacity(i));
    },
    followCamera(x, y) {
      camera.position.set(
        cameraFollowPosXFromLook(
          x,
          cameraShakeOffsetXFromLook(cameraShakeOut.offsetX),
        ),
        cameraFollowPosYFromLook(),
        cameraFollowPosZFromLook(
          y,
          cameraShakeOffsetZFromLook(cameraShakeOut.offsetZ),
        ),
      );
      camera.lookAt(
        cameraFollowLookXFromLook(x),
        0,
        cameraFollowLookZFromLook(y),
      );
    },
    syncVisibleChunks,
    syncFov,
    loadedChunkCount() {
      return loaded.size;
    },
    spawnTracer,
    tickTracers,
    hideTracers: clearTracers,
    spawnNoiseRing,
    tickNoiseRings,
    hideNoiseRings: clearNoiseRings,
    syncRain,
    syncGrass,
    dispose() {
      scene.remove(torchLight);
      scene.remove(torchSpot);
      scene.remove(torchSpot.target);
      scene.remove(warmLight);
      clearTracers();
      clearNoiseRings();
      clearRain();
      clearGrass();
      tracerGeo.dispose();
      tracerMatBase.dispose();
      noiseRingGeo.dispose();
      for (const p of noiseRingPool) {
        scene.remove(p.mesh);
        p.mat.dispose();
      }
      for (const key of [...loaded.keys()]) unloadChunk(key);
      floorGeo.dispose();
      wallGeo.dispose();
      doorGeo.dispose();
      furnitureGeo.dispose();
      bedGeo.dispose();
      barricadeGeo.dispose();
      for (const m of floorMatByColor.values()) m.dispose();
      floorMatByColor.clear();
      wallMat.dispose();
      wallBaseMat.dispose();
      furnitureMat.dispose();
      bedMat.dispose();
      doorClosedMat.dispose();
      doorOpenMat.dispose();
      barricadeMat.dispose();
      barricadeEdgeMat.dispose();
      fogMat.dispose();
      for (const entry of lootMarkerGroups) {
        const mat = entry.nameplate.material as THREE.SpriteMaterial;
        mat.map?.dispose();
        mat.dispose();
        scene.remove(entry.group);
      }
      lootMarkerGroups.length = 0;
      for (const entry of doorMarkerGroups) {
        scene.remove(entry.group);
      }
      doorMarkerGroups.length = 0;
      for (const entry of bedMarkerGroups) {
        scene.remove(entry.group);
      }
      bedMarkerGroups.length = 0;
      for (const mesh of hostileMeshes.values()) {
        scene.remove(mesh);
      }
      for (const mixer of hostileMixers.values()) mixer.dispose();
      hostileMixers.clear();
      hostileAnimators.clear();
      hostileLastMapPos.clear();
      hostileMeshes.clear();
      hostileKinds.clear();
      soldierTemplate = null;
      hostileGeo.dispose();
      hostileHeadGeo.dispose();
      hostileMat.dispose();
      possessedMat.dispose();
      possessedHeadMat.dispose();
      playerMesh.remove(muzzleMesh, muzzleLight);
      muzzleGeo.dispose();
      muzzleMat.dispose();
      playerMesh.remove(chevronMesh);
      chevronGeo.dispose();
      chevronMat.dispose();
      playerMesh.remove(flashlightConeWedge);
      coneGeo.dispose();
      coneMat.dispose();
      scene.remove(impactMesh, impactLight);
      impactGeo.dispose();
      impactMat.dispose();
      playerBodyMat.dispose();
      playerHeadMat.dispose();
      playerBodyGeo.dispose();
      playerHeadGeo.dispose();
      markerShared.dispose();
    },
  };
}

/** Figura mute/poseído box + anillo/badge — fallback si GLB pending/fail. HOSTILE_VISUAL_SCALE solo aquí. */
function makeHostileFigure(
  kind: "mute" | "possessed",
  bodyGeo: THREE.BoxGeometry,
  headGeo: THREE.BoxGeometry,
  muteMat: THREE.MeshStandardMaterial,
  possessedBodyMat: THREE.MeshStandardMaterial,
  possessedHeadMat: THREE.MeshStandardMaterial,
  markers: MarkerSharedResources,
): THREE.Object3D {
  const root = new THREE.Group();
  if (kind === "mute") {
    const mesh = new THREE.Mesh(bodyGeo, muteMat);
    mesh.position.y = HOSTILE_BODY_BASE_Y;
    // Un poco más bajo/ancho que el player para silueta distinta.
    mesh.scale.set(HOSTILE_MUTE_XZ_SCALE, 1, HOSTILE_MUTE_XZ_SCALE);
    root.add(mesh);
  } else {
    const body = new THREE.Mesh(bodyGeo, possessedBodyMat);
    body.position.y = HOSTILE_BODY_BASE_Y;
    const head = new THREE.Mesh(headGeo, possessedHeadMat);
    head.position.y = HOSTILE_HEAD_BASE_Y;
    root.add(body, head);
  }
  attachRoleMarkers(root, kind, markers);
  // Mute/poseído box a escala legible vs Soldier; markers/rings heredan.
  root.scale.setScalar(HOSTILE_VISUAL_SCALE);
  return root;
}

/**
 * Hostile GLB: clone del template Soldier + tint (mute/poseído) + mixer Idle/Walk/Run.
 * Escala del manifest (hostiles 1.5, misma que el player).
 * No HOSTILE_VISUAL_SCALE.
 */
function makeHostileGltfFigure(
  kind: "mute" | "possessed",
  template: LoadedCharacterGltf,
  markers: MarkerSharedResources,
): { root: THREE.Object3D; mixer: CharacterMixerHandle | null } {
  const root = new THREE.Group();
  const clone = SkeletonUtils.clone(template.scene) as THREE.Group;
  const manifest =
    kind === "mute" ? MUTE_SOLDIER_MANIFEST : POSSESSED_SOLDIER_MANIFEST;
  const scale =
    Number.isFinite(manifest.scale) && manifest.scale > 0 ? manifest.scale : 1;
  const yOff = Number.isFinite(manifest.yOffset) ? manifest.yOffset : 0;
  clone.scale.setScalar(scale);
  clone.position.y = yOff;
  if (kind === "mute") applyMuteLook(clone);
  else applyPossessedLook(clone);
  root.add(clone);

  const loaded: LoadedCharacterGltf = {
    root: clone,
    scene: clone,
    animations: template.animations,
    clipNames: template.clipNames,
  };
  const mixer = bindMixer(loaded, manifest);
  if (mixer) mixer.syncFromAnimator("idle");

  attachRoleMarkers(root, kind, markers);
  return { root, mixer };
}

interface MarkerSharedResources {
  /** Aro mute/possessed (THREAT 0.37845–0.8993). */
  ringGeo: THREE.RingGeometry;
  /** Aro loot/door/bed (INTERACT 0.416295–1.03155). */
  interactRingGeo: THREE.RingGeometry;
  badgeGeo: THREE.CircleGeometry;
  iconGeo: THREE.PlaneGeometry;
  doorLetterMap: THREE.CanvasTexture;
  bedLetterMap: THREE.CanvasTexture;
  mats: THREE.Material[];
  dispose(): void;
}

/** Letra blanca + stroke oscuro en el disc del floatBadge (puerta/cama). */
function makeBadgeLetterTexture(
  letter: string,
  fontPx: number,
): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.font = `700 ${fontPx}px ui-monospace, SF Mono, Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 9;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(letter, size / 2, size / 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(letter, size / 2, size / 2);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.needsUpdate = true;
  return map;
}

function createMarkerSharedResources(): MarkerSharedResources {
  const threat = markerRingRadii("mute");
  const interact = markerRingRadii("loot");
  const ringGeo = new THREE.RingGeometry(threat.inner, threat.outer, 28);
  const interactRingGeo = new THREE.RingGeometry(
    interact.inner,
    interact.outer,
    28,
  );
  const badgeGeo = new THREE.CircleGeometry(MARKER_BADGE_RADIUS, 20);
  const iconGeo = new THREE.PlaneGeometry(MARKER_ICON_SIZE, MARKER_ICON_SIZE);
  const doorLetterMap = makeBadgeLetterTexture(doorBadgeLabel, doorBadgeFontPx);
  const bedLetterMap = makeBadgeLetterTexture(bedBadgeLabel, bedBadgeFontPx);
  const mats: THREE.Material[] = [];
  return {
    ringGeo,
    interactRingGeo,
    badgeGeo,
    iconGeo,
    doorLetterMap,
    bedLetterMap,
    mats,
    dispose() {
      ringGeo.dispose();
      interactRingGeo.dispose();
      badgeGeo.dispose();
      iconGeo.dispose();
      doorLetterMap.dispose();
      bedLetterMap.dispose();
      for (const m of mats) m.dispose();
      mats.length = 0;
    },
  };
}

/** Oculta solo anillo+badge; no toca el nameplate de loot. */
function setInteractRingVisible(root: THREE.Object3D, vis: boolean): void {
  const ring = root.getObjectByName("groundRing");
  if (ring) ring.visible = vis;
  const badge = root.getObjectByName("floatBadge");
  if (badge) badge.visible = vis;
}

/**
 * Anillo de suelo + badge flotante (triple encoding chess).
 * Materiales por rol; geom compartida.
 */
function attachRoleMarkers(
  root: THREE.Object3D,
  role: MarkerRole,
  shared: MarkerSharedResources,
): void {
  const pal = paletteFor(role);
  // Player: sin aro de suelo ni badge flotante (queda el chevron).
  if (role === "player") return;

  const ringMat = new THREE.MeshBasicMaterial({
    color: pal.ring,
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: markerRingTransparentAfterRestart(),
    opacity: markerRingOpacity(role),
    // R / dispose: side fresco (idle); leftover mid-life side de la vida anterior no filtra.
    side: markerRingSideAfterRestart() as THREE.Side,
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: markerRingDepthWriteAfterRestart(),
  });
  shared.mats.push(ringMat);
  const ringGeo = markerUsesInteractRing(role)
    ? shared.interactRingGeo
    : shared.ringGeo;
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = "groundRing";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = MARKER_RING_Y;
  root.add(ring);

  // Loot/mute/possessed: sin disc/glyph (queda nameplate o look+aro). Player ya return arriba.
  if (markerBadgeOpacity(role) <= 0) return;

  const badgeMat = new THREE.MeshStandardMaterial({
    color: pal.badge,
    emissive: pal.emissive,
    // R / dispose: intensity fresco (idle); leftover mid-life intensity de la vida anterior no filtra.
    emissiveIntensity: markerBadgeEmissiveIntensityAfterRestart(),
    // R / dispose: roughness fresco (idle); leftover mid-life roughness de la vida anterior no filtra.
    roughness: markerBadgeRoughnessAfterRestart(),
    // R / dispose: metalness fresco (idle); leftover mid-life metalness de la vida anterior no filtra.
    metalness: markerBadgeMetalnessAfterRestart(),
    // R / dispose: side fresco (idle); leftover mid-life side de la vida anterior no filtra.
    side: markerBadgeSideAfterRestart() as THREE.Side,
    opacity: markerBadgeOpacity(role),
  });
  const letterMap =
    role === "door"
      ? shared.doorLetterMap
      : role === "bed"
        ? shared.bedLetterMap
        : null;
  const iconMat = new THREE.MeshBasicMaterial({
    // R / dispose: color fresco (idle); leftover mid-life color de la vida anterior no filtra.
    color: markerIconColorAfterRestart(),
    ...(letterMap ? { map: letterMap } : {}),
    // R / dispose: transparent fresco (idle); leftover mid-life transparent de la vida anterior no filtra.
    transparent: markerIconTransparentAfterRestart(),
    // R / dispose: opacity fresco (idle); leftover mid-life opacity de la vida anterior no filtra.
    opacity: markerIconOpacityAfterRestart(),
    // R / dispose: side fresco (idle); leftover mid-life side de la vida anterior no filtra.
    side: markerIconSideAfterRestart() as THREE.Side,
    // R / dispose: depthWrite fresco (idle); leftover mid-life depthWrite de la vida anterior no filtra.
    depthWrite: markerIconDepthWriteAfterRestart(),
  });
  shared.mats.push(badgeMat, iconMat);

  const badge = new THREE.Group();
  badge.name = "floatBadge";
  const disc = new THREE.Mesh(shared.badgeGeo, badgeMat);
  // Mirar hacia arriba un poco legible en iso
  disc.rotation.x = -Math.PI / MARKER_BADGE_TILT;
  const icon = new THREE.Mesh(shared.iconGeo, iconMat);
  icon.rotation.x = -Math.PI / MARKER_BADGE_TILT;
  icon.position.y = MARKER_ICON_Y;
  // Escala distinta por glifo visual (mute más angular vía scale)
  if (role === "mute") icon.scale.set(muteBadgeIconScale, muteBadgeIconScale, 1);
  else if (role === "possessed")
    icon.scale.set(possessedBadgeIconScale, possessedBadgeIconScale, 1);
  else if (role === "loot")
    icon.scale.set(lootBadgeIconScale, lootBadgeIconScale, 1);
  else if (role === "door") {
    disc.scale.set(doorBadgeDiscScale, doorBadgeDiscScale, 1);
    icon.scale.set(doorBadgeLetterScale, doorBadgeLetterScale, 1);
  } else if (role === "bed") {
    disc.scale.set(bedBadgeDiscScale, bedBadgeDiscScale, 1);
    icon.scale.set(bedBadgeLetterScale, bedBadgeLetterScale, 1);
  }
  badge.add(disc, icon);
  if (role === "door") badge.position.y = doorBadgeY;
  else if (role === "bed") badge.position.y = bedBadgeY;
  else if (role === "loot") badge.position.y = lootBadgeY;
  else if (role === "mute") badge.position.y = muteBadgeY;
  else if (role === "possessed") badge.position.y = possessedBadgeY;
  root.add(badge);
}

function doorKey(x: number, y: number): string {
  return `${x},${y}`;
}

function fillTileContent(
  content: THREE.Group,
  x: number,
  y: number,
  tile: Tile,
  floorGeo: THREE.PlaneGeometry,
  wallGeo: THREE.BoxGeometry,
  doorGeo: THREE.BoxGeometry,
  furnitureGeo: THREE.BoxGeometry,
  bedGeo: THREE.BoxGeometry,
  barricadeGeo: THREE.BoxGeometry,
  floorMatForTile: (x: number, y: number, tile: Tile) => THREE.MeshStandardMaterial,
  wallMat: THREE.MeshStandardMaterial,
  wallBaseMat: THREE.MeshStandardMaterial,
  furnitureMat: THREE.MeshStandardMaterial,
  bedMat: THREE.MeshStandardMaterial,
  doorClosedMat: THREE.MeshStandardMaterial,
  doorOpenMat: THREE.MeshStandardMaterial,
  barricadeMat: THREE.MeshStandardMaterial,
  barricadeEdgeMat: THREE.MeshStandardMaterial,
  doorMeshes: Map<string, THREE.Mesh>,
): void {
  if (
    tile.kind === "floor" ||
    tile.kind === "door" ||
    tile.kind === "furniture" ||
    tile.kind === "barricade"
  ) {
    const floor = new THREE.Mesh(floorGeo, floorMatForTile(x, y, tile));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x + 0.5, 0, y + 0.5);
    content.add(floor);
  }
  if (tile.kind === "wall") {
    const base = new THREE.Mesh(floorGeo, wallBaseMat);
    base.rotation.x = -Math.PI / 2;
    base.position.set(x + 0.5, 0, y + 0.5);
    content.add(base);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x + 0.5, WALL_BASE_Y, y + 0.5);
    content.add(wall);
  }
  if (tile.kind === "door") {
    const door = new THREE.Mesh(
      doorGeo,
      tile.open ? doorOpenMat : doorClosedMat,
    );
    if (tile.open) {
      door.rotation.y = Math.PI / 2;
      door.position.set(x + DOOR_OPEN_X, DOOR_BASE_Y, y + 0.5);
    } else {
      door.position.set(x + 0.5, DOOR_BASE_Y, y + 0.5);
    }
    content.add(door);
    doorMeshes.set(doorKey(x, y), door);
  }

  if (tile.kind === "furniture") {
    if (tile.variant === "bed") {
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.set(x + 0.5, BED_BASE_Y, y + 0.5);
      content.add(bed);
    } else {
      const furn = new THREE.Mesh(furnitureGeo, furnitureMat);
      furn.position.set(x + 0.5, FURNITURE_BASE_Y, y + 0.5);
      content.add(furn);
    }
  }

  if (tile.kind === "barricade") {
    // Dos planchas cruzadas — silueta distinta al muro gris
    const plank = new THREE.Mesh(barricadeGeo, barricadeMat);
    plank.position.set(x + 0.5, BARRICADE_PLANK_Y, y + 0.5);
    plank.rotation.y = BARRICADE_PLANK_ROT_Y;
    content.add(plank);
    const cross = new THREE.Mesh(barricadeGeo, barricadeEdgeMat);
    cross.position.set(x + 0.5, BARRICADE_CROSS_Y, y + 0.5);
    cross.rotation.y = BARRICADE_CROSS_ROT_Y;
    cross.scale.set(BARRICADE_CROSS_SCALE_X, BARRICADE_CROSS_SCALE_Y, BARRICADE_CROSS_SCALE_Z);
    content.add(cross);
  }
}

function addTileMesh(
  chunkGroup: THREE.Group,
  x: number,
  y: number,
  tile: Tile,
  floorGeo: THREE.PlaneGeometry,
  wallGeo: THREE.BoxGeometry,
  doorGeo: THREE.BoxGeometry,
  furnitureGeo: THREE.BoxGeometry,
  bedGeo: THREE.BoxGeometry,
  barricadeGeo: THREE.BoxGeometry,
  floorMatForTile: (x: number, y: number, tile: Tile) => THREE.MeshStandardMaterial,
  wallMat: THREE.MeshStandardMaterial,
  wallBaseMat: THREE.MeshStandardMaterial,
  furnitureMat: THREE.MeshStandardMaterial,
  bedMat: THREE.MeshStandardMaterial,
  doorClosedMat: THREE.MeshStandardMaterial,
  doorOpenMat: THREE.MeshStandardMaterial,
  barricadeMat: THREE.MeshStandardMaterial,
  barricadeEdgeMat: THREE.MeshStandardMaterial,
  fogMat: THREE.MeshBasicMaterial,
  doorMeshes: Map<string, THREE.Mesh>,
): THREE.Group {
  const root = new THREE.Group();
  root.name = `tile_${x}_${y}`;

  const content = new THREE.Group();
  content.name = "content";

  fillTileContent(
    content,
    x,
    y,
    tile,
    floorGeo,
    wallGeo,
    doorGeo,
    furnitureGeo,
    bedGeo,
    barricadeGeo,
    floorMatForTile,
    wallMat,
    wallBaseMat,
    furnitureMat,
    bedMat,
    doorClosedMat,
    doorOpenMat,
    barricadeMat,
    barricadeEdgeMat,
    doorMeshes,
  );

  const fog = new THREE.Mesh(floorGeo, fogMat);
  fog.name = "fog";
  // R / dispose: rot X fresco (idle); leftover mid-life rot de la vida anterior no filtra.
  fog.rotation.x = fogRotXAfterRestart();
  // R / dispose: rot Y fresco (idle); leftover mid-life rot Y de la vida anterior no filtra.
  fog.rotation.y = fogRotYAfterRestart();
  // R / dispose: rot Z fresco (idle); leftover mid-life rot Z de la vida anterior no filtra.
  fog.rotation.z = fogRotZAfterRestart();
  // R / dispose: scale X fresco (idle); leftover mid-life scale de la vida anterior no filtra.
  fog.scale.x = fogScaleXAfterRestart();
  // R / dispose: scale Y fresco (idle); leftover mid-life scale Y de la vida anterior no filtra.
  fog.scale.y = fogScaleYAfterRestart();
  // R / dispose: scale Z fresco (idle); leftover mid-life scale Z de la vida anterior no filtra.
  fog.scale.z = fogScaleZAfterRestart();
  // R / dispose: Y fresco (idle); leftover mid-life Y de la vida anterior no filtra.
  fog.position.set(x + 0.5, fogYAfterRestart(), y + 0.5);
  fog.visible = false;

  root.add(content);
  root.add(fog);
  chunkGroup.add(root);
  return root;
}
