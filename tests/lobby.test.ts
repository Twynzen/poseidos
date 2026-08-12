import { describe, expect, test } from "vitest";
import {
  LOBBY_MAX_SLOTS,
  LOBBY_MIN_SLOTS,
  MemoryLobby,
  canStart,
} from "../src/net";

describe("MemoryLobby", () => {
  test("create + join hasta full", () => {
    const lobby = new MemoryLobby();
    const created = lobby.createRoom("h1", "Host", 2);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.room.status).toBe("open");
    expect(created.room.slots).toHaveLength(1);
    expect(created.room.slots[0]).toMatchObject({
      playerId: "h1",
      name: "Host",
      ready: false,
    });
    expect(created.room.hostId).toBe("h1");

    const joined = lobby.joinRoom(created.room.id, "p2", "P2");
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.room.slots).toHaveLength(2);
    expect(joined.room.status).toBe("full");
  });

  test("join cuando full falla", () => {
    const lobby = new MemoryLobby();
    const created = lobby.createRoom("h1", "Host", 2);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    lobby.joinRoom(created.room.id, "p2", "P2");

    const fail = lobby.joinRoom(created.room.id, "p3", "P3");
    expect(fail).toEqual({ ok: false, error: "sala llena" });
  });

  test("leave libera slot / host transfer", () => {
    const lobby = new MemoryLobby();
    const created = lobby.createRoom("h1", "Host", 3);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.room.id;
    lobby.joinRoom(id, "p2", "P2");
    lobby.joinRoom(id, "p3", "P3");
    expect(lobby.getRoom(id)!.status).toBe("full");

    const leaveGuest = lobby.leaveRoom(id, "p3");
    expect(leaveGuest.ok).toBe(true);
    if (!leaveGuest.ok || !leaveGuest.room) return;
    expect(leaveGuest.room.slots).toHaveLength(2);
    expect(leaveGuest.room.status).toBe("open");
    expect(leaveGuest.room.hostId).toBe("h1");

    const leaveHost = lobby.leaveRoom(id, "h1");
    expect(leaveHost.ok).toBe(true);
    if (!leaveHost.ok || !leaveHost.room) return;
    expect(leaveHost.room.hostId).toBe("p2");
    expect(leaveHost.room.slots.map((s) => s.playerId)).toEqual(["p2"]);

    const leaveLast = lobby.leaveRoom(id, "p2");
    expect(leaveLast.ok).toBe(true);
    if (!leaveLast.ok) return;
    expect(leaveLast.room).toBeNull();
    expect(lobby.getRoom(id)).toBeUndefined();
  });

  test("setReady + canStart", () => {
    const lobby = new MemoryLobby();
    const created = lobby.createRoom("h1", "Host", 2);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.room.id;
    lobby.joinRoom(id, "p2", "P2");

    expect(canStart(lobby.getRoom(id)!)).toBe(false);

    const r1 = lobby.setReady(id, "h1", true);
    expect(r1.ok).toBe(true);
    expect(canStart(lobby.getRoom(id)!)).toBe(false);

    const r2 = lobby.setReady(id, "p2", true);
    expect(r2.ok).toBe(true);
    expect(canStart(lobby.getRoom(id)!)).toBe(true);

    lobby.setReady(id, "p2", false);
    expect(canStart(lobby.getRoom(id)!)).toBe(false);
  });

  test("maxSlots clamp [2,4]", () => {
    const lobby = new MemoryLobby();
    const low = lobby.createRoom("a", "A", 1);
    expect(low.ok).toBe(true);
    if (!low.ok) return;
    expect(low.room.maxSlots).toBe(LOBBY_MIN_SLOTS);

    const high = lobby.createRoom("b", "B", 99);
    expect(high.ok).toBe(true);
    if (!high.ok) return;
    expect(high.room.maxSlots).toBe(LOBBY_MAX_SLOTS);

    const def = lobby.createRoom("c", "C");
    expect(def.ok).toBe(true);
    if (!def.ok) return;
    expect(def.room.maxSlots).toBe(LOBBY_MAX_SLOTS);
  });

  test("duplicate join falla", () => {
    const lobby = new MemoryLobby();
    const created = lobby.createRoom("h1", "Host", 4);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const dup = lobby.joinRoom(created.room.id, "h1", "Otro");
    expect(dup).toEqual({ ok: false, error: "jugador ya en sala" });
  });

  test("join sala inexistente / listRooms solo open|full", () => {
    const lobby = new MemoryLobby();
    expect(lobby.joinRoom("nope", "x", "X")).toEqual({
      ok: false,
      error: "sala no existe",
    });

    const a = lobby.createRoom("h1", "Host", 2);
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    lobby.joinRoom(a.room.id, "p2", "P2");
    expect(lobby.listRooms()).toHaveLength(1);
    expect(lobby.listRooms()[0]!.status).toBe("full");

    // Vaciar → delete → no aparece en list
    lobby.leaveRoom(a.room.id, "h1");
    lobby.leaveRoom(a.room.id, "p2");
    expect(lobby.listRooms()).toHaveLength(0);
  });
});
