import * as THREE from "three";
import {
  markerBadgeOpacity,
  markerRingOpacity,
  markerRingRadii,
  markerUsesInteractRing,
  muteBadgeY,
  paletteFor,
  possessedBadgeY,
  type MarkerRole,
} from "./markers";
import {
  FACING_CHEVRON_COLOR,
  FACING_CHEVRON_HW,
  FACING_CHEVRON_LEN,
  FACING_CHEVRON_OPACITY,
  facingChevronOffset,
} from "./facingChevron";
import {
  FLASHLIGHT_CONE_HALF_WIDTH,
  FLASHLIGHT_CONE_LENGTH,
  FLASHLIGHT_CONE_Y,
  FLASHLIGHT_FILL_INTENSITY_MUL,
  FLASHLIGHT_SPOT_COLOR,
  FLASHLIGHT_SPOT_INTENSITY_MUL,
  FLASHLIGHT_SPOT_PENUMBRA,
  FLASHLIGHT_WEDGE_COLOR,
  FLASHLIGHT_WEDGE_OPACITY_BASE,
  flashlightConeTip,
  flashlightConeVisible,
  flashlightSpotAngle,
  flashlightWedgeOpacity,
  flashlightWedgeVertexColors,
} from "./flashlightCone";
import {
  DEFAULT_TRACER_TTL,
  TRACER_HEIGHT,
  clampTracerTtl,
  tracerLength,
  tracerMidpoint,
  tracerOpacity,
  tracerYaw,
  type TracerPoint,
} from "./tracers";
import {
  createNoiseRing,
  ringColorHex,
  ringOpacity,
  ringScale,
  tickNoiseRing,
  type NoiseRingState,
} from "./noiseRings";
import {
  createLocoBobState,
  tickLocoBob,
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
import { ISO_FRUSTUM } from "./cameraConfig";
import { HOSTILE_VISUAL_SCALE, hostileYaw } from "./hostileFigure";
import { hostileLocoFromDelta } from "./hostileLoco";
import { playerGltfYawFromMove } from "./playerFacing";
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
  tickMeleeSwing,
  triggerMeleeSwing,
} from "./meleeSwing";
import {
  createHitLeanState,
  tickHitLean,
  triggerHitLean,
} from "./hitLean";
import {
  createCameraShakeState,
  tickCameraShake,
  triggerCameraShake,
  type CameraShakeOutput,
} from "./cameraShake";
import {
  createMuzzleFlash,
  tickMuzzleFlash,
  triggerMuzzleFlash as startMuzzleFlash,
} from "./muzzleFlash";
import {
  createImpactSpark,
  tickImpactSpark,
  triggerImpactSpark as startImpactSpark,
} from "./impactSpark";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import {
  applyNightGroundLift,
  countAoNeighbors,
  floorColorAt,
} from "./floorStyle";
import {
  atmosphereFor,
  nightAmbientIntensity,
  nightSunIntensity,
} from "./fogAtmosphere";
import {
  bladePoseAt,
  collectGrassTiles,
  GRASS_RADIUS,
  MAX_GRASS_INSTANCES,
  BLADES_PER_TILE,
  type GrassTile,
} from "./windGrass";
import {
  RAIN_COLOR,
  RAIN_COUNT,
  RAIN_STREAK_LENGTH_DAY,
  RAIN_STREAK_WIDTH,
  rainActiveCount,
  rainStreakOpacity,
  rainStreakScaleY,
  rainStreaksHidden,
} from "./rainStreaks";
import { lootFocusMul, lootRingVisible, LOOT_FOCUS_REACH } from "./lootFocus";
import {
  LOOT_NAMEPLATE_ICON_PAD,
  LOOT_NAMEPLATE_ICON_SIZE,
  LOOT_NAMEPLATE_SCALE_X,
  LOOT_NAMEPLATE_SCALE_Y,
  LOOT_NAMEPLATE_Y,
  lootNameplateInvEmpty,
  lootNameplateLabel,
  lootNameplateLeadId,
  lootNameplateOpacity,
  lootNameplateScale,
  lootNameplateVisible,
  paintLootNameplateIcon,
} from "./lootNameplate";
import {
  doorBadgeDiscScale,
  doorBadgeFontPx,
  doorBadgeLabel,
  doorBadgeLetterScale,
  doorBadgeY,
  doorFocusMul,
  doorRingVisible,
  DOOR_FOCUS_REACH,
} from "./doorFocus";
import {
  bedBadgeDiscScale,
  bedBadgeFontPx,
  bedBadgeLabel,
  bedBadgeLetterScale,
  bedBadgeY,
  bedFocusMul,
  bedRingVisible,
  BED_FOCUS_REACH,
} from "./bedFocus";
import type { TileMap } from "../world/tilemap";
import type { Tile } from "../world/tile";
import type { Chunk } from "../world/chunk";
import { chunkKey } from "../world/chunk";
import { tileKey } from "../world/los";
import { isIndoor } from "../world/indoor";
import type { GameClock } from "../core/clock";
import {
  lootPileLabel,
  type ContainerRegistry,
} from "../items";

const WALL_COLOR = 0x5a5348;
const DOOR_CLOSED = 0x8b5a2b;
const DOOR_OPEN = 0xc4a35a;
const PLAYER_COLOR = 0x4a8fd4;
/** Amenaza muda: rojo oscuro. */
const HOSTILE_COLOR = 0x6b1a1a;
/** Poseído: púrpura enfermo. */
const POSSESSED_COLOR = 0x5a2d6b;
const POSSESSED_EMISSIVE = 0x1a0820;
const FURNITURE_COLOR = 0x6b4f2a;
/** Cama: burdeos / azul oscuro. */
const BED_COLOR = 0x4a1f3d;
/** Barricada: madera clara, más baja que muro. */
const BARRICADE_COLOR = 0xc49a6c;
const BARRICADE_EDGE = 0x8a6239;
/** Color del fog de tiles fuera de LOS. */
const FOG_COLOR = 0x050508;

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
   * `plate.visible` según `lootNameplateInvEmpty` + dist 0 (syncLootFocus aplica fade + scale).
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
   */
  syncLootFocus(
    wx: number,
    wy: number,
    dt: number,
    emptyIds?: ReadonlySet<string>,
  ): void;
  /**
   * Pulso de escala de la puerta más cercana en reach (anillo+badge).
   * Fuera de reach: scale 1; anillo/badge ocultos. `dt` avanza el seno.
   */
  syncDoorFocus(wx: number, wy: number, dt: number): void;
  /**
   * Pulso de escala de la cama más cercana en reach (anillo+badge).
   * Fuera de reach: scale 1; anillo/badge ocultos. `dt` avanza el seno.
   */
  syncBedFocus(wx: number, wy: number, dt: number): void;
  /**
   * Locomocion visual: silueta locoBob o mixer GLB (Idle/Walk/Run).
   * No mueve el root mundo — solo locoRoot local (bob) o mixer + yaw.
   * Aplica meleeSwing a rotation.x/z si el golpe procedural está activo.
   * Hit lean (recoil) overridea el swing mientras está activo.
   * Avanza camera shake (offset para followCamera).
   * Coloca el chevron de facing (siempre on).
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
   * One-shot de vista: melee/disparo ok → primary-attack; toque hostil → hit;
   * game-over → death. setAction + mixer sync (no-op si el GLB no tiene el clip).
   * primary-attack sin clip mapeado (`!hasRole`) → swing procedural.
   * hit → camera shake; sin clip mapeado (`!hasRole`) → lean procedural
   * (no needs-damage).
   */
  triggerPlayerAction(role: PlayerOneShotRole): void;
  /**
   * Flash de hocico al disparar (hit y miss). Re-triggerable.
   * Esfera aditiva + PointLight; avanza en tickPlayerLoco.
   */
  triggerMuzzleFlash(): void;
  /**
   * Spark de impacto al extremo del tracer (hit y miss). Re-triggerable.
   * Esfera aditiva unlit + PointLight en (x, TRACER_HEIGHT, y); hide si idle.
   */
  triggerImpactSpark(x: number, y: number): void;
  /**
   * Limpia one-shot (incluida death sticky) y resync mixer a loco.
   * softReset (R) y load-alive.
   */
  clearPlayerAction(): void;
  /**
   * Sync meshes de hostiles. `visible` respeta FOV del player (no ver through walls).
   * `dt` avanza loco Idle/Walk/Run de mute/poseído GLB (mapa y → Three z).
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
   * PointLight fill ×0.55. Separada de warmLight / muzzle flash.
   */
  syncTorchLight(wx: number, wy: number, intensity: number): void;
  /**
   * Iso follow: position = (x+12, 14, y+12) + shake XZ; lookAt (x,0,y) sin shake.
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
  /** Avanza TTL / opacidad de tracers activos; limpia expirados. */
  tickTracers(dt: number): void;
  /**
   * Anillo de ruido en el suelo: se expande hasta `radius` (tiles) y se desvanece.
   * `kind` colorea (run blanco, door/loot ámbar, attack/gun/barricade rojo).
   */
  spawnNoiseRing(x: number, y: number, radius: number, kind?: string): void;
  /** Avanza age / scale / opacity de anillos; limpia muertos. */
  tickNoiseRings(dt: number): void;
  /**
   * Lluvia barata: partículas/líneas alrededor de (wx,wy).
   * intensity 0 = oculto; >0 sync + anima caída.
   * `daylight` (GameClock) alarga / aclara streaks de noche.
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
   */
  syncGrass(wx: number, wy: number, dt?: number): void;
  dispose(): void;
}

interface ChunkMeshes {
  group: THREE.Group;
  doorMeshes: Map<string, THREE.Mesh>;
  /** Materials propios del chunk (no compartidos) a dispose. */
  ownedMats: THREE.Material[];
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
  const warmLight = new THREE.PointLight(0xffb070, 0, 7.5, 2);
  warmLight.position.set(0, 1.6, 0);
  scene.add(warmLight);

  // Linterna: PointLight fill + SpotLight al facing (separada de warm / muzzle).
  const torchLight = new THREE.PointLight(0xb0d0ff, 0, 10, 2);
  torchLight.position.set(0, 1.35, 0);
  torchLight.visible = false;
  scene.add(torchLight);
  const torchSpot = new THREE.SpotLight(
    FLASHLIGHT_SPOT_COLOR,
    0,
    FLASHLIGHT_CONE_LENGTH + 2.4,
    flashlightSpotAngle(),
    FLASHLIGHT_SPOT_PENUMBRA,
    2,
  );
  torchSpot.position.set(0, 1.55, 0);
  torchSpot.visible = false;
  scene.add(torchSpot);
  scene.add(torchSpot.target);

  // Reutilizados en syncDayNight (evita new Color cada frame).
  const skyColor = new THREE.Color(0x0a0a0c);
  const ambientColor = new THREE.Color(0x6a6a78);
  const sunColor = new THREE.Color(0xe8e0d0);

  const floorGeo = new THREE.PlaneGeometry(1, 1);
  const wallGeo = new THREE.BoxGeometry(1, 2.2, 1);
  const doorGeo = new THREE.BoxGeometry(1, 2.0, 0.18);
  const furnitureGeo = new THREE.BoxGeometry(0.7, 0.85, 0.7);
  /** Planchas apiladas: más bajas y estrechas que un muro. */
  const barricadeGeo = new THREE.BoxGeometry(0.92, 1.35, 0.55);
  const furnitureMat = new THREE.MeshStandardMaterial({
    color: FURNITURE_COLOR,
    roughness: 0.8,
  });
  /** Cama: más baja y ancha que furniture genérico (reuse geo/mat). */
  const bedGeo = new THREE.BoxGeometry(1.0, 0.35, 0.7);
  const bedMat = new THREE.MeshStandardMaterial({
    color: BED_COLOR,
    roughness: 0.85,
  });
  /** Cache de materiales de floor por color final (tint+AO) — barato, sin GTAO. */
  const floorMatByColor = new Map<number, THREE.MeshStandardMaterial>();
  /** Último daylight visto en syncDayNight; mats nuevos nacen ya lifted. */
  let lastDaylight = 1;
  function matForFloorColor(color: number): THREE.MeshStandardMaterial {
    const key = color & 0xffffff;
    let m = floorMatByColor.get(key);
    if (m) return m;
    m = new THREE.MeshStandardMaterial({
      color: applyNightGroundLift(key, lastDaylight),
      roughness: 0.95,
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
    color: WALL_COLOR,
    roughness: 0.85,
  });
  const wallBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    roughness: 1,
  });
  const barricadeMat = new THREE.MeshStandardMaterial({
    color: BARRICADE_COLOR,
    roughness: 0.75,
  });
  const barricadeEdgeMat = new THREE.MeshStandardMaterial({
    color: BARRICADE_EDGE,
    roughness: 0.9,
  });
  const fogMat = new THREE.MeshBasicMaterial({
    color: FOG_COLOR,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });

  const loaded = new Map<string, ChunkMeshes>();
  /** Índice global puerta → mesh (solo chunks cargados). */
  const doorMeshes = new Map<string, THREE.Mesh>();
  /** Índice global tile → root group (solo chunks cargados). */
  const tileRoots = new Map<string, THREE.Group>();

  // Silueta legible a cámara iso: torso + cabeza (create-game-vfx / character silhouette).
  const playerBodyGeo = new THREE.BoxGeometry(0.55, 1.12, 0.48);
  const playerHeadGeo = new THREE.BoxGeometry(0.36, 0.36, 0.36);
  const playerBodyMat = new THREE.MeshStandardMaterial({
    color: PLAYER_COLOR,
    roughness: 0.45,
  });
  const playerHeadMat = new THREE.MeshStandardMaterial({
    color: 0x7eb6ef,
    roughness: 0.4,
    emissive: 0x102030,
    emissiveIntensity: 0.22,
  });
  const PLAYER_BODY_BASE_Y = 0.56;
  const PLAYER_HEAD_BASE_Y = 1.32;
  const playerMesh = new THREE.Group();
  /** Hijo de silueta: bobY + lean/sway; root queda en suelo (x,0,y). */
  const playerLocoRoot = new THREE.Group();
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
  let cameraShakeOut: CameraShakeOutput = {
    offsetX: 0,
    offsetZ: 0,
    active: false,
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
  playerMesh.position.set(0, 0, 0);
  scene.add(playerMesh);

  // Loot: anillo/badge ámbar por contenedor. Anillo solo en reach (no FOV);
  // syncLootFocus oculta ids vacíos. Nameplate canvas hijo (fade dist 6.5).
  interface LootMarkerEntry {
    group: THREE.Group;
    nameplate: THREE.Sprite;
    x: number;
    y: number;
    id: string;
  }
  const lootMarkerGroups: LootMarkerEntry[] = [];
  let lootFocusElapsed = 0;

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
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.beginPath();
      ctx.roundRect(12, 16, W - 24, 48, 10);
      ctx.fill();
      if (hasIcon) {
        const iconX = Math.max(0, (ICON_PAD - iconSize) / 2);
        paintLootNameplateIcon(ctx, itemId, iconX, (H - iconSize) / 2, iconSize);
      }
      ctx.font = "600 34px ui-monospace, SF Mono, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      const textX = hasIcon ? ICON_PAD + BASE_W / 2 : W / 2;
      ctx.strokeText(text, textX, H / 2);
      ctx.fillStyle = "#f0c060";
      ctx.fillText(text, textX, H / 2);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.name = "lootNameplate";
    sprite.position.set(0, LOOT_NAMEPLATE_Y, 0);
    sprite.scale.set(LOOT_NAMEPLATE_SCALE_X, LOOT_NAMEPLATE_SCALE_Y, 1);
    sprite.renderOrder = 9;
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

  // Door: anillo/badge steel blue-grey por tile door. Anillo solo en reach (no FOV).
  interface DoorMarkerEntry {
    group: THREE.Group;
    x: number;
    y: number;
  }
  const doorMarkerGroups: DoorMarkerEntry[] = [];
  let doorFocusElapsed = 0;
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

  // Bed: anillo/badge púrpura sleep por tile cama. Anillo solo en reach (no FOV).
  // Neighborhood: (6,6) y (24,22).
  interface BedMarkerEntry {
    group: THREE.Group;
    x: number;
    y: number;
  }
  const bedMarkerGroups: BedMarkerEntry[] = [];
  let bedFocusElapsed = 0;
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

  // Muzzle flash: esfera aditiva ~0.22 dia + PointLight (reutilizable).
  const MUZZLE_FORWARD = 0.48;
  const MUZZLE_LIGHT_PEAK = 2.2;
  const MUZZLE_LIGHT_DISTANCE = 2.6;
  const muzzleGeo = new THREE.SphereGeometry(0.11, 10, 8);
  const muzzleMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c0,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzleMesh.visible = false;
  const muzzleLight = new THREE.PointLight(
    0xffe8a0,
    0,
    MUZZLE_LIGHT_DISTANCE,
    2,
  );
  muzzleLight.visible = false;
  playerMesh.add(muzzleMesh, muzzleLight);

  // Chevron de facing: triángulo plano unlit (siempre visible; sin luz extra).
  // Dist/len/hw/color/opacity desde facingChevron knobs; oro HUD; tilt iso.
  const CHEVRON_Y = 0.12;
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
    color: FACING_CHEVRON_COLOR,
    transparent: true,
    opacity: FACING_CHEVRON_OPACITY,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const chevronMesh = new THREE.Mesh(chevronGeo, chevronMat);
  chevronMesh.renderOrder = 8;
  chevronMesh.visible = true;
  playerMesh.add(chevronMesh);

  function placeFacingChevron(): void {
    const { x, z } = facingChevronOffset(playerGltfYaw);
    chevronMesh.position.set(x, CHEVRON_Y, z);
    chevronMesh.rotation.y = playerGltfYaw;
    chevronMesh.rotation.x = -0.35;
    chevronMesh.visible = true;
  }
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
    color: FLASHLIGHT_WEDGE_COLOR,
    vertexColors: true,
    transparent: true,
    opacity: FLASHLIGHT_WEDGE_OPACITY_BASE,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flashlightConeWedge = new THREE.Mesh(coneGeo, coneMat);
  flashlightConeWedge.name = "flashlightConeWedge";
  flashlightConeWedge.renderOrder = 7;
  flashlightConeWedge.visible = false;
  flashlightConeWedge.position.set(0, FLASHLIGHT_CONE_Y, 0);
  playerMesh.add(flashlightConeWedge);

  function applyMuzzleFlashVisual(out: {
    intensity: number;
    active: boolean;
  }): void {
    const ox = Math.sin(playerGltfYaw) * MUZZLE_FORWARD;
    const oz = Math.cos(playerGltfYaw) * MUZZLE_FORWARD;
    muzzleMesh.position.set(ox, TRACER_HEIGHT, oz);
    muzzleLight.position.set(ox, TRACER_HEIGHT, oz);
    muzzleMesh.visible = out.active;
    muzzleLight.visible = out.active;
    muzzleMat.opacity = out.intensity;
    muzzleLight.intensity = out.active ? MUZZLE_LIGHT_PEAK * out.intensity : 0;
  }

  // Impact spark: esfera aditiva unlit dia 0.18 + PointLight (reutilizable).
  const IMPACT_SPARK_LIGHT_PEAK = 1.4;
  const IMPACT_SPARK_LIGHT_DISTANCE = 1.8;
  const impactGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const impactMat = new THREE.MeshBasicMaterial({
    color: 0xffd080,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const impactMesh = new THREE.Mesh(impactGeo, impactMat);
  impactMesh.visible = false;
  const impactLight = new THREE.PointLight(
    0xffd080,
    0,
    IMPACT_SPARK_LIGHT_DISTANCE,
    2,
  );
  impactLight.visible = false;
  scene.add(impactMesh, impactLight);

  function applyImpactSparkVisual(out: {
    intensity: number;
    active: boolean;
    x: number;
    y: number;
  }): void {
    impactMesh.position.set(out.x, TRACER_HEIGHT, out.y);
    impactLight.position.set(out.x, TRACER_HEIGHT, out.y);
    impactMesh.visible = out.active;
    impactLight.visible = out.active;
    impactMat.opacity = out.intensity;
    impactLight.intensity = out.active
      ? IMPACT_SPARK_LIGHT_PEAK * out.intensity
      : 0;
  }

  const hostileGeo = new THREE.BoxGeometry(0.58, 1.12, 0.48);
  const hostileHeadGeo = new THREE.BoxGeometry(0.34, 0.34, 0.34);
  const hostileMat = new THREE.MeshStandardMaterial({
    color: HOSTILE_COLOR,
    roughness: 0.55,
  });
  const possessedMat = new THREE.MeshStandardMaterial({
    color: POSSESSED_COLOR,
    emissive: POSSESSED_EMISSIVE,
    emissiveIntensity: 0.55,
    roughness: 0.5,
  });
  const possessedHeadMat = new THREE.MeshStandardMaterial({
    color: 0x7a3d8a,
    emissive: 0x2a1040,
    emissiveIntensity: 0.7,
    roughness: 0.45,
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
    color: 0xffe8a0,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  interface LiveTracer {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    flash: THREE.PointLight;
    age: number;
    ttl: number;
  }
  const liveTracers: LiveTracer[] = [];

  function spawnTracer(from: TracerPoint, to: TracerPoint, ttl = DEFAULT_TRACER_TTL): void {
    const life = clampTracerTtl(ttl);
    const len = tracerLength(from, to);
    const mid = tracerMidpoint(from, to);
    const mat = tracerMatBase.clone();
    mat.opacity = 1;
    const mesh = new THREE.Mesh(tracerGeo, mat);
    mesh.position.set(mid.x, TRACER_HEIGHT, mid.y);
    mesh.scale.set(0.055, 0.055, len);
    mesh.rotation.y = tracerYaw(from, to);
    scene.add(mesh);

    const flash = new THREE.PointLight(0xffc060, 2.4, 3.2, 2);
    flash.position.set(from.x, TRACER_HEIGHT + 0.15, from.y);
    scene.add(flash);

    liveTracers.push({ mesh, mat, flash, age: 0, ttl: life });
  }

  function tickTracers(dt: number): void {
    for (let i = liveTracers.length - 1; i >= 0; i--) {
      const t = liveTracers[i]!;
      t.age += dt;
      const op = tracerOpacity(t.age, t.ttl);
      t.mat.opacity = op;
      t.flash.intensity = 2.4 * op;
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
  const NOISE_RING_Y = 0.05;
  // RingGeometry unitario (outer≈1); scale = radius * ringScale.
  const noiseRingGeo = new THREE.RingGeometry(0.82, 1, 48);
  noiseRingGeo.rotateX(-Math.PI / 2); // plano XZ
  interface PooledNoiseRing {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    state: NoiseRingState | null;
  }
  const noiseRingPool: PooledNoiseRing[] = [];
  for (let i = 0; i < NOISE_RING_POOL; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xe8e8f0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(noiseRingGeo, mat);
    mesh.visible = false;
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
    slot.mat.opacity = ringOpacity(state);
    const s = Math.max(0.05, state.radius * ringScale(state));
    slot.mesh.scale.set(s, 1, s);
    slot.mesh.position.set(state.x, NOISE_RING_Y, state.y);
    slot.mesh.visible = true;
  }

  function tickNoiseRings(dt: number): void {
    for (const p of noiseRingPool) {
      if (!p.state) continue;
      const alive = tickNoiseRing(p.state, dt);
      if (!alive) {
        p.state = null;
        p.mesh.visible = false;
        p.mat.opacity = 0;
        continue;
      }
      const s = Math.max(0.05, p.state.radius * ringScale(p.state));
      p.mesh.scale.set(s, 1, s);
      p.mat.opacity = ringOpacity(p.state);
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
    color: RAIN_COLOR,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const rainGroup = new THREE.Group();
  rainGroup.visible = false;
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
    const vx = (Math.random() - 0.5) * 14;
    const vz = (Math.random() - 0.5) * 14;
    const y = 2 + Math.random() * 6;
    mesh.position.set(vx, y, vz);
    rainGroup.add(mesh);
    rainDrops.push({
      mesh,
      vx,
      vz,
      vy: 9 + Math.random() * 6,
      y,
    });
  }
  let rainAnchorX = 0;
  let rainAnchorZ = 0;

  function syncRain(
    wx: number,
    wy: number,
    intensity: number,
    dt = 0.016,
    daylight = 1,
  ): void {
    const i = Math.max(0, Math.min(1, intensity));
    rainAnchorX = wx;
    rainAnchorZ = wy;
    rainGroup.position.set(wx, 0, wy);
    if (rainStreaksHidden(i)) {
      rainGroup.visible = false;
      return;
    }
    rainGroup.visible = true;
    const op = rainStreakOpacity(i, daylight);
    const active = rainActiveCount(i, daylight);
    const sy = rainStreakScaleY(daylight);
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
        d.y -= d.vy * dt * (0.7 + i * 0.5);
        if (d.y < 0.15) {
          d.y = 2.2 + Math.random() * 5.5;
          d.vx = (Math.random() - 0.5) * 14;
          d.vz = (Math.random() - 0.5) * 14;
        }
        // Drift leve con el viento.
        d.vx += dt * 0.4;
        d.mesh.position.set(d.vx, d.y, d.vz);
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
    color: 0x4a6a38,
    roughness: 0.92,
    metalness: 0,
  });
  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, MAX_GRASS_INSTANCES);
  grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  grassMesh.frustumCulled = false;
  grassMesh.count = 0;
  grassMesh.visible = false;
  scene.add(grassMesh);
  const grassDummy = new THREE.Object3D();
  let grassTiles: GrassTile[] = [];
  let grassAnchorTx = Number.NaN;
  let grassAnchorTy = Number.NaN;
  let grassTime = 0;

  function rebuildGrassTiles(wx: number, wy: number): void {
    const tx = Math.floor(wx);
    const ty = Math.floor(wy);
    if (tx === grassAnchorTx && ty === grassAnchorTy) return;
    grassAnchorTx = tx;
    grassAnchorTy = ty;
    grassTiles = collectGrassTiles(
      tx,
      ty,
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
        const pose = bladePoseAt(t.tx, t.ty, b, t.seed, grassTime);
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
    grassMesh.visible = n > 0;
  }

  function syncGrass(wx: number, wy: number, dt = 0.016): void {
    grassTime += Math.max(0, dt);
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
  camera.position.set(12, 14, 12);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  function unloadChunk(key: string): void {
    const entry = loaded.get(key);
    if (!entry) return;
    scene.remove(entry.group);
    for (const mat of entry.ownedMats) mat.dispose();
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
    const ownedMats: THREE.Material[] = [];

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
        barricadeMat,
        barricadeEdgeMat,
        fogMat,
        localDoors,
        ownedMats,
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
      ownedMats,
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

    // Localizar chunk entry para ownedMats / localDoors
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
      barricadeMat,
      barricadeEdgeMat,
      entry.doorMeshes,
      entry.ownedMats,
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
      playerMesh.position.set(x, 0, y);
      placeFacingChevron();
    },
    addLootMarker(id, x, y, name, inv) {
      addLootMarker({ id, x, y, name, inv });
    },
    syncLootFocus(wx, wy, dt, emptyIds) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
      lootFocusElapsed += safeDt;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < lootMarkerGroups.length; i++) {
        const e = lootMarkerGroups[i]!;
        const empty = !!emptyIds?.has(e.id);
        const d = Math.hypot(wx - e.x, wy - e.y);
        const vis = lootRingVisible(empty, d, LOOT_FOCUS_REACH);
        e.group.visible = !empty;
        setInteractRingVisible(e.group, vis);
        e.nameplate.visible = lootNameplateVisible(empty, d);
        const plateMat = e.nameplate.material as THREE.SpriteMaterial;
        plateMat.opacity = lootNameplateOpacity(d);
        const s = lootNameplateScale(d);
        e.nameplate.scale.set(
          LOOT_NAMEPLATE_SCALE_X * s,
          LOOT_NAMEPLATE_SCALE_Y * s,
          1,
        );
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
        const mul = i === best ? lootFocusMul(bestD, lootFocusElapsed) : 1;
        e.group.scale.setScalar(mul);
      }
    },
    syncDoorFocus(wx, wy, dt) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
      doorFocusElapsed += safeDt;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < doorMarkerGroups.length; i++) {
        const e = doorMarkerGroups[i]!;
        const d = Math.hypot(wx - e.x, wy - e.y);
        const open = map.get(Math.floor(e.x), Math.floor(e.y))?.open ?? false;
        const vis = doorRingVisible(open, d, DOOR_FOCUS_REACH);
        setInteractRingVisible(e.group, vis);
        if (vis && d < bestD) {
          bestD = d;
          best = i;
        }
      }
      for (let i = 0; i < doorMarkerGroups.length; i++) {
        const e = doorMarkerGroups[i]!;
        const mul = i === best ? doorFocusMul(bestD, doorFocusElapsed) : 1;
        e.group.scale.setScalar(mul);
      }
    },
    syncBedFocus(wx, wy, dt) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
      bedFocusElapsed += safeDt;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < bedMarkerGroups.length; i++) {
        const e = bedMarkerGroups[i]!;
        const d = Math.hypot(wx - e.x, wy - e.y);
        const vis = bedRingVisible(d, BED_FOCUS_REACH);
        setInteractRingVisible(e.group, vis);
        if (vis && d < bestD) {
          bestD = d;
          best = i;
        }
      }
      for (let i = 0; i < bedMarkerGroups.length; i++) {
        const e = bedMarkerGroups[i]!;
        const mul = i === best ? bedFocusMul(bestD, bedFocusElapsed) : 1;
        e.group.scale.setScalar(mul);
      }
    },
    tickPlayerLoco(dt, moving, sprinting, faceX, faceZ) {
      setLocomotion(playerAnimator, { moving, sprinting });
      tickCharacterAnimator(playerAnimator, dt);
      const swing = tickMeleeSwing(playerSwing, dt);
      const lean = tickHitLean(playerHitLean, dt);
      cameraShakeOut = tickCameraShake(playerCameraShake, dt);
      if (faceX != null && faceZ != null) {
        const yaw = playerGltfYawFromMove(faceX, faceZ);
        if (yaw !== null) playerGltfYaw = yaw;
      }
      placeFacingChevron();
      applyMuzzleFlashVisual(tickMuzzleFlash(playerMuzzle, dt));
      applyImpactSparkVisual(tickImpactSpark(impactSpark, dt));
      const pose = lean.active ? lean : swing;
      if (playerUsesGltfVisual && playerMixer) {
        playerLocoRoot.position.y = 0;
        playerLocoRoot.rotation.z = pose.yawBias;
        playerLocoRoot.rotation.x = pose.pitch;
        playerLocoRoot.rotation.y = playerGltfYaw;
        playerMixer.update(dt, currentRole(playerAnimator));
        return;
      }
      const out = tickLocoBob(playerLoco, { moving, sprinting }, dt);
      playerLocoRoot.position.y = out.bobY;
      playerLocoRoot.rotation.z = out.leanZ + pose.yawBias;
      playerLocoRoot.rotation.x = out.swayX + pose.pitch;
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
    triggerImpactSpark(x, y) {
      startImpactSpark(impactSpark, x, y);
    },
    clearPlayerAction() {
      setAction(playerAnimator, null);
      playerMixer?.syncFromAnimator(currentRole(playerAnimator));
    },
    syncHostiles(entities, dt = 0) {
      const seen = new Set<string>();
      const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
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
        const mixer = hostileMixers.get(e.id);
        const anim = hostileAnimators.get(e.id);
        if (mixer && anim) {
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
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(open ? DOOR_OPEN : DOOR_CLOSED);
      if (open) {
        mesh.rotation.y = Math.PI / 2;
        mesh.position.set(tx + 0.15, 1.0, ty + 0.5);
      } else {
        mesh.rotation.y = 0;
        mesh.position.set(tx + 0.5, 1.0, ty + 0.5);
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
      const atm = atmosphereFor(clock.phase, d);
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
      // Albedo de suelo/pasto: lift de noche; día = paleta intacta.
      for (const [key, m] of floorMatByColor) {
        m.color.setHex(applyNightGroundLift(key, d));
      }
      grassMat.color.setHex(applyNightGroundLift(0x4a6a38, d));
    },
    syncWarmLight(wx, wy, intensity) {
      const i = Math.max(0, Math.min(1, intensity));
      warmLight.intensity = i * 1.55;
      warmLight.distance = 6.5 + i * 2.5;
      warmLight.position.set(wx, 1.55, wy);
      warmLight.visible = i > 0.02;
      // Tinte un poco más ámbar cuando está fuerte.
      warmLight.color.setRGB(1, 0.66 + i * 0.08, 0.38 + i * 0.1);
    },
    syncTorchLight(wx, wy, intensity) {
      const i = Math.max(0, intensity);
      const on = flashlightConeVisible(i);
      torchLight.intensity = i * FLASHLIGHT_FILL_INTENSITY_MUL;
      torchLight.distance = 7 + i * 3.5;
      torchLight.position.set(wx, 1.35, wy);
      torchLight.visible = on;
      torchLight.color.setHex(0xb0d0ff);

      const tip = flashlightConeTip(playerGltfYaw);
      torchSpot.intensity = i * FLASHLIGHT_SPOT_INTENSITY_MUL;
      torchSpot.distance = FLASHLIGHT_CONE_LENGTH + 1.6 + i * 2;
      torchSpot.position.set(wx, 1.55, wy);
      torchSpot.target.position.set(wx + tip.x, 0.12, wy + tip.z);
      torchSpot.target.updateMatrixWorld();
      torchSpot.visible = on;
      torchSpot.color.setHex(FLASHLIGHT_SPOT_COLOR);

      flashlightConeWedge.rotation.y = playerGltfYaw;
      flashlightConeWedge.visible = on;
      coneMat.opacity = flashlightWedgeOpacity(i);
    },
    followCamera(x, y) {
      camera.position.set(
        x + 12 + cameraShakeOut.offsetX,
        14,
        y + 12 + cameraShakeOut.offsetZ,
      );
      camera.lookAt(x, 0, y);
    },
    syncVisibleChunks,
    syncFov,
    loadedChunkCount() {
      return loaded.size;
    },
    spawnTracer,
    tickTracers,
    spawnNoiseRing,
    tickNoiseRings,
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
    mesh.position.y = 0.56;
    // Un poco más bajo/ancho que el player para silueta distinta.
    mesh.scale.set(1.05, 1, 1.05);
    root.add(mesh);
  } else {
    const body = new THREE.Mesh(bodyGeo, possessedBodyMat);
    body.position.y = 0.56;
    const head = new THREE.Mesh(headGeo, possessedHeadMat);
    head.position.y = 1.3;
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
  /** Aro mute/possessed (THREAT 0.50–0.68). */
  ringGeo: THREE.RingGeometry;
  /** Aro loot/door/bed (INTERACT 0.55–0.78). */
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
  const badgeGeo = new THREE.CircleGeometry(0.16, 20);
  const iconGeo = new THREE.PlaneGeometry(0.18, 0.18);
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
    transparent: true,
    opacity: markerRingOpacity(role),
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  shared.mats.push(ringMat);
  const ringGeo = markerUsesInteractRing(role)
    ? shared.interactRingGeo
    : shared.ringGeo;
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = "groundRing";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  root.add(ring);

  // Loot/mute/possessed: sin disc/glyph (queda nameplate o look+aro). Player ya return arriba.
  if (markerBadgeOpacity(role) <= 0) return;

  const badgeMat = new THREE.MeshStandardMaterial({
    color: pal.badge,
    emissive: pal.emissive,
    emissiveIntensity: 0.65,
    roughness: 0.45,
    metalness: 0.1,
    side: THREE.DoubleSide,
    opacity: markerBadgeOpacity(role),
  });
  const letterMap =
    role === "door"
      ? shared.doorLetterMap
      : role === "bed"
        ? shared.bedLetterMap
        : null;
  const iconMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    ...(letterMap ? { map: letterMap } : {}),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  shared.mats.push(badgeMat, iconMat);

  const badge = new THREE.Group();
  badge.name = "floatBadge";
  const disc = new THREE.Mesh(shared.badgeGeo, badgeMat);
  // Mirar hacia arriba un poco legible en iso
  disc.rotation.x = -Math.PI / 2.6;
  const icon = new THREE.Mesh(shared.iconGeo, iconMat);
  icon.rotation.x = -Math.PI / 2.6;
  icon.position.y = 0.02;
  // Escala distinta por glifo visual (mute más angular vía scale)
  if (role === "mute") icon.scale.set(0.7, 0.7, 1);
  else if (role === "possessed") icon.scale.set(0.85, 0.85, 1);
  else if (role === "loot") icon.scale.set(0.8, 0.8, 1);
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
  else if (role === "loot") badge.position.y = 1.12;
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
  barricadeMat: THREE.MeshStandardMaterial,
  barricadeEdgeMat: THREE.MeshStandardMaterial,
  doorMeshes: Map<string, THREE.Mesh>,
  ownedMats: THREE.Material[],
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
    wall.position.set(x + 0.5, 1.1, y + 0.5);
    content.add(wall);
  }
  if (tile.kind === "door") {
    const mat = new THREE.MeshStandardMaterial({
      color: tile.open ? DOOR_OPEN : DOOR_CLOSED,
      roughness: 0.7,
    });
    ownedMats.push(mat);
    const door = new THREE.Mesh(doorGeo, mat);
    if (tile.open) {
      door.rotation.y = Math.PI / 2;
      door.position.set(x + 0.15, 1.0, y + 0.5);
    } else {
      door.position.set(x + 0.5, 1.0, y + 0.5);
    }
    content.add(door);
    doorMeshes.set(doorKey(x, y), door);
  }

  if (tile.kind === "furniture") {
    if (tile.variant === "bed") {
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.set(x + 0.5, 0.175, y + 0.5);
      content.add(bed);
    } else {
      const furn = new THREE.Mesh(furnitureGeo, furnitureMat);
      furn.position.set(x + 0.5, 0.425, y + 0.5);
      content.add(furn);
    }
  }

  if (tile.kind === "barricade") {
    // Dos planchas cruzadas — silueta distinta al muro gris
    const plank = new THREE.Mesh(barricadeGeo, barricadeMat);
    plank.position.set(x + 0.5, 0.7, y + 0.5);
    plank.rotation.y = Math.PI / 8;
    content.add(plank);
    const cross = new THREE.Mesh(barricadeGeo, barricadeEdgeMat);
    cross.position.set(x + 0.5, 0.55, y + 0.5);
    cross.rotation.y = -Math.PI / 5;
    cross.scale.set(0.95, 0.7, 0.9);
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
  barricadeMat: THREE.MeshStandardMaterial,
  barricadeEdgeMat: THREE.MeshStandardMaterial,
  fogMat: THREE.MeshBasicMaterial,
  doorMeshes: Map<string, THREE.Mesh>,
  ownedMats: THREE.Material[],
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
    barricadeMat,
    barricadeEdgeMat,
    doorMeshes,
    ownedMats,
  );

  const fog = new THREE.Mesh(floorGeo, fogMat);
  fog.name = "fog";
  fog.rotation.x = -Math.PI / 2;
  fog.position.set(x + 0.5, 0.02, y + 0.5);
  fog.visible = false;

  root.add(content);
  root.add(fog);
  chunkGroup.add(root);
  return root;
}
