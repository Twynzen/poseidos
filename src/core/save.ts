/**
 * Save/load mínimo (F2): player, needs, inventario, puertas, barricadas, contenedores, clock.
 * F5: possession runtime (trust / TTLs de gates / mood bias / ShortMemory) — campo opcional.
 * Headless (JSON string / storage abstracto) + localStorage en browser.
 */

import type { GameClock } from "./clock";
import type { PlayerSim } from "../actors/player";
import type { NeedsState } from "../actors/needs";
import { createNeeds } from "../actors/needs";
import { MAX_HEALTH } from "../actors/body";
import type { TileMap } from "../world/tilemap";
import { makeBarricade, makeFloor } from "../world/tile";
import type { ContainerRegistry } from "../items";
import type { ItemId, ItemStack, Inventory } from "../items";
import { ITEM_DEFS } from "../items";
import type { TrustLedger } from "../possession/trust";
import type { DialogueBehaviorGates } from "../possession/gates";
import type { SpeechDirector } from "../possession/speech";
import type { ShortMemory } from "../possession/memory";
import {
  applyPossession,
  capturePossession,
  emptyPossession,
  normalizePossession,
  type SavePossession,
} from "../possession/persist";

export const SAVE_VERSION = 1;
export const SAVE_SLOT_KEY = "poseidos.save.slot0";

export interface SaveDoor {
  x: number;
  y: number;
  open: boolean;
}

export interface SaveBarricade {
  x: number;
  y: number;
}

export interface SaveContainer {
  id: string;
  slots: ItemStack[];
  maxSlots: number;
  maxWeight: number;
}

export interface SaveGame {
  v: number;
  clock: { elapsed: number };
  player: {
    x: number;
    y: number;
    needs: NeedsState;
    /** Salud 0–100 (opcional en saves antiguos → 100). */
    health: number;
    inventory: {
      slots: ItemStack[];
      maxSlots: number;
      maxWeight: number;
    };
  };
  doors: SaveDoor[];
  /** Barricadas colocadas (tiles floor → barricade). */
  barricades: SaveBarricade[];
  containers: SaveContainer[];
  /** Runtime possession (opcional en saves antiguos → vacío). */
  possession: SavePossession;
}

/** Storage mínimo (localStorage o memoria para tests). */
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): SaveStorage & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>();
  return {
    data,
    getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

/** localStorage si existe (browser); null en Node/tests. */
export function browserStorage(): SaveStorage | null {
  try {
    if (typeof globalThis.localStorage === "undefined") return null;
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export interface SaveWorld {
  clock: GameClock;
  player: PlayerSim;
  map: TileMap;
  containers: ContainerRegistry;
  /** Si falta, capture escribe possession vacío y apply no toca ledgers. */
  possession?: {
    trust: TrustLedger;
    gates: DialogueBehaviorGates;
    speech: SpeechDirector;
    memory: ShortMemory;
  };
}

/** Captura estado mínimo serializable. */
export function captureSave(world: SaveWorld): SaveGame {
  const doors: SaveDoor[] = [];
  const barricades: SaveBarricade[] = [];
  world.map.forEach((x, y, tile) => {
    if (tile.kind === "door") {
      doors.push({ x, y, open: tile.open });
    } else if (tile.kind === "barricade") {
      barricades.push({ x, y });
    }
  });

  const containers: SaveContainer[] = world.containers.list.map((c) => ({
    id: c.id,
    slots: cloneSlots(c.inv.slots),
    maxSlots: c.inv.maxSlots,
    maxWeight: c.inv.maxWeight,
  }));

  return {
    v: SAVE_VERSION,
    clock: { elapsed: world.clock.elapsed },
    player: {
      x: world.player.x,
      y: world.player.y,
      needs: { ...world.player.needs },
      health: world.player.health,
      inventory: {
        slots: cloneSlots(world.player.inventory.slots),
        maxSlots: world.player.inventory.maxSlots,
        maxWeight: world.player.inventory.maxWeight,
      },
    },
    doors,
    barricades,
    containers,
    possession: world.possession
      ? capturePossession(
          world.possession.trust,
          world.possession.gates,
          world.possession.speech,
          world.possession.memory,
        )
      : emptyPossession(),
  };
}

/** Aplica un save sobre mundo ya creado (mismo barrio / ids). */
export function applySave(world: SaveWorld, save: SaveGame): void {
  const parsed = normalizeSave(save);
  world.clock.elapsed = parsed.clock.elapsed;

  world.player.x = parsed.player.x;
  world.player.y = parsed.player.y;
  const n = createNeeds(parsed.player.needs);
  world.player.needs.hunger = n.hunger;
  world.player.needs.thirst = n.thirst;
  world.player.needs.fatigue = n.fatigue;
  world.player.body.health = parsed.player.health;
  replaceInventory(world.player.inventory, parsed.player.inventory);

  for (const d of parsed.doors) {
    const t = world.map.getTile(d.x, d.y);
    if (t && t.kind === "door") t.open = d.open;
  }

  // Quitar barricadas actuales y restaurar las del save
  world.map.forEach((x, y, tile) => {
    if (tile.kind === "barricade") world.map.setTile(x, y, makeFloor());
  });
  for (const b of parsed.barricades) {
    const t = world.map.getTile(b.x, b.y);
    if (t && t.kind === "floor") world.map.setTile(b.x, b.y, makeBarricade());
  }

  for (const sc of parsed.containers) {
    const c = world.containers.list.find((x) => x.id === sc.id);
    if (!c) continue;
    replaceInventory(c.inv, {
      slots: sc.slots,
      maxSlots: sc.maxSlots,
      maxWeight: sc.maxWeight,
    });
  }

  if (world.possession) {
    applyPossession(
      world.possession.trust,
      world.possession.gates,
      world.possession.speech,
      world.possession.memory,
      parsed.possession,
    );
  }
}

export function saveToString(world: SaveWorld): string {
  return JSON.stringify(captureSave(world));
}

export function loadFromString(json: string): SaveGame {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("save: JSON inválido");
  }
  return normalizeSave(raw);
}

export function writeSave(
  storage: SaveStorage,
  world: SaveWorld,
  key: string = SAVE_SLOT_KEY,
): SaveGame {
  const save = captureSave(world);
  storage.setItem(key, JSON.stringify(save));
  return save;
}

export function readSave(
  storage: SaveStorage,
  key: string = SAVE_SLOT_KEY,
): SaveGame | null {
  const raw = storage.getItem(key);
  if (raw == null || raw === "") return null;
  return loadFromString(raw);
}

/** Escribe save capturado (ya serializado) — útil tras captureSave. */
export function persistSave(
  storage: SaveStorage,
  save: SaveGame,
  key: string = SAVE_SLOT_KEY,
): void {
  storage.setItem(key, JSON.stringify(normalizeSave(save)));
}

export function clearSave(
  storage: SaveStorage,
  key: string = SAVE_SLOT_KEY,
): void {
  storage.removeItem(key);
}

function cloneSlots(slots: readonly ItemStack[]): ItemStack[] {
  return slots.map((s) => ({ id: s.id, qty: s.qty }));
}

function replaceInventory(
  inv: Inventory,
  data: { slots: ItemStack[]; maxSlots: number; maxWeight: number },
): void {
  inv.maxSlots = data.maxSlots;
  inv.maxWeight = data.maxWeight;
  inv.slots.length = 0;
  for (const s of data.slots) {
    inv.slots.push({ id: s.id, qty: s.qty });
  }
}

function isItemId(id: unknown): id is ItemId {
  return typeof id === "string" && id in ITEM_DEFS;
}

function parseSlots(raw: unknown): ItemStack[] {
  if (!Array.isArray(raw)) throw new Error("save: slots inválidos");
  const out: ItemStack[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") throw new Error("save: stack inválido");
    const obj = s as Record<string, unknown>;
    if (!isItemId(obj.id)) throw new Error(`save: item desconocido ${String(obj.id)}`);
    const qty = Number(obj.qty);
    if (!Number.isFinite(qty) || qty < 0) throw new Error("save: qty inválida");
    if (qty === 0) continue;
    out.push({ id: obj.id, qty: Math.floor(qty) });
  }
  return out;
}

function normalizeSave(raw: unknown): SaveGame {
  if (!raw || typeof raw !== "object") throw new Error("save: objeto inválido");
  const o = raw as Record<string, unknown>;
  if (o.v !== SAVE_VERSION) {
    throw new Error(`save: versión no soportada (${String(o.v)})`);
  }
  const clock = o.clock as Record<string, unknown> | undefined;
  if (!clock || typeof clock.elapsed !== "number" || !Number.isFinite(clock.elapsed)) {
    throw new Error("save: clock inválido");
  }
  const player = o.player as Record<string, unknown> | undefined;
  if (!player || typeof player.x !== "number" || typeof player.y !== "number") {
    throw new Error("save: player inválido");
  }
  const needsRaw = player.needs as Record<string, unknown> | undefined;
  if (!needsRaw) throw new Error("save: needs inválidos");
  const needs = createNeeds({
    hunger: Number(needsRaw.hunger),
    thirst: Number(needsRaw.thirst),
    fatigue: Number(needsRaw.fatigue),
  });
  let health = MAX_HEALTH;
  if (player.health !== undefined) {
    const h = Number(player.health);
    if (!Number.isFinite(h)) throw new Error("save: health inválida");
    health = Math.max(0, Math.min(MAX_HEALTH, h));
  }
  const invRaw = player.inventory as Record<string, unknown> | undefined;
  if (!invRaw) throw new Error("save: inventory inválido");

  if (!Array.isArray(o.doors)) throw new Error("save: doors inválidas");
  const doors: SaveDoor[] = o.doors.map((d) => {
    const door = d as Record<string, unknown>;
    if (
      typeof door.x !== "number" ||
      typeof door.y !== "number" ||
      typeof door.open !== "boolean"
    ) {
      throw new Error("save: puerta inválida");
    }
    return { x: door.x, y: door.y, open: door.open };
  });

  // Barricadas opcionales (saves antiguos sin campo → [])
  let barricades: SaveBarricade[] = [];
  if (o.barricades !== undefined) {
    if (!Array.isArray(o.barricades)) throw new Error("save: barricades inválidas");
    barricades = o.barricades.map((b) => {
      const bar = b as Record<string, unknown>;
      if (typeof bar.x !== "number" || typeof bar.y !== "number") {
        throw new Error("save: barricada inválida");
      }
      return { x: bar.x, y: bar.y };
    });
  }

  if (!Array.isArray(o.containers)) throw new Error("save: containers inválidos");
  const containers: SaveContainer[] = o.containers.map((c) => {
    const cont = c as Record<string, unknown>;
    if (typeof cont.id !== "string") throw new Error("save: container id");
    return {
      id: cont.id,
      slots: parseSlots(cont.slots),
      maxSlots: Number(cont.maxSlots) || 6,
      maxWeight: Number(cont.maxWeight) || 40,
    };
  });

  // Possession opcional (saves antiguos sin campo → vacío). v=1 se mantiene.
  let possession: SavePossession = emptyPossession();
  if (o.possession !== undefined) {
    if (
      !o.possession ||
      typeof o.possession !== "object" ||
      Array.isArray(o.possession)
    ) {
      throw new Error("save: possession inválida");
    }
    possession = normalizePossession(o.possession);
  }

  return {
    v: SAVE_VERSION,
    clock: { elapsed: Math.max(0, clock.elapsed) },
    player: {
      x: player.x,
      y: player.y,
      needs,
      health,
      inventory: {
        slots: parseSlots(invRaw.slots),
        maxSlots: Number(invRaw.maxSlots) || 8,
        maxWeight: Number(invRaw.maxWeight) || 20,
      },
    },
    doors,
    barricades,
    containers,
    possession,
  };
}
