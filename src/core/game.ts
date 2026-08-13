import * as THREE from "three";
import { GameLoop } from "./loop";
import { Input } from "./input";
import { GameClock } from "./clock";
import {
  applySave,
  browserStorage,
  readSave,
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
  zoomInFrustum,
  zoomOutFrustum,
} from "../render/cameraConfig";
import {
  CONTAINER_REACH,
  containerHasLoot,
  inventorySummary,
  buildInventoryPanelData,
  findSlot,
  removeFromSlot,
  canRefillFromRain,
  tryRefillFromRain,
  hasFlashlight,
  fovRadiusWithFlashlight,
  torchLightIntensity,
  getItemDef,
  splitStack,
  mergeStack,
  swapInventoryStacks,
  takeFromSlot,
  dropOnTile,
  dropQty,
  dropSourceIndex,
  dropToastLabel,
  dropTargetTile,
  type ContainerRegistry,
  type ItemId,
} from "../items";
import {
  HostileSim,
  defaultHostileSpawns,
  defaultPossessedSpawns,
  SPAWN_GRACE_SECONDS,
  tickSpawnGrace,
  hostileDamageAllowed,
} from "../ai";
import { tryApplyTouchKnockback } from "../combat";
import { tileKey } from "../world/los";
import { NoiseBus, type NoiseEvent } from "../world/noise";
import { shouldShowNoiseRing } from "../render/noiseRings";
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
  StubLlmBridge,
  type DialogueIntent,
  type LlmBridge,
} from "../possession";
import { DEFAULT_CONFIG, DEFAULT_DAY_LENGTH_SEC, type GameConfig } from "./config";
import {
  createSpeechOverlay,
  createDialoguePanel,
  createMoodlesHud,
  createHotbarHud,
  createLootFloaterHud,
  createInventoryPanel,
  hotbarSlots,
  hotbarInspectLabel,
  inventoryInspectLabel,
  HOTBAR_SIZE,
  clampHotbarIndex,
  stepHotbarIndex,
  swapHotbarStacks,
  formatHudStatus,
  HIT_FLASH_PEAK,
  createHitFlash,
  triggerHitFlash,
  tickHitFlash,
  type SpeechOverlay,
  type DialoguePanel,
  type MoodlesHud,
  type HotbarHud,
  type LootFloaterHud,
  type InventoryPanel,
  type HitFlash,
} from "../ui";
import { buildHudMoodles } from "../actors/moodles";
import { trySleep, isSafehouseHint, nearBed, hostileNearby } from "../actors/sleep";
import {
  createAmbientBus,
  tickAmbient,
  describeAmbient,
  toggleAmbientMute,
  createFootstepsBus,
  tickFootsteps,
  describeFootsteps,
  createFootstepPlayer,
  syncFootstepPlayer,
  createAmbientPlayer,
  syncAmbientPlayer,
  createCombatPlayer,
  playMelee,
  playHit,
  playGun,
  playDryFire,
  createInteractPlayer,
  playDoor,
  playLoot,
  playUse,
  createSpeechPlayer,
  playSpeech,
  createHeartbeatBus,
  tickHeartbeat,
  createHeartbeatPlayer,
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
  /** Tras spawnThreats/reinicio: sin daño touch al player. */
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
    this.loop = new GameLoop((dt) => this.tick(dt));

    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    this.resize();
    this.refreshHud(true);
  }

  start(): void {
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
    this.gameOver = !this.player.alive;
    if (this.player.alive) {
      this.view.clearPlayerAction();
    } else {
      this.view.triggerPlayerAction("death");
    }
    if (!hasFlashlight(this.player.inventory)) this.flashlightOn = false;
    this.noise.clear();
    this.refreshViewAfterLoad();
    this.lastLootMsg = "cargado";
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
    this.spawnThreats();
    this.clock = new GameClock(DEFAULT_DAY_LENGTH_SEC);
    this.weather = new WeatherSystem({ initial: "drizzle" });
    this.gameOver = false;
    this.showInvDetail = false;
    this.lastInvUseSlot = null;
    this.lastInvUseAt = Number.NEGATIVE_INFINITY;
    this.lastInvIndex = null;
    this.flashlightOn = false;
    this.needsDamageMsgCd = 0;
    this.hitFlash.intensity = 0;
    this.syncHitFlashOverlay();
    this.syncInventoryPanel();
    this.lastLootMsg = "reinicio";
    this.view.dispose();
    this.view = createWorldView(this.map, this.containers);
    this.view.clearPlayerAction();
    this.view.syncVisibleChunks(this.player.x, this.player.y);
    this.applyFov();
    this.view.syncPlayer(this.player.x, this.player.y);
    this.syncHostileView();
    this.syncSpeechOverlay();
    this.syncDialoguePanel();
    this.syncLighting();
    this.view.followCamera(this.player.x, this.player.y);
  }

  /** Tras applySave: remesh chunks, puertas, FOV, player, día/noche. */
  private refreshViewAfterLoad(): void {
    this.view.forceReloadVisible(this.player.x, this.player.y);
    this.map.forEach((x, y, tile) => {
      if (tile.kind === "door") this.view.syncDoor(x, y, tile.open);
    });
    this.applyFov();
    this.view.syncPlayer(this.player.x, this.player.y);
    this.syncHostileView();
    this.syncSpeechOverlay();
    this.syncLighting();
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
    const torch = torchLightIntensity(
      this.flashlightOn,
      has,
      this.clock.daylight,
    );
    this.view.syncTorchLight(this.player.x, this.player.y, torch);
  }

  /** Partículas de lluvia (ocultas indoor o si clear). */
  private syncRainVisual(dt: number): void {
    const indoor = isIndoor(this.map, this.player.x, this.player.y);
    const inten =
      indoor || !this.weather.isRaining ? 0 : this.weather.intensity;
    this.view.syncRain(this.player.x, this.player.y, inten, dt);
  }

  /** Césped wind outdoor cerca del player (rebuild por tile). */
  private syncGrassVisual(dt: number): void {
    this.view.syncGrass(this.player.x, this.player.y, dt);
  }

  private applyFov(): void {
    const has = hasFlashlight(this.player.inventory);
    if (!has) this.flashlightOn = false;
    const radius = fovRadiusWithFlashlight(
      DEFAULT_FOV_RADIUS,
      this.flashlightOn,
      has,
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

  /** Hostiles solo visibles si su tile está en FOV del player. */
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
      dt,
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
            visible: inFov && !!active,
          };
        }),
      this.view.camera,
      this.renderer.domElement,
    );
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
    });
  }

  private async handleDialogueChoice(intent: DialogueIntent): Promise<void> {
    const id = this.dialogue.target;
    if (!id || this.gameOver) return;
    const result = await applyDialogueChoiceAsync(
      this.trust,
      id,
      intent,
      Math.random,
      this.memory,
      { enabled: this.config.llm.enabled, bridge: this.llmBridge },
    );
    // Ofrecer: detectar comida antes de validar gates (diálogo propone; código valida)
    const inv = this.player.inventory;
    const hasOfferFood =
      findSlot(inv, "hot_meal") >= 0 || findSlot(inv, "canned_food") >= 0;
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
      this.dialogue.close();
      this.dialogueLastLine = null;
      this.dialogueLastTone = null;
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
    this.lastLootMsg = `diálogo ${near.id}`;
    this.hudAcc = 1;
    this.syncDialoguePanel();
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

  private enterGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.lastLootMsg = "HAS MUERTO";
    this.hudAcc = 1;
    this.view.triggerPlayerAction("death");
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
      if (
        tryRefillFromRain(
          this.weather.isRaining,
          outdoor,
          this.player.inventory,
        )
      ) {
        playUse(this.interactPlayer, this.ambient.muted);
        this.lastLootMsg = RAIN_FILL_MSG;
        this.lootToast.show(this.lastLootMsg);
        this.hudAcc = 1;
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
      this.lootToast.show(this.lastLootMsg);
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
      if (
        tryRefillFromRain(
          this.weather.isRaining,
          outdoor,
          this.player.inventory,
        )
      ) {
        playUse(this.interactPlayer, this.ambient.muted);
        this.lastLootMsg = RAIN_FILL_MSG;
        this.lootToast.show(this.lastLootMsg);
        this.hudAcc = 1;
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
      this.lootToast.show(this.lastLootMsg);
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
      this.lootToast.show(label);
      this.hudAcc = 1;
    } else {
      this.lastLootMsg = "no se puede partir";
      this.lootToast.show(this.lastLootMsg);
      this.hudAcc = 1;
    }
  }

  private toastMerge(index: number): void {
    const merged = mergeStack(this.player.inventory, index);
    if (merged) {
      const label = `juntaste ${getItemDef(merged.id as ItemId).name} ×${merged.destQty}`;
      this.lastLootMsg = label;
      this.lootToast.show(label);
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
    if (slot !== null) {
      this.hotbarSelected = slot;
      this.hudAcc = 1;
    }
    const wheel = this.input.consumeHotbarWheel();
    if (wheel !== null) {
      this.hotbarSelected = stepHotbarIndex(this.hotbarSelected, wheel);
      this.hudAcc = 1;
    }
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
    if (dragged) {
      if (swapHotbarStacks(this.player.inventory, dragged.from, dragged.to)) {
        this.hotbarSelected = dragged.to;
        this.hudAcc = 1;
      }
    } else if (
      clicked !== null &&
      hotbarSplitIdx === null &&
      hotbarMergeIdx === null
    ) {
      this.hotbarSelected = clicked;
      this.hudAcc = 1;
    }

    // Game-over: solo R reinicia / F9 carga (F5 no aplica)
    if (this.gameOver || !this.player.alive) {
      if (!this.gameOver) this.enterGameOver();
      if (this.input.consumeRestOrRestart()) {
        this.softReset();
        this.hudAcc = 1;
      } else if (this.input.consumeLoad()) {
        this.doLoad();
        this.hudAcc = 1;
      } else if (this.input.consumeSave()) {
        this.doSave();
        this.hudAcc = 1;
      }
      if (this.input.consumeHelp()) {
        this.showHelp = !this.showHelp;
        this.hudAcc = 1;
      }
      if (this.input.consumeMute()) {
        toggleAmbientMute(this.ambient);
        this.hudAcc = 1;
      }
      this.input.endFrame();
      this.syncAmbient(dt);
      this.syncHeartbeat(dt);
      this.syncFootsteps(dt, 0, false);
      this.syncLighting();
      this.syncRainVisual(dt);
    this.syncGrassVisual(dt);
      this.view.tickTracers(dt);
      this.view.tickLootFloaters(dt);
    this.view.tickNoiseRings(dt);
      this.tickHitFlashOverlay(dt);
      this.view.syncPlayer(this.player.x, this.player.y);
      this.view.syncLootFocus(
        this.player.x,
        this.player.y,
        dt,
        this.emptyLootIds(),
      );
      this.view.syncDoorFocus(this.player.x, this.player.y, dt);
      this.view.syncBedFocus(this.player.x, this.player.y, dt);
      // Mixer must keep ticking during freeze so death LoopOnce can play/clamp.
      this.view.tickPlayerLoco(dt, false, false);
      this.renderer.render(this.view.scene, this.view.camera);
      this.syncSpeechOverlay();
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
      if (sprint) this.showNoiseRing(this.noise.emitRun(this.player.x, this.player.y));
      else this.noise.emitWalk(this.player.x, this.player.y);
    }

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
    if (!this.player.alive) {
      this.enterGameOver();
      this.input.endFrame();
      this.syncHeartbeat(dt);
      this.syncHostileView(dt);
      this.syncSpeechOverlay();
      this.tickHitFlashOverlay(dt);
      this.view.syncPlayer(this.player.x, this.player.y);
      this.view.syncLootFocus(
        this.player.x,
        this.player.y,
        dt,
        this.emptyLootIds(),
      );
      this.view.syncDoorFocus(this.player.x, this.player.y, dt);
      this.view.syncBedFocus(this.player.x, this.player.y, dt);
      this.view.tickPlayerLoco(dt, false, false);
      this.renderer.render(this.view.scene, this.view.camera);
      this.refreshHud(true);
      return;
    }

    if (this.input.consumeAttack()) {
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

    if (this.input.consumeShoot()) {
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
            }
          }
        }
        this.lastLootMsg = shot.message;
        this.hudAcc = 1;
      }
    }

    if (this.input.consumeInteract()) {
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
          this.view.spawnLootFloater(lootLabel, this.player.x, this.player.y);
          this.lootToast.show(lootLabel);
          this.lastLootMsg = lootLabel;
          this.hudAcc = 1; // forzar refresh
          this.refreshNearestLootMarker();
        }
      }
    }
    const loot = this.input.consumeLoot();
    if (loot) {
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
        this.view.spawnLootFloater(lootLabel, this.player.x, this.player.y);
        this.lootToast.show(lootLabel);
        this.lastLootMsg = lootLabel;
        this.hudAcc = 1;
        this.refreshNearestLootMarker();
      }
    }
    const drop = this.input.consumeDrop();
    if (drop) {
      const i = dropSourceIndex(
        this.showInvDetail,
        this.lastInvIndex,
        this.hotbarSelected,
        this.player.inventory.slots,
      );
      const stack = this.player.inventory.slots[i];
      const qty = dropQty(stack?.qty, drop.whole);
      const taken = takeFromSlot(this.player.inventory, i, qty);
      if (taken) {
        const { tx, ty } = dropTargetTile(
          this.player.x,
          this.player.y,
          this.player.facingX,
          this.player.facingY,
          (x, y) => this.map.walkable(x, y),
        );
        const id = `drop-${tx}-${ty}-${taken.id}`;
        const c = dropOnTile(this.containers, tx, ty, taken, id);
        this.view.addLootMarker(c.id, c.x, c.y, c.name);
        playLoot(this.interactPlayer, this.ambient.muted);
        const label = dropToastLabel(getItemDef(taken.id).name, taken.qty);
        this.lootToast.show(label);
        this.lastLootMsg = label;
        this.hudAcc = 1;
      }
    }
    if (inspected !== null) {
      this.hotbarSelected = inspected;
      const label = hotbarInspectLabel(
        hotbarSlots(this.player.inventory)[inspected]!,
      );
      this.lastLootMsg = label;
      this.lootToast.show(label);
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
      this.lootToast.show(label);
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
    if (this.input.consumeUse()) {
      const outdoor = !isIndoor(this.map, this.player.x, this.player.y);
      if (
        canRefillFromRain(
          this.weather.isRaining,
          outdoor,
          this.player.inventory,
        )
      ) {
        if (
          tryRefillFromRain(
            this.weather.isRaining,
            outdoor,
            this.player.inventory,
          )
        ) {
          playUse(this.interactPlayer, this.ambient.muted);
          this.lastLootMsg = RAIN_FILL_MSG;
          this.lootToast.show(this.lastLootMsg);
          this.hudAcc = 1;
        }
      } else {
        this.useHotbarSlot(this.hotbarSelected);
      }
    }
    if (this.input.consumeInventoryToggle()) {
      this.showInvDetail = !this.showInvDetail;
      if (!this.showInvDetail) this.lastInvIndex = null;
      this.hudAcc = 1;
    }
    if (this.input.consumeHelp()) {
      this.showHelp = !this.showHelp;
      this.hudAcc = 1;
    }
    if (this.input.consumeMute()) {
      toggleAmbientMute(this.ambient);
      this.hudAcc = 1;
    }
    if (this.input.consumeRestOrRestart()) {
      this.player.rest();
    }
    if (this.input.consumeSleep()) {
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
    if (this.input.consumeBuild()) {
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
    if (this.input.consumeCraft()) {
      if (this.player.tryCraftBandage()) {
        this.lastLootMsg = "vendaje craftado";
        this.hudAcc = 1;
      } else {
        this.lastLootMsg = "falta tela/chatarra";
        this.hudAcc = 1;
      }
    }
    if (this.input.consumeCook()) {
      const cooked = this.player.tryCook(this.map);
      if (cooked?.ok) {
        this.lastLootMsg = "cocinaste un plato caliente";
        this.hudAcc = 1;
      } else if (cooked && !cooked.ok) {
        this.lastLootMsg = cooked.message;
        this.hudAcc = 1;
      }
    }
    if (this.input.consumeTalk()) {
      this.tryToggleDialogue();
    }
    if (this.input.consumeCancel() && this.dialogue.open) {
      this.dialogue.close();
      this.dialogueLastLine = null;
      this.dialogueLastTone = null;
    }
    if (this.dialogue.open) {
      this.dialogue.validate(
        this.hostiles.hostiles,
        this.player.x,
        this.player.y,
        DIALOGUE_REACH,
      );
      if (!this.dialogue.open) {
        this.dialogueLastLine = null;
        this.dialogueLastTone = null;
      }
    }
    if (this.input.consumeFlashlightToggle()) {
      if (!hasFlashlight(this.player.inventory)) {
        this.flashlightOn = false;
        this.lastLootMsg = "sin linterna";
      } else {
        this.flashlightOn = !this.flashlightOn;
        this.lastLootMsg = this.flashlightOn ? "linterna on" : "linterna off";
      }
      this.hudAcc = 1;
    }
    if (this.input.consumeSave()) {
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
    this.view.syncLootFocus(
      this.player.x,
      this.player.y,
      dt,
      this.emptyLootIds(),
    );
    this.view.syncDoorFocus(this.player.x, this.player.y, dt);
    this.view.syncBedFocus(this.player.x, this.player.y, dt);
    {
      const ax = this.input.axes;
      const moving = ax.x !== 0 || ax.z !== 0;
      // Ejes vivos (diagonal continua) para yaw GLB; facing cardinal sigue
      // en player para melee / barricada / disparo.
      this.view.tickPlayerLoco(dt, moving, sprint, ax.x, ax.z);
    }
    this.syncHostileView(dt);
    this.syncAmbient(dt);
    this.syncHeartbeat(dt);
    this.syncFootsteps(dt, moved, sprint);
    this.syncLighting();
    this.syncRainVisual(dt);
    this.syncGrassVisual(dt);
    this.view.tickTracers(dt);
    this.view.tickLootFloaters(dt);
      this.view.tickNoiseRings(dt);
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

  /** Re-pinta el nameplate del contenedor cercano (qty tras G/E/Shift+G). */
  private refreshNearestLootMarker(): void {
    const c = this.containers.nearest(
      this.player.x,
      this.player.y,
      CONTAINER_REACH,
      this.lootPreferTile(),
    );
    if (!c) return;
    this.view.addLootMarker(c.id, c.x, c.y, c.name);
  }

  /** Overlay `#hit-flash`: decay + opacity = intensity × peak. */
  private tickHitFlashOverlay(dt: number): void {
    tickHitFlash(this.hitFlash, dt);
    this.syncHitFlashOverlay();
  }

  private syncHitFlashOverlay(): void {
    if (!this.hitFlashEl) return;
    this.hitFlashEl.style.opacity = String(
      this.hitFlash.intensity * HIT_FLASH_PEAK,
    );
  }

  private syncInventoryPanel(): void {
    const open = this.showInvDetail && !this.gameOver;
    this.inventoryPanel.sync({
      open,
      data: buildInventoryPanelData(this.player.inventory),
      selectedIndex: open ? this.lastInvIndex : null,
    });
  }


  /** Low-HP heartbeat: tick headless + beep si `{beat}` y no mute. */
  private syncHeartbeat(dt: number): void {
    const { beat } = tickHeartbeat(this.heartbeat, this.player.health, dt);
    if (beat) playHeartbeat(this.heartbeatPlayer, this.ambient.muted);
  }

  /** Ambient stub + WebAudio layers; mute → gains 0. */
  private syncAmbient(dt: number): void {
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
      dt,
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
      this.hud.classList.toggle("hud-help", this.showHelp);
      this.moodlesHud.sync(this.buildPlayerHudMoodles());
      this.hotbarHud.sync(hotbarSlots(this.player.inventory), this.hotbarSelected);
      this.inventoryPanel.sync({
        open: false,
        data: buildInventoryPanelData(this.player.inventory),
      });
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
        ? `cerca: ${near.name} [${inventorySummary(near.inv)}] G/E loot`
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
    const dlgHint = this.dialogue.open
      ? `diálogo ${this.dialogue.target}`
      : undefined;
    this.moodlesHud.sync(this.buildPlayerHudMoodles());
    this.hotbarHud.sync(hotbarSlots(this.player.inventory), this.hotbarSelected);
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
    this.hud.classList.toggle("hud-help", this.showHelp);
  }

  /** +/- zoom iso: ajusta frustum y reaplica proyección. */
  private applyIsoZoomInput(): void {
    let changed = false;
    if (this.input.consumeZoomIn()) {
      this.isoFrustum = zoomInFrustum(this.isoFrustum);
      changed = true;
    }
    if (this.input.consumeZoomOut()) {
      this.isoFrustum = zoomOutFrustum(this.isoFrustum);
      changed = true;
    }
    if (changed) this.resize();
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
