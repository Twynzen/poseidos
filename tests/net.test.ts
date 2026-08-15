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
  SpeechDirector,
  ShortMemory,
  proposeDialogueGates,
  GATE_CALM_PACIFY_TTL,
  GATE_LINE_MAX_LEN,
  formatMemorySummary,
  MEMORY_SUMMARY_MAX_LEN,
  compactLlmLine,
  compactMoodBias,
  LLM_LINE_MAX_LEN,
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
    expect(snaps[0]!.moodBias).toBeUndefined();
    expect("moodBias" in snaps[0]!).toBe(false);
    expect(snaps[0]!.toneBias).toBeUndefined();
    expect("toneBias" in snaps[0]!).toBe(false);
    expect(snaps[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in snaps[0]!).toBe(false);

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toBeUndefined();
    expect(afterTtl[0]!.gateLine).toBeUndefined();
    expect(afterTtl[0]!.moodBias).toBeUndefined();
    expect(afterTtl[0]!.toneBias).toBeUndefined();
    expect(afterTtl[0]!.memorySummary).toBeUndefined();
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
    expect(none[0]!.moodBias).toBeUndefined();
    expect("moodBias" in none[0]!).toBe(false);
    expect(none[0]!.toneBias).toBeUndefined();
    expect("toneBias" in none[0]!).toBe(false);
    expect(none[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in none[0]!).toBe(false);

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
    expect(none[0]!.moodBias).toBeUndefined();
    expect("moodBias" in none[0]!).toBe(false);
    expect(none[0]!.toneBias).toBeUndefined();
    expect("toneBias" in none[0]!).toBe(false);
    expect(none[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in none[0]!).toBe(false);

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
    expect(snaps[0]!.moodBias).toBeUndefined();
    expect("moodBias" in snaps[0]!).toBe(false);
    expect(snaps[0]!.toneBias).toBeUndefined();
    expect("toneBias" in snaps[0]!).toBe(false);
    expect(snaps[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in snaps[0]!).toBe(false);

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
    expect(all.find((s) => s.id === "a")!.moodBias).toBeUndefined();
    expect(all.find((s) => s.id === "b")!.moodBias).toBeUndefined();
    expect(all.find((s) => s.id === "a")!.toneBias).toBeUndefined();
    expect(all.find((s) => s.id === "b")!.toneBias).toBeUndefined();
    expect(all.find((s) => s.id === "a")!.memorySummary).toBeUndefined();
    expect(all.find((s) => s.id === "b")!.memorySummary).toBeUndefined();
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
    expect(none[0]!.moodBias).toBeUndefined();
    expect("moodBias" in none[0]!).toBe(false);
    expect(none[0]!.toneBias).toBeUndefined();
    expect("toneBias" in none[0]!).toBe(false);
    expect(none[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in none[0]!).toBe(false);
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
    expect(afterTtl[0]!.moodBias).toBeUndefined();
    expect(afterTtl[0]!.toneBias).toBeUndefined();
    expect(afterTtl[0]!.memorySummary).toBeUndefined();
  });

  test("collector: moodBias presente; vacío/null/desconocido omitido; tags/gateLine/trust/TTL sin cambio", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);
    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");

    const none = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(none[0]!.moodBias).toBeUndefined();
    expect("moodBias" in none[0]!).toBe(false);
    expect(none[0]!.toneBias).toBeUndefined();
    expect("toneBias" in none[0]!).toBe(false);
    expect(none[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in none[0]!).toBe(false);
    expect(none[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(none[0]!.lastRejected).toEqual(["offer_food"]);
    expect(none[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(none[0]!.trust).toBe(65);
    expect(none[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(none[0]!.speedBumpLeft).toBe(0);
    expect(none[0]!.speedBumpMul).toBe(1);
    expect(none[0]!.pacified).toBe(true);

    const blank = collectPossessionFrom(ledger, gates, ["p1"], () => "");
    expect(blank[0]!.moodBias).toBeUndefined();
    expect("moodBias" in blank[0]!).toBe(false);
    expect(blank[0]!.toneBias).toBeUndefined();
    expect("toneBias" in blank[0]!).toBe(false);
    expect(blank[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in blank[0]!).toBe(false);

    const nulled = collectPossessionFrom(ledger, gates, ["p1"], () => null);
    expect(nulled[0]!.moodBias).toBeUndefined();
    expect("moodBias" in nulled[0]!).toBe(false);
    expect(nulled[0]!.toneBias).toBeUndefined();
    expect("toneBias" in nulled[0]!).toBe(false);
    expect(nulled[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in nulled[0]!).toBe(false);

    const unknown = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      () => "scream" as "lucidez",
    );
    expect(unknown[0]!.moodBias).toBeUndefined();
    expect("moodBias" in unknown[0]!).toBe(false);
    expect(unknown[0]!.toneBias).toBeUndefined();
    expect("toneBias" in unknown[0]!).toBe(false);
    expect(unknown[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in unknown[0]!).toBe(false);

    const speech = new SpeechDirector({}, () => 0.5);
    speech.setMoodBias("p1", "lucidez");
    const set = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(set[0]!.moodBias).toBe("lucidez");
    expect(set[0]!.toneBias).toBeUndefined();
    expect("toneBias" in set[0]!).toBe(false);
    expect(set[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in set[0]!).toBe(false);
    expect(set[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(set[0]!.lastRejected).toEqual(["offer_food"]);
    expect(set[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(set[0]!.trust).toBe(65);
    expect(set[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(set[0]!.speedBumpLeft).toBe(0);
    expect(set[0]!.speedBumpMul).toBe(1);
    expect(set[0]!.pacified).toBe(true);

    speech.setMoodBias("p1", "demonio");
    const demon = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      (id) => speech.getMoodBias(id),
    );
    expect(demon[0]!.moodBias).toBe("demonio");
    expect(demon[0]!.toneBias).toBeUndefined();
    expect("toneBias" in demon[0]!).toBe(false);
    expect(demon[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in demon[0]!).toBe(false);
    expect(demon[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(demon[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(demon[0]!.trust).toBe(65);

    speech.setMoodBias("p1", "ruega");
    const plea = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(plea[0]!.moodBias).toBe("ruega");
    expect(plea[0]!.toneBias).toBeUndefined();
    expect("toneBias" in plea[0]!).toBe(false);
    expect(plea[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in plea[0]!).toBe(false);

    const unregistered = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      new SpeechDirector(),
    );
    expect(unregistered[0]!.moodBias).toBeUndefined();
    expect("moodBias" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.toneBias).toBeUndefined();
    expect("toneBias" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in unregistered[0]!).toBe(false);

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(afterTtl[0]!.moodBias).toBe("ruega");
    expect(afterTtl[0]!.toneBias).toBeUndefined();
    expect("toneBias" in afterTtl[0]!).toBe(false);
    expect(afterTtl[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in afterTtl[0]!).toBe(false);
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
  });

  test("collector: toneBias presente; vacío/null/desconocido omitido; moodBias/tags/gateLine/trust/TTL sin cambio", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);
    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");
    const speech = new SpeechDirector({}, () => 0.5);
    speech.setMoodBias("p1", "lucidez");

    const threeArg = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(threeArg[0]!.toneBias).toBeUndefined();
    expect("toneBias" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.moodBias).toBeUndefined();
    expect("moodBias" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(threeArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(threeArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(threeArg[0]!.trust).toBe(65);
    expect(threeArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(threeArg[0]!.speedBumpLeft).toBe(0);
    expect(threeArg[0]!.speedBumpMul).toBe(1);
    expect(threeArg[0]!.pacified).toBe(true);

    const fourArg = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(fourArg[0]!.toneBias).toBeUndefined();
    expect("toneBias" in fourArg[0]!).toBe(false);
    expect(fourArg[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in fourArg[0]!).toBe(false);
    expect(fourArg[0]!.moodBias).toBe("lucidez");
    expect(fourArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fourArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fourArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fourArg[0]!.trust).toBe(65);
    expect(fourArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fourArg[0]!.speedBumpLeft).toBe(0);
    expect(fourArg[0]!.speedBumpMul).toBe(1);
    expect(fourArg[0]!.pacified).toBe(true);

    const emptyMem = new ShortMemory();
    expect(emptyMem.toneBias("p1")).toBeUndefined();
    const noHistory = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      emptyMem,
    );
    expect(noHistory[0]!.toneBias).toBeUndefined();
    expect("toneBias" in noHistory[0]!).toBe(false);
    expect(noHistory[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in noHistory[0]!).toBe(false);
    expect(noHistory[0]!.moodBias).toBe("lucidez");
    expect(noHistory[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(noHistory[0]!.lastRejected).toEqual(["offer_food"]);
    expect(noHistory[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(noHistory[0]!.trust).toBe(65);

    const blank = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      () => "",
    );
    expect(blank[0]!.toneBias).toBeUndefined();
    expect("toneBias" in blank[0]!).toBe(false);
    expect(blank[0]!.moodBias).toBe("lucidez");

    const nulled = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      () => null,
    );
    expect(nulled[0]!.toneBias).toBeUndefined();
    expect("toneBias" in nulled[0]!).toBe(false);
    expect(nulled[0]!.moodBias).toBe("lucidez");

    const unknown = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      () => "scream" as "lucidez",
    );
    expect(unknown[0]!.toneBias).toBeUndefined();
    expect("toneBias" in unknown[0]!).toBe(false);
    expect(unknown[0]!.moodBias).toBe("lucidez");

    const mem = new ShortMemory();
    mem.remember("p1", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    expect(mem.toneBias("p1")).toBe("lucidez");
    const set = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(set[0]!.toneBias).toBe("lucidez");
    expect(set[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in set[0]!).toBe(false);
    expect(set[0]!.moodBias).toBe("lucidez");
    expect(set[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(set[0]!.lastRejected).toEqual(["offer_food"]);
    expect(set[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(set[0]!.trust).toBe(65);
    expect(set[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(set[0]!.speedBumpLeft).toBe(0);
    expect(set[0]!.speedBumpMul).toBe(1);
    expect(set[0]!.pacified).toBe(true);

    mem.restore("p1", [
      {
        who: "player",
        intent: "amenazar",
        trustDelta: -20,
        tone: "demonio",
      },
      {
        who: "player",
        intent: "amenazar",
        trustDelta: -20,
        tone: "demonio",
      },
    ]);
    expect(mem.toneBias("p1")).toBe("demonio");
    const demon = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      (id) => mem.toneBias(id),
    );
    expect(demon[0]!.toneBias).toBe("demonio");
    expect(demon[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in demon[0]!).toBe(false);
    expect(demon[0]!.moodBias).toBe("lucidez");
    expect(demon[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(demon[0]!.lastRejected).toEqual(["offer_food"]);
    expect(demon[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(demon[0]!.trust).toBe(65);

    mem.restore("p1", [
      {
        who: "player",
        intent: "calmar",
        trustDelta: 14,
        tone: "ruega",
      },
      {
        who: "player",
        intent: "calmar",
        trustDelta: 14,
        tone: "ruega",
      },
    ]);
    expect(mem.toneBias("p1")).toBe("ruega");
    const plea = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(plea[0]!.toneBias).toBe("ruega");
    expect(plea[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in plea[0]!).toBe(false);
    expect(plea[0]!.moodBias).toBe("lucidez");

    const unregistered = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      new ShortMemory(),
    );
    expect(unregistered[0]!.toneBias).toBeUndefined();
    expect("toneBias" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.moodBias).toBe("lucidez");

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(afterTtl[0]!.toneBias).toBe("ruega");
    expect(afterTtl[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in afterTtl[0]!).toBe(false);
    expect(afterTtl[0]!.moodBias).toBe("lucidez");
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
  });

  test("collector: memorySummary presente; vacío/omitido/sin historial omitido; over-cap via formatMemorySummary; toneBias/moodBias/tags/gateLine/trust/TTL sin cambio", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);
    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");
    const speech = new SpeechDirector({}, () => 0.5);
    speech.setMoodBias("p1", "lucidez");
    const mem = new ShortMemory();
    mem.remember("p1", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    expect(mem.toneBias("p1")).toBe("lucidez");
    const expected = formatMemorySummary(mem.recent("p1"));
    expect(expected).toBe("preguntar/lucidez/+6");

    const threeArg = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(threeArg[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.toneBias).toBeUndefined();
    expect(threeArg[0]!.moodBias).toBeUndefined();
    expect(threeArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(threeArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(threeArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(threeArg[0]!.trust).toBe(65);
    expect(threeArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(threeArg[0]!.speedBumpLeft).toBe(0);
    expect(threeArg[0]!.speedBumpMul).toBe(1);
    expect(threeArg[0]!.pacified).toBe(true);

    const fourArg = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(fourArg[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in fourArg[0]!).toBe(false);
    expect(fourArg[0]!.toneBias).toBeUndefined();
    expect(fourArg[0]!.moodBias).toBe("lucidez");
    expect(fourArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fourArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fourArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fourArg[0]!.trust).toBe(65);
    expect(fourArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fourArg[0]!.speedBumpLeft).toBe(0);
    expect(fourArg[0]!.speedBumpMul).toBe(1);
    expect(fourArg[0]!.pacified).toBe(true);

    const fiveArg = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(fiveArg[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in fiveArg[0]!).toBe(false);
    expect(fiveArg[0]!.toneBias).toBe("lucidez");
    expect(fiveArg[0]!.moodBias).toBe("lucidez");
    expect(fiveArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fiveArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fiveArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fiveArg[0]!.trust).toBe(65);
    expect(fiveArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fiveArg[0]!.speedBumpLeft).toBe(0);
    expect(fiveArg[0]!.speedBumpMul).toBe(1);
    expect(fiveArg[0]!.pacified).toBe(true);

    const emptyMem = new ShortMemory();
    expect(emptyMem.recent("p1")).toEqual([]);
    const noHistory = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      emptyMem,
    );
    expect(noHistory[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in noHistory[0]!).toBe(false);
    expect(noHistory[0]!.toneBias).toBe("lucidez");
    expect(noHistory[0]!.moodBias).toBe("lucidez");
    expect(noHistory[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(noHistory[0]!.lastRejected).toEqual(["offer_food"]);
    expect(noHistory[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(noHistory[0]!.trust).toBe(65);

    const blank = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      () => "",
    );
    expect(blank[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in blank[0]!).toBe(false);
    expect(blank[0]!.toneBias).toBe("lucidez");
    expect(blank[0]!.moodBias).toBe("lucidez");

    const whitespace = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      () => "   ",
    );
    expect(whitespace[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in whitespace[0]!).toBe(false);
    expect(whitespace[0]!.toneBias).toBe("lucidez");

    const nulled = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      () => null,
    );
    expect(nulled[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in nulled[0]!).toBe(false);
    expect(nulled[0]!.toneBias).toBe("lucidez");

    const unset = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      () => undefined,
    );
    expect(unset[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in unset[0]!).toBe(false);

    const emptyEntries = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      () => [],
    );
    expect(emptyEntries[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in emptyEntries[0]!).toBe(false);

    const set = collectPossessionFrom(ledger, gates, ["p1"], speech, mem, mem);
    expect(set[0]!.memorySummary).toBe(expected);
    expect(set[0]!.memorySummary).toBe(formatMemorySummary(mem.recent("p1")));
    expect(set[0]!.toneBias).toBe("lucidez");
    expect(set[0]!.moodBias).toBe("lucidez");
    expect(set[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(set[0]!.lastRejected).toEqual(["offer_food"]);
    expect(set[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(set[0]!.trust).toBe(65);
    expect(set[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(set[0]!.speedBumpLeft).toBe(0);
    expect(set[0]!.speedBumpMul).toBe(1);
    expect(set[0]!.pacified).toBe(true);

    const viaRecent = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      (id) => mem.recent(id),
    );
    expect(viaRecent[0]!.memorySummary).toBe(expected);
    expect(viaRecent[0]!.toneBias).toBe("lucidez");
    expect(viaRecent[0]!.moodBias).toBe("lucidez");

    const viaString = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      (id) => formatMemorySummary(mem.recent(id)),
    );
    expect(viaString[0]!.memorySummary).toBe(expected);
    expect(viaString[0]!.toneBias).toBe("lucidez");

    mem.restore("p1", [
      {
        who: "player",
        intent: "amenazar",
        trustDelta: -20,
        tone: "demonio",
      },
      {
        who: "player",
        intent: "calmar",
        trustDelta: 14,
        tone: "ruega",
      },
    ]);
    const restored = formatMemorySummary(mem.recent("p1"));
    expect(restored).toContain("amenazar");
    expect(restored).toContain("calmar");
    const mixed = collectPossessionFrom(ledger, gates, ["p1"], speech, mem, mem);
    expect(mixed[0]!.memorySummary).toBe(restored);
    expect(mixed[0]!.toneBias).toBe(mem.toneBias("p1"));
    expect(mixed[0]!.moodBias).toBe("lucidez");
    expect(mixed[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(mixed[0]!.lastRejected).toEqual(["offer_food"]);
    expect(mixed[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(mixed[0]!.trust).toBe(65);

    const many = new ShortMemory(20);
    for (let i = 0; i < 20; i++) {
      many.remember("p1", {
        who: "player",
        intent: "preguntar",
        trustDelta: 6,
        tone: "lucidez",
      });
    }
    const capped = formatMemorySummary(many.recent("p1"));
    expect(capped.length).toBeLessThanOrEqual(MEMORY_SUMMARY_MAX_LEN);
    expect(capped.length).toBeLessThan(
      many
        .recent("p1")
        .map((e) => `${e.intent}/${e.tone}/+${e.trustDelta}`)
        .join(" · ").length,
    );
    const overCap = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      many,
    );
    expect(overCap[0]!.memorySummary).toBe(capped);
    expect(overCap[0]!.memorySummary!.length).toBeLessThanOrEqual(
      MEMORY_SUMMARY_MAX_LEN,
    );
    expect(overCap[0]!.memorySummary).toBe(
      formatMemorySummary(many.recent("p1")),
    );
    expect(overCap[0]!.toneBias).toBe(mem.toneBias("p1"));
    expect(overCap[0]!.moodBias).toBe("lucidez");
    expect(overCap[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(overCap[0]!.lastRejected).toEqual(["offer_food"]);
    expect(overCap[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(overCap[0]!.trust).toBe(65);
    expect(overCap[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(overCap[0]!.speedBumpLeft).toBe(0);
    expect(overCap[0]!.speedBumpMul).toBe(1);
    expect(overCap[0]!.pacified).toBe(true);

    const unregistered = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      new ShortMemory(),
    );
    expect(unregistered[0]!.memorySummary).toBeUndefined();
    expect("memorySummary" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.toneBias).toBe(mem.toneBias("p1"));
    expect(unregistered[0]!.moodBias).toBe("lucidez");

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
    );
    expect(afterTtl[0]!.memorySummary).toBe(
      formatMemorySummary(mem.recent("p1")),
    );
    expect(afterTtl[0]!.toneBias).toBe(mem.toneBias("p1"));
    expect(afterTtl[0]!.moodBias).toBe("lucidez");
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
  });

  test("collector: lineSource presente (llm/bank); unset/sin utterance/unknown/omitido omitido; memorySummary/toneBias/moodBias/tags/gateLine/trust/TTL sin cambio", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);
    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");
    const speech = new SpeechDirector({}, () => 0.5);
    speech.setMoodBias("p1", "lucidez");
    const mem = new ShortMemory();
    mem.remember("p1", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    expect(mem.toneBias("p1")).toBe("lucidez");
    const expectedMem = formatMemorySummary(mem.recent("p1"));
    expect(expectedMem).toBe("preguntar/lucidez/+6");

    const threeArg = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(threeArg[0]!.lineSource).toBeUndefined();
    expect("lineSource" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.memorySummary).toBeUndefined();
    expect(threeArg[0]!.toneBias).toBeUndefined();
    expect(threeArg[0]!.moodBias).toBeUndefined();
    expect(threeArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(threeArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(threeArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(threeArg[0]!.trust).toBe(65);
    expect(threeArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(threeArg[0]!.speedBumpLeft).toBe(0);
    expect(threeArg[0]!.speedBumpMul).toBe(1);
    expect(threeArg[0]!.pacified).toBe(true);

    const fourArg = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(fourArg[0]!.lineSource).toBeUndefined();
    expect("lineSource" in fourArg[0]!).toBe(false);
    expect(fourArg[0]!.memorySummary).toBeUndefined();
    expect(fourArg[0]!.toneBias).toBeUndefined();
    expect(fourArg[0]!.moodBias).toBe("lucidez");
    expect(fourArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fourArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fourArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fourArg[0]!.trust).toBe(65);
    expect(fourArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fourArg[0]!.speedBumpLeft).toBe(0);
    expect(fourArg[0]!.speedBumpMul).toBe(1);
    expect(fourArg[0]!.pacified).toBe(true);

    const fiveArg = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(fiveArg[0]!.lineSource).toBeUndefined();
    expect("lineSource" in fiveArg[0]!).toBe(false);
    expect(fiveArg[0]!.memorySummary).toBeUndefined();
    expect(fiveArg[0]!.toneBias).toBe("lucidez");
    expect(fiveArg[0]!.moodBias).toBe("lucidez");
    expect(fiveArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fiveArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fiveArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fiveArg[0]!.trust).toBe(65);
    expect(fiveArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fiveArg[0]!.speedBumpLeft).toBe(0);
    expect(fiveArg[0]!.speedBumpMul).toBe(1);
    expect(fiveArg[0]!.pacified).toBe(true);

    const sixArg = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
    );
    expect(sixArg[0]!.lineSource).toBeUndefined();
    expect("lineSource" in sixArg[0]!).toBe(false);
    expect(sixArg[0]!.memorySummary).toBe(expectedMem);
    expect(sixArg[0]!.toneBias).toBe("lucidez");
    expect(sixArg[0]!.moodBias).toBe("lucidez");
    expect(sixArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(sixArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(sixArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(sixArg[0]!.trust).toBe(65);
    expect(sixArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(sixArg[0]!.speedBumpLeft).toBe(0);
    expect(sixArg[0]!.speedBumpMul).toBe(1);
    expect(sixArg[0]!.pacified).toBe(true);

    expect(speech.getActive("p1")).toBeNull();
    const noUtterance = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
    );
    expect(noUtterance[0]!.lineSource).toBeUndefined();
    expect("lineSource" in noUtterance[0]!).toBe(false);
    expect(noUtterance[0]!.memorySummary).toBe(expectedMem);
    expect(noUtterance[0]!.toneBias).toBe("lucidez");
    expect(noUtterance[0]!.moodBias).toBe("lucidez");
    expect(noUtterance[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(noUtterance[0]!.lastRejected).toEqual(["offer_food"]);
    expect(noUtterance[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(noUtterance[0]!.trust).toBe(65);

    const blank = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      () => "",
    );
    expect(blank[0]!.lineSource).toBeUndefined();
    expect("lineSource" in blank[0]!).toBe(false);
    expect(blank[0]!.memorySummary).toBe(expectedMem);
    expect(blank[0]!.toneBias).toBe("lucidez");
    expect(blank[0]!.moodBias).toBe("lucidez");

    const whitespace = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      () => "   ",
    );
    expect(whitespace[0]!.lineSource).toBeUndefined();
    expect("lineSource" in whitespace[0]!).toBe(false);
    expect(whitespace[0]!.toneBias).toBe("lucidez");

    const nulled = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      () => null,
    );
    expect(nulled[0]!.lineSource).toBeUndefined();
    expect("lineSource" in nulled[0]!).toBe(false);
    expect(nulled[0]!.toneBias).toBe("lucidez");

    const unset = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      () => undefined,
    );
    expect(unset[0]!.lineSource).toBeUndefined();
    expect("lineSource" in unset[0]!).toBe(false);

    const unknown = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      () => "STUB",
    );
    expect(unknown[0]!.lineSource).toBeUndefined();
    expect("lineSource" in unknown[0]!).toBe(false);
    expect(unknown[0]!.memorySummary).toBe(expectedMem);
    expect(unknown[0]!.toneBias).toBe("lucidez");
    expect(unknown[0]!.moodBias).toBe("lucidez");

    const bancoHud = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      () => "BANCO",
    );
    expect(bancoHud[0]!.lineSource).toBeUndefined();
    expect("lineSource" in bancoHud[0]!).toBe(false);

    speech.forceSpeak("p1", "lucidez", "una línea", "dialogue", "bank");
    expect(speech.getActive("p1")?.lineSource).toBe("bank");
    const bank = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
    );
    expect(bank[0]!.lineSource).toBe("bank");
    expect(bank[0]!.memorySummary).toBe(expectedMem);
    expect(bank[0]!.toneBias).toBe("lucidez");
    expect(bank[0]!.moodBias).toBe("lucidez");
    expect(bank[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(bank[0]!.lastRejected).toEqual(["offer_food"]);
    expect(bank[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(bank[0]!.trust).toBe(65);
    expect(bank[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(bank[0]!.speedBumpLeft).toBe(0);
    expect(bank[0]!.speedBumpMul).toBe(1);
    expect(bank[0]!.pacified).toBe(true);
    expect("line" in bank[0]!).toBe(false);

    const viaGetter = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      (id) => speech.getActive(id)?.lineSource,
    );
    expect(viaGetter[0]!.lineSource).toBe("bank");
    expect(viaGetter[0]!.memorySummary).toBe(expectedMem);
    expect(viaGetter[0]!.toneBias).toBe("lucidez");
    expect(viaGetter[0]!.moodBias).toBe("lucidez");

    speech.forceSpeak("p1", "lucidez", "otra línea", "dialogue", "llm");
    expect(speech.getActive("p1")?.lineSource).toBe("llm");
    const llm = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
    );
    expect(llm[0]!.lineSource).toBe("llm");
    expect(llm[0]!.memorySummary).toBe(expectedMem);
    expect(llm[0]!.toneBias).toBe("lucidez");
    expect(llm[0]!.moodBias).toBe("lucidez");
    expect(llm[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(llm[0]!.lastRejected).toEqual(["offer_food"]);
    expect(llm[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(llm[0]!.trust).toBe(65);
    expect(llm[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(llm[0]!.speedBumpLeft).toBe(0);
    expect(llm[0]!.speedBumpMul).toBe(1);
    expect(llm[0]!.pacified).toBe(true);
    expect("line" in llm[0]!).toBe(false);

    const stillSix = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
    );
    expect(stillSix[0]!.lineSource).toBeUndefined();
    expect("lineSource" in stillSix[0]!).toBe(false);
    expect(stillSix[0]!.memorySummary).toBe(expectedMem);
    expect(stillSix[0]!.toneBias).toBe("lucidez");
    expect(stillSix[0]!.moodBias).toBe("lucidez");

    const unregistered = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      new SpeechDirector({}, () => 0.5),
    );
    expect(unregistered[0]!.lineSource).toBeUndefined();
    expect("lineSource" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.memorySummary).toBe(expectedMem);
    expect(unregistered[0]!.toneBias).toBe("lucidez");
    expect(unregistered[0]!.moodBias).toBe("lucidez");

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
    );
    expect(afterTtl[0]!.lineSource).toBe("llm");
    expect(afterTtl[0]!.memorySummary).toBe(expectedMem);
    expect(afterTtl[0]!.toneBias).toBe("lucidez");
    expect(afterTtl[0]!.moodBias).toBe("lucidez");
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
  });

  test("collector: line presente (getActive / compactLlmLine); unset/sin utterance/vacío/whitespace/omitido omitido; over-cap truncado; lineSource/memorySummary/toneBias/moodBias/tags/gateLine/trust/TTL sin cambio", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);
    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");
    const speech = new SpeechDirector({}, () => 0.5);
    speech.setMoodBias("p1", "lucidez");
    const mem = new ShortMemory();
    mem.remember("p1", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    expect(mem.toneBias("p1")).toBe("lucidez");
    const expectedMem = formatMemorySummary(mem.recent("p1"));
    expect(expectedMem).toBe("preguntar/lucidez/+6");

    const threeArg = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(threeArg[0]!.line).toBeUndefined();
    expect("line" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.lineSource).toBeUndefined();
    expect(threeArg[0]!.memorySummary).toBeUndefined();
    expect(threeArg[0]!.toneBias).toBeUndefined();
    expect(threeArg[0]!.moodBias).toBeUndefined();
    expect(threeArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(threeArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(threeArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(threeArg[0]!.trust).toBe(65);
    expect(threeArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(threeArg[0]!.speedBumpLeft).toBe(0);
    expect(threeArg[0]!.speedBumpMul).toBe(1);
    expect(threeArg[0]!.pacified).toBe(true);

    const fourArg = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(fourArg[0]!.line).toBeUndefined();
    expect("line" in fourArg[0]!).toBe(false);
    expect(fourArg[0]!.lineSource).toBeUndefined();
    expect(fourArg[0]!.memorySummary).toBeUndefined();
    expect(fourArg[0]!.toneBias).toBeUndefined();
    expect(fourArg[0]!.moodBias).toBe("lucidez");
    expect(fourArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fourArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fourArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fourArg[0]!.trust).toBe(65);
    expect(fourArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fourArg[0]!.speedBumpLeft).toBe(0);
    expect(fourArg[0]!.speedBumpMul).toBe(1);
    expect(fourArg[0]!.pacified).toBe(true);

    const fiveArg = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(fiveArg[0]!.line).toBeUndefined();
    expect("line" in fiveArg[0]!).toBe(false);
    expect(fiveArg[0]!.lineSource).toBeUndefined();
    expect(fiveArg[0]!.memorySummary).toBeUndefined();
    expect(fiveArg[0]!.toneBias).toBe("lucidez");
    expect(fiveArg[0]!.moodBias).toBe("lucidez");
    expect(fiveArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fiveArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fiveArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fiveArg[0]!.trust).toBe(65);
    expect(fiveArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fiveArg[0]!.speedBumpLeft).toBe(0);
    expect(fiveArg[0]!.speedBumpMul).toBe(1);
    expect(fiveArg[0]!.pacified).toBe(true);

    const sixArg = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
    );
    expect(sixArg[0]!.line).toBeUndefined();
    expect("line" in sixArg[0]!).toBe(false);
    expect(sixArg[0]!.lineSource).toBeUndefined();
    expect(sixArg[0]!.memorySummary).toBe(expectedMem);
    expect(sixArg[0]!.toneBias).toBe("lucidez");
    expect(sixArg[0]!.moodBias).toBe("lucidez");
    expect(sixArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(sixArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(sixArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(sixArg[0]!.trust).toBe(65);
    expect(sixArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(sixArg[0]!.speedBumpLeft).toBe(0);
    expect(sixArg[0]!.speedBumpMul).toBe(1);
    expect(sixArg[0]!.pacified).toBe(true);

    expect(speech.getActive("p1")).toBeNull();
    const noUtterance = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
    );
    expect(noUtterance[0]!.line).toBeUndefined();
    expect("line" in noUtterance[0]!).toBe(false);
    expect(noUtterance[0]!.lineSource).toBeUndefined();
    expect(noUtterance[0]!.memorySummary).toBe(expectedMem);
    expect(noUtterance[0]!.toneBias).toBe("lucidez");
    expect(noUtterance[0]!.moodBias).toBe("lucidez");
    expect(noUtterance[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(noUtterance[0]!.lastRejected).toEqual(["offer_food"]);
    expect(noUtterance[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(noUtterance[0]!.trust).toBe(65);

    const blank = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      () => "",
    );
    expect(blank[0]!.line).toBeUndefined();
    expect("line" in blank[0]!).toBe(false);
    expect(blank[0]!.memorySummary).toBe(expectedMem);
    expect(blank[0]!.toneBias).toBe("lucidez");
    expect(blank[0]!.moodBias).toBe("lucidez");

    const whitespace = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      () => "   \n\t  ",
    );
    expect(whitespace[0]!.line).toBeUndefined();
    expect("line" in whitespace[0]!).toBe(false);
    expect(whitespace[0]!.toneBias).toBe("lucidez");

    const nulled = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      () => null,
    );
    expect(nulled[0]!.line).toBeUndefined();
    expect("line" in nulled[0]!).toBe(false);
    expect(nulled[0]!.toneBias).toBe("lucidez");

    const unset = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      () => undefined,
    );
    expect(unset[0]!.line).toBeUndefined();
    expect("line" in unset[0]!).toBe(false);

    speech.forceSpeak("p1", "lucidez", "una línea", "dialogue", "bank");
    expect(speech.getActive("p1")?.line).toBe("una línea");
    expect(compactLlmLine("una línea")).toBe("una línea");

    const sevenArg = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
    );
    expect(sevenArg[0]!.line).toBeUndefined();
    expect("line" in sevenArg[0]!).toBe(false);
    expect(sevenArg[0]!.lineSource).toBe("bank");
    expect(sevenArg[0]!.memorySummary).toBe(expectedMem);
    expect(sevenArg[0]!.toneBias).toBe("lucidez");
    expect(sevenArg[0]!.moodBias).toBe("lucidez");
    expect(sevenArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(sevenArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(sevenArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(sevenArg[0]!.trust).toBe(65);
    expect(sevenArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(sevenArg[0]!.speedBumpLeft).toBe(0);
    expect(sevenArg[0]!.speedBumpMul).toBe(1);
    expect(sevenArg[0]!.pacified).toBe(true);

    const spoken = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
    );
    expect(spoken[0]!.line).toBe(compactLlmLine(speech.getActive("p1")?.line));
    expect(spoken[0]!.line).toBe("una línea");
    expect(spoken[0]!.lineSource).toBe("bank");
    expect(spoken[0]!.memorySummary).toBe(expectedMem);
    expect(spoken[0]!.toneBias).toBe("lucidez");
    expect(spoken[0]!.moodBias).toBe("lucidez");
    expect(spoken[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(spoken[0]!.lastRejected).toEqual(["offer_food"]);
    expect(spoken[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(spoken[0]!.trust).toBe(65);
    expect(spoken[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(spoken[0]!.speedBumpLeft).toBe(0);
    expect(spoken[0]!.speedBumpMul).toBe(1);
    expect(spoken[0]!.pacified).toBe(true);

    const viaGetter = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      (id) => speech.getActive(id)?.line,
    );
    expect(viaGetter[0]!.line).toBe(compactLlmLine("una línea"));
    expect(viaGetter[0]!.line).toBe("una línea");
    expect(viaGetter[0]!.lineSource).toBe("bank");
    expect(viaGetter[0]!.memorySummary).toBe(expectedMem);
    expect(viaGetter[0]!.toneBias).toBe("lucidez");
    expect(viaGetter[0]!.moodBias).toBe("lucidez");

    const stillSeven = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
    );
    expect(stillSeven[0]!.line).toBeUndefined();
    expect("line" in stillSeven[0]!).toBe(false);
    expect(stillSeven[0]!.lineSource).toBe("bank");
    expect(stillSeven[0]!.memorySummary).toBe(expectedMem);
    expect(stillSeven[0]!.toneBias).toBe("lucidez");
    expect(stillSeven[0]!.moodBias).toBe("lucidez");

    const long = "x".repeat(LLM_LINE_MAX_LEN + 8);
    const expectedLong = compactLlmLine(long);
    expect(expectedLong).toBe("x".repeat(LLM_LINE_MAX_LEN));
    expect(expectedLong!.length).toBe(LLM_LINE_MAX_LEN);
    const overCap = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      () => long,
    );
    expect(overCap[0]!.line).toBe(expectedLong);
    expect(overCap[0]!.line!.length).toBe(LLM_LINE_MAX_LEN);
    expect(overCap[0]!.line).toBe(compactLlmLine(long));
    expect(overCap[0]!.lineSource).toBe("bank");
    expect(overCap[0]!.memorySummary).toBe(expectedMem);
    expect(overCap[0]!.toneBias).toBe("lucidez");
    expect(overCap[0]!.moodBias).toBe("lucidez");
    expect(overCap[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(overCap[0]!.lastRejected).toEqual(["offer_food"]);
    expect(overCap[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(overCap[0]!.trust).toBe(65);
    expect(overCap[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(overCap[0]!.speedBumpLeft).toBe(0);
    expect(overCap[0]!.speedBumpMul).toBe(1);
    expect(overCap[0]!.pacified).toBe(true);

    speech.forceSpeak("p1", "lucidez", long, "dialogue", "llm");
    expect(speech.getActive("p1")?.line).toBe(long);
    const overCapViaSpeech = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
    );
    expect(overCapViaSpeech[0]!.line).toBe(compactLlmLine(long));
    expect(overCapViaSpeech[0]!.line!.length).toBe(LLM_LINE_MAX_LEN);
    expect(overCapViaSpeech[0]!.lineSource).toBe("llm");
    expect(overCapViaSpeech[0]!.memorySummary).toBe(expectedMem);
    expect(overCapViaSpeech[0]!.toneBias).toBe("lucidez");
    expect(overCapViaSpeech[0]!.moodBias).toBe("lucidez");

    const unregistered = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      new SpeechDirector({}, () => 0.5),
    );
    expect(unregistered[0]!.line).toBeUndefined();
    expect("line" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.lineSource).toBe("llm");
    expect(unregistered[0]!.memorySummary).toBe(expectedMem);
    expect(unregistered[0]!.toneBias).toBe("lucidez");
    expect(unregistered[0]!.moodBias).toBe("lucidez");

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
    );
    expect(afterTtl[0]!.line).toBe(compactLlmLine(long));
    expect(afterTtl[0]!.lineSource).toBe("llm");
    expect(afterTtl[0]!.memorySummary).toBe(expectedMem);
    expect(afterTtl[0]!.toneBias).toBe("lucidez");
    expect(afterTtl[0]!.moodBias).toBe("lucidez");
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(afterTtl[0]!.trust).toBe(65);
    expect(afterTtl[0]!.pacifiedLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpLeft).toBe(0);
    expect(afterTtl[0]!.speedBumpMul).toBe(1);
  });

  test("collector: tone presente (getActive / compactMoodBias lucidez/demonio/ruega); unset/sin utterance/unknown/omitido omitido; line/lineSource/memorySummary/toneBias/moodBias/tags/gateLine/trust/TTL sin cambio; moodBias distinto de utterance tone", () => {
    const ledger = new TrustLedger();
    ledger.register("p1", 65);
    const gates = new DialogueBehaviorGates();
    const proposal = proposeDialogueGates("calmar", ledger.get("p1"));
    gates.apply("p1", proposal);
    gates.restoreLastRejected("p1", ["offer_food"]);
    gates.restoreGateLine("p1", "código: aplicado (pacify_ttl)");
    const speech = new SpeechDirector({}, () => 0.5);
    speech.setMoodBias("p1", "lucidez");
    const mem = new ShortMemory();
    mem.remember("p1", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    expect(mem.toneBias("p1")).toBe("lucidez");
    const expectedMem = formatMemorySummary(mem.recent("p1"));
    expect(expectedMem).toBe("preguntar/lucidez/+6");

    const threeArg = collectPossessionFrom(ledger, gates, ["p1"]);
    expect(threeArg[0]!.tone).toBeUndefined();
    expect("tone" in threeArg[0]!).toBe(false);
    expect(threeArg[0]!.line).toBeUndefined();
    expect(threeArg[0]!.lineSource).toBeUndefined();
    expect(threeArg[0]!.memorySummary).toBeUndefined();
    expect(threeArg[0]!.toneBias).toBeUndefined();
    expect(threeArg[0]!.moodBias).toBeUndefined();
    expect(threeArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(threeArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(threeArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(threeArg[0]!.trust).toBe(65);
    expect(threeArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(threeArg[0]!.speedBumpLeft).toBe(0);
    expect(threeArg[0]!.speedBumpMul).toBe(1);
    expect(threeArg[0]!.pacified).toBe(true);

    const fourArg = collectPossessionFrom(ledger, gates, ["p1"], speech);
    expect(fourArg[0]!.tone).toBeUndefined();
    expect("tone" in fourArg[0]!).toBe(false);
    expect(fourArg[0]!.line).toBeUndefined();
    expect(fourArg[0]!.lineSource).toBeUndefined();
    expect(fourArg[0]!.memorySummary).toBeUndefined();
    expect(fourArg[0]!.toneBias).toBeUndefined();
    expect(fourArg[0]!.moodBias).toBe("lucidez");
    expect(fourArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fourArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fourArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fourArg[0]!.trust).toBe(65);
    expect(fourArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fourArg[0]!.speedBumpLeft).toBe(0);
    expect(fourArg[0]!.speedBumpMul).toBe(1);
    expect(fourArg[0]!.pacified).toBe(true);

    const fiveArg = collectPossessionFrom(ledger, gates, ["p1"], speech, mem);
    expect(fiveArg[0]!.tone).toBeUndefined();
    expect("tone" in fiveArg[0]!).toBe(false);
    expect(fiveArg[0]!.line).toBeUndefined();
    expect(fiveArg[0]!.lineSource).toBeUndefined();
    expect(fiveArg[0]!.memorySummary).toBeUndefined();
    expect(fiveArg[0]!.toneBias).toBe("lucidez");
    expect(fiveArg[0]!.moodBias).toBe("lucidez");
    expect(fiveArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(fiveArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(fiveArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(fiveArg[0]!.trust).toBe(65);
    expect(fiveArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(fiveArg[0]!.speedBumpLeft).toBe(0);
    expect(fiveArg[0]!.speedBumpMul).toBe(1);
    expect(fiveArg[0]!.pacified).toBe(true);

    const sixArg = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
    );
    expect(sixArg[0]!.tone).toBeUndefined();
    expect("tone" in sixArg[0]!).toBe(false);
    expect(sixArg[0]!.line).toBeUndefined();
    expect(sixArg[0]!.lineSource).toBeUndefined();
    expect(sixArg[0]!.memorySummary).toBe(expectedMem);
    expect(sixArg[0]!.toneBias).toBe("lucidez");
    expect(sixArg[0]!.moodBias).toBe("lucidez");
    expect(sixArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(sixArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(sixArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(sixArg[0]!.trust).toBe(65);
    expect(sixArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(sixArg[0]!.speedBumpLeft).toBe(0);
    expect(sixArg[0]!.speedBumpMul).toBe(1);
    expect(sixArg[0]!.pacified).toBe(true);

    expect(speech.getActive("p1")).toBeNull();
    const noUtterance = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      speech,
    );
    expect(noUtterance[0]!.tone).toBeUndefined();
    expect("tone" in noUtterance[0]!).toBe(false);
    expect(noUtterance[0]!.line).toBeUndefined();
    expect(noUtterance[0]!.lineSource).toBeUndefined();
    expect(noUtterance[0]!.memorySummary).toBe(expectedMem);
    expect(noUtterance[0]!.toneBias).toBe("lucidez");
    expect(noUtterance[0]!.moodBias).toBe("lucidez");
    expect(noUtterance[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(noUtterance[0]!.lastRejected).toEqual(["offer_food"]);
    expect(noUtterance[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(noUtterance[0]!.trust).toBe(65);

    const blank = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      () => "",
    );
    expect(blank[0]!.tone).toBeUndefined();
    expect("tone" in blank[0]!).toBe(false);
    expect(blank[0]!.memorySummary).toBe(expectedMem);
    expect(blank[0]!.toneBias).toBe("lucidez");
    expect(blank[0]!.moodBias).toBe("lucidez");

    const nulled = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      () => null,
    );
    expect(nulled[0]!.tone).toBeUndefined();
    expect("tone" in nulled[0]!).toBe(false);
    expect(nulled[0]!.toneBias).toBe("lucidez");

    const unset = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      () => undefined,
    );
    expect(unset[0]!.tone).toBeUndefined();
    expect("tone" in unset[0]!).toBe(false);

    const unknown = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      () => "wat",
    );
    expect(unknown[0]!.tone).toBeUndefined();
    expect("tone" in unknown[0]!).toBe(false);
    expect(compactMoodBias("wat")).toBe("");
    expect(unknown[0]!.toneBias).toBe("lucidez");
    expect(unknown[0]!.moodBias).toBe("lucidez");

    speech.forceSpeak("p1", "lucidez", "una línea", "dialogue", "bank");
    expect(speech.getActive("p1")?.tone).toBe("lucidez");
    expect(compactMoodBias(speech.getActive("p1")?.tone)).toBe("lucidez");

    const eightArg = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
    );
    expect(eightArg[0]!.tone).toBeUndefined();
    expect("tone" in eightArg[0]!).toBe(false);
    expect(eightArg[0]!.line).toBe("una línea");
    expect(eightArg[0]!.lineSource).toBe("bank");
    expect(eightArg[0]!.memorySummary).toBe(expectedMem);
    expect(eightArg[0]!.toneBias).toBe("lucidez");
    expect(eightArg[0]!.moodBias).toBe("lucidez");
    expect(eightArg[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(eightArg[0]!.lastRejected).toEqual(["offer_food"]);
    expect(eightArg[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(eightArg[0]!.trust).toBe(65);
    expect(eightArg[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(eightArg[0]!.speedBumpLeft).toBe(0);
    expect(eightArg[0]!.speedBumpMul).toBe(1);
    expect(eightArg[0]!.pacified).toBe(true);

    const spoken = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      speech,
    );
    expect(spoken[0]!.tone).toBe(compactMoodBias(speech.getActive("p1")?.tone));
    expect(spoken[0]!.tone).toBe("lucidez");
    expect(spoken[0]!.line).toBe("una línea");
    expect(spoken[0]!.lineSource).toBe("bank");
    expect(spoken[0]!.memorySummary).toBe(expectedMem);
    expect(spoken[0]!.toneBias).toBe("lucidez");
    expect(spoken[0]!.moodBias).toBe("lucidez");
    expect(spoken[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(spoken[0]!.lastRejected).toEqual(["offer_food"]);
    expect(spoken[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(spoken[0]!.trust).toBe(65);
    expect(spoken[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(spoken[0]!.speedBumpLeft).toBe(0);
    expect(spoken[0]!.speedBumpMul).toBe(1);
    expect(spoken[0]!.pacified).toBe(true);

    const viaGetter = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      (id) => speech.getActive(id)?.tone,
    );
    expect(viaGetter[0]!.tone).toBe(compactMoodBias("lucidez"));
    expect(viaGetter[0]!.tone).toBe("lucidez");
    expect(viaGetter[0]!.line).toBe("una línea");
    expect(viaGetter[0]!.lineSource).toBe("bank");
    expect(viaGetter[0]!.memorySummary).toBe(expectedMem);
    expect(viaGetter[0]!.toneBias).toBe("lucidez");
    expect(viaGetter[0]!.moodBias).toBe("lucidez");

    const stillEight = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
    );
    expect(stillEight[0]!.tone).toBeUndefined();
    expect("tone" in stillEight[0]!).toBe(false);
    expect(stillEight[0]!.line).toBe("una línea");
    expect(stillEight[0]!.lineSource).toBe("bank");
    expect(stillEight[0]!.memorySummary).toBe(expectedMem);
    expect(stillEight[0]!.toneBias).toBe("lucidez");
    expect(stillEight[0]!.moodBias).toBe("lucidez");

    speech.forceSpeak("p1", "demonio", "otra línea", "dialogue", "bank");
    speech.setMoodBias("p1", "lucidez");
    expect(speech.getActive("p1")?.tone).toBe("demonio");
    expect(speech.getMoodBias("p1")).toBe("lucidez");
    const mixed = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      speech,
    );
    expect(mixed[0]!.tone).toBe("demonio");
    expect(mixed[0]!.moodBias).toBe("lucidez");
    expect(mixed[0]!.tone).not.toBe(mixed[0]!.moodBias);
    expect(mixed[0]!.line).toBe("otra línea");
    expect(mixed[0]!.lineSource).toBe("bank");
    expect(mixed[0]!.memorySummary).toBe(expectedMem);
    expect(mixed[0]!.toneBias).toBe("lucidez");
    expect(mixed[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(mixed[0]!.lastRejected).toEqual(["offer_food"]);
    expect(mixed[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(mixed[0]!.trust).toBe(65);
    expect(mixed[0]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(mixed[0]!.speedBumpLeft).toBe(0);
    expect(mixed[0]!.speedBumpMul).toBe(1);
    expect(mixed[0]!.pacified).toBe(true);

    speech.forceSpeak("p1", "ruega", "ruega línea", "dialogue", "llm");
    speech.setMoodBias("p1", "lucidez");
    expect(speech.getActive("p1")?.tone).toBe("ruega");
    const plea = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      speech,
    );
    expect(plea[0]!.tone).toBe("ruega");
    expect(plea[0]!.moodBias).toBe("lucidez");
    expect(plea[0]!.line).toBe("ruega línea");
    expect(plea[0]!.lineSource).toBe("llm");
    expect(plea[0]!.memorySummary).toBe(expectedMem);
    expect(plea[0]!.toneBias).toBe("lucidez");
    expect(plea[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(plea[0]!.lastRejected).toEqual(["offer_food"]);
    expect(plea[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(plea[0]!.trust).toBe(65);

    const unregistered = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      new SpeechDirector({}, () => 0.5),
    );
    expect(unregistered[0]!.tone).toBeUndefined();
    expect("tone" in unregistered[0]!).toBe(false);
    expect(unregistered[0]!.line).toBe("ruega línea");
    expect(unregistered[0]!.lineSource).toBe("llm");
    expect(unregistered[0]!.memorySummary).toBe(expectedMem);
    expect(unregistered[0]!.toneBias).toBe("lucidez");
    expect(unregistered[0]!.moodBias).toBe("lucidez");

    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    const afterTtl = collectPossessionFrom(
      ledger,
      gates,
      ["p1"],
      speech,
      mem,
      mem,
      speech,
      speech,
      speech,
    );
    expect(afterTtl[0]!.tone).toBe("ruega");
    expect(afterTtl[0]!.line).toBe("ruega línea");
    expect(afterTtl[0]!.lineSource).toBe("llm");
    expect(afterTtl[0]!.memorySummary).toBe(expectedMem);
    expect(afterTtl[0]!.toneBias).toBe("lucidez");
    expect(afterTtl[0]!.moodBias).toBe("lucidez");
    expect(afterTtl[0]!.lastApplied).toEqual(["pacify_ttl"]);
    expect(afterTtl[0]!.lastRejected).toEqual(["offer_food"]);
    expect(afterTtl[0]!.gateLine).toBe("código: aplicado (pacify_ttl)");
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
