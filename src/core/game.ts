import * as THREE from "three";
import { GameLoop } from "./loop";
import { Input } from "./input";
import { GameClock } from "./clock";
import {
  applySave,
  browserStorage,
  readSave,
  saveInputApplies,
  writeSave,
  type SaveStorage,
  type SaveWorld,
} from "./save";
import { createNeighborhood } from "../world/neighborhood";
import type { TileMap } from "../world/tilemap";
import {
  computeVisibleTiles,
  DEFAULT_FOV_RADIUS,
} from "../world/los";
import { PlayerSim } from "../actors/player";
import { createWorldView, type WorldView } from "../render/worldView";
import {
  ISO_FRUSTUM,
  isoFrustumAfterRestart,
  nextIsoZoom,
  zoomInputApplies,
} from "../render/cameraConfig";
import {
  CONTAINER_REACH,
  containerHasLoot,
  lootFullMessage,
  inventorySummary,
  buildInventoryPanelData,
  findSlot,
  removeFromSlot,
  canRefillFromRain,
  attemptRefill,
  refillFullMessage,
  hasFlashlight,
  fovRadiusWithFlashlight,
  torchLightApplies,
  torchLightIntensity,
  flashlightToggleApplies,
  nextFlashlightOn,
  lootInputApplies,
  dropInputApplies,
  useInputApplies,
  craftInputApplies,
  cookInputApplies,
  buildInputApplies,
  getItemDef,
  splitStack,
  mergeStack,
  swapInventoryStacks,
  dropFromSlot,
  dropFullMessage,
  dropQty,
  dropSourceIndex,
  dropToastLabel,
  dropTargetTile,
  craftFullMessage,
  cookFullMessage,
  hasBandageMaterials,
  type ContainerRegistry,
  type ItemId,
} from "../items";
import {
  HostileSim,
  defaultHostileSpawns,
  defaultPossessedSpawns,
  SPAWN_GRACE_SECONDS,
  spawnGraceAfterRestart,
  tickSpawnGrace,
  hostileDamageAllowed,
  loadAliveRuntime,
} from "../ai";
import {
  tryApplyTouchKnockback,
  shootInputApplies,
  meleeInputApplies,
} from "../combat";
import { tileKey } from "../world/los";
import { NoiseBus, type NoiseEvent } from "../world/noise";
import {
  lastRunRingAgeAfterRestart,
  noiseRingApplies,
  shouldShowNoiseRing,
  shouldSpawnNoiseRing,
} from "../render/noiseRings";
import { tracerOverlayApplies } from "../render/tracers";
import { rainVisualApplies } from "../render/rainStreaks";
import { grassVisualApplies } from "../render/windGrass";
import { muzzleFlashApplies } from "../render/muzzleFlash";
import { impactSparkApplies } from "../render/impactSpark";
import { swingPoseApplies } from "../render/meleeSwing";
import { cameraShakeApplies } from "../render/cameraShake";
import { hitLeanApplies } from "../render/hitLean";
import { locoBobApplies } from "../render/locoBob";
import { facingChevronVisible } from "../render/facingChevron";
import { hostileIdleApplies } from "../render/hostileLoco";
import { lootFloaterLabel } from "../render/lootFloater";
import {
  SpeechDirector,
  TrustLedger,
  DialogueSession,
  ShortMemory,
  DialogueBehaviorGates,
  applyDialogueChoiceAsync,
  proposeDialogueGates,
  nearestPossessed,
  DIALOGUE_REACH,
  dialogueOpenHudMsg,
  nextDialogueCloseHud,
  talkInputApplies,
  cancelInputApplies,
  StubLlmBridge,
  type DialogueIntent,
  type GateTag,
  type LineSource,
  type LlmBridge,
  type PossessionTone,
} from "../possession";
import { DEFAULT_CONFIG, DEFAULT_DAY_LENGTH_SEC, type GameConfig } from "./config";
import {
  createSpeechOverlay,
  speechBubbleVisible,
  createDialoguePanel,
  createMoodlesHud,
  moodlesHudVisible,
  createHotbarHud,
  createLootFloaterHud,
  lootFloaterVisible,
  createInventoryPanel,
  inventoryPanelVisible,
  inventoryToggleApplies,
  nextShowInvDetail,
  hotbarSlots,
  hotbarInspectLabel,
  inventoryInspectLabel,
  HOTBAR_SIZE,
  clampHotbarIndex,
  stepHotbarIndex,
  hotbarInputApplies,
  hotbarHudVisible,
  nextHotbarSelected,
  hotbarSelectedAfterRestart,
  swapHotbarStacks,
  formatHudStatus,
  helpInputApplies,
  helpHudVisible,
  nextShowHelp,
  isKeepableDeathCause,
  formatGateLine,
  createHitFlash,
  triggerHitFlash,
  tickHitFlash,
  hitFlashOverlayOpacity,
  type SpeechOverlay,
  type DialoguePanel,
  type MoodlesHud,
  type HotbarHud,
  type LootFloaterHud,
  type InventoryPanel,
  type HitFlash,
} from "../ui";
import { buildHudMoodles } from "../actors/moodles";
import {
  trySleep,
  isSafehouseHint,
  nearBed,
  hostileNearby,
  sleepInputApplies,
} from "../actors/sleep";
import { REST_HUD_MSG } from "../actors/needs";
import {
  createAmbientBus,
  resetAmbientAfterRestart,
  tickAmbient,
  ambientTickApplies,
  describeAmbient,
  toggleAmbientMute,
  muteHudMsg,
  createFootstepsBus,
  resetFootstepsAfterRestart,
  tickFootsteps,
  describeFootsteps,
  createFootstepPlayer,
  resetFootstepPlayerAfterRestart,
  syncFootstepPlayer,
  createAmbientPlayer,
  resetAmbientPlayerAfterRestart,
  syncAmbientPlayer,
  createCombatPlayer,
  resetCombatPlayerAfterRestart,
  playMelee,
  playHit,
  playGun,
  playDryFire,
  createInteractPlayer,
  resetInteractPlayerAfterRestart,
  playDoor,
  playLoot,
  playUse,
  createSpeechPlayer,
  resetSpeechPlayerAfterRestart,
  playSpeech,
  createHeartbeatBus,
  tickHeartbeat,
  createHeartbeatPlayer,
  resetHeartbeatPlayerAfterRestart,
  playHeartbeat,
  type AmbientBus,
  type FootstepsBus,
  type FootstepPlayer,
  type AmbientPlayer,
  type CombatPlayer,
  type InteractPlayer,
  type SpeechPlayer,
  type HeartbeatBus,
  type HeartbeatPlayer,
} from "../audio";
import {
  computeNeedsDamage,
  needsDamageHudMessage,
  NEEDS_DAMAGE_MSG_CD,
} from "../actors/needsDamage";
import {
  isIndoor,
  warmLightAnchor,
  warmLightIntensity,
} from "../world/indoor";
import { WeatherSystem, rainNeedsMult } from "../world/weather";
import {
  LocalLoopbackSession,
  publishHostBarricades,
  publishHostContainers,
  publishHostDoors,
  publishHostHostiles,
  publishHostPossession,
} from "../net";

const RAIN_FILL_MSG = "recogiste agua de lluvia";

export class Game {
  private readonly root: HTMLElement;
  private readonly hud: HTMLElement | null;
  private readonly renderer: THREE.WebGLRenderer;
  private map: TileMap;
  private containers: ContainerRegistry;
  private player: PlayerSim;
  private hostiles: HostileSim;
  private speech: SpeechDirector;
  private speechOverlay: SpeechOverlay;
  private trust: TrustLedger;
  private memory: ShortMemory;
  private gates: DialogueBehaviorGates;
  private readonly config: GameConfig;
  private readonly llmBridge: LlmBridge;
  private dialogue: DialogueSession;
  private dialoguePanel: DialoguePanel;
  private moodlesHud: MoodlesHud;
  private hotbarHud: HotbarHud;
  private lootToast: LootFloaterHud;
  private inventoryPanel: InventoryPanel;
  private readonly hitFlashEl: HTMLElement | null;
  private readonly hitFlash: HitFlash;
  private dialogueLastLine: string | null = null;
  private dialogueLastTone: string | null = null;
  private dialogueGateLine: string | null = null;
  private noise: NoiseBus;
  private view: WorldView;
  private readonly input: Input;
  private clock: GameClock;
  private weather: WeatherSystem;
  private ambient: AmbientBus;
  private ambientPlayer: AmbientPlayer;
  private combatPlayer: CombatPlayer;
  private interactPlayer: InteractPlayer;
  private speechPlayer: SpeechPlayer;
  private heartbeat: HeartbeatBus;
  private heartbeatPlayer: HeartbeatPlayer;
  private footsteps: FootstepsBus;
  private footstepPlayer: FootstepPlayer;
  private readonly loop: GameLoop;
  private readonly onResize: () => void;
  private readonly storage: SaveStorage | null;
  private hudAcc = 0;
  private fovVisibleCount = 0;
  private fovVisible: ReadonlySet<string> = new Set();
  private showInvDetail = false;
  /** F1: mostrar muro de controles en HUD. */
  private showHelp = false;
  /** Linterna encendida (se apaga si pierdes el item). */
  private flashlightOn = false;
  private lastLootMsg = "";
  /** HP ≤ 0: congela gameplay; R reinicia / F9 carga. */
  private gameOver = false;
  /** Tras spawnThreats/reinicio/F9 load-vivo: sin daño touch al player. */
  private spawnGrace = 0;
  /** Cooldown HUD para mensajes de daño por hambre/sed (~2s). */
  private needsDamageMsgCd = 0;
  /** Half-extent ortográfico iso (ajustable con +/-). */
  private isoFrustum = ISO_FRUSTUM;
  /** Slot hotbar seleccionado (0–4). Default 0 = tecla 1, botella de agua. */
  private hotbarSelected = 0;
  /** Debounce useInventorySlot: mismo índice en ~0.35s de clock.elapsed es no-op. */
  private lastInvUseSlot: number | null = null;
  private lastInvUseAt = Number.NEGATIVE_INFINITY;
  /** Última fila I clicada; U tira de aquí si el panel está abierto y ocupada. */
  private lastInvIndex: number | null = null;
  /** Edad (s) del último anillo visual de sprint; null = nunca. */
  private lastRunRingAgeSec: number | null = null;
  /** Stub F7 1P: possession gated → loopback (sin sockets). */
  private session: LocalLoopbackSession;

  constructor(root: HTMLElement) {
    this.root = root;
    this.hud = document.querySelector("#hud");
    this.hitFlashEl = document.querySelector("#hit-flash");
    this.hitFlash = createHitFlash();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    root.appendChild(this.renderer.domElement);

    const neighborhood = createNeighborhood(48);
    this.map = neighborhood.map;
    this.containers = neighborhood.containers;
    this.player = new PlayerSim(neighborhood.spawn);
    this.hostiles = new HostileSim();
    this.config = DEFAULT_CONFIG;
    this.llmBridge = new StubLlmBridge({ response: null });
    this.speech = new SpeechDirector({
      llmEnabled: this.config.llm.enabled,
      bridge: this.llmBridge,
    });
    this.trust = new TrustLedger();
    this.memory = new ShortMemory();
    this.gates = new DialogueBehaviorGates();
    this.dialogue = new DialogueSession();
    const speechLayer =
      document.querySelector<HTMLElement>("#speech-layer") ?? document.body;
    this.speechOverlay = createSpeechOverlay(speechLayer);
    const uiRoot = document.body;
    this.dialoguePanel = createDialoguePanel(uiRoot);
    this.dialoguePanel.onChoice((intent) => this.handleDialogueChoice(intent));
    this.moodlesHud = createMoodlesHud(uiRoot);
    this.hotbarHud = createHotbarHud(uiRoot);
    this.lootToast = createLootFloaterHud(uiRoot);
    this.inventoryPanel = createInventoryPanel(uiRoot);
    this.noise = new NoiseBus();
    this.spawnThreats();
    this.view = createWorldView(this.map, this.containers);
    this.view.syncVisibleChunks(this.player.x, this.player.y);
    this.applyFov();
    this.view.syncPlayer(this.player.x, this.player.y);
    this.syncHostileView();
    this.syncSpeechOverlay();

    this.input = new Input();
    this.clock = new GameClock(DEFAULT_DAY_LENGTH_SEC);
    this.weather = new WeatherSystem({ initial: "drizzle" });
    this.ambient = createAmbientBus();
    this.ambientPlayer = createAmbientPlayer();
    this.combatPlayer = createCombatPlayer();
    this.interactPlayer = createInteractPlayer();
    this.speechPlayer = createSpeechPlayer();
    this.heartbeat = createHeartbeatBus();
    this.heartbeatPlayer = createHeartbeatPlayer();
    this.footsteps = createFootstepsBus();
    this.footstepPlayer = createFootstepPlayer();
    this.storage = browserStorage();
    this.session = new LocalLoopbackSession({
      playerX: this.player.x,
      playerY: this.player.y,
    });
    this.loop = new GameLoop((dt) => this.tick(dt));

    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    this.resize();
    this.refreshHud(true);
  }

  start(): void {
    // Overlay skip (Espacio) no debe colarse como melee/disparo al primer tick.
    this.input.endFrame();
    this.renderer.render(this.view.scene, this.view.camera);
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.speechOverlay.dispose();
    this.dialoguePanel.dispose();
    this.moodlesHud.dispose();
    this.hotbarHud.dispose();
    this.lootToast.dispose();
    this.inventoryPanel.dispose();
    this.dialogue.close();
    this.speech.clear();
    this.trust.clear();
    this.memory.clear();
    this.gates.clear();
    this.view.dispose();
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.root.replaceChildren();
  }

  /** Mudos + poseídos (F4: conviven; no reemplaza todos los mudos). */
  private spawnThreats(): void {
    this.hostiles.clear();
    this.speech.clear();
    this.trust.clear();
    this.memory.clear();
    this.gates.clear();
    this.dialogue.close();
    this.dialogueLastLine = null;
    this.dialogueLastTone = null;
    this.dialogueGateLine = null;
    for (const s of defaultHostileSpawns()) {
      this.hostiles.add(s.id, s.x, s.y);
    }
    for (const s of defaultPossessedSpawns()) {
      this.hostiles.add(s.id, s.x, s.y, undefined, "possessed");
      this.speech.register(s.id);
      this.trust.register(s.id);
    }
    this.spawnGrace = SPAWN_GRACE_SECONDS;
  }

  private saveWorld(): SaveWorld {
    return {
      clock: this.clock,
      player: this.player,
      map: this.map,
      containers: this.containers,
      possession: {
        trust: this.trust,
        gates: this.gates,
        speech: this.speech,
        memory: this.memory,
      },
    };
  }

  /** Guarda en localStorage (no-op si no hay storage). */
  private doSave(): boolean {
    if (this.gameOver) {
      this.lastLootMsg = "F5 no aplica (muerto)";
      return false;
    }
    if (!this.storage) {
      this.lastLootMsg = "sin storage";
      return false;
    }
    writeSave(this.storage, this.saveWorld());
    this.lastLootMsg = "guardado";
    return true;
  }

  /** Carga desde localStorage y refresca sim + render. */
  private doLoad(): boolean {
    if (!this.storage) {
      this.lastLootMsg = "sin storage";
      return false;
    }
    const save = readSave(this.storage);
    if (!save) {
      this.lastLootMsg = "sin partida";
      return false;
    }
    applySave(this.saveWorld(), save);
    const loadedTarget = this.dialogue.target;
    this.dialogueGateLine = loadedTarget
      ? this.gates.gateLine(loadedTarget)
      : null;
    const loaded = loadAliveRuntime(this.player.alive);
    this.gameOver = loaded.gameOver;
    this.spawnGrace = loaded.spawnGrace;
    if (loaded.deathClip) {
      this.view.triggerPlayerAction("death");
    } else {
      this.view.clearPlayerAction();
    }
    // Load-muerto salta enterGameOver: cerrar panel antes de refreshViewAfterLoad.
    if (loaded.gameOver) {
      this.input.consumeFlashlightToggle();
      this.closeDialogueOnGameOver();
      this.input.consumeLoot();
      this.input.consumeInteract();
    }
    if (!hasFlashlight(this.player.inventory)) this.flashlightOn = false;
    this.noise.clear();
    this.refreshViewAfterLoad();
    // Drain U / Q / C / H / X / Space/V / Z / B / T / Esc / I / F1 / +/- / F5 fuera del bloque close/loot: no tira ni consume ni craftea ni cocina ni dispara ni golpea ni duerme ni coloca ni abre ni cierra diálogo ni togglea inventario ni ayuda ni zoomea ni guarda leftover; no estira regex de hide.
    if (loaded.gameOver) this.input.consumeDrop();
    if (loaded.gameOver) this.input.consumeUse();
    if (loaded.gameOver) this.input.consumeCraft();
    if (loaded.gameOver) this.input.consumeCook();
    if (loaded.gameOver) this.input.consumeShoot();
    if (loaded.gameOver) this.input.consumeAttack();
    if (loaded.gameOver) this.input.consumeSleep();
    if (loaded.gameOver) this.input.consumeBuild();
    if (loaded.gameOver) this.input.consumeTalk();
    if (loaded.gameOver) this.input.consumeCancel();
    if (loaded.gameOver) this.input.consumeInventoryToggle();
    if (loaded.gameOver) this.input.consumeHelp();
    if (loaded.gameOver) this.input.consumeZoomIn();
    if (loaded.gameOver) this.input.consumeZoomOut();
    if (loaded.gameOver) this.input.consumeSave();
    this.lastLootMsg = "cargado";
    this.refreshHud(true);
    return true;
  }

  /** Reinicio fresco del barrio (game-over → R). Recrea vista (mapa nuevo). */
  private softReset(): void {
    const neighborhood = createNeighborhood(48);
    this.map = neighborhood.map;
    this.containers = neighborhood.containers;
    this.player = new PlayerSim(neighborhood.spawn);
    this.hostiles = new HostileSim();
    this.speech = new SpeechDirector({
      llmEnabled: this.config.llm.enabled,
      bridge: this.llmBridge,
    });
    this.trust = new TrustLedger();
    this.memory = new ShortMemory();
    this.gates = new DialogueBehaviorGates();
    this.dialogue = new DialogueSession();
    this.noise = new NoiseBus();
    // R: kit fresco = nunca sprintó; no filtrar RUN_NOISE_RING_MIN_AGE de la vida anterior.
    this.lastRunRingAgeSec = lastRunRingAgeAfterRestart();
    this.spawnThreats();
    this.clock = new GameClock(DEFAULT_DAY_LENGTH_SEC);
    this.weather = new WeatherSystem({ initial: "drizzle" });
    // R: mix fresco; no filtrar night/indoor/threat de la vida anterior. Mute se queda.
    resetAmbientAfterRestart(this.ambient);
    // R: voices a 0; no rampa leftover. Mute se queda.
    resetAmbientPlayerAfterRestart(this.ambientPlayer);
    // R: pisadas frescas + corta beep leftover (sine 45ms). Mute se queda.
    resetFootstepsAfterRestart(this.footsteps);
    resetFootstepPlayerAfterRestart(this.footstepPlayer);
    this.gameOver = false;
    this.showInvDetail = false;
    this.lastInvUseSlot = null;
    this.lastInvUseAt = Number.NEGATIVE_INFINITY;
    this.lastInvIndex = null;
    // R: kit fresco = slot 1; no filtrar 1–5/rueda de la vida anterior.
    this.hotbarSelected = hotbarSelectedAfterRestart();
    // R: corta beep leftover (hit 100ms / gun / melee). Mute se queda.
    resetCombatPlayerAfterRestart(this.combatPlayer);
    this.flashlightOn = false;
    this.session = new LocalLoopbackSession({
      playerX: this.player.x,
      playerY: this.player.y,
    });
    this.needsDamageMsgCd = 0;
    this.hitFlash.intensity = 0;
    this.syncHitFlashOverlay();
    this.syncInventoryPanel();
    this.lastLootMsg = "reinicio";
    this.view.dispose();
    this.view = createWorldView(this.map, this.containers);
    // R: cámara nueva = ISO_FRUSTUM; no filtrar el zoom de la vida anterior.
    this.isoFrustum = isoFrustumAfterRestart();
    this.resize();
    // R: kit fresco = gracia de spawn; leftover 0 de la vida anterior no filtra.
    this.spawnGrace = spawnGraceAfterRestart();
    // R: corta beep leftover (heartbeat sine 80ms). Mute se queda.
    resetHeartbeatPlayerAfterRestart(this.heartbeatPlayer);
    // R: corta beep leftover (door 90ms / loot 70ms / use 80ms). Mute se queda.
    resetInteractPlayerAfterRestart(this.interactPlayer);
    // R: corta beep leftover (speech 240Hz + 480Hz 120ms). Mute se queda.
    resetSpeechPlayerAfterRestart(this.speechPlayer);
    this.view.clearPlayerAction();
    this.view.syncVisibleChunks(this.player.x, this.player.y);
    this.applyFov();
    this.view.syncPlayer(this.player.x, this.player.y);
    this.syncHostileView();
    this.syncSpeechOverlay();
    this.syncDialoguePanel();
    this.syncLighting();
    this.view.followCamera(this.player.x, this.player.y);
    // R: pintar HUD vivo ya (no esperar 0.25s del freeze path).
    this.refreshHud(true);
  }

  /** Tras applySave: remesh chunks, puertas, FOV, player, día/noche. */
  private refreshViewAfterLoad(): void {
    this.view.forceReloadVisible(this.player.x, this.player.y);
    this.map.forEach((x, y, tile) => {
      if (tile.kind === "door") this.view.syncDoor(x, y, tile.open);
    });
    this.applyFov();
    this.view.syncPlayer(this.player.x, this.player.y);
    // Load-muerto: Idle mixer leftover dt 0 (load-vivo dt=0, igual que hoy).
    this.syncHostileView();
    this.syncSpeechOverlay();
    this.syncDialoguePanel();
    this.syncHitFlashOverlay();
    this.syncLootFloaterOverlay();
    this.syncInventoryPanel();
    this.syncMoodlesHud();
    this.syncHotbarHud();
    this.syncHelpHud();
    // Load-muerto: apagar pulso leftover (load-vivo espera el tick, igual que hoy).
    if (this.gameOver) this.syncInteractFocus();
    this.syncLighting();
    // Load-muerto: tracers / anillos leftover off (load-vivo dt=0, igual que hoy).
    this.syncTracerOverlay();
    this.syncNoiseRingOverlay();
    // Load-muerto: rain/grass leftover freeze (load-vivo dt=0, igual que hoy).
    this.syncRainVisual();
    this.syncGrassVisual();
    // Load-muerto: muzzle leftover off (load-vivo dt=0, igual que hoy).
    this.syncMuzzleFlashOverlay();
    // Load-muerto: impact leftover off (load-vivo dt=0, igual que hoy).
    this.syncImpactSparkOverlay();
    // Load-muerto: swing overlay leftover off (load-vivo dt=0, igual que hoy).
    this.syncSwingPoseOverlay();
    // Load-muerto: hit-lean leftover off (load-vivo dt=0, igual que hoy).
    this.syncHitLeanOverlay();
    // Load-muerto: locoBob leftover off (load-vivo dt=0, igual que hoy).
    this.syncLocoBobOverlay();
    // Load-muerto: camera shake leftover off (load-vivo dt=0, igual que hoy).
    this.syncCameraShakeOverlay();
    // Load-muerto: ambient leftover freeze (load-vivo dt=0, igual que hoy).
    this.syncAmbient();
    // Load-muerto: chevron leftover off (load-vivo helper=true, igual que hoy).
    this.syncFacingChevron();
    this.view.followCamera(this.player.x, this.player.y);
  }

  /** Día/noche + pool cálido indoor + linterna (no toca FOV/badges). */
  private syncLighting(): void {
    this.view.syncDayNight(this.clock);
    const indoor = isIndoor(this.map, this.player.x, this.player.y);
    const inten = warmLightIntensity(indoor, this.clock.daylight);
    const anchor = warmLightAnchor(this.map, this.player.x, this.player.y);
    this.view.syncWarmLight(anchor.x, anchor.y, inten);
    const has = hasFlashlight(this.player.inventory);
    if (!has) this.flashlightOn = false;
    // gameOver: cono/torch off (no mutate flashlightOn — R / load-vivo sin restore).
    const torch = torchLightApplies(this.gameOver)
      ? torchLightIntensity(this.flashlightOn, has, this.clock.daylight)
      : 0;
    this.view.syncTorchLight(this.player.x, this.player.y, torch);
  }

  /**
   * Partículas de lluvia (ocultas indoor o si clear).
   * gameOver → dt 0 (congela streaks; no esconde el clima).
   * Vivo (incl. F9 load-vivo): dt de hoy.
   */
  private syncRainVisual(dt = 0): void {
    const indoor = isIndoor(this.map, this.player.x, this.player.y);
    const inten =
      indoor || !this.weather.isRaining ? 0 : this.weather.intensity;
    this.view.syncRain(
      this.player.x,
      this.player.y,
      inten,
      rainVisualApplies(this.gameOver) ? dt : 0,
      this.clock.daylight,
    );
  }

  /**
   * Césped wind outdoor cerca del player (rebuild por tile).
   * gameOver → dt 0 (congela viento; no esconde el césped).
   * Vivo (incl. F9 load-vivo): dt de hoy.
   */
  private syncGrassVisual(dt = 0): void {
    this.view.syncGrass(
      this.player.x,
      this.player.y,
      grassVisualApplies(this.gameOver) ? dt : 0,
    );
  }

  private applyFov(): void {
    const has = hasFlashlight(this.player.inventory);
    if (!has) this.flashlightOn = false;
    // gameOver: radio base (no mutate flashlightOn — R / load-vivo sin restore).
    const radius = fovRadiusWithFlashlight(
      DEFAULT_FOV_RADIUS,
      this.flashlightOn,
      has,
      this.gameOver,
    );
    const visible = computeVisibleTiles(
      this.map,
      this.player.x,
      this.player.y,
      radius,
    );
    this.fovVisible = visible;
    this.fovVisibleCount = visible.size;
    this.view.syncFov(visible);
  }

  /**
   * Hostiles solo visibles si su tile está en FOV del player.
   * gameOver → dt 0 (congela mixer Idle; no esconde meshes).
   * Vivo (incl. F9 load-vivo): dt de hoy.
   */
  private syncHostileView(dt = 0): void {
    const px = this.player.x;
    const py = this.player.y;
    this.view.syncHostiles(
      this.hostiles.hostiles.map((h) => {
        const visible = this.fovVisible.has(
          tileKey(Math.floor(h.x), Math.floor(h.y)),
        );
        return {
          id: h.id,
          x: h.x,
          y: h.y,
          kind: h.kind,
          visible,
          ...(visible
            ? { faceX: px - h.x, faceZ: py - h.y }
            : {}),
        };
      }),
      hostileIdleApplies(this.gameOver) ? dt : 0,
      this.gameOver,
    );
  }

  private syncSpeechOverlay(): void {
    this.speechOverlay.sync(
      this.hostiles.hostiles
        .filter((h) => h.kind === "possessed")
        .map((h) => {
          const active = this.speech.getActive(h.id);
          const inFov = this.fovVisible.has(
            tileKey(Math.floor(h.x), Math.floor(h.y)),
          );
          return {
            id: h.id,
            x: h.x,
            y: h.y,
            line: active?.line ?? null,
            tone: active?.tone ?? null,
            visible: speechBubbleVisible(this.gameOver, inFov, !!active),
          };
        }),
      this.view.camera,
      this.renderer.domElement,
    );
  }


  private playerHasOfferFood(): boolean {
    const inv = this.player.inventory;
    return findSlot(inv, "hot_meal") >= 0 || findSlot(inv, "canned_food") >= 0;
  }

  private syncDialoguePanel(): void {
    const open = this.dialogue.open;
    const id = this.dialogue.target;
    this.dialoguePanel.sync({
      open,
      targetId: id,
      trust: id ? this.trust.get(id) : 50,
      lastLine: open ? this.dialogueLastLine : null,
      lastTone: open ? this.dialogueLastTone : null,
      gateLine: open && id ? this.gates.gateLine(id) : null,
      hasOfferFood: this.playerHasOfferFood(),
    });
  }

  private async handleDialogueChoice(intent: DialogueIntent): Promise<void> {
    const id = this.dialogue.target;
    if (!id || this.gameOver) return;
    // Línea / tags / TTLs ya validados *antes* de este turno (el apply posterior escribe lo nuevo).
    const lastGateLine = this.gates.gateLine(id);
    const lastApplied = this.gates.lastApplied(id);
    const lastRejected = this.gates.lastRejected(id);
    const lastMoodBias = this.speech.getMoodBias(id);
    const lastPacifiedLeft = this.gates.pacifiedLeft(id);
    const lastSpeedBumpLeft = this.gates.speedBumpLeft(id);
    const result = await applyDialogueChoiceAsync(
      this.trust,
      id,
      intent,
      Math.random,
      this.memory,
      { enabled: this.config.llm.enabled, bridge: this.llmBridge },
      lastGateLine,
      lastApplied,
      lastRejected,
      lastMoodBias,
      lastPacifiedLeft,
      lastSpeedBumpLeft,
    );
    // Ofrecer: detectar comida antes de validar gates (diálogo propone; código valida)
    const inv = this.player.inventory;
    const hasOfferFood = this.playerHasOfferFood();
    const proposal = proposeDialogueGates(result.intent, result.trustAfter, {
      hasOfferFood,
    });
    if (proposal.consumeFood) {
      // Preferir plato caliente si hay; si no, lata
      const hot = findSlot(inv, "hot_meal");
      const canned = findSlot(inv, "canned_food");
      const slot = hot >= 0 ? hot : canned;
      if (slot >= 0) removeFromSlot(inv, slot, 1);
    }
    if (proposal.extraTrustHeal > 0) {
      result.trustAfter = this.trust.adjust(id, proposal.extraTrustHeal);
      result.trustDelta += proposal.extraTrustHeal;
    }
    this.gates.apply(id, proposal);
    if (proposal.lucidityBoost) {
      this.speech.setMoodBias(id, "lucidez");
    }
    if (proposal.emitThreatNoise) {
      const h = this.hostiles.get(id);
      if (h) this.showNoiseRing(this.noise.emitAttack(h.x, h.y));
    }
    // Distraer: ruido señuelo lejos del player (no chase hacia el player)
    if (proposal.emitDistractNoise) {
      const h = this.hostiles.get(id);
      if (h) {
        const DISTRACT_RANGE = 8;
        let nx = h.x + proposal.distractOffset.dx;
        let ny = h.y + proposal.distractOffset.dy;
        const awayX = h.x - this.player.x;
        const awayY = h.y - this.player.y;
        const len = Math.hypot(awayX, awayY);
        if (len > 0.05) {
          nx = h.x + (awayX / len) * DISTRACT_RANGE;
          ny = h.y + (awayY / len) * DISTRACT_RANGE;
        }
        // Radio medio/alto (attack ≈ threat) en el punto far → atrae mudos
        this.showNoiseRing(this.noise.emitAttack(nx, ny));
      }
    }
    if (proposal.forceChase) {
      const h = this.hostiles.get(id);
      if (h && !this.gates.isPacifiedByGate(id) && !this.trust.attitude(id).pacified) {
        h.mode = "chase";
        h.investigateX = this.player.x;
        h.investigateY = this.player.y;
        h.path = [];
        h.pathIndex = 0;
        h.replanAt = 0;
      }
    }
    if (proposal.pacifyTtl > 0) {
      const h = this.hostiles.get(id);
      if (h) {
        h.mode = "wander";
        h.path = [];
        h.pathIndex = 0;
        h.investigateTtl = 0;
        h.replanAt = 0;
      }
    }
    this.speech.forceSpeak(
      id,
      result.tone,
      result.line,
      "dialogue",
      result.lineSource ?? "bank",
    );
    playSpeech(this.speechPlayer, this.ambient.muted);
    const bias = this.memory.toneBias(id);
    if (bias && !proposal.lucidityBoost) this.speech.setMoodBias(id, bias);
    this.dialogueLastLine = result.line;
    this.dialogueLastTone = result.tone;
    this.dialogueGateLine = formatGateLine(proposal);
    if (this.dialogueGateLine) {
      this.gates.restoreGateLine(id, this.dialogueGateLine);
    }
    const sign = result.trustDelta >= 0 ? "+" : "";
    let gateHint =
      proposal.applied.length > 0
        ? ` · gate ${proposal.applied.join("+")}`
        : "";
    if (
      intent === "ofrecer" &&
      proposal.rejected.includes("offer_food") &&
      !hasOfferFood
    ) {
      gateHint += " · sin comida";
    }
    this.lastLootMsg = `${intent} → trust ${result.trustAfter} (${sign}${result.trustDelta})${gateHint}`;
    this.hudAcc = 1;
    this.syncDialoguePanel();
    this.syncSpeechOverlay();
  }

  private tryToggleDialogue(): void {
    if (this.dialogue.open) {
      const next = nextDialogueCloseHud(true, this.lastLootMsg);
      this.dialogue.close();
      this.dialogueLastLine = null;
      this.dialogueLastTone = null;
      this.dialogueGateLine = null;
      this.lastLootMsg = next.lastLootMsg;
      this.hudAcc = 1;
      this.syncDialoguePanel();
      return;
    }
    const near = nearestPossessed(
      this.hostiles.hostiles,
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    if (!near) {
      this.lastLootMsg = "nadie cerca (T)";
      this.hudAcc = 1;
      return;
    }
    this.trust.register(near.id);
    this.dialogue.begin(near.id);
    this.dialogueLastLine = null;
    this.dialogueLastTone = null;
    this.dialogueGateLine = this.gates.gateLine(near.id);
    this.lastLootMsg = dialogueOpenHudMsg(near.id);
    this.hudAcc = 1;
    this.syncDialoguePanel();
  }

  /** Possession gated → loopback (speech+memory ya actualizados). */
  private publishPossessionSnap(): void {
    publishHostPossession(
      this.session,
      this.trust,
      this.gates,
      this.trust.ids(),
      this.speech,
      this.memory,
    );
  }

  /** Habla de poseídos: al ver player o periódico. */
  private tickSpeech(dt: number): void {
    const ptx = Math.floor(this.player.x);
    const pty = Math.floor(this.player.y);
    const entities = this.hostiles.hostiles
      .filter((h) => h.kind === "possessed")
      .map((h) => ({
        id: h.id,
        seesPlayer: this.hostiles.seesPlayer(this.map, h, ptx, pty),
      }));
    const uttered = this.speech.tick(dt, entities);
    for (let i = 0; i < uttered.length; i++) {
      playSpeech(this.speechPlayer, this.ambient.muted);
    }
  }

  /**
   * Muerte / F9 load-muerto: cierra el panel igual que T/Esc/validate
   * para que no tape HAS MUERTO. Ya cerrado = no-op (lastLootMsg intacto).
   * Keepable causa la filtra enterGameOver; doLoad pisa lastLootMsg con cargado.
   */
  private closeDialogueOnGameOver(): void {
    if (!this.dialogue.open) return;
    const next = nextDialogueCloseHud(true, this.lastLootMsg);
    this.dialogue.close();
    this.dialogueLastLine = null;
    this.dialogueLastTone = null;
    this.dialogueGateLine = null;
    this.lastLootMsg = next.lastLootMsg;
    this.hudAcc = 1;
    this.syncDialoguePanel();
  }

  private enterGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    // Drain L; no assign flashlightOn (R / load-vivo sin restore inventado).
    this.input.consumeFlashlightToggle();
    this.closeDialogueOnGameOver();
    // formatHudStatus already paints HAS MUERTO. Keep combate/hambre-sed; drop leftover.
    if (!isKeepableDeathCause(this.lastLootMsg)) {
      this.lastLootMsg = "";
    }
    this.hudAcc = 1;
    this.view.triggerPlayerAction("death");
    this.syncDialoguePanel();
    this.syncLootFloaterOverlay();
    this.syncInventoryPanel();
    this.syncMoodlesHud();
    this.syncHotbarHud();
    this.syncHelpHud();
    this.syncInteractFocus();
    this.applyFov();
    // FOV ya en radio base: ocultar mudos/poseídos del anillo +4 linterna.
    // Idle mixer leftover: dt 0 ya (no hide meshes).
    this.syncHostileView();
    this.syncLighting();
    // Tracers / anillos leftover: hide ya (no esperar el freeze tick).
    this.syncTracerOverlay();
    this.syncNoiseRingOverlay();
    // Rain/grass leftover: freeze streaks/viento ya (no hide weather).
    this.syncRainVisual();
    this.syncGrassVisual();
    // Muzzle leftover: hide ya (no esperar el freeze tick).
    this.syncMuzzleFlashOverlay();
    // Impact leftover: hide ya (no esperar el freeze tick).
    this.syncImpactSparkOverlay();
    // Swing leftover: reset overlay pose ya (no esperar el freeze tick).
    this.syncSwingPoseOverlay();
    // Hit-lean leftover: reset overlay pose ya (no esperar el freeze tick).
    this.syncHitLeanOverlay();
    // LocoBob leftover: zero idle offsets ya (no esperar el freeze tick).
    this.syncLocoBobOverlay();
    // Camera shake leftover: zero offset ya (no esperar el freeze tick).
    this.syncCameraShakeOverlay();
    // Ambient leftover: freeze threatPhase/lerp ya (no mute).
    this.syncAmbient();
    // Facing chevron leftover: hide ya (no esperar el freeze tick).
    this.syncFacingChevron();
    // Drain G/E/F / U / Q / C / H / X / Space/V / Z / B / T / Esc / I / F1 / +/- / F5 al final: no loot/puerta/drop/use/craft/cook/shoot/melee/sleep/build/diálogo/inventario/ayuda/zoom/save; no empuja ventanas de scan del hide.
    this.input.consumeLoot();
    this.input.consumeInteract();
    this.input.consumeDrop();
    this.input.consumeUse();
    this.input.consumeCraft();
    this.input.consumeCook();
    this.input.consumeShoot();
    this.input.consumeAttack();
    this.input.consumeSleep();
    this.input.consumeBuild();
    this.input.consumeTalk();
    this.input.consumeCancel();
    this.input.consumeInventoryToggle();
    this.input.consumeHelp();
    this.input.consumeZoomIn();
    this.input.consumeZoomOut();
    this.input.consumeSave();
  }


  /** Feedback visual de ruido (no walk — spam). */
  private showNoiseRing(ev: NoiseEvent): void {
    if (!shouldShowNoiseRing(ev.source)) return;
    this.view.spawnNoiseRing(ev.x, ev.y, ev.radius, ev.source);
  }

  /**
   * Usa el slot de hotbar: vacía+lluvia outdoor rellena esa botella;
   * si no, consume food/drink/heal. Q prioriza lluvia en cualquier vacía.
   */
  private useHotbarSlot(index: number): void {
    this.hotbarSelected = clampHotbarIndex(index);
    const outdoor = !isIndoor(this.map, this.player.x, this.player.y);
    const stack = this.player.inventory.slots[this.hotbarSelected];
    if (
      stack?.id === "empty_bottle" &&
      canRefillFromRain(
        this.weather.isRaining,
        outdoor,
        this.player.inventory,
      )
    ) {
      const filled = attemptRefill(
        this.weather.isRaining,
        outdoor,
        this.player.inventory,
      );
      if (filled.ok) {
        playUse(this.interactPlayer, this.ambient.muted);
        this.lastLootMsg = RAIN_FILL_MSG;
        this.lootToast.show(this.lastLootMsg, "water_bottle");
        this.hudAcc = 1;
      } else if (filled.reason === "inv_full") {
        this.toastRefillFull(0);
      }
      return;
    }
    const used = this.player.tryConsumeAt(this.hotbarSelected);
    if (used) {
      playUse(this.interactPlayer, this.ambient.muted);
      this.lastLootMsg =
        used === "food"
          ? "comiste"
          : used === "drink"
            ? "bebiste"
            : "vendaje +HP";
      this.lootToast.show(this.lastLootMsg, stack?.id);
      this.hudAcc = 1;
    } else if (stack) {
      const use = getItemDef(stack.id).use;
      if (use !== "food" && use !== "drink" && use !== "heal") {
        this.lastLootMsg = "no se puede usar";
        this.lootToast.show(this.lastLootMsg);
        this.hudAcc = 1;
      }
    }
  }

  /**
   * Usa un slot de inventario por índice original (sin clamp).
   * Clic / doble clic en fila del panel I; slots 0–4 también seleccionan hotbar.
   * Mismo índice dentro de ~0.35s de clock.elapsed es no-op (anti doble-consumo).
   */
  private useInventorySlot(index: number): void {
    if (!Number.isFinite(index)) return;
    const i = index;
    const now = this.clock.elapsed;
    if (
      this.lastInvUseSlot === i &&
      now - this.lastInvUseAt < 0.35
    ) {
      return;
    }
    const stack = this.player.inventory.slots[i];
    if (!stack || stack.qty <= 0) return;
    this.lastInvUseSlot = i;
    this.lastInvUseAt = now;
    if (i >= 0 && i < HOTBAR_SIZE) {
      this.hotbarSelected = i;
    }
    const outdoor = !isIndoor(this.map, this.player.x, this.player.y);
    if (
      stack.id === "empty_bottle" &&
      canRefillFromRain(
        this.weather.isRaining,
        outdoor,
        this.player.inventory,
      )
    ) {
      const filled = attemptRefill(
        this.weather.isRaining,
        outdoor,
        this.player.inventory,
      );
      if (filled.ok) {
        playUse(this.interactPlayer, this.ambient.muted);
        this.lastLootMsg = RAIN_FILL_MSG;
        this.lootToast.show(this.lastLootMsg, "water_bottle");
        this.hudAcc = 1;
      } else if (filled.reason === "inv_full") {
        this.toastRefillFull(0);
      }
      return;
    }
    const used = this.player.tryConsumeAt(i);
    if (used) {
      playUse(this.interactPlayer, this.ambient.muted);
      this.lastLootMsg =
        used === "food"
          ? "comiste"
          : used === "drink"
            ? "bebiste"
            : "vendaje +HP";
      this.lootToast.show(this.lastLootMsg, stack.id);
      this.hudAcc = 1;
    } else {
      const use = getItemDef(stack.id).use;
      if (use !== "food" && use !== "drink" && use !== "heal") {
        this.lastLootMsg = "no se puede usar";
        this.lootToast.show(this.lastLootMsg);
        this.hudAcc = 1;
      }
    }
  }

  private toastSplit(index: number): void {
    const split = splitStack(this.player.inventory, index);
    if (split) {
      const label = `partiste ${getItemDef(split.id as ItemId).name} ×${split.qty}`;
      this.lastLootMsg = label;
      this.lootToast.show(label, split.id);
      this.hudAcc = 1;
    } else {
      this.lastLootMsg = "no se puede partir";
      this.lootToast.show(this.lastLootMsg);
      this.hudAcc = 1;
    }
  }

  /** U / Shift+U / inv throw: dest pila llena → toast existente. */
  private toastDropFull(added: number): void {
    const msg = dropFullMessage(added);
    if (!msg) return;
    this.lastLootMsg = msg;
    this.lootToast.show(msg);
    this.hudAcc = 1;
  }

  /** C: dest inv no acepta el vendaje → toast existente. */
  private toastCraftFull(added: number): void {
    const msg = craftFullMessage(added);
    if (!msg) return;
    this.lastLootMsg = msg;
    this.lootToast.show(msg);
    this.hudAcc = 1;
  }

  /** H: dest inv no acepta el plato → toast existente. */
  private toastCookFull(added: number): void {
    const msg = cookFullMessage(added);
    if (!msg) return;
    this.lastLootMsg = msg;
    this.lootToast.show(msg);
    this.hudAcc = 1;
  }

  /** Q / clic / hotbar: dest inv no acepta el agua leftover → toast existente. */
  private toastRefillFull(added: number): void {
    const msg = refillFullMessage(added);
    if (!msg) return;
    this.lastLootMsg = msg;
    this.lootToast.show(msg);
    this.hudAcc = 1;
  }

  /** G / Shift+G / E-fallback: dest lleno + loot cerca → toast existente. */
  private toastLootFull(): void {
    const msg = lootFullMessage(
      null,
      this.containers.nearest(
        this.player.x,
        this.player.y,
        CONTAINER_REACH,
        this.lootPreferTile(),
      ),
    );
    if (!msg) return;
    this.lastLootMsg = msg;
    this.lootToast.show(msg);
    this.hudAcc = 1;
  }

  private toastMerge(index: number): void {
    const merged = mergeStack(this.player.inventory, index);
    if (merged) {
      const label = `juntaste ${getItemDef(merged.id as ItemId).name} ×${merged.destQty}`;
      this.lastLootMsg = label;
      this.lootToast.show(label, merged.id);
      this.hudAcc = 1;
    } else {
      this.lastLootMsg = "no se puede juntar";
      this.lootToast.show(this.lastLootMsg);
      this.hudAcc = 1;
    }
  }

  private tick(dt: number): void {
    this.applyIsoZoomInput();
    const slot = this.input.consumeHotbar();
    const wheel = this.input.consumeHotbarWheel();
    const clicked = this.hotbarHud.consumeClick();
    const dragged = this.hotbarHud.consumeDrag();
    const inspected = this.hotbarHud.consumeInspect();
    const dbl = this.hotbarHud.consumeDblClick();
    const hotbarSplitIdx = this.hotbarHud.consumeSplit();
    const hotbarMergeIdx = this.hotbarHud.consumeMerge();
    const invClick = this.inventoryPanel.consumeClick();
    const invDbl = this.inventoryPanel.consumeDblClick();
    const invInspect = this.inventoryPanel.consumeInspect();
    const splitIdx = this.inventoryPanel.consumeSplit();
    const mergeIdx = this.inventoryPanel.consumeMerge();
    const invDragged = this.inventoryPanel.consumeDrag();
    // Drain 1–5 / rueda / clic / swap; HAS MUERTO no cambia selección ni stacks.
    if (hotbarInputApplies(this.gameOver)) {
      if (slot !== null) {
        this.hotbarSelected = nextHotbarSelected(
          this.gameOver,
          this.hotbarSelected,
          slot,
        );
        this.hudAcc = 1;
      }
      if (wheel !== null) {
        this.hotbarSelected = nextHotbarSelected(
          this.gameOver,
          this.hotbarSelected,
          stepHotbarIndex(this.hotbarSelected, wheel),
        );
        this.hudAcc = 1;
      }
      if (dragged) {
        if (swapHotbarStacks(this.player.inventory, dragged.from, dragged.to)) {
          this.hotbarSelected = nextHotbarSelected(
            this.gameOver,
            this.hotbarSelected,
            dragged.to,
          );
          this.hudAcc = 1;
        }
      } else if (
        clicked !== null &&
        hotbarSplitIdx === null &&
        hotbarMergeIdx === null
      ) {
        this.hotbarSelected = nextHotbarSelected(
          this.gameOver,
          this.hotbarSelected,
          clicked,
        );
        this.hudAcc = 1;
      }
    }

    // Game-over: solo R reinicia / F9 carga (F5 no aplica)
    if (this.gameOver || !this.player.alive) {
      if (!this.gameOver) this.enterGameOver();
      this.closeDialogueOnGameOver();
      if (this.input.consumeRestOrRestart()) {
        this.softReset();
        this.hudAcc = 1;
      } else if (this.input.consumeLoad()) {
        this.doLoad();
        this.hudAcc = 1;
      }
      if (this.input.consumeMute()) {
        this.lastLootMsg = muteHudMsg(toggleAmbientMute(this.ambient));
        this.hudAcc = 1;
      }
      // Drain L / G / E / F / U / Q / C / H / X / Space/V / Z / B / T / Esc / I / F1 / +/- / F5; HAS MUERTO no togglea ni lootea / abre puertas / tira / usa / craftea / cocina / dispara / golpea / duerme / coloca / abre ni cierra diálogo ni inventario ni ayuda ni zoomea ni guarda.
      this.input.consumeFlashlightToggle();
      this.input.consumeLoot();
      this.input.consumeInteract();
      this.input.consumeDrop();
      this.input.consumeUse();
      this.input.consumeCraft();
      this.input.consumeCook();
      this.input.consumeShoot();
      this.input.consumeAttack();
      this.input.consumeSleep();
      this.input.consumeBuild();
      this.input.consumeTalk();
      this.input.consumeCancel();
      this.input.consumeInventoryToggle();
      this.input.consumeHelp();
      this.input.consumeZoomIn();
      this.input.consumeZoomOut();
      this.input.consumeSave();
      this.input.endFrame();
      this.syncAmbient(dt);
      this.syncHeartbeat(dt);
      this.syncFootsteps(dt, 0, false);
      this.applyFov();
      this.syncHostileView(dt);
      this.syncLighting();
      this.syncRainVisual(dt);
      this.syncGrassVisual(dt);
      this.syncTracerOverlay(dt);
      this.syncNoiseRingOverlay(dt);
      this.tickHitFlashOverlay(dt);
      this.view.syncPlayer(this.player.x, this.player.y);
      this.syncInteractFocus(dt);
      this.syncLocoBobOverlay(dt);
      this.syncHitLeanOverlay(dt);
      // Mixer must keep ticking during freeze so death LoopOnce can play/clamp.
      this.syncSwingPoseOverlay(dt);
      this.view.tickPlayerLoco(dt, false, false);
      this.syncMuzzleFlashOverlay(dt);
      this.syncImpactSparkOverlay(dt);
      this.syncCameraShakeOverlay(dt);
      this.syncFacingChevron();
      this.renderer.render(this.view.scene, this.view.camera);
      this.syncHelpHud();
      this.syncSpeechOverlay();
      this.syncDialoguePanel();
      this.syncLootFloaterOverlay();
      this.syncInventoryPanel();
      this.hudAcc += dt;
      if (this.hudAcc >= 0.25) {
        this.hudAcc = 0;
        this.refreshHud(false);
      }
      return;
    }

    this.clock.advance(dt);
    this.weather.tick(dt, this.clock.phase);
    {
      const indoor = isIndoor(this.map, this.player.x, this.player.y);
      this.player.tickNeeds(dt, rainNeedsMult(this.weather, indoor));
    }
    // Daño supervivencia: hambre/sed al tope (fatigue no daña HP aquí).
    // No triggerPlayerAction("hit"): el lean procedural es solo toque hostil.
    if (this.player.alive) {
      const nd = computeNeedsDamage(this.player.needs, dt);
      if (nd.amount > 0) {
        this.player.takeDamage(nd.amount);
        triggerHitFlash(this.hitFlash, Math.min(1, nd.amount * 5));
        if (this.needsDamageMsgCd <= 0) {
          const msg = needsDamageHudMessage(nd);
          if (msg) {
            this.lastLootMsg = msg;
            this.hudAcc = 1;
            this.needsDamageMsgCd = NEEDS_DAMAGE_MSG_CD;
          }
        }
      }
    }
    if (this.needsDamageMsgCd > 0) {
      this.needsDamageMsgCd = Math.max(0, this.needsDamageMsgCd - dt);
    }
    this.player.tickCombat(dt);
    const sprint = this.input.sprinting;
    const moved = this.player.move(dt, this.input.axes, this.map, sprint);
    if (moved > 0.001) {
      if (sprint) {
        const ev = this.noise.emitRun(this.player.x, this.player.y);
        if (shouldSpawnNoiseRing("run", this.lastRunRingAgeSec)) {
          this.showNoiseRing(ev);
          this.lastRunRingAgeSec = 0;
        }
      } else this.noise.emitWalk(this.player.x, this.player.y);
    }
    if (this.lastRunRingAgeSec != null) this.lastRunRingAgeSec += dt;

    this.noise.tick(dt);
    this.gates.tick(dt);

    const hits = this.hostiles.tick(
      dt,
      this.map,
      this.player.x,
      this.player.y,
      this.noise,
      this.gates.mergeAttitudes(this.trust.attitudes()),
    );
    if (hostileDamageAllowed(this.spawnGrace)) {
      for (const hit of hits) {
        this.player.takeDamage(hit.damage);
        playHit(this.combatPlayer, this.ambient.muted);
        this.view.triggerPlayerAction("hit");
        triggerHitFlash(this.hitFlash, 1);
        const attacker = this.hostiles.get(hit.hostileId);
        if (attacker) {
          tryApplyTouchKnockback(this.player, attacker, this.map);
        }
        this.showNoiseRing(this.noise.emitAttack(this.player.x, this.player.y));
        this.lastLootMsg = `golpe -${hit.damage} HP`;
        this.hudAcc = 1;
      }
    }
    this.spawnGrace = tickSpawnGrace(this.spawnGrace, dt);
    this.tickSpeech(dt);
    publishHostHostiles(this.session, this.hostiles);
    publishHostDoors(this.session, this.map);
    publishHostContainers(this.session, this.containers);
    publishHostBarricades(this.session, this.map);
    this.publishPossessionSnap();
    if (!this.player.alive) {
      this.enterGameOver();
      this.input.endFrame();
      this.syncHeartbeat(dt);
      this.syncHostileView(dt);
      this.syncSpeechOverlay();
      this.tickHitFlashOverlay(dt);
      this.view.syncPlayer(this.player.x, this.player.y);
      this.syncInteractFocus(dt);
      this.syncLocoBobOverlay(dt);
      this.syncHitLeanOverlay(dt);
      this.syncSwingPoseOverlay(dt);
      this.view.tickPlayerLoco(dt, false, false);
      this.syncMuzzleFlashOverlay(dt);
      this.syncImpactSparkOverlay(dt);
      this.syncCameraShakeOverlay(dt);
      this.syncFacingChevron();
      this.renderer.render(this.view.scene, this.view.camera);
      this.refreshHud(true);
      return;
    }

    const wantsAttack = this.input.consumeAttack();
    if (meleeInputApplies(this.gameOver) && wantsAttack) {
      const canSwing = this.player.alive && this.player.attackCd === 0;
      const result = this.player.tryMelee(this.hostiles);
      if (canSwing) {
        this.view.triggerPlayerAction("primary-attack");
        playMelee(this.combatPlayer, this.ambient.muted);
      }
      if (result) {
        if (result.killed) {
          this.speech.unregister(result.hostileId);
          this.trust.unregister(result.hostileId);
          this.memory.unregister(result.hostileId);
          this.gates.unregister(result.hostileId);
          if (this.dialogue.target === result.hostileId) {
            this.dialogue.close();
            this.dialogueLastLine = null;
            this.dialogueLastTone = null;
            this.dialogueGateLine = null;
          }
        }
        this.showNoiseRing(this.noise.emitAttack(this.player.x, this.player.y));
        const wpn = result.weapon.label;
        this.lastLootMsg = result.killed
          ? `mataste ${result.hostileId} (${wpn})`
          : `golpeaste ${result.hostileId} con ${wpn} -${result.damage}`;
        this.hudAcc = 1;
      } else {
        this.lastLootMsg = "sin objetivo";
        this.hudAcc = 1;
      }
    }

    const wantsShoot = this.input.consumeShoot();
    if (shootInputApplies(this.gameOver) && wantsShoot) {
      const shot = this.player.tryShoot(this.hostiles, this.map);
      if (shot.kind === "fail") {
        this.lastLootMsg = shot.message;
        this.hudAcc = 1;
        if (shot.message === "sin munición") {
          playDryFire(this.combatPlayer, this.ambient.muted);
        }
      } else {
        playGun(this.combatPlayer, this.ambient.muted);
        this.view.triggerPlayerAction("primary-attack");
        this.view.triggerMuzzleFlash();
        this.view.triggerImpactSpark(shot.toX, shot.toY);
        this.showNoiseRing(this.noise.emitGun(this.player.x, this.player.y));
        this.view.spawnTracer(
          { x: shot.fromX, y: shot.fromY },
          { x: shot.toX, y: shot.toY },
        );
        if (shot.hit) {
          if (shot.killed) {
            this.speech.unregister(shot.hostileId);
            this.trust.unregister(shot.hostileId);
            this.memory.unregister(shot.hostileId);
            this.gates.unregister(shot.hostileId);
            if (this.dialogue.target === shot.hostileId) {
              this.dialogue.close();
              this.dialogueLastLine = null;
              this.dialogueLastTone = null;
              this.dialogueGateLine = null;
            }
          }
        }
        this.lastLootMsg = shot.message;
        this.hudAcc = 1;
      }
    }

    const wantsInteract = this.input.consumeInteract();
    if (lootInputApplies(this.gameOver) && wantsInteract) {
      const result = this.player.tryToggleDoor(this.map);
      if (result) {
        playDoor(this.interactPlayer, this.ambient.muted);
        this.view.syncDoor(result.x, result.y, result.open);
        this.showNoiseRing(this.noise.emitDoor(result.x + 0.5, result.y + 0.5));
      } else {
        const taken = this.player.tryLoot(this.containers);
        if (taken) {
          playLoot(this.interactPlayer, this.ambient.muted);
          this.showNoiseRing(this.noise.emitLoot(this.player.x, this.player.y));
          const lootLabel = lootFloaterLabel(
            `+${getItemDef(taken.id).name}`,
          );
          this.lootToast.show(lootLabel, taken.id);
          this.lastLootMsg = lootLabel;
          this.hudAcc = 1; // forzar refresh
          this.refreshNearestLootMarker();
        } else {
          this.toastLootFull();
        }
      }
    }
    const loot = this.input.consumeLoot();
    if (lootInputApplies(this.gameOver) && loot) {
      const taken = loot.whole
        ? this.player.tryLootStack(this.containers)
        : this.player.tryLoot(this.containers);
      if (taken) {
        playLoot(this.interactPlayer, this.ambient.muted);
        this.showNoiseRing(this.noise.emitLoot(this.player.x, this.player.y));
        const lootLabel = lootFloaterLabel(
          `+${getItemDef(taken.id).name}`,
          taken.qty,
        );
        this.lootToast.show(lootLabel, taken.id);
        this.lastLootMsg = lootLabel;
        this.hudAcc = 1;
        this.refreshNearestLootMarker();
      } else {
        this.toastLootFull();
      }
    }
    const drop = this.input.consumeDrop();
    if (dropInputApplies(this.gameOver) && drop) {
      const i = dropSourceIndex(
        this.showInvDetail,
        this.lastInvIndex,
        this.hotbarSelected,
        this.player.inventory.slots,
      );
      const stack = this.player.inventory.slots[i];
      const qty = dropQty(stack?.qty, drop.whole);
      if (stack && qty >= 1) {
        const itemId = stack.id;
        const { tx, ty } = dropTargetTile(
          this.player.x,
          this.player.y,
          this.player.facingX,
          this.player.facingY,
          (x, y) => this.map.walkable(x, y),
        );
        const id = `drop-${tx}-${ty}-${itemId}`;
        const { container: c, added } = dropFromSlot(
          this.player.inventory,
          i,
          qty,
          this.containers,
          tx,
          ty,
          id,
        );
        if (added <= 0) {
          this.toastDropFull(added);
        } else if (c) {
          this.view.addLootMarker(c.id, c.x, c.y, c.name, c.inv);
          playLoot(this.interactPlayer, this.ambient.muted);
          const label = dropToastLabel(getItemDef(itemId).name, added);
          this.lootToast.show(label, itemId);
          this.lastLootMsg = label;
          this.hudAcc = 1;
        }
      }
    }
    if (inspected !== null) {
      this.hotbarSelected = inspected;
      const slot = hotbarSlots(this.player.inventory)[inspected]!;
      const label = hotbarInspectLabel(slot);
      this.lastLootMsg = label;
      this.lootToast.show(label, slot.empty ? undefined : slot.id);
      this.hudAcc = 1;
    } else if (dbl !== null) {
      this.hotbarSelected = dbl;
      this.useHotbarSlot(dbl);
    }
    if (this.showInvDetail && invDragged) {
      this.lastInvIndex = invDragged.to;
      if (
        swapInventoryStacks(
          this.player.inventory,
          invDragged.from,
          invDragged.to,
        )
      ) {
        this.hudAcc = 1;
      }
    }
    if (this.showInvDetail && invDbl !== null) {
      this.lastInvIndex = invDbl;
      this.useInventorySlot(invDbl);
    }
    if (this.showInvDetail && invClick !== null) {
      this.lastInvIndex = invClick;
      this.useInventorySlot(invClick);
    }
    if (this.showInvDetail && invInspect !== null) {
      this.lastInvIndex = invInspect;
      const label = inventoryInspectLabel(this.player.inventory, invInspect);
      this.lastLootMsg = label;
      const invStack = this.player.inventory.slots[invInspect];
      this.lootToast.show(
        label,
        invStack && invStack.qty > 0 ? invStack.id : undefined,
      );
      this.hudAcc = 1;
    }
    if (hotbarSplitIdx !== null) {
      this.toastSplit(hotbarSplitIdx);
    }
    if (hotbarMergeIdx !== null) {
      this.toastMerge(hotbarMergeIdx);
    }
    if (this.showInvDetail && splitIdx !== null) {
      this.lastInvIndex = splitIdx;
      this.toastSplit(splitIdx);
    }
    if (this.showInvDetail && mergeIdx !== null) {
      this.lastInvIndex = mergeIdx;
      this.toastMerge(mergeIdx);
    }
    const wantsUse = this.input.consumeUse();
    if (useInputApplies(this.gameOver) && wantsUse) {
      const outdoor = !isIndoor(this.map, this.player.x, this.player.y);
      if (
        canRefillFromRain(
          this.weather.isRaining,
          outdoor,
          this.player.inventory,
        )
      ) {
        const filled = attemptRefill(
          this.weather.isRaining,
          outdoor,
          this.player.inventory,
        );
        if (filled.ok) {
          playUse(this.interactPlayer, this.ambient.muted);
          this.lastLootMsg = RAIN_FILL_MSG;
          this.lootToast.show(this.lastLootMsg, "water_bottle");
          this.hudAcc = 1;
        } else if (filled.reason === "inv_full") {
          this.toastRefillFull(0);
        }
      } else {
        this.useHotbarSlot(this.hotbarSelected);
      }
    }
    const wantsInv = this.input.consumeInventoryToggle();
    if (inventoryToggleApplies(this.gameOver) && wantsInv) {
      this.showInvDetail = nextShowInvDetail(
        this.gameOver,
        this.showInvDetail,
        true,
      );
      if (!this.showInvDetail) this.lastInvIndex = null;
      this.hudAcc = 1;
    }
    const wantsHelp = this.input.consumeHelp();
    if (helpInputApplies(this.gameOver) && wantsHelp) {
      this.showHelp = nextShowHelp(this.gameOver, this.showHelp, true);
      this.hudAcc = 1;
    }
    if (this.input.consumeMute()) {
      this.lastLootMsg = muteHudMsg(toggleAmbientMute(this.ambient));
      this.hudAcc = 1;
    }
    if (this.input.consumeRestOrRestart()) {
      this.player.rest();
      this.lastLootMsg = REST_HUD_MSG;
      this.hudAcc = 1;
    }
    const wantsSleep = this.input.consumeSleep();
    if (sleepInputApplies(this.gameOver) && wantsSleep) {
      const result = trySleep(
        this.player.needs,
        this.clock,
        this.map,
        this.player.x,
        this.player.y,
        this.hostiles.hostiles,
        { alive: this.player.alive },
      );
      this.lastLootMsg = result.message;
      this.hudAcc = 1;
    }
    const wantsBuild = this.input.consumeBuild();
    if (buildInputApplies(this.gameOver) && wantsBuild) {
      const built = this.player.tryPlaceBarricade(this.map);
      if (built?.ok) {
        const { x, y } = built.result;
        this.view.remeshTile(x, y);
        this.showNoiseRing(this.noise.emitBarricade(x + 0.5, y + 0.5));
        this.lastLootMsg = "barricada colocada";
        this.hudAcc = 1;
      } else if (built && !built.ok) {
        this.lastLootMsg = built.message;
        this.hudAcc = 1;
      }
    }
    const wantsCraft = this.input.consumeCraft();
    if (craftInputApplies(this.gameOver) && wantsCraft) {
      const had =
        this.player.alive && hasBandageMaterials(this.player.inventory);
      const { added } = this.player.tryCraftBandage();
      if (added > 0) {
        this.lastLootMsg = "vendaje craftado";
        this.hudAcc = 1;
      } else if (had) {
        this.toastCraftFull(added);
      } else {
        this.lastLootMsg = "falta tela/chatarra";
        this.hudAcc = 1;
      }
    }
    const wantsCook = this.input.consumeCook();
    if (cookInputApplies(this.gameOver) && wantsCook) {
      const cooked = this.player.tryCook(this.map);
      if (cooked?.ok) {
        this.lastLootMsg = "cocinaste un plato caliente";
        this.hudAcc = 1;
      } else if (cooked && !cooked.ok) {
        if (cooked.reason === "inv_full") {
          this.toastCookFull(0);
        } else {
          this.lastLootMsg = cooked.message;
          this.hudAcc = 1;
        }
      }
    }
    const wantsTalk = this.input.consumeTalk();
    if (talkInputApplies(this.gameOver) && wantsTalk) {
      this.tryToggleDialogue();
    }
    const wantsCancel = this.input.consumeCancel();
    if (cancelInputApplies(this.gameOver) && wantsCancel) {
      const next = nextDialogueCloseHud(this.dialogue.open, this.lastLootMsg);
      if (next.closed) {
        this.dialogue.close();
        this.dialogueLastLine = null;
        this.dialogueLastTone = null;
        this.dialogueGateLine = null;
        this.lastLootMsg = next.lastLootMsg;
        this.hudAcc = 1;
      }
    }
    if (this.dialogue.open) {
      this.dialogue.validate(
        this.hostiles.hostiles,
        this.player.x,
        this.player.y,
        DIALOGUE_REACH,
      );
      if (!this.dialogue.open) {
        const next = nextDialogueCloseHud(true, this.lastLootMsg);
        this.dialogueLastLine = null;
        this.dialogueLastTone = null;
        this.dialogueGateLine = null;
        this.lastLootMsg = next.lastLootMsg;
        this.hudAcc = 1;
      }
    }
    const wantsFlashlight = this.input.consumeFlashlightToggle();
    if (flashlightToggleApplies(this.gameOver) && wantsFlashlight) {
      const has = hasFlashlight(this.player.inventory);
      this.flashlightOn = nextFlashlightOn(
        this.gameOver,
        this.flashlightOn,
        true,
        has,
      );
      this.lastLootMsg = !has
        ? "sin linterna"
        : this.flashlightOn
          ? "linterna on"
          : "linterna off";
      this.hudAcc = 1;
    }
    const wantsSave = this.input.consumeSave();
    if (saveInputApplies(this.gameOver) && wantsSave) {
      this.doSave();
      this.hudAcc = 1;
    }
    if (this.input.consumeLoad()) {
      this.doLoad();
      this.hudAcc = 1;
    }
    // Zoom ya consumido al inicio del tick (applyIsoZoomInput).
    this.input.endFrame();

    this.view.syncVisibleChunks(this.player.x, this.player.y);
    this.applyFov();
    this.view.syncPlayer(this.player.x, this.player.y);
    this.syncInteractFocus(dt);
    {
      const ax = this.input.axes;
      const moving = ax.x !== 0 || ax.z !== 0;
      // Ejes vivos (diagonal continua) para yaw GLB; facing cardinal sigue
      // en player para melee / barricada / disparo.
      this.syncLocoBobOverlay(dt, moving, sprint);
      this.syncHitLeanOverlay(dt);
      this.syncSwingPoseOverlay(dt);
      this.view.tickPlayerLoco(dt, moving, sprint, ax.x, ax.z);
    }
    this.syncMuzzleFlashOverlay(dt);
    this.syncImpactSparkOverlay(dt);
    this.syncCameraShakeOverlay(dt);
    this.syncFacingChevron();
    this.syncHostileView(dt);
    this.syncAmbient(dt);
    this.syncHeartbeat(dt);
    this.syncFootsteps(dt, moved, sprint);
    this.syncLighting();
    this.syncRainVisual(dt);
    this.syncGrassVisual(dt);
    this.syncTracerOverlay(dt);
    this.syncNoiseRingOverlay(dt);
    this.view.followCamera(this.player.x, this.player.y);
    this.tickHitFlashOverlay(dt);
    this.renderer.render(this.view.scene, this.view.camera);
    this.syncSpeechOverlay();
    this.syncDialoguePanel();

    this.hudAcc += dt;
    if (this.hudAcc >= 0.25) {
      this.hudAcc = 0;
      this.refreshHud(false);
    }
  }

  /**
   * Pulso loot/puerta/cama + nameplate loot: gameOver → anillo+escala+plate off.
   * Vivo (incl. F9 load-vivo): igual que hoy. Ya apagado = no-op.
   */
  private syncInteractFocus(dt = 0): void {
    this.view.syncLootFocus(
      this.player.x,
      this.player.y,
      dt,
      this.emptyLootIds(),
      this.gameOver,
    );
    this.view.syncDoorFocus(this.player.x, this.player.y, dt, this.gameOver);
    this.view.syncBedFocus(this.player.x, this.player.y, dt, this.gameOver);
  }

  /** Ids de contenedores sin loot — anillo de loot oculto. */
  private emptyLootIds(): ReadonlySet<string> {
    const ids = new Set<string>();
    for (const c of this.containers.list) {
      if (!containerHasLoot(c)) ids.add(c.id);
    }
    return ids;
  }

  /** Tile de frente (sin walkable): mismo destino que U, para preferir loot. */
  private lootPreferTile(): { tx: number; ty: number } {
    return dropTargetTile(
      this.player.x,
      this.player.y,
      this.player.facingX,
      this.player.facingY,
    );
  }

  /**
   * Re-pinta nameplates en reach (qty tras G/E/Shift+G).
   * Incluye pilas vacías: `nearest()` las salta y el plate huérfano no se actualizaba.
   */
  private refreshNearestLootMarker(): void {
    const wx = this.player.x;
    const wy = this.player.y;
    for (const c of this.containers.list) {
      const d = Math.hypot(wx - (c.x + 0.5), wy - (c.y + 0.5));
      if (d > CONTAINER_REACH) continue;
      this.view.addLootMarker(c.id, c.x, c.y, c.name, c.inv);
    }
  }

  /**
   * Flash de hocico: gameOver → skip tick + hide mesh/luz.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya oculto = no-op.
   */
  private syncMuzzleFlashOverlay(dt = 0): void {
    if (muzzleFlashApplies(this.gameOver)) this.view.tickMuzzleFlash(dt);
    else this.view.hideMuzzleFlash();
  }

  /**
   * Spark de impacto: gameOver → skip tick + hide mesh/luz.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya oculto = no-op.
   */
  private syncImpactSparkOverlay(dt = 0): void {
    if (impactSparkApplies(this.gameOver)) this.view.tickImpactSpark(dt);
    else this.view.hideImpactSpark();
  }

  /**
   * Swing melee overlay: gameOver → skip tick + reset pose.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya en reposo = no-op.
   */
  private syncSwingPoseOverlay(dt = 0): void {
    if (swingPoseApplies(this.gameOver)) this.view.tickMeleeSwing(dt);
    else this.view.hideMeleeSwing();
  }

  /**
   * Hit-lean recoil overlay: gameOver → skip tick + reset lean pose.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya en reposo = no-op.
   */
  private syncHitLeanOverlay(dt = 0): void {
    if (hitLeanApplies(this.gameOver)) this.view.tickHitLean(dt);
    else this.view.hideHitLean();
  }

  /**
   * Chevron de facing: gameOver → hide mesh.
   * Vivo (incl. F9 load-vivo): visible de hoy. Ya oculto = no-op.
   */
  private syncFacingChevron(): void {
    if (facingChevronVisible(this.gameOver)) this.view.showFacingChevron();
    else this.view.hideFacingChevron();
  }

  /**
   * Bob/sway de silueta: gameOver → skip tick + zero idle offsets.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya en reposo = no-op.
   */
  private syncLocoBobOverlay(
    dt = 0,
    moving = false,
    sprinting = false,
  ): void {
    if (locoBobApplies(this.gameOver)) {
      this.view.tickLocoBob(dt, moving, sprinting);
    } else this.view.hideLocoBob();
  }

  /**
   * Camera shake: gameOver → skip tick + zero offset + followCamera.
   * Vivo (incl. F9 load-vivo): tick de hoy (followCamera aplica el offset).
   * Ya en reposo = no-op.
   */
  private syncCameraShakeOverlay(dt = 0): void {
    if (cameraShakeApplies(this.gameOver)) this.view.tickCameraShake(dt);
    else {
      this.view.hideCameraShake();
      this.view.followCamera(this.player.x, this.player.y);
    }
  }

  /**
   * Tracers de disparo: gameOver → skip tick + hide meshes.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya vacío = no-op.
   */
  private syncTracerOverlay(dt = 0): void {
    if (tracerOverlayApplies(this.gameOver)) this.view.tickTracers(dt);
    else this.view.hideTracers();
  }

  /**
   * Anillos de ruido: gameOver → skip tick + hide meshes.
   * Vivo (incl. F9 load-vivo): tick de hoy. Ya vacío = no-op.
   */
  private syncNoiseRingOverlay(dt = 0): void {
    if (noiseRingApplies(this.gameOver)) this.view.tickNoiseRings(dt);
    else this.view.hideNoiseRings();
  }

  /** Overlay `#hit-flash`: decay + opacity (0 si gameOver). */
  private tickHitFlashOverlay(dt: number): void {
    tickHitFlash(this.hitFlash, dt);
    this.syncHitFlashOverlay();
  }

  private syncHitFlashOverlay(): void {
    if (!this.hitFlashEl) return;
    this.hitFlashEl.style.opacity = String(
      hitFlashOverlayOpacity(this.gameOver, this.hitFlash.intensity),
    );
  }

  /** Overlay `#loot-floater`: hide si gameOver (no tapa HAS MUERTO). */
  private syncLootFloaterOverlay(): void {
    if (!lootFloaterVisible(this.gameOver, true)) {
      this.lootToast.hide();
    }
  }

  private syncInventoryPanel(): void {
    const open = inventoryPanelVisible(this.gameOver, this.showInvDetail);
    this.inventoryPanel.sync({
      open,
      data: buildInventoryPanelData(this.player.inventory),
      selectedIndex: open ? this.lastInvIndex : null,
    });
  }

  /** Overlay `#moodles`: hide si gameOver (no tapa HAS MUERTO). */
  private syncMoodlesHud(): void {
    if (!moodlesHudVisible(this.gameOver, true)) {
      this.moodlesHud.hide();
      return;
    }
    this.moodlesHud.sync(this.buildPlayerHudMoodles());
  }

  /** Overlay `#hotbar`: hide si gameOver (no tapa HAS MUERTO). */
  private syncHotbarHud(): void {
    if (!hotbarHudVisible(this.gameOver, true)) {
      this.hotbarHud.hide();
      return;
    }
    this.hotbarHud.sync(hotbarSlots(this.player.inventory), this.hotbarSelected);
  }

  /** Clase `#hud.hud-help`: drop si gameOver (no tapa HAS MUERTO). */
  private syncHelpHud(): void {
    if (!this.hud) return;
    this.hud.classList.toggle(
      "hud-help",
      helpHudVisible(this.gameOver, this.showHelp),
    );
  }


  /** Low-HP heartbeat: tick headless + beep si `{beat}` y no mute. */
  private syncHeartbeat(dt: number): void {
    const { beat } = tickHeartbeat(this.heartbeat, this.player.health, dt);
    if (beat) playHeartbeat(this.heartbeatPlayer, this.ambient.muted);
  }

  /**
   * Ambient stub + WebAudio layers; mute → gains 0.
   * gameOver → dt 0 (congela threatPhase / lerp; no mutea).
   * Vivo (incl. F9 load-vivo): dt de hoy.
   */
  private syncAmbient(dt = 0): void {
    const indoor = isIndoor(this.map, this.player.x, this.player.y);
    const threat = hostileNearby(
      this.hostiles.hostiles,
      this.player.x,
      this.player.y,
      10,
    );
    tickAmbient(
      this.ambient,
      {
        raining: this.weather.isRaining,
        isNight: this.clock.isNight,
        indoor,
        threatNearby: threat,
      },
      ambientTickApplies(this.gameOver) ? dt : 0,
    );
    syncAmbientPlayer(this.ambientPlayer, this.ambient);
  }

  /** Needs/HP + BAL si hay pistola (qty>0) + clock DIA/NOC. */
  private buildPlayerHudMoodles() {
    const inv = this.player.inventory;
    const pistolSlot = findSlot(inv, "pistol");
    const hasPistol = pistolSlot >= 0 && (inv.slots[pistolSlot]?.qty ?? 0) > 0;
    const ammoSlot = findSlot(inv, "ammo");
    const ammoQty = ammoSlot >= 0 ? (inv.slots[ammoSlot]?.qty ?? 0) : 0;
    return buildHudMoodles(
      this.player.needs,
      this.player.health,
      hasPistol,
      ammoQty,
      this.clock.isNight,
      this.clock.phase * 100,
    );
  }

  /** Footsteps stub + WebAudio beeps; mute compartido con ambient. */
  private syncFootsteps(dt: number, moved: number, sprint: boolean): void {
    tickFootsteps(
      this.footsteps,
      {
        moved,
        sprint,
        muted: this.ambient.muted,
      },
      dt,
    );
    syncFootstepPlayer(this.footstepPlayer, this.footsteps, { sprint });
  }

  private refreshHud(force: boolean): void {
    if (!this.hud && !force) return;
    if (!this.hud) return;

    if (this.gameOver || !this.player.alive) {
      this.hud.textContent = formatHudStatus({
        modo: this.clock.isNight ? "noche" : "día",
        phasePct: Math.floor(this.clock.phase * 100),
        muteN: 0,
        possN: 0,
        invLine: "",
        tileX: Math.floor(this.player.x),
        tileY: Math.floor(this.player.y),
        chunksLoaded: this.view.loadedChunkCount(),
        chunksTotal: this.map.chunkCount,
        fov: this.fovVisibleCount,
        gameOver: true,
        msg: this.lastLootMsg || undefined,
        showHelp: this.showHelp,
      });
      this.hud.classList.toggle(
        "hud-help",
        helpHudVisible(this.gameOver, this.showHelp),
      );
      this.syncMoodlesHud();
      this.syncHotbarHud();
      this.syncInventoryPanel();
      return;
    }

    const phase = Math.floor(this.clock.phase * 100);
    const modo = this.clock.isNight ? "noche" : "día";
    const muteN = this.hostiles.hostiles.filter((x) => x.kind === "mute").length;
    const possN = this.hostiles.hostiles.filter(
      (x) => x.kind === "possessed",
    ).length;
    const near = this.containers.nearest(
      this.player.x,
      this.player.y,
      CONTAINER_REACH,
      this.lootPreferTile(),
    );
    const nearHint =
      near && containerHasLoot(near)
        ? `cerca: ${near.name} [${inventorySummary(near.inv)}] G/E recoger`
        : undefined;
    const invLine = `inv ${this.player.invSummary()} (${this.player.invWeight().toFixed(1)}kg)`;
    const invDetailHint = this.showInvDetail ? "I cerrar inv" : undefined;
    this.syncInventoryPanel();
    const loud = this.noise.loudest();
    const noiseHint = loud
      ? `ruido ${loud.source} r${loud.radius.toFixed(0)}`
      : undefined;
    const msg = this.lastLootMsg || undefined;
    const nearPoss = nearestPossessed(
      this.hostiles.hostiles,
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    const talkHint = nearPoss
      ? `T hablar ${nearPoss.id} (trust ${this.trust.get(nearPoss.id)})`
      : undefined;
    const dlgHint =
      this.dialogue.open && this.dialogue.target
        ? dialogueOpenHudMsg(this.dialogue.target)
        : undefined;
    const pacifyLeft = this.hudPacifyLeft();
    const speedBumpLeft = this.hudSpeedBumpLeft();
    const moodBias = this.hudMoodBias();
    const memoryTone = this.hudMemoryTone();
    const lastApplied = this.hudLastApplied();
    const lastRejected = this.hudLastRejected();
    const lineSource = this.hudLineSource();
    this.syncMoodlesHud();
    this.syncHotbarHud();
    const indoor = isIndoor(this.map, this.player.x, this.player.y);
    const safe =
      indoor && isSafehouseHint(this.map, this.player.x, this.player.y);
    const bedNear = nearBed(this.map, this.player.x, this.player.y);
    const safeHint = safe
      ? bedNear
        ? "safehouse cama"
        : "safehouse"
      : undefined;
    const raining = this.weather.isRaining && !indoor;
    const flashlight =
      this.flashlightOn && hasFlashlight(this.player.inventory);

    this.hud.textContent = formatHudStatus({
      modo,
      phasePct: phase,
      muteN,
      possN,
      invLine,
      nearHint,
      noiseHint,
      talkHint,
      dlgHint,
      pacifyLeft,
      speedBumpLeft,
      moodBias,
      memoryTone,
      lastApplied,
      lastRejected,
      lineSource,
      indoor,
      safeHint,
      raining,
      flashlight,
      audioHint:
        describeAmbient(this.ambient) ??
        describeFootsteps(this.footsteps) ??
        undefined,
      msg,
      invDetailHint,
      tileX: Math.floor(this.player.x),
      tileY: Math.floor(this.player.y),
      chunksLoaded: this.view.loadedChunkCount(),
      chunksTotal: this.map.chunkCount,
      fov: this.fovVisibleCount,
      showHelp: this.showHelp,
    });
    this.hud.classList.toggle(
      "hud-help",
      helpHudVisible(this.gameOver, this.showHelp),
    );
  }

  /**
   * TTL de pacify para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `gates.pacifiedLeft > 0`.
   * Un solo reloj: `DialogueBehaviorGates.pacifiedLeft`.
   */
  private hudPacifyLeft(): number {
    if (this.dialogue.open && this.dialogue.target) {
      return this.gates.pacifiedLeft(this.dialogue.target);
    }
    const nearPacified = nearestPossessed(
      this.hostiles.hostiles.filter((h) => this.gates.pacifiedLeft(h.id) > 0),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearPacified ? this.gates.pacifiedLeft(nearPacified.id) : 0;
  }

  /**
   * TTL de speed-bump para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `gates.speedBumpLeft > 0`.
   * Un solo reloj: `DialogueBehaviorGates.speedBumpLeft`.
   */
  private hudSpeedBumpLeft(): number {
    if (this.dialogue.open && this.dialogue.target) {
      return this.gates.speedBumpLeft(this.dialogue.target);
    }
    const nearBump = nearestPossessed(
      this.hostiles.hostiles.filter((h) => this.gates.speedBumpLeft(h.id) > 0),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearBump ? this.gates.speedBumpLeft(nearBump.id) : 0;
  }

  /**
   * Sesgo de tono para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `speech.getMoodBias` (DIALOGUE_REACH).
   * Un solo store: `SpeechDirector.getMoodBias` — no es un TTL.
   */
  private hudMoodBias(): PossessionTone | null {
    if (this.dialogue.open && this.dialogue.target) {
      return this.speech.getMoodBias(this.dialogue.target);
    }
    const nearBiased = nearestPossessed(
      this.hostiles.hostiles.filter((h) => this.speech.getMoodBias(h.id) != null),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearBiased ? this.speech.getMoodBias(nearBiased.id) : null;
  }

  /**
   * Tono de ShortMemory para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `memory.toneBias` (DIALOGUE_REACH).
   * Un solo store: `ShortMemory.toneBias` — no es speech mood.
   */
  private hudMemoryTone(): PossessionTone | null {
    if (this.dialogue.open && this.dialogue.target) {
      return this.memory.toneBias(this.dialogue.target) ?? null;
    }
    const nearRemembered = nearestPossessed(
      this.hostiles.hostiles.filter((h) => this.memory.toneBias(h.id) != null),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearRemembered
      ? this.memory.toneBias(nearRemembered.id) ?? null
      : null;
  }

  /**
   * Últimos tags de gate para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `gates.lastApplied` (DIALOGUE_REACH).
   * Un solo store: `DialogueBehaviorGates.lastApplied` — no es TTL.
   */
  private hudLastApplied(): readonly GateTag[] {
    if (this.dialogue.open && this.dialogue.target) {
      return this.gates.lastApplied(this.dialogue.target);
    }
    const nearGated = nearestPossessed(
      this.hostiles.hostiles.filter(
        (h) => this.gates.lastApplied(h.id).length > 0,
      ),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearGated ? this.gates.lastApplied(nearGated.id) : [];
  }

  /**
   * Últimos tags rechazados para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `gates.lastRejected` (DIALOGUE_REACH).
   * Un solo store: `DialogueBehaviorGates.lastRejected` — no es TTL.
   */
  private hudLastRejected(): readonly GateTag[] {
    if (this.dialogue.open && this.dialogue.target) {
      return this.gates.lastRejected(this.dialogue.target);
    }
    const nearRejected = nearestPossessed(
      this.hostiles.hostiles.filter(
        (h) => this.gates.lastRejected(h.id).length > 0,
      ),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearRejected ? this.gates.lastRejected(nearRejected.id) : [];
  }

  /**
   * Fuente de la última línea para el HUD: target del panel si está abierto,
   * si no el poseído más cercano con `speech.getActive.lineSource` (DIALOGUE_REACH).
   * Un solo store: `SpeechDirector.getActive` — runtime, no persist.
   */
  private hudLineSource(): LineSource | null {
    if (this.dialogue.open && this.dialogue.target) {
      return this.speech.getActive(this.dialogue.target)?.lineSource ?? null;
    }
    const nearSourced = nearestPossessed(
      this.hostiles.hostiles.filter(
        (h) => this.speech.getActive(h.id)?.lineSource != null,
      ),
      this.player.x,
      this.player.y,
      DIALOGUE_REACH,
    );
    return nearSourced
      ? this.speech.getActive(nearSourced.id)?.lineSource ?? null
      : null;
  }

  /** +/- zoom iso: drain always; frustum + resize + HUD solo si aplica y cambió. */
  private applyIsoZoomInput(): void {
    const zoomIn = this.input.consumeZoomIn();
    const zoomOut = this.input.consumeZoomOut();
    if (!zoomInputApplies(this.gameOver)) return;
    const next = nextIsoZoom(this.isoFrustum, zoomIn, zoomOut);
    if (!next.changed) return;
    this.isoFrustum = next.frustum;
    this.resize();
    if (next.msg) this.lastLootMsg = next.msg;
    this.hudAcc = 1;
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const frustum = this.isoFrustum;
    const cam = this.view.camera;
    cam.left = -frustum * aspect;
    cam.right = frustum * aspect;
    cam.top = frustum;
    cam.bottom = -frustum;
    cam.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
