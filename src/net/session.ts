/**
 * Stub MP (F7 prep) — headless, sin sockets.
 * Facade de snapshot + loopback local para roundtrip de inputs.
 */
import type { HostileMode } from "../ai/hostile";
import type { HostileSim } from "../ai/hostile";
import type { GateTag } from "../possession/gates";
import type { PossessionTone } from "../possession/lineBank";
import type { LineSource } from "../possession/llmBridge";

/** Input de cliente → host (stub: solo move). */
export interface NetInput {
  /** Secuencia monótona del cliente. */
  seq: number;
  /** Delta de movimiento deseado (tiles / tick stub). */
  dx: number;
  dy: number;
}

/** Hostile en el wire (mínimo). */
export interface NetHostileSnap {
  id: string;
  x: number;
  y: number;
  mode: HostileMode;
}

/** Puerta en el wire. */
export interface NetDoorSnap {
  x: number;
  y: number;
  open: boolean;
}

/** Barricada (tile kind) en el wire. */
export interface NetBarricadeSnap {
  x: number;
  y: number;
}

/** Contenedor compacto — stacks { id, qty } con qty > 0. */
export interface NetContainerSnap {
  id: string;
  x: number;
  y: number;
  /** stacks compactos { id, qty }[] — ItemId string */
  slots: { id: string; qty: number }[];
}

/**
 * Possession gated en el wire (efectos ya validados).
 * No incluye intents crudos del cliente.
 */
export interface NetPossessionSnap {
  id: string;
  /** 0..100 */
  trust: number;
  /** TTL gate pacify restantes (s). */
  pacifiedLeft: number;
  speedBumpLeft: number;
  /** 1 si inactivo. */
  speedBumpMul: number;
  /** Attitude efectiva (trust OR TTL). */
  pacified: boolean;
  /** Últimos tags aplicados (`gates.lastApplied`); omitido si vacío. */
  lastApplied?: GateTag[];
  /** Últimos tags rechazados (`gates.lastRejected`); omitido si vacío. */
  lastRejected?: GateTag[];
  /**
   * Última línea ya validada (`gates.gateLine`); omitido si vacío.
   * No se reformatea — cap GATE_LINE_MAX_LEN.
   */
  gateLine?: string;
  /**
   * Sesgo de habla ya validado (`speech.getMoodBias`); omitido si vacío.
   * Distinto de ShortMemory.toneBias.
   */
  moodBias?: PossessionTone;
  /**
   * Sesgo de tono ya validado (`memory.toneBias`); omitido si vacío.
   * Distinto de speech moodBias.
   */
  toneBias?: PossessionTone;
  /**
   * Resumen compacto ya validado (`formatMemorySummary` / `memory.recent`);
   * omitido si vacío. Distinto de toneBias. Cap MEMORY_SUMMARY_MAX_LEN.
   */
  memorySummary?: string;
  /**
   * Fuente de la última línea ya validada (`speech.getActive.lineSource`);
   * omitido si vacío / sin utterance. Distinto de memorySummary.
   * Wire: `llm` | `bank` — no se mapea a STUB/BANCO.
   */
  lineSource?: LineSource;
  /**
   * Última línea hablada ya validada (`speech.getActive.line`);
   * omitido si vacío / sin utterance. Distinto de lineSource y de gateLine.
   * Cap LLM_LINE_MAX_LEN via compactLlmLine.
   */
  line?: string;
  /**
   * Tono de la utterance actual ya validado (`speech.getActive.tone`);
   * omitido si vacío / sin utterance. Distinto de moodBias, toneBias y line.
   */
  tone?: PossessionTone;
}

/**
 * Snapshot autoritativo legible.
 * No incluye FOV/render — solo sim.
 */
export interface NetSnapshot {
  /** Último seq de input aplicado. */
  seq: number;
  /**
   * Ack de inputs: último seq aplicado en host.
   * En este stub `ack === seq` (alias claro en wire).
   */
  ack: number;
  playerX: number;
  playerY: number;
  /** Fase del día [0, 1) del GameClock. */
  clockPhase: number;
  hostiles: NetHostileSnap[];
  /** hostiles.length (redundante a propósito para asserts de wire). */
  hostileCount: number;
  doors: NetDoorSnap[];
  barricades: NetBarricadeSnap[];
  containers: NetContainerSnap[];
  /** Poseídos: trust + TTLs gated + lastApplied / lastRejected / gateLine / moodBias / toneBias / memorySummary / lineSource / line / tone (default []). */
  possession: NetPossessionSnap[];
}

/** Fuente mínima para serializar (HostileSim o lista ya recortada). */
export interface NetSnapshotSource {
  playerX: number;
  playerY: number;
  clockPhase: number;
  hostiles: HostileSim | ReadonlyArray<{
    id: string;
    x: number;
    y: number;
    mode: HostileMode;
  }>;
  seq?: number;
  /** Alias de seq — si solo viene ack, se usa como seq. */
  ack?: number;
  /** Ya listos, o omitir → arrays vacíos (compat tests viejos). */
  doors?: ReadonlyArray<NetDoorSnap>;
  barricades?: ReadonlyArray<NetBarricadeSnap>;
  containers?: ReadonlyArray<NetContainerSnap>;
  possession?: ReadonlyArray<NetPossessionSnap>;
}

function listHostiles(
  source: NetSnapshotSource["hostiles"],
): NetHostileSnap[] {
  const arr =
    "hostiles" in source
      ? source.hostiles
      : source;
  return arr.map((h) => ({
    id: h.id,
    x: h.x,
    y: h.y,
    mode: h.mode,
  }));
}

/** Facade: serializa snapshot leíble desde coords + HostileSim (o lista). */
export function buildNetSnapshot(source: NetSnapshotSource): NetSnapshot {
  const hostiles = listHostiles(source.hostiles);
  // ack === seq: último input aplicado (claridad en wire).
  const seq = source.seq ?? source.ack ?? 0;
  return {
    seq,
    ack: seq,
    playerX: source.playerX,
    playerY: source.playerY,
    clockPhase: source.clockPhase,
    hostiles,
    hostileCount: hostiles.length,
    doors: source.doors ? source.doors.map((d) => ({ ...d })) : [],
    barricades: source.barricades
      ? source.barricades.map((b) => ({ ...b }))
      : [],
    containers: source.containers
      ? source.containers.map((c) => ({
          id: c.id,
          x: c.x,
          y: c.y,
          slots: c.slots.map((s) => ({ id: s.id, qty: s.qty })),
        }))
      : [],
    possession: source.possession
      ? source.possession.map((p) => ({ ...p }))
      : [],
  };
}

/**
 * Loopback 1P: almacena inputs, tick aplica move stub, getSnapshot desde estado mínimo.
 * No toca Game / no red.
 */
export class LocalLoopbackSession {
  private playerX: number;
  private playerY: number;
  private clockPhase: number;
  private hostiles: NetHostileSnap[];
  private doors: NetDoorSnap[];
  private barricades: NetBarricadeSnap[];
  private containers: NetContainerSnap[];
  private possession: NetPossessionSnap[];
  private pending: NetInput[] = [];
  private lastSeq = 0;
  /** Velocidad stub (unidades / segundo) al aplicar dx/dy normalizados. */
  readonly moveSpeed: number;

  constructor(
    initial: {
      playerX: number;
      playerY: number;
      clockPhase?: number;
      hostiles?: ReadonlyArray<NetHostileSnap>;
      doors?: ReadonlyArray<NetDoorSnap>;
      barricades?: ReadonlyArray<NetBarricadeSnap>;
      containers?: ReadonlyArray<NetContainerSnap>;
      possession?: ReadonlyArray<NetPossessionSnap>;
    },
    opts?: { moveSpeed?: number },
  ) {
    this.playerX = initial.playerX;
    this.playerY = initial.playerY;
    this.clockPhase = initial.clockPhase ?? 0;
    this.hostiles = (initial.hostiles ?? []).map((h) => ({ ...h }));
    this.doors = (initial.doors ?? []).map((d) => ({ ...d }));
    this.barricades = (initial.barricades ?? []).map((b) => ({ ...b }));
    this.containers = (initial.containers ?? []).map((c) => ({
      id: c.id,
      x: c.x,
      y: c.y,
      slots: c.slots.map((s) => ({ id: s.id, qty: s.qty })),
    }));
    this.possession = (initial.possession ?? []).map((p) => ({ ...p }));
    this.moveSpeed = opts?.moveSpeed ?? 3;
  }

  /** Encola input; no tira con dx/dy raros. */
  pushInput(input: NetInput): void {
    this.pending.push({
      seq: input.seq,
      dx: Number.isFinite(input.dx) ? input.dx : 0,
      dy: Number.isFinite(input.dy) ? input.dy : 0,
    });
  }

  /**
   * Aplica inputs pendientes (move stub) y avanza phase de reloj de forma trivial.
   * `dt` en segundos.
   */
  tick(dt: number): void {
    const step = Math.max(0, dt);
    while (this.pending.length > 0) {
      const inp = this.pending.shift()!;
      const len = Math.hypot(inp.dx, inp.dy);
      if (len > 0) {
        const scale = (this.moveSpeed * step) / len;
        this.playerX += inp.dx * scale;
        this.playerY += inp.dy * scale;
      }
      this.lastSeq = Math.max(this.lastSeq, inp.seq);
    }
    // Phase stub: avanza como si dayLength=60s (solo para roundtrip).
    if (step > 0) {
      this.clockPhase = (this.clockPhase + step / 60) % 1;
    }
  }

  getSnapshot(): NetSnapshot {
    return buildNetSnapshot({
      playerX: this.playerX,
      playerY: this.playerY,
      clockPhase: this.clockPhase,
      hostiles: this.hostiles,
      seq: this.lastSeq,
      doors: this.doors,
      barricades: this.barricades,
      containers: this.containers,
      possession: this.possession,
    });
  }

  /** Sustituye hostiles del stub (p.ej. tras leer HostileSim). */
  setHostilesFromSim(sim: HostileSim): void {
    this.hostiles = listHostiles(sim);
  }

  /** Stub: setea / actualiza puerta en (x,y). */
  setDoor(x: number, y: number, open: boolean): void {
    const i = this.doors.findIndex((d) => d.x === x && d.y === y);
    if (i >= 0) this.doors[i] = { x, y, open };
    else this.doors.push({ x, y, open });
  }

  /** Stub: reemplaza lista de contenedores del snapshot. */
  setContainers(containers: ReadonlyArray<NetContainerSnap>): void {
    this.containers = containers.map((c) => ({
      id: c.id,
      x: c.x,
      y: c.y,
      slots: c.slots.map((s) => ({ id: s.id, qty: s.qty })),
    }));
  }

  /** Stub: reemplaza barricadas. */
  setBarricades(barricades: ReadonlyArray<NetBarricadeSnap>): void {
    this.barricades = barricades.map((b) => ({ ...b }));
  }

  /** Stub: reemplaza possession gated del snapshot. */
  setPossession(list: ReadonlyArray<NetPossessionSnap>): void {
    this.possession = list.map((p) => ({ ...p }));
  }
}
