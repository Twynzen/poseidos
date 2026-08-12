/**
 * Lobby stub F7 — salas en memoria (2–4 slots), sin sockets / red.
 */

export const LOBBY_MIN_SLOTS = 2;
export const LOBBY_MAX_SLOTS = 4;

export interface LobbySlot {
  playerId: string;
  name: string;
  ready: boolean;
}

export interface LobbyRoom {
  id: string;
  hostId: string;
  slots: LobbySlot[];
  maxSlots: number;
  status: "open" | "full" | "closed";
}

export type LobbyResult<T> =
  | { ok: true; room: T }
  | { ok: false; error: string };

function clampMaxSlots(maxSlots?: number): number {
  const n = maxSlots ?? LOBBY_MAX_SLOTS;
  return Math.min(LOBBY_MAX_SLOTS, Math.max(LOBBY_MIN_SLOTS, Math.floor(n)));
}

function refreshStatus(room: LobbyRoom): void {
  if (room.status === "closed") return;
  room.status = room.slots.length >= room.maxSlots ? "full" : "open";
}

/** True si hay ≥2 jugadores y todos ready (no inicia partida real). */
export function canStart(room: LobbyRoom): boolean {
  return (
    room.slots.length >= LOBBY_MIN_SLOTS &&
    room.slots.every((s) => s.ready) &&
    room.status !== "closed"
  );
}

/**
 * Lobby en memoria (Map). Sin sockets — solo crear/unir/listar salas.
 */
export class MemoryLobby {
  private rooms = new Map<string, LobbyRoom>();
  private nextId = 1;

  createRoom(
    hostId: string,
    hostName: string,
    maxSlots?: number,
  ): LobbyResult<LobbyRoom> {
    if (!hostId) {
      return { ok: false, error: "hostId inválido" };
    }
    const id = `room-${this.nextId++}`;
    const room: LobbyRoom = {
      id,
      hostId,
      slots: [{ playerId: hostId, name: hostName, ready: false }],
      maxSlots: clampMaxSlots(maxSlots),
      status: "open",
    };
    this.rooms.set(id, room);
    return { ok: true, room };
  }

  joinRoom(
    roomId: string,
    playerId: string,
    name: string,
  ): LobbyResult<LobbyRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { ok: false, error: "sala no existe" };
    }
    if (room.status === "closed") {
      return { ok: false, error: "sala cerrada" };
    }
    if (room.slots.length >= room.maxSlots || room.status === "full") {
      return { ok: false, error: "sala llena" };
    }
    if (room.slots.some((s) => s.playerId === playerId)) {
      return { ok: false, error: "jugador ya en sala" };
    }
    room.slots.push({ playerId, name, ready: false });
    refreshStatus(room);
    return { ok: true, room };
  }

  leaveRoom(roomId: string, playerId: string): LobbyResult<LobbyRoom | null> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { ok: false, error: "sala no existe" };
    }
    const idx = room.slots.findIndex((s) => s.playerId === playerId);
    if (idx < 0) {
      return { ok: false, error: "jugador no en sala" };
    }
    room.slots.splice(idx, 1);

    if (room.slots.length === 0) {
      this.rooms.delete(roomId);
      return { ok: true, room: null };
    }

    if (room.hostId === playerId) {
      // Transferir host al primer slot restante.
      room.hostId = room.slots[0]!.playerId;
    }

    if (room.status !== "closed") {
      refreshStatus(room);
    }
    return { ok: true, room };
  }

  setReady(
    roomId: string,
    playerId: string,
    ready: boolean,
  ): LobbyResult<LobbyRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { ok: false, error: "sala no existe" };
    }
    if (room.status === "closed") {
      return { ok: false, error: "sala cerrada" };
    }
    const slot = room.slots.find((s) => s.playerId === playerId);
    if (!slot) {
      return { ok: false, error: "jugador no en sala" };
    }
    slot.ready = ready;
    return { ok: true, room };
  }

  getRoom(roomId: string): LobbyRoom | undefined {
    return this.rooms.get(roomId);
  }

  /** Solo salas open/full (no closed). */
  listRooms(): LobbyRoom[] {
    return [...this.rooms.values()].filter(
      (r) => r.status === "open" || r.status === "full",
    );
  }
}
