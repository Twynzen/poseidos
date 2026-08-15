import { describe, expect, test } from "vitest";
import { HostileSim } from "../src/ai";
import {
  buildNetSnapshot,
  ClientPredictBuffer,
  collectBarricadesFromMap,
  collectContainersFromRegistry,
  collectDoorsFromMap,
  collectPossessionFrom,
  LocalLoopbackSession,
  type NetSnapshot,
} from "../src/net";
import {
  TrustLedger,
  DialogueBehaviorGates,
  proposeDialogueGates,
  GATE_CALM_PACIFY_TTL,
  GATE_LINE_MAX_LEN,
} from "../src/possession";
import {
  ContainerRegistry,
  createWorldContainer,
} from "../src/items";
import { TileMap } from "../src/world/tilemap";
import { makeBarricade, makeDoor, makeFloor } from "../src/world/tile";

describe("buildNetSnapshot facade", () => {
  test("roundtrip fields desde HostileSim + player", () => {
    const sim = new HostileSim({}, () => 0.5);
    sim.add("h1", 10, 12);
    sim.add("h2", 3, 4, undefined, "possessed");
    const h2 = sim.get("h2")!;
    h2.mode = "chase";

    const snap: NetSnapshot = buildNetSnapshot({
      playerX: 24.5,
      playerY: 15.5,
      clockPhase: 0.25,
      hostiles: sim,
      seq: 7,
    });

    expect(snap.seq).toBe(7);
    expect(snap.ack).toBe(7);
    expect(snap.ack).toBe(snap.seq);
    expect(snap.playerX).toBe(24.5);
    expect(snap.playerY).toBe(15.5);
    expect(snap.clockPhase).toBe(0.25);
    expect(snap.hostileCount).toBe(2);
    expect(snap.hostiles).toHaveLength(2);
    expect(snap.hostiles[0]).toEqual({
      id: "h1",
      x: 10,
      y: 12,
      mode: "wander",
    });
    expect(snap.hostiles[1]).toEqual({
      id: "h2",
      x: 3,
      y: 4,
      mode: "chase",
    });
    // Compat: sin doors/containers → arrays vacíos
    expect(snap.doors).toEqual([]);
    expect(snap.barricades).toEqual([]);
    expect(snap.containers).toEqual([]);
    expect(snap.possession).toEqual([]);
  });

  test("incluye doors + containers cuando se pasan", () => {
    const snap = buildNetSnapshot({
      playerX: 1,
      playerY: 2,
      clockPhase: 0,
      hostiles: [],
      doors: [
        { x: 3, y: 4, open: true },
        { x: 5, y: 6, open: false },
      ],
      barricades: [{ x: 7, y: 8 }],
      containers: [
        {
          id: "chest_a",
          x: 2,
          y: 2,
          slots: [
            { id: "wood", qty: 3 },
            { id: "canned_food", qty: 1 },
          ],
        },
      ],
    });

    expect(snap.doors).toEqual([
      { x: 3, y: 4, open: true },
      { x: 5, y: 6, open: false },
    ]);
    expect(snap.barricades).toEqual([{ x: 7, y: 8 }]);
    expect(snap.containers).toHaveLength(1);
    expect(snap.containers[0]).toEqual({
      id: "chest_a",
      x: 2,
      y: 2,
      slots: [
        { id: "wood", qty: 3 },
        { id: "canned_food", qty: 1 },
      ],
    });
  });
});

describe("collectors TileMap + ContainerRegistry", () => {
  test("collectDoorsFromMap + collectBarricadesFromMap", () => {
    const map = new TileMap(6, 6, makeFloor);
    map.set(1, 1, makeDoor(false));
    map.set(2, 3, makeDoor(true));
    map.set(4, 4, makeBarricade());

    const doors = collectDoorsFromMap(map);
    expect(doors).toContainEqual({ x: 1, y: 1, open: false });
    expect(doors).toContainEqual({ x: 2, y: 3, open: true });
    expect(doors).toHaveLength(2);

    const barricades = collectBarricadesFromMap(map);
    expect(barricades).toEqual([{ x: 4, y: 4 }]);
  });

  test("collectContainersFromRegistry omite slots qty<=0", () => {
    const reg = new ContainerRegistry([
      createWorldContainer("c1", 3, 5, "caja", [
        { id: "wood", qty: 2 },
        { id: "scrap", qty: 0 },
      ]),
      createWorldContainer("c2", 0, 0, "vacío", []),
    ]);
    // Forzar un slot qty 0 residual si addItem no lo puso
    reg.list[0]!.inv.slots.push({ id: "cloth", qty: 0 });

    const snaps = collectContainersFromRegistry(reg);
    expect(snaps).toHaveLength(2);
    expect(snaps[0]).toEqual({
      id: "c1",
      x: 3,
      y: 5,
      slots: [{ id: "wood", qty: 2 }],
    });
    expect(snaps[1]).toEqual({ id: "c2", x: 0, y: 0, slots: [] });
  });
});

describe("LocalLoopbackSession", () => {
  test("pushInput no tira; tick aplica move stub; snapshot coherente", () => {
    const session = new LocalLoopbackSession({
      playerX: 5,
      playerY: 5,
      clockPhase: 0,
      hostiles: [{ id: "z", x: 8, y: 8, mode: "wander" }],
    });

    expect(() => {
      session.pushInput({ seq: 1, dx: 1, dy: 0 });
      session.pushInput({ seq: 2, dx: 0, dy: -1 });
      session.pushInput({ seq: 3, dx: NaN, dy: Infinity });
    }).not.toThrow();

    session.tick(1);
    const snap = session.getSnapshot();
    expect(snap.seq).toBe(3);
    expect(snap.ack).toBe(3);
    expect(snap.hostileCount).toBe(1);
    expect(snap.hostiles[0]!.id).toBe("z");
    // Tras inputs: se movió en +x luego -y (speed 3 * dt 1, dirs unitarias).
    expect(snap.playerX).toBeGreaterThan(5);
    expect(snap.playerY).toBeLessThan(5);
    expect(snap.clockPhase).toBeGreaterThan(0);
    expect(snap.clockPhase).toBeLessThan(1);
    expect(snap.doors).toEqual([]);
    expect(snap.containers).toEqual([]);
    expect(snap.possession).toEqual([]);
  });

  test("setHostilesFromSim actualiza snapshot", () => {
    const session = new LocalLoopbackSession({ playerX: 0, playerY: 0 });
    const sim = new HostileSim();
    sim.add("a", 1, 2);
    session.setHostilesFromSim(sim);
    const snap = session.getSnapshot();
    expect(snap.hostileCount).toBe(1);
    expect(snap.hostiles[0]).toMatchObject({ id: "a", x: 1, y: 2 });
  });

  test("roundtrip doors/containers vía constructor + stubs", () => {
    const session = new LocalLoopbackSession({
      playerX: 0,
      playerY: 0,
      doors: [{ x: 1, y: 1, open: false }],
      barricades: [{ x: 2, y: 2 }],
      containers: [
        { id: "box", x: 3, y: 3, slots: [{ id: "wood", qty: 1 }] },
      ],
    });

    let snap = session.getSnapshot();
    expect(snap.doors).toEqual([{ x: 1, y: 1, open: false }]);
    expect(snap.barricades).toEqual([{ x: 2, y: 2 }]);
    expect(snap.containers[0]!.slots).toEqual([{ id: "wood", qty: 1 }]);

    session.setDoor(1, 1, true);
    session.setDoor(9, 9, false);
    session.setBarricades([{ x: 4, y: 4 }]);
    session.setContainers([
      { id: "box", x: 3, y: 3, slots: [{ id: "scrap", qty: 5 }] },
    ]);

    snap = session.getSnapshot();
    expect(snap.doors).toContainEqual({ x: 1, y: 1, open: true });
    expect(snap.doors).toContainEqual({ x: 9, y: 9, open: false });
    expect(snap.barricades).toEqual([{ x: 4, y: 4 }]);
    expect(snap.containers).toEqual([
      { id: "box", x: 3, y: 3, slots: [{ id: "scrap", qty: 5 }] },
    ]);
  });
});

describe("collectPossessionFrom + snapshot possession", () => {
  test("collector: propose+apply calmar → pacifiedLeft > 0", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    expect(proposal.applied).toContain("pacify_ttl");
    gates.apply("p1", proposal);

    const snaps = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(snaps).toHaveLength(1);
    expect(snaps[0]).toMatchObject({
      id: "p1",
      trust: 65,
      pacified: true,
      speedBumpMul: 1,
      speedBumpLeft: 0,
    });
    expect(snaps[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(snaps[0]!.pacifiedLeft).toBeGreaterThan(0);
    expect(snaps[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(snaps[0]!.lastRejected).toBeUndefined();
    expect("lastRejected" in snaps[0]!).toBe(false);
    expect(snaps[0]!.gateLine).toBeUndefined();
    expect("gateLine" in snaps[0]!).toBe(false);

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toBeUndefined();
    expect(afterTtl[0]!.gateLine).toBeUndefined();
  });

  test("collector: lastApplied omitido si vacío; tags desconocidos se descartan", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 50);
    const gates = new DialogueBehaviorGates();

    const none = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(none).toHaveLength(1);
    expect(none[0]).toEqual({
      id: "p1",
      trust: 50,
      pacifiedLeft: 0,
      speedBumpLeft: 0,
      speedBumpMul: 1,
      pacified: false,
    });
    expect(none[0]!.lastApplied).toBeUndefined();
    expect("lastApplied" in none[0]!).toBe(false);
    expect(none[0]!.lastRejected).toBeUndefined();
    expect("lastRejected" in none[0]!).toBe(false);
    expect(none[0]!.gateLine).toBeUndefined();
    expect("gateLine" in none[0]!).toBe(false);

    gates.restoreLastApplied("p1", [
      "pacify_ttl",
      "not_a_tag" as "pacify_ttl",
      "offer_food",
    ]);
    const mixed = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(mixed[0]!.lastApplied).toEqual(["pacify_ttl", "offer_food"]);
    expect(mixed[0]!.lastRejected).toBeUndefined();
    expect(mixed[0]!.trust).toBe(50);
    expect(mixed[0]!.pacifiedLeft).toBe(0);
    expect(mixed[0]!.speedBumpLeft).toBe(0);
    expect(mixed[0]!.speedBumpMul).toBe(1);
    expect(mixed[0]!.pacified).toBe(false);
  });

  test("collector: lastRejected omitido si vacío; tags desconocidos se descartan", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 50);
    const gates = new DialogueBehaviorGates();

    const none = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(none).toHaveLength(1);
    expect(none[0]).toEqual({
      id: "p1",
      trust: 50,
      pacifiedLeft: 0,
      speedBumpLeft: 0,
      speedBumpMul: 1,
      pacified: false,
    });
    expect(none[0]!.lastRejected).toBeUndefined();
    expect("lastRejected" in none[0]!).toBe(false);
    expect(none[0]!.lastApplied).toBeUndefined();
    expect(none[0]!.gateLine).toBeUndefined();
    expect("gateLine" in none[0]!).toBe(false);

    gates.restoreLastRejected("p1", [
      "pacify_ttl",
      "not_a_tag" as "pacify_ttl",
      "offer_food",
    ]);
    const mixed = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(mixed[0]!.lastRejected).toEqual(["pacify_ttl", "offer_food"]);
    expect(mixed[0]!.lastApplied).toBeUndefined();
    expect("lastApplied" in mixed[0]!).toBe(false);
    expect(mixed[0]!.trust).toBe(50);
    expect(mixed[0]!.pacifiedLeft).toBe(0);
    expect(mixed[0]!.speedBumpLeft).toBe(0);
    expect(mixed[0]!.speedBumpMul).toBe(1);
    expect(mixed[0]!.pacified).toBe(false);
  });

  test("collector: propose+apply calmar bajo trust → lastRejected", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 40);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    expect(proposal.rejected).toContain("pacify_ttl");
    expect(proposal.applied).toEqual([]);
    gates.apply("p1", proposal);

    const snaps = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(snaps).toHaveLength(1);
    expect(snaps[0]).toMatchObject({
      id: "p1",
      trust: 40,
      pacified: false,
      speedBumpMul: 1,
      speedBumpLeft: 0,
      pacifiedLeft: 0,
    });
    expect(snaps[0]!.lastRejected).toEqual(["pacify_ttl"]);
    expect(snaps[0]!.lastApplied).toBeUndefined();
    expect("lastApplied" in snaps[0]!).toBe(false);
    expect(snaps[0]!.gateLine).toBeUndefined();
    expect("gateLine" in snaps[0]!).toBe(false);

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(afterTtl[0]!.trust).toBe(40);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
    expect(afterTtl[0]!.lastRejected).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastApplied).toBeUndefined();
    expect(afterTtl[0]!.gateLine).toBeUndefined();
  });

  test("collector: sin ids → todos del ledger; default vacío si ledger vacío", () => {
    const ledger = new TrustLedger();
    const gates = new DialogueBehaviorGates();
    expect(collectPossessionFrom(ledger, gates)).toEqual([]);

    ledger.register("a", 50);
    ledger.register("b", 80);
    const all = collectPossessionFrom(ledger, gates);
    expect(all.map((s) => s.id).sort()).toEqual(["a", "b"]);
    expect(all.find((s) => s.id === "b")!.pacified).toBe(true); // trust ≥ 70
    expect(all.find((s) => s.id === "a")!.pacified).toBe(false);
    expect(all.find((s) => s.id === "a")!.lastApplied).toBeUndefined();
    expect(all.find((s) => s.id === "b")!.lastApplied).toBeUndefined();
    expect(all.find((s) => s.id === "a")!.lastRejected).toBeUndefined();
    expect(all.find((s) => s.id === "b")!.lastRejected).toBeUndefined();
    expect(all.find((s) => s.id === "a")!.gateLine).toBeUndefined();
    expect(all.find((s) => s.id === "b")!.gateLine).toBeUndefined();
  });

  test("collector: gateLine presente; vacío omitido; over-cap truncado; tags/trust/TTL sin cambio", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);

    const none = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(none[0]!.gateLine).toBeUndefined();
    expect("gateLine" in none[0]!).toBe(false);
    expect(none[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(none[0]!.lastRejected).toEqual(["offer_food"]);
    expect(none[0]!.trust).toBe(65);
    expect(none[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(none[0]!.speedBumpLeft).toBe(0);
    expect(none[0]!.speedBumpMul).toBe(1);
    expect(none[0]!.pacified).toBe(true);

    gates.restoreGateLine("p1", "   ");
    const blank = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(blank[0]!.gateLine).toBeUndefined();
    expect("gateLine" in blank[0]!).toBe(false);

    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");
    const applied = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(applied[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(applied[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(applied[0]!.lastRejected).toEqual(["offer_food"]);
    expect(applied[0]!.trust).toBe(65);
    expect(applied[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(applied[0]!.speedBumpLeft).toBe(0);
    expect(applied[0]!.speedBumpMul).toBe(1);
    expect(applied[0]!.pacified).toBe(true);

    gates.restoreGateLine("p1", "código: rechazado (trust)");
    const rejected = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(rejected[0]!.gateLine).toBe("código: rechazado (trust)");
    expect(rejected[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(rejected[0]!.lastRejected).toEqual(["offer_food"]);
    expect(rejected[0]!.trust).toBe(65);
    expect(rejected[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);

    const long = "x".repeat(GATE_LINE_MAX_LEN + 8);
    gates.restoreGateLine("p1", `  ${long}  `);
    const capped = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(capped[0]!.gateLine).toBe("x".repeat(GATE_LINE_MAX_LEN));
    expect(capped[0]!.gateLine!.length).toBe(GATE_LINE_MAX_LEN);
    expect(capped[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(capped[0]!.lastRejected).toEqual(["offer_food"]);
    expect(capped[0]!.trust).toBe(65);
    expect(capped[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(capped[0]!.speedBumpLeft).toBe(0);
    expect(capped[0]!.speedBumpMul).toBe(1);
    expect(capped[0]!.pacified).toBe(true);

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(afterTtl[0]!.gateLine).toBe("x".repeat(GATE_LINE_MAX_LEN));
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
  });

  test("buildNetSnapshot incluye possession; default vacío", () => {
    const empty = buildNetSnapshot({
      playerX: 0,
      playerY: 0,
      clockPhase: 0,
      hostiles: [],
    });
    expect(empty.possession).toEqual([]);

    const withPoss = buildNetSnapshot({
      playerX: 0,
      playerY: 0,
      clockPhase: 0,
      hostiles: [],
      possession: [
        {
          id: "p1",
          trust: 70,
          pacifiedLeft: 8,
          speedBumpLeft: 0,
          speedBumpMul: 1,
          pacified: true,
        },
      ],
    });
    expect(withPoss.possession).toEqual([
      {
        id: "p1",
        trust: 70,
        pacifiedLeft: 8,
        speedBumpLeft: 0,
        speedBumpMul: 1,
        pacified: true,
      },
    ]);
  });

  test("LocalLoopbackSession setPossession en getSnapshot", () => {
    const session = new LocalLoopbackSession({ playerX: 0, playerY: 0 });
    expect(session.getSnapshot().possession).toEqual([]);
    session.setPossession([
      {
        id: "x",
        trust: 40,
        pacifiedLeft: 0,
        speedBumpLeft: 2,
        speedBumpMul: 1.55,
        pacified: false,
      },
    ]);
    expect(session.getSnapshot().possession).toEqual([
      {
        id: "x",
        trust: 40,
        pacifiedLeft: 0,
        speedBumpLeft: 2,
        speedBumpMul: 1.55,
        pacified: false,
      },
    ]);
  });
});

describe("ClientPredictBuffer", () => {
  test("pushMove encola, avanza pred, seq monótono", () => {
    const client = new ClientPredictBuffer(0, 0, { moveSpeed: 3 });
    const a = client.pushMove(1, 0, 1);
    expect(a.seq).toBe(1);
    expect(client.predX).toBeCloseTo(3, 5);
    expect(client.predY).toBeCloseTo(0, 5);
    expect(client.pendingCount()).toBe(1);

    const b = client.pushMove(0, 1, 0.5);
    expect(b.seq).toBe(2);
    expect(client.predY).toBeCloseTo(1.5, 5);
    expect(client.pendingCount()).toBe(2);
    expect(client.lastAck()).toBe(0);
  });

  test("reconcile drop ack'd y re-aplica pending", () => {
    const client = new ClientPredictBuffer(10, 10, { moveSpeed: 2 });
    client.pushMove(1, 0, 1); // seq 1 → pred ~12,10
    client.pushMove(0, -1, 1); // seq 2 → pred ~12,8
    expect(client.pendingCount()).toBe(2);

    // Host solo ack'd seq 1 en (12, 10)
    client.reconcile({ seq: 1, ack: 1, playerX: 12, playerY: 10 });
    expect(client.lastAck()).toBe(1);
    expect(client.pendingCount()).toBe(1);
    expect(client.authX).toBe(12);
    expect(client.authY).toBe(10);
    // re-aplica seq 2: moveSpeed 2 * dt 1 en -y
    expect(client.predX).toBeCloseTo(12, 5);
    expect(client.predY).toBeCloseTo(8, 5);
  });
});

describe("inputs ack reconcile e2e (loopback)", () => {
  test("client predict ≈ host tras reconcile; pending vacío", () => {
    const speed = 3;
    const x0 = 5;
    const y0 = 5;
    const client = new ClientPredictBuffer(x0, y0, { moveSpeed: speed });
    const session = new LocalLoopbackSession(
      { playerX: x0, playerY: y0, clockPhase: 0 },
      { moveSpeed: speed },
    );

    const moves: { dx: number; dy: number; dt: number }[] = [
      { dx: 1, dy: 0, dt: 0.2 },
      { dx: 1, dy: 1, dt: 0.1 },
      { dx: 0, dy: -1, dt: 0.15 },
      { dx: -1, dy: 0, dt: 0.05 },
    ];

    for (const m of moves) {
      const input = client.pushMove(m.dx, m.dy, m.dt);
      session.pushInput(input);
      session.tick(m.dt);
    }

    expect(client.pendingCount()).toBe(moves.length);

    const snap = session.getSnapshot();
    expect(snap.ack).toBe(snap.seq);
    expect(snap.seq).toBe(moves.length);

    client.reconcile(snap);

    expect(client.pendingCount()).toBe(0);
    expect(client.lastAck()).toBe(snap.seq);
    expect(client.authX).toBeCloseTo(snap.playerX, 5);
    expect(client.authY).toBeCloseTo(snap.playerY, 5);
    expect(client.predX).toBeCloseTo(snap.playerX, 5);
    expect(client.predY).toBeCloseTo(snap.playerY, 5);
    expect(client.predX).toBeCloseTo(client.authX, 5);
    expect(client.predY).toBeCloseTo(client.authY, 5);
  });

  test("reconcile parcial deja pending y re-simula", () => {
    const speed = 4;
    const client = new ClientPredictBuffer(0, 0, { moveSpeed: speed });
    const session = new LocalLoopbackSession(
      { playerX: 0, playerY: 0 },
      { moveSpeed: speed },
    );

    const i1 = client.pushMove(1, 0, 0.25);
    session.pushInput(i1);
    session.tick(0.25);

    const i2 = client.pushMove(0, 1, 0.25);
    // i2 aún no enviado / no tickeado en host
    const snap1 = session.getSnapshot();
    expect(snap1.seq).toBe(1);
    client.reconcile(snap1);

    expect(client.pendingCount()).toBe(1);
    expect(client.authX).toBeCloseTo(snap1.playerX, 5);
    // pred incluye re-sim de i2
    expect(client.predY).toBeCloseTo(speed * 0.25, 5);

    session.pushInput(i2);
    session.tick(0.25);
    const snap2 = session.getSnapshot();
    client.reconcile(snap2);
    expect(client.pendingCount()).toBe(0);
    expect(client.predX).toBeCloseTo(snap2.playerX, 5);
    expect(client.predY).toBeCloseTo(snap2.playerY, 5);
  });
});
