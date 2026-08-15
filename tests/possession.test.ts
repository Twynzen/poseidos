import { describe, expect, test } from "vitest";
import {
  LINE_BANK,
  POSSESSION_TONES,
  SpeechDirector,
  TrustLedger,
  TRUST_DEFAULT,
  TRUST_PACIFY,
  TRUST_AGGRO,
  DIALOGUE_OPTIONS,
  DIALOGUE_REACH,
  DialogueSession,
  ShortMemory,
  toneBiasFromEntries,
  applyDialogueChoice,
  applyDialogueChoiceAsync,
  nearestPossessed,
  clampTrust,
  isPacified,
  isAggressive,
  attitudeFromTrust,
  lineCount,
  pickLine,
  pickTone,
  StubLlmBridge,
  MemoryLlmFileIo,
  resolveLineWithBridge,
  proposeDialogueGates,
  DialogueBehaviorGates,
  GATE_CALM_MIN_TRUST,
  GATE_CALM_PACIFY_TTL,
  GATE_THREAT_MAX_TRUST,
  GATE_THREAT_SPEED_TTL,
  GATE_THREAT_SPEED_MUL,
  GATE_ASK_MIN_TRUST,
  GATE_ASK_EXTRA_TRUST,
  GATE_OFFER_MIN_TRUST,
  GATE_OFFER_PACIFY_TTL,
  GATE_DISTRACT_MIN_TRUST,
  GATE_DISTRACT_DEFAULT_OFFSET,
  capturePossession,
  normalizePossession,
  applyPossession,
  type LlmBridge,
} from "../src/possession";
import { NoiseBus } from "../src/world/noise";
import { DEFAULT_CONFIG, mergeConfig } from "../src/core/config";
import {
  HostileSim,
  defaultHostileSpawns,
  defaultPossessedSpawns,
} from "../src/ai";
import { makeFloor, makeWall } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { TOUCH_DAMAGE } from "../src/actors/body";

function corridorMap(): TileMap {
  const map = new TileMap(16, 5, makeFloor);
  for (let x = 0; x < 16; x++) {
    map.set(x, 0, makeWall());
    map.set(x, 4, makeWall());
  }
  return map;
}

/** RNG determinista: secuencia fija 0..n-1 / n. */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length]!;
    i++;
    return v;
  };
}

describe("lineBank", () => {
  test("tiene tonos lucidez / demonio / ruega con líneas en español", () => {
    expect(POSSESSION_TONES).toEqual(["lucidez", "demonio", "ruega"]);
    for (const tone of POSSESSION_TONES) {
      expect(LINE_BANK[tone].length).toBeGreaterThanOrEqual(3);
      for (const line of LINE_BANK[tone]) {
        expect(line.length).toBeGreaterThan(5);
        expect(/[áéíóúñ¿¡]|[A-Za-zÁÉÍÓÚÑ]{3,}/.test(line)).toBe(true);
      }
    }
    expect(lineCount()).toBeGreaterThanOrEqual(12);
  });

  test("pickLine / pickTone deterministas con RNG fijo", () => {
    const rng = seqRng([0, 0.5, 0.99, 0.1, 0.8]);
    const t1 = pickTone(rng);
    expect(POSSESSION_TONES).toContain(t1);
    const line = pickLine("demonio", seqRng([0]));
    expect(line).toBe(LINE_BANK.demonio[0]);
    const last = pickLine("ruega", seqRng([0.999]));
    expect(LINE_BANK.ruega).toContain(last);
  });
});

describe("SpeechDirector triggers", () => {
  test("habla al ver al player (see_player)", () => {
    const dir = new SpeechDirector(
      {
        displayDuration: 2,
        cooldown: 10,
        seePlayerCooldown: 10,
        periodicInterval: 100,
      },
      seqRng([0.1, 0.2, 0.3, 0.4, 0.5]),
    );
    dir.register("poss-a", "lucidez");
    dir.tick(3, [{ id: "poss-a", seesPlayer: true }]);
    const active = dir.getActive("poss-a");
    expect(active).not.toBeNull();
    expect(active!.trigger).toBe("see_player");
    expect(active!.line.length).toBeGreaterThan(5);
    expect(POSSESSION_TONES).toContain(active!.tone);
  });

  test("habla periódico si no ve al player", () => {
    const dir = new SpeechDirector(
      {
        displayDuration: 2,
        cooldown: 1,
        periodicInterval: 1,
        periodicJitter: 0,
        seePlayerCooldown: 1,
      },
      seqRng([0, 0, 0, 0, 0, 0, 0, 0]),
    );
    dir.register("poss-b", "demonio");
    let uttered = dir.tick(5, [{ id: "poss-b", seesPlayer: false }]);
    if (uttered.length === 0) {
      uttered = dir.tick(2, [{ id: "poss-b", seesPlayer: false }]);
    }
    expect(uttered.length).toBeGreaterThanOrEqual(1);
    expect(uttered[0]!.trigger).toBe("periodic");
    expect(uttered[0]!.entityId).toBe("poss-b");
  });

  test("respeta cooldown: no spam el mismo frame siguiente", () => {
    const dir = new SpeechDirector(
      {
        displayDuration: 3,
        cooldown: 5,
        seePlayerCooldown: 5,
        periodicInterval: 100,
      },
      seqRng([0.25, 0.25, 0.25, 0.25]),
    );
    dir.register("p", "ruega");
    const first = dir.tick(3, [{ id: "p", seesPlayer: true }]);
    expect(first.length).toBe(1);
    const second = dir.tick(0.5, [{ id: "p", seesPlayer: true }]);
    expect(second.length).toBe(0);
    expect(dir.getActive("p")?.line).toBe(first[0]!.line);
  });

  test("purga entidades ausentes del director", () => {
    const dir = new SpeechDirector({ periodicInterval: 100 }, () => 0.2);
    dir.register("gone");
    expect(dir.has("gone")).toBe(true);
    dir.tick(0.1, []);
    expect(dir.has("gone")).toBe(false);
  });

  test("forceSpeak dialogue sobrescribe bubble activo", () => {
    const dir = new SpeechDirector({ displayDuration: 4 }, () => 0.1);
    dir.register("poss-d", "lucidez");
    const u = dir.forceSpeak("poss-d", "demonio", "Tu miedo tiene buen sabor.", "dialogue");
    expect(u).not.toBeNull();
    expect(u!.trigger).toBe("dialogue");
    expect(dir.getActive("poss-d")?.tone).toBe("demonio");
    expect(dir.getActive("poss-d")?.line).toContain("miedo");
  });
});

describe("possessed coexist with mute hostiles", () => {
  test("kind possessed + mute en el mismo HostileSim", () => {
    const sim = new HostileSim({ speed: 0 });
    sim.add("mute-1", 2, 2);
    sim.add("poss-1", 3, 3, undefined, "possessed");
    expect(sim.hostiles.map((h) => h.kind)).toEqual(["mute", "possessed"]);
  });

  test("default spawns: mudos y ≥2 poseídos distintos", () => {
    const mutes = defaultHostileSpawns();
    const poss = defaultPossessedSpawns();
    expect(mutes.length).toBeGreaterThanOrEqual(2);
    expect(poss.length).toBeGreaterThanOrEqual(2);
    const ids = new Set([...mutes, ...poss].map((s) => s.id));
    expect(ids.size).toBe(mutes.length + poss.length);
  });

  test("poseído usa AI chase como muda cuando ve al player", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 10,
      hearRange: 0,
      speed: 4,
    });
    sim.add("poss-chaser", 2.5, 2.5, undefined, "possessed");
    for (let t = 0; t < 30; t++) {
      sim.tick(0.1, map, 10.5, 2.5);
    }
    const h = sim.hostiles[0]!;
    expect(h.kind).toBe("possessed");
    expect(h.mode).toBe("chase");
    expect(h.x).toBeGreaterThan(2.5);
  });
});

describe("trust ledger", () => {
  test("empieza en medio (50) y clampa 0–100", () => {
    const ledger = new TrustLedger();
    expect(ledger.register("poss-a")).toBe(TRUST_DEFAULT);
    expect(ledger.get("poss-a")).toBe(50);
    expect(clampTrust(-10)).toBe(0);
    expect(clampTrust(140)).toBe(100);
    expect(ledger.adjust("poss-a", 80)).toBe(100);
    expect(ledger.adjust("poss-a", -200)).toBe(0);
  });

  test("umbrales pacify / aggro", () => {
    expect(isPacified(TRUST_PACIFY)).toBe(true);
    expect(isPacified(TRUST_PACIFY - 1)).toBe(false);
    expect(isAggressive(TRUST_AGGRO)).toBe(true);
    expect(isAggressive(TRUST_AGGRO + 1)).toBe(false);
    expect(attitudeFromTrust(80).pacified).toBe(true);
    expect(attitudeFromTrust(80).damageMul).toBe(0);
    expect(attitudeFromTrust(10).speedMul).toBeGreaterThan(1);
    expect(attitudeFromTrust(10).damageMul).toBe(1);
    expect(attitudeFromTrust(10).attackCdMul).toBe(0.9);
    expect(attitudeFromTrust(50).speedMul).toBe(1);
  });
});

describe("dialogue choices", () => {
  test("opciones calmar/amenazar/preguntar/ofrecer/distraer con tonos", () => {
    const intents = DIALOGUE_OPTIONS.map((o) => o.intent).sort();
    expect(intents).toEqual([
      "amenazar",
      "calmar",
      "distraer",
      "ofrecer",
      "preguntar",
    ]);
    const by = Object.fromEntries(
      DIALOGUE_OPTIONS.map((o) => [o.intent, o.tone]),
    );
    expect(by.calmar).toBe("ruega");
    expect(by.amenazar).toBe("demonio");
    expect(by.preguntar).toBe("lucidez");
    expect(by.ofrecer).toBe("ruega");
    expect(by.distraer).toBe("demonio");
  });

  test("applyDialogueChoice aplica trust y elige línea del banco (sin LLM)", () => {
    const ledger = new TrustLedger();
    ledger.register("poss-a", 50);
    const calm = applyDialogueChoice(
      ledger,
      "poss-a",
      "calmar",
      seqRng([0]),
    );
    expect(calm.tone).toBe("ruega");
    expect(calm.line).toBe(LINE_BANK.ruega[0]);
    expect(calm.trustAfter).toBe(50 + calm.trustDelta);
    expect(calm.trustAfter).toBeGreaterThan(50);

    const threat = applyDialogueChoice(
      ledger,
      "poss-a",
      "amenazar",
      seqRng([0]),
    );
    expect(threat.tone).toBe("demonio");
    expect(threat.line).toBe(LINE_BANK.demonio[0]);
    expect(threat.trustAfter).toBeLessThan(calm.trustAfter);

    const ask = applyDialogueChoice(
      ledger,
      "poss-a",
      "preguntar",
      seqRng([0]),
    );
    expect(ask.tone).toBe("lucidez");
    expect(LINE_BANK.lucidez).toContain(ask.line);
  });

  test("nearestPossessed respeta reach y ignora mudos", () => {
    const hostiles = [
      { id: "mute-a", x: 1, y: 1, kind: "mute" },
      { id: "poss-far", x: 10, y: 10, kind: "possessed" },
      { id: "poss-near", x: 2.2, y: 1.1, kind: "possessed" },
    ];
    const near = nearestPossessed(hostiles, 1, 1, DIALOGUE_REACH);
    expect(near?.id).toBe("poss-near");
    expect(nearestPossessed(hostiles, 1, 1, 0.5)).toBeNull();
  });

  test("DialogueSession cierra si se aleja", () => {
    const session = new DialogueSession();
    session.begin("poss-a");
    expect(session.open).toBe(true);
    const ok = session.validate(
      [{ id: "poss-a", x: 1, y: 1, kind: "possessed" }],
      1.2,
      1.1,
    );
    expect(ok).toBe(true);
    const far = session.validate(
      [{ id: "poss-a", x: 1, y: 1, kind: "possessed" }],
      20,
      20,
    );
    expect(far).toBe(false);
    expect(session.open).toBe(false);
  });
});

describe("trust → AI hostility", () => {
  test("trust alto: poseído no chase ni ataca", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 10,
      hearRange: 0,
      speed: 4,
      touchRange: 0.8,
      touchDamage: TOUCH_DAMAGE,
    });
    sim.add("poss-calm", 5.5, 2.5, undefined, "possessed");
    const ledger = new TrustLedger();
    ledger.register("poss-calm", 85);
    expect(isPacified(ledger.get("poss-calm"))).toBe(true);

    for (let t = 0; t < 25; t++) {
      const hits = sim.tick(
        0.1,
        map,
        5.5,
        2.5,
        null,
        ledger.attitudes(),
      );
      expect(hits.length).toBe(0);
    }
    expect(sim.hostiles[0]!.mode).toBe("wander");
  });

  test("trust muy bajo: fear es speedMul, no burst DPS", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 10,
      hearRange: 0,
      speed: 0,
      touchRange: 0.8,
      touchDamage: TOUCH_DAMAGE,
      attackCooldown: 1,
    });
    sim.add("poss-rage", 5.5, 2.5, undefined, "possessed");
    const ledger = new TrustLedger();
    ledger.register("poss-rage", 10);
    const att = ledger.attitude("poss-rage");
    expect(att.damageMul).toBe(1);
    expect(att.attackCdMul).toBe(0.9);
    expect(att.speedMul).toBeGreaterThan(1);

    const hits = sim.tick(0.1, map, 5.5, 2.5, null, ledger.attitudes());
    expect(hits.length).toBe(1);
    expect(hits[0]!.damage).toBe(TOUCH_DAMAGE);

    // attackCdMul 0.9 → siguiente hit a 0.9s, no burst a 0.7s
    const tooEarly = sim.tick(0.7, map, 5.5, 2.5, null, ledger.attitudes());
    expect(tooEarly.length).toBe(0);
    const onCd = sim.tick(0.21, map, 5.5, 2.5, null, ledger.attitudes());
    expect(onCd.length).toBe(1);
    expect(onCd[0]!.damage).toBe(TOUCH_DAMAGE);
  });

  test("mudos ignoran attitudes ajenas (combat intacto)", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      touchRange: 0.8,
      touchDamage: TOUCH_DAMAGE,
      attackCooldown: 0.5,
      speed: 0,
      visionRange: 20,
    });
    sim.add("mute-biter", 5.5, 2.5);
    // Attitude solo para otro id — muda debe pegar normal
    const attitudes = new Map([
      ["other", attitudeFromTrust(100)],
    ]);
    const hits = sim.tick(0.1, map, 5.5, 2.5, null, attitudes);
    expect(hits.length).toBe(1);
    expect(hits[0]!.damage).toBe(TOUCH_DAMAGE);
  });
});

describe("short memory", () => {
  test("guarda últimas N interacciones (quién, choice, trust delta)", () => {
    const mem = new ShortMemory(3);
    const ledger = new TrustLedger();
    ledger.register("poss-m", 50);
    applyDialogueChoice(ledger, "poss-m", "calmar", seqRng([0]), mem);
    applyDialogueChoice(ledger, "poss-m", "preguntar", seqRng([0]), mem);
    applyDialogueChoice(ledger, "poss-m", "amenazar", seqRng([0]), mem);
    applyDialogueChoice(ledger, "poss-m", "amenazar", seqRng([0]), mem);
    const recent = mem.recent("poss-m");
    expect(recent.length).toBe(3);
    expect(recent[0]!.intent).toBe("preguntar");
    expect(recent[2]!.intent).toBe("amenazar");
    expect(recent[2]!.who).toBe("player");
    expect(recent[2]!.trustDelta).toBeLessThan(0);
  });

  test("toneBias sesga a demonio tras amenazas repetidas", () => {
    const mem = new ShortMemory(5);
    mem.remember("p", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });
    mem.remember("p", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });
    mem.remember("p", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    expect(mem.toneBias("p")).toBe("demonio");
  });

  test("toneBias sesga a ruega tras calmar repetido", () => {
    const entries = [
      {
        who: "player" as const,
        intent: "calmar" as const,
        trustDelta: 14,
        tone: "ruega" as const,
      },
      {
        who: "player" as const,
        intent: "calmar" as const,
        trustDelta: 14,
        tone: "ruega" as const,
      },
    ];
    expect(toneBiasFromEntries(entries)).toBe("ruega");
  });

  test("sin historial no hay bias; setMoodBias actualiza SpeechDirector", () => {
    const mem = new ShortMemory();
    expect(mem.toneBias("ghost")).toBeUndefined();
    const dir = new SpeechDirector({}, () => 0.1);
    dir.register("poss-x", "lucidez");
    dir.setMoodBias("poss-x", "demonio");
    expect(dir.getMoodBias("poss-x")).toBe("demonio");
  });

  test("applyDialogueChoice sin memory no rompe trust/tonos", () => {
    const ledger = new TrustLedger();
    ledger.register("poss-z", 50);
    const r = applyDialogueChoice(ledger, "poss-z", "calmar", seqRng([0]));
    expect(r.tone).toBe("ruega");
    expect(r.trustAfter).toBe(64);
  });

  test("ids + restore reemplazan el buffer y omiten listas vacías", () => {
    const mem = new ShortMemory(3);
    mem.remember("p", {
      who: "player",
      intent: "calmar",
      trustDelta: 14,
      tone: "ruega",
    });
    expect(mem.ids()).toEqual(["p"]);
    mem.restore("p", [
      { who: "player", intent: "amenazar", trustDelta: -20, tone: "demonio" },
      { who: "player", intent: "preguntar", trustDelta: 6, tone: "lucidez" },
    ]);
    expect(mem.recent("p").map((e) => e.intent)).toEqual(["amenazar", "preguntar"]);
    mem.restore("p", [{ who: "", intent: "calmar", trustDelta: 14, tone: "ruega" }]);
    expect(mem.has("p")).toBe(false);
    expect(mem.ids()).toEqual([]);
  });
});

describe("llm bridge stub", () => {
  test("fallback al banco cuando bridge retorna null", async () => {
    const bridge = new StubLlmBridge({ response: null });
    const ledger = new TrustLedger();
    ledger.register("poss-llm", 50);
    const r = await applyDialogueChoiceAsync(
      ledger,
      "poss-llm",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(r.lineSource).toBe("bank");
    expect(r.line).toBe(LINE_BANK.ruega[0]);
    expect(r.trustAfter).toBe(64);
  });

  test("cuando stub responde string, se usa esa línea", async () => {
    const custom = "El vacío me dicta estas palabras.";
    const bridge = new StubLlmBridge({ response: custom });
    const ledger = new TrustLedger();
    ledger.register("poss-llm2", 50);
    const r = await applyDialogueChoiceAsync(
      ledger,
      "poss-llm2",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(r.lineSource).toBe("llm");
    expect(r.line).toBe(custom);
    expect(r.tone).toBe("demonio");
    // Trust sigue siendo del gate de código, no del LLM
    expect(r.trustAfter).toBe(30);
  });

  test("llm.enabled false no llama al bridge", async () => {
    let asks = 0;
    const bridge = new StubLlmBridge({
      responder: () => {
        asks += 1;
        return "no deberia verse";
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-off", 50);
    const r = await applyDialogueChoiceAsync(
      ledger,
      "poss-off",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: false, bridge },
    );
    expect(asks).toBe(0);
    expect(r.lineSource).toBe("bank");
    expect(r.line).toBe(LINE_BANK.lucidez[0]);
  });

  test("resolveLineWithBridge: enabled false usa fallback sin ask", async () => {
    let asks = 0;
    const bridge: LlmBridge = {
      ask: async () => {
        asks += 1;
        return "x";
      },
    };
    const out = await resolveLineWithBridge({
      enabled: false,
      bridge,
      snapshot: { entityId: "a", tone: "lucidez" },
      fallback: () => "banco",
    });
    expect(asks).toBe(0);
    expect(out).toEqual({ line: "banco", source: "bank" });
  });

  test("StubLlmBridge file IO: escribe ai-req y lee ai-resp", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const askP = bridge.ask({
      entityId: "poss-f",
      tone: "ruega",
      trigger: "dialogue",
      intent: "calmar",
    });
    // Esperar a que escriba el req
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    expect(files.requests.get(reqId)).toContain("poss-f");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo te oigo." }));
    const line = await askP;
    expect(line).toBe("Desde el archivo te oigo.");
  });

  test("StubLlmBridge file IO: timeout sin resp → null", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 20, pollMs: 5 });
    const line = await bridge.ask({ entityId: "x", tone: "demonio" });
    expect(line).toBeNull();
    expect(files.requests.size).toBe(1);
  });

  test("SpeechDirector.speakWithBridge usa LLM o banco", async () => {
    const bridge = new StubLlmBridge({ response: "Hablo por el puente." });
    const dirOn = new SpeechDirector(
      { llmEnabled: true, bridge, displayDuration: 2 },
      seqRng([0]),
    );
    const u = await dirOn.speakWithBridge("p1", "lucidez", "see_player");
    expect(u.line).toBe("Hablo por el puente.");
    expect(u.lineSource).toBe("llm");

    let asks = 0;
    const spy = new StubLlmBridge({
      responder: () => {
        asks += 1;
        return "no";
      },
    });
    const dirOff = new SpeechDirector(
      { llmEnabled: false, bridge: spy },
      seqRng([0]),
    );
    const u2 = await dirOff.speakWithBridge("p2", "demonio", "periodic");
    expect(asks).toBe(0);
    expect(u2.lineSource).toBe("bank");
    expect(LINE_BANK.demonio).toContain(u2.line);
  });

  test("DEFAULT_CONFIG.llm.enabled es false", () => {
    expect(DEFAULT_CONFIG.llm.enabled).toBe(false);
    const merged = mergeConfig({ llm: { enabled: true } });
    expect(merged.llm.enabled).toBe(true);
    expect(DEFAULT_CONFIG.llm.enabled).toBe(false);
  });
});


describe("dialogue → behavior gates", () => {
  test("calmar + trust alto: pacify TTL; bajo: rechaza", () => {
    const ok = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST);
    expect(ok.applied).toContain("pacify_ttl");
    expect(ok.pacifyTtl).toBe(GATE_CALM_PACIFY_TTL);
    expect(ok.emitThreatNoise).toBe(false);

    const no = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1);
    expect(no.rejected).toContain("pacify_ttl");
    expect(no.pacifyTtl).toBe(0);
  });

  test("amenazar + trust bajo: noise + chase + speed; alto: rechaza", () => {
    const ok = proposeDialogueGates("amenazar", GATE_THREAT_MAX_TRUST);
    expect(ok.applied).toEqual(
      expect.arrayContaining(["threat_noise", "threat_chase", "threat_speed"]),
    );
    expect(ok.emitThreatNoise).toBe(true);
    expect(ok.forceChase).toBe(true);
    expect(ok.speedBumpTtl).toBe(GATE_THREAT_SPEED_TTL);
    expect(ok.speedBumpMul).toBe(GATE_THREAT_SPEED_MUL);

    const no = proposeDialogueGates("amenazar", GATE_THREAT_MAX_TRUST + 1);
    expect(no.emitThreatNoise).toBe(false);
    expect(no.forceChase).toBe(false);
    expect(no.rejected).toContain("threat_noise");
  });

  test("preguntar + trust medio+: heal lucidez; bajo: rechaza", () => {
    const ok = proposeDialogueGates("preguntar", GATE_ASK_MIN_TRUST);
    expect(ok.extraTrustHeal).toBe(GATE_ASK_EXTRA_TRUST);
    expect(ok.lucidityBoost).toBe(true);
    expect(ok.applied).toEqual(
      expect.arrayContaining(["ask_heal", "ask_lucidity"]),
    );

    const no = proposeDialogueGates("preguntar", GATE_ASK_MIN_TRUST - 1);
    expect(no.extraTrustHeal).toBe(0);
    expect(no.lucidityBoost).toBe(false);
  });

  test("calmar real: applyDialogueChoice cruza umbral → pacifiedUntil en HostileSim", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 10,
      hearRange: 0,
      speed: 4,
      touchRange: 0.8,
      touchDamage: TOUCH_DAMAGE,
    });
    sim.add("poss-gate", 5.5, 2.5, undefined, "possessed");
    sim.hostiles[0]!.mode = "chase";

    const ledger = new TrustLedger();
    ledger.register("poss-gate", 50);
    const gates = new DialogueBehaviorGates();

    const choice = applyDialogueChoice(
      ledger,
      "poss-gate",
      "calmar",
      seqRng([0]),
    );
    // 50+14 = 64 ≥ 60
    expect(choice.trustAfter).toBeGreaterThanOrEqual(GATE_CALM_MIN_TRUST);
    const proposal = proposeDialogueGates(choice.intent, choice.trustAfter);
    expect(proposal.pacifyTtl).toBe(GATE_CALM_PACIFY_TTL);
    gates.apply("poss-gate", proposal);

    expect(gates.pacifiedLeft("poss-gate")).toBe(GATE_CALM_PACIFY_TTL);
    const atts = gates.mergeAttitudes(ledger.attitudes());
    expect(atts.get("poss-gate")!.pacified).toBe(true);

    for (let t = 0; t < 20; t++) {
      const hits = sim.tick(
        0.1,
        map,
        5.5,
        2.5,
        null,
        gates.mergeAttitudes(ledger.attitudes()),
      );
      expect(hits.length).toBe(0);
    }
    expect(sim.hostiles[0]!.mode).toBe("wander");

    // TTL expira → si trust < PACIFY, vuelve hostil
    gates.tick(GATE_CALM_PACIFY_TTL + 0.1);
    expect(gates.isPacifiedByGate("poss-gate")).toBe(false);
    // 64 < 70 → no pacify por trust
    expect(isPacified(ledger.get("poss-gate"))).toBe(false);
    const after = gates.mergeAttitudes(ledger.attitudes());
    expect(after.get("poss-gate")!.pacified).toBe(false);
  });

  test("amenazar real: noise en posición + speed bump; muda investiga", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      // Visión corta: muda no debe chasear por LOS; solo ruido
      visionRange: 1,
      hearRange: 0,
      speed: 3,
      touchRange: 0.5,
    });
    // Poseído a la derecha; muda a la izquierda; player fuera del FOV del muda
    // (seesPlayer usa tiles floor: mute@3 → tile 3; player@0.4 → tile 0; dist 3 > 1)
    sim.add("poss-threat", 8.5, 2.5, undefined, "possessed");
    sim.add("mute-near", 3.5, 2.5);

    const ledger = new TrustLedger();
    ledger.register("poss-threat", 50);
    const gates = new DialogueBehaviorGates();
    const noise = new NoiseBus();

    const choice = applyDialogueChoice(
      ledger,
      "poss-threat",
      "amenazar",
      seqRng([0]),
    );
    // 50-20 = 30 ≤ 40
    expect(choice.trustAfter).toBeLessThanOrEqual(GATE_THREAT_MAX_TRUST);
    const proposal = proposeDialogueGates(choice.intent, choice.trustAfter);
    expect(proposal.emitThreatNoise).toBe(true);
    gates.apply("poss-threat", proposal);

    const h = sim.get("poss-threat")!;
    noise.emitAttack(h.x, h.y);
    // Gate threat_chase: forzar chase inmediato (como game.ts)
    h.mode = "chase";
    h.investigateX = 0.4;
    h.investigateY = 2.5;
    expect(h.mode).toBe("chase");

    const mod = gates.mergeAttitude(
      "poss-threat",
      ledger.attitude("poss-threat"),
    );
    expect(mod.speedMul).toBe(GATE_THREAT_SPEED_MUL);
    expect(mod.pacified).toBe(false);

    // Muda oye el ruido del poseído amenazado (attack radius 10)
    expect(noise.heardFrom(3.5, 2.5)?.source).toBe("attack");

    sim.tick(
      0.15,
      map,
      0.4,
      2.5,
      noise,
      gates.mergeAttitudes(ledger.attitudes()),
    );
    expect(sim.get("mute-near")!.mode).toBe("investigate");

    // Con player a la vista del poseído: chase + speed bump activos
    h.mode = "chase";
    sim.tick(
      0.1,
      map,
      8.5,
      2.5,
      null,
      gates.mergeAttitudes(ledger.attitudes()),
    );
    expect(sim.get("poss-threat")!.mode).toBe("chase");

    gates.tick(GATE_THREAT_SPEED_TTL + 0.2);
    expect(gates.speedBumpLeft("poss-threat")).toBe(0);
    const cooled = gates.mergeAttitude(
      "poss-threat",
      ledger.attitude("poss-threat"),
    );
    // trust 30 ≤ AGGRO → speedMul trust 1.35, bump gone
    expect(cooled.speedMul).toBe(ledger.attitude("poss-threat").speedMul);
  });

  test("preguntar gated: heal trust extra + lucidez mood", () => {
    const ledger = new TrustLedger();
    ledger.register("poss-ask", 50);
    const speech = new SpeechDirector(
      { displayDuration: 2, cooldown: 10 },
      seqRng([0, 0.1, 0.2]),
    );
    speech.register("poss-ask", "demonio");

    const choice = applyDialogueChoice(
      ledger,
      "poss-ask",
      "preguntar",
      seqRng([0]),
    );
    // 50+6 = 56 ≥ 50
    expect(choice.trustAfter).toBe(56);
    const proposal = proposeDialogueGates(choice.intent, choice.trustAfter);
    expect(proposal.extraTrustHeal).toBe(GATE_ASK_EXTRA_TRUST);
    expect(proposal.lucidityBoost).toBe(true);

    const healed = ledger.adjust("poss-ask", proposal.extraTrustHeal);
    expect(healed).toBe(56 + GATE_ASK_EXTRA_TRUST);
    speech.setMoodBias("poss-ask", "lucidez");
    expect(speech.getMoodBias("poss-ask")).toBe("lucidez");
  });

  test("ofrecer + comida + trust alto: offer_food+offer_pacify, consumeFood, TTL 12", () => {
    const ok = proposeDialogueGates("ofrecer", GATE_OFFER_MIN_TRUST, {
      hasOfferFood: true,
    });
    expect(ok.applied).toEqual(
      expect.arrayContaining(["offer_food", "offer_pacify"]),
    );
    expect(ok.consumeFood).toBe(true);
    expect(ok.pacifyTtl).toBe(GATE_OFFER_PACIFY_TTL);
    expect(ok.pacifyTtl).toBe(12);
    expect(ok.rejected).toEqual([]);
  });

  test("ofrecer sin comida: rejected, consumeFood false", () => {
    const no = proposeDialogueGates("ofrecer", 80, { hasOfferFood: false });
    expect(no.rejected).toEqual(
      expect.arrayContaining(["offer_food", "offer_pacify"]),
    );
    expect(no.consumeFood).toBe(false);
    expect(no.pacifyTtl).toBe(0);
    expect(no.applied).toEqual([]);

    const missing = proposeDialogueGates("ofrecer", 80);
    expect(missing.consumeFood).toBe(false);
    expect(missing.rejected).toContain("offer_food");
  });

  test("ofrecer con comida pero trust bajo: rejected", () => {
    const no = proposeDialogueGates(
      "ofrecer",
      GATE_OFFER_MIN_TRUST - 1,
      { hasOfferFood: true },
    );
    expect(no.rejected).toContain("offer_food");
    expect(no.rejected).toContain("offer_pacify");
    expect(no.consumeFood).toBe(false);
    expect(no.pacifyTtl).toBe(0);
  });

  test("calmar/amenazar/preguntar/distraer: umbrales intactos (ctx ofrecer ignorado)", () => {
    const calm = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST, {
      hasOfferFood: true,
    });
    expect(calm.pacifyTtl).toBe(GATE_CALM_PACIFY_TTL);
    expect(calm.consumeFood).toBe(false);
    expect(calm.applied).toContain("pacify_ttl");
    expect(calm.applied).not.toContain("offer_food");
    expect(calm.emitDistractNoise).toBe(false);

    const threat = proposeDialogueGates("amenazar", GATE_THREAT_MAX_TRUST, {
      hasOfferFood: false,
    });
    expect(threat.emitThreatNoise).toBe(true);
    expect(threat.consumeFood).toBe(false);
    expect(threat.emitDistractNoise).toBe(false);

    const ask = proposeDialogueGates("preguntar", GATE_ASK_MIN_TRUST, {
      hasOfferFood: true,
    });
    expect(ask.extraTrustHeal).toBe(GATE_ASK_EXTRA_TRUST);
    expect(ask.consumeFood).toBe(false);
    expect(ask.emitDistractNoise).toBe(false);

    const distract = proposeDialogueGates("distraer", GATE_DISTRACT_MIN_TRUST, {
      hasOfferFood: true,
    });
    expect(distract.emitDistractNoise).toBe(true);
    expect(distract.consumeFood).toBe(false);
    expect(distract.forceChase).toBe(false);
  });


  test("distraer + trust alto: applied distract_noise+distract_lure + emitDistractNoise", () => {
    const ok = proposeDialogueGates("distraer", GATE_DISTRACT_MIN_TRUST);
    expect(ok.applied).toEqual(
      expect.arrayContaining(["distract_noise", "distract_lure"]),
    );
    expect(ok.emitDistractNoise).toBe(true);
    expect(ok.distractOffset).toEqual({
      dx: GATE_DISTRACT_DEFAULT_OFFSET.dx,
      dy: GATE_DISTRACT_DEFAULT_OFFSET.dy,
    });
    expect(ok.forceChase).toBe(false);
    expect(ok.emitThreatNoise).toBe(false);
    expect(ok.rejected).toEqual([]);
  });

  test("distraer + trust bajo: rejected, sin ruido señuelo", () => {
    const no = proposeDialogueGates("distraer", GATE_DISTRACT_MIN_TRUST - 1);
    expect(no.rejected).toEqual(
      expect.arrayContaining(["distract_noise", "distract_lure"]),
    );
    expect(no.emitDistractNoise).toBe(false);
    expect(no.distractOffset).toEqual({ dx: 0, dy: 0 });
    expect(no.applied).toEqual([]);
  });

  test("distraer real: applyDialogueChoice + noise far (sin chase player)", () => {
    const ledger = new TrustLedger();
    // 40-4 = 36 ≥ 35
    ledger.register("poss-distract", 40);
    const choice = applyDialogueChoice(
      ledger,
      "poss-distract",
      "distraer",
      seqRng([0]),
    );
    expect(choice.trustAfter).toBe(36);
    expect(choice.tone).toBe("demonio");
    const proposal = proposeDialogueGates(choice.intent, choice.trustAfter);
    expect(proposal.emitDistractNoise).toBe(true);
    expect(proposal.forceChase).toBe(false);

    const noise = new NoiseBus();
    // Simula game.ts: punto far por offset default
    const hx = 5;
    const hy = 5;
    const nx = hx + proposal.distractOffset.dx;
    const ny = hy + proposal.distractOffset.dy;
    noise.emitAttack(nx, ny);
    expect(noise.events[0]!.x).toBe(5);
    expect(noise.events[0]!.y).toBe(11);
    expect(noise.heardFrom(5, 11)?.source).toBe("attack");
  });

  test("ofrecer real: applyDialogueChoice + comida → pacify TTL vía gates", () => {
    const ledger = new TrustLedger();
    ledger.register("poss-offer", 40);
    const gates = new DialogueBehaviorGates();
    const choice = applyDialogueChoice(
      ledger,
      "poss-offer",
      "ofrecer",
      seqRng([0]),
    );
    // 40+10 = 50 ≥ 45
    expect(choice.trustAfter).toBe(50);
    expect(choice.tone).toBe("ruega");
    const proposal = proposeDialogueGates(choice.intent, choice.trustAfter, {
      hasOfferFood: true,
    });
    expect(proposal.consumeFood).toBe(true);
    expect(proposal.pacifyTtl).toBe(GATE_OFFER_PACIFY_TTL);
    gates.apply("poss-offer", proposal);
    expect(gates.pacifiedLeft("poss-offer")).toBe(GATE_OFFER_PACIFY_TTL);
    expect(gates.mergeAttitude("poss-offer", ledger.attitude("poss-offer")).pacified).toBe(
      true,
    );
  });

  test("apply records lastApplied; rejected no pisa; clear/unregister limpian", () => {
    const gates = new DialogueBehaviorGates();
    expect(gates.lastApplied("p")).toEqual([]);

    const calm = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST);
    gates.apply("p", calm);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates.pacifiedLeft("p")).toBe(GATE_CALM_PACIFY_TTL);

    const offer = proposeDialogueGates("ofrecer", GATE_OFFER_MIN_TRUST, {
      hasOfferFood: true,
    });
    gates.apply("p", offer);
    expect(gates.lastApplied("p")).toEqual(["offer_food", "offer_pacify"]);

    const rejected = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1);
    expect(rejected.applied).toEqual([]);
    gates.apply("p", rejected);
    expect(gates.lastApplied("p")).toEqual(["offer_food", "offer_pacify"]);
    expect(gates.pacifiedLeft("p")).toBe(GATE_OFFER_PACIFY_TTL);

    const ask = proposeDialogueGates("preguntar", GATE_ASK_MIN_TRUST);
    gates.apply("q", ask);
    expect(gates.lastApplied("q")).toEqual(["ask_heal", "ask_lucidity"]);

    gates.tick(GATE_CALM_PACIFY_TTL + GATE_OFFER_PACIFY_TTL + 1);
    expect(gates.pacifiedLeft("p")).toBe(0);
    expect(gates.lastApplied("p")).toEqual(["offer_food", "offer_pacify"]);
    expect(gates.lastApplied("q")).toEqual(["ask_heal", "ask_lucidity"]);

    gates.unregister("p");
    expect(gates.lastApplied("p")).toEqual([]);
    expect(gates.lastApplied("q")).toEqual(["ask_heal", "ask_lucidity"]);

    gates.clear();
    expect(gates.lastApplied("q")).toEqual([]);
  });

  test("apply records lastRejected; applied no pisa; clear/unregister limpian ambos", () => {
    const gates = new DialogueBehaviorGates();
    expect(gates.lastRejected("p")).toEqual([]);

    const rejectedCalm = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1);
    expect(rejectedCalm.applied).toEqual([]);
    expect(rejectedCalm.rejected).toEqual(["pacify_ttl"]);
    gates.apply("p", rejectedCalm);
    expect(gates.lastRejected("p")).toEqual(["pacify_ttl"]);
    expect(gates.lastApplied("p")).toEqual([]);

    const rejectedOffer = proposeDialogueGates("ofrecer", GATE_OFFER_MIN_TRUST);
    expect(rejectedOffer.rejected).toEqual(["offer_food", "offer_pacify"]);
    gates.apply("p", rejectedOffer);
    expect(gates.lastRejected("p")).toEqual(["offer_food", "offer_pacify"]);

    const applied = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST);
    expect(applied.rejected).toEqual([]);
    gates.apply("p", applied);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates.lastRejected("p")).toEqual(["offer_food", "offer_pacify"]);

    const rejectedAsk = proposeDialogueGates("preguntar", GATE_ASK_MIN_TRUST - 1);
    expect(rejectedAsk.applied).toEqual([]);
    gates.apply("p", rejectedAsk);
    expect(gates.lastRejected("p")).toEqual(["ask_heal", "ask_lucidity"]);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);

    const rejectedThreat = proposeDialogueGates(
      "amenazar",
      GATE_THREAT_MAX_TRUST + 1,
    );
    gates.apply("q", rejectedThreat);
    expect(gates.lastRejected("q")).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);

    gates.tick(GATE_CALM_PACIFY_TTL + 1);
    expect(gates.pacifiedLeft("p")).toBe(0);
    expect(gates.lastRejected("p")).toEqual(["ask_heal", "ask_lucidity"]);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates.lastRejected("q")).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);

    gates.unregister("p");
    expect(gates.lastRejected("p")).toEqual([]);
    expect(gates.lastApplied("p")).toEqual([]);
    expect(gates.lastRejected("q")).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);

    gates.clear();
    expect(gates.lastRejected("q")).toEqual([]);
    expect(gates.lastApplied("q")).toEqual([]);
  });
});

describe("possession persist (F5/F9)", () => {
  test("roundtrip trust + ambos TTLs + lucidez + memory; no persiste burbuja", () => {
    const ledger = new TrustLedger();
    const gates = new DialogueBehaviorGates();
    const speech = new SpeechDirector({}, () => 0.2);
    const memory = new ShortMemory();
    ledger.set("poss-a", 72);
    gates.apply("poss-a", proposeDialogueGates("calmar", 72));
    gates.apply("poss-a", proposeDialogueGates("amenazar", 20));
    speech.setMoodBias("poss-a", "lucidez");
    speech.forceSpeak("poss-a", "lucidez", "línea que no se guarda");
    memory.remember("poss-a", {
      who: "player",
      intent: "calmar",
      trustDelta: 14,
      tone: "ruega",
    });
    memory.remember("poss-a", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });

    const snap = capturePossession(ledger, gates, speech, memory);
    expect(snap.trust["poss-a"]).toBe(72);
    expect(snap.gates["poss-a"]).toEqual({
      pacifiedLeft: GATE_CALM_PACIFY_TTL,
      speedBumpLeft: GATE_THREAT_SPEED_TTL,
      speedBumpMul: GATE_THREAT_SPEED_MUL,
    });
    expect(snap.moodBias["poss-a"]).toBe("lucidez");
    expect(snap.memory["poss-a"]).toEqual([
      { who: "player", intent: "calmar", trustDelta: 14, tone: "ruega" },
      { who: "player", intent: "amenazar", trustDelta: -20, tone: "demonio" },
    ]);
    expect(JSON.stringify(snap)).not.toContain("línea que no se guarda");
    expect(snap.lastApplied["poss-a"]).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);
    expect(snap).not.toHaveProperty("lastRejected");

    const ledger2 = new TrustLedger();
    const gates2 = new DialogueBehaviorGates();
    const speech2 = new SpeechDirector({}, () => 0.8);
    const memory2 = new ShortMemory();
    ledger2.set("stale", 9);
    gates2.apply("stale", proposeDialogueGates("calmar", 80));
    memory2.remember("stale", {
      who: "player",
      intent: "calmar",
      trustDelta: 14,
      tone: "ruega",
    });
    expect(gates2.lastApplied("stale")).toEqual(["pacify_ttl"]);
    applyPossession(ledger2, gates2, speech2, memory2, snap);
    expect(ledger2.has("stale")).toBe(false);
    expect(gates2.pacifiedLeft("stale")).toBe(0);
    expect(memory2.has("stale")).toBe(false);
    expect(ledger2.get("poss-a")).toBe(72);
    expect(gates2.pacifiedLeft("poss-a")).toBe(GATE_CALM_PACIFY_TTL);
    expect(gates2.speedBumpLeft("poss-a")).toBe(GATE_THREAT_SPEED_TTL);
    expect(gates2.speedBumpMul("poss-a")).toBe(GATE_THREAT_SPEED_MUL);
    expect(speech2.getMoodBias("poss-a")).toBe("lucidez");
    expect(speech2.getActive("poss-a")).toBeNull();
    expect(memory2.recent("poss-a")).toEqual(snap.memory["poss-a"]);
    expect(memory2.toneBias("poss-a")).toBe("demonio");
    expect(gates2.lastApplied("poss-a")).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);
    expect(gates2.lastApplied("stale")).toEqual([]);
  });

  test("roundtrip lastApplied tras TTL 0; leftover lastApplied se reemplaza", () => {
    const ledger = new TrustLedger();
    const gates = new DialogueBehaviorGates();
    const speech = new SpeechDirector({}, () => 0.2);
    const memory = new ShortMemory();
    gates.apply("p", proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST));
    gates.tick(GATE_CALM_PACIFY_TTL + 1);
    expect(gates.pacifiedLeft("p")).toBe(0);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);

    const snap = capturePossession(ledger, gates, speech, memory);
    expect(snap.gates["p"]).toBeUndefined();
    expect(snap.lastApplied["p"]).toEqual(["pacify_ttl"]);

    const gates2 = new DialogueBehaviorGates();
    gates2.apply(
      "stale",
      proposeDialogueGates("ofrecer", GATE_OFFER_MIN_TRUST, {
        hasOfferFood: true,
      }),
    );
    expect(gates2.lastApplied("stale")).toEqual(["offer_food", "offer_pacify"]);
    applyPossession(
      new TrustLedger(),
      gates2,
      new SpeechDirector({}, () => 0.1),
      new ShortMemory(),
      snap,
    );
    expect(gates2.pacifiedLeft("p")).toBe(0);
    expect(gates2.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates2.lastApplied("stale")).toEqual([]);
  });

  test("blob viejo sin memory / lastApplied carga vacío; leftover ids se reemplazan", () => {
    const n = normalizePossession({
      trust: { a: 50 },
      gates: {},
      moodBias: { a: "ruega" },
    });
    expect(n.memory).toEqual({});
    expect(n.lastApplied).toEqual({});

    const memory = new ShortMemory();
    memory.remember("leftover", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    const leftoverGates = new DialogueBehaviorGates();
    leftoverGates.apply("leftover", proposeDialogueGates("calmar", 80));
    applyPossession(
      new TrustLedger(),
      leftoverGates,
      new SpeechDirector({}, () => 0.1),
      memory,
      n,
    );
    expect(memory.has("leftover")).toBe(false);
    expect(memory.ids()).toEqual([]);
    expect(memory.toneBias("a")).toBeUndefined();
    expect(leftoverGates.lastApplied("leftover")).toEqual([]);
  });

  test("normalize: clamp trust, descarta tono desconocido, omite TTL ≤ 0", () => {
    const n = normalizePossession({
      trust: { a: 150, b: -3, c: 50.4 },
      gates: {
        a: { pacifiedLeft: 8, speedBumpLeft: 0, speedBumpMul: 1.55 },
        b: { pacifiedLeft: 0, speedBumpLeft: 0, speedBumpMul: 2 },
        c: { pacifiedLeft: -1, speedBumpLeft: 3.5, speedBumpMul: 1.55 },
      },
      moodBias: { a: "lucidez", b: "scream", c: "demonio" },
    });
    expect(n.trust).toEqual({ a: 100, b: 0, c: 50 });
    expect(n.gates.a).toEqual({
      pacifiedLeft: 8,
      speedBumpLeft: 0,
      speedBumpMul: 1,
    });
    expect(n.gates.b).toBeUndefined();
    expect(n.gates.c).toEqual({
      pacifiedLeft: 0,
      speedBumpLeft: 3.5,
      speedBumpMul: 1.55,
    });
    expect(n.moodBias).toEqual({ a: "lucidez", c: "demonio" });
    expect(n.memory).toEqual({});
    expect(n.lastApplied).toEqual({});
  });

  test("normalize lastApplied: descarta tags desconocidos; omite listas vacías", () => {
    const n = normalizePossession({
      lastApplied: {
        "": ["pacify_ttl"],
        keep: ["pacify_ttl", "not_a_tag", "offer_food"],
        unknownOnly: ["scream", 12, null],
        empty: [],
        junk: "nope",
      },
    });
    expect(n.lastApplied[""]).toBeUndefined();
    expect(n.lastApplied.empty).toBeUndefined();
    expect(n.lastApplied.junk).toBeUndefined();
    expect(n.lastApplied.unknownOnly).toBeUndefined();
    expect(n.lastApplied.keep).toEqual(["pacify_ttl", "offer_food"]);
  });

  test("capturePossession no serializa lastRejected", () => {
    const gates = new DialogueBehaviorGates();
    gates.apply("p", proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1));
    expect(gates.lastRejected("p")).toEqual(["pacify_ttl"]);
    const snap = capturePossession(
      new TrustLedger(),
      gates,
      new SpeechDirector({}, () => 0.2),
      new ShortMemory(),
    );
    expect(snap).not.toHaveProperty("lastRejected");
    expect(Object.keys(snap)).toEqual([
      "trust",
      "gates",
      "moodBias",
      "memory",
      "lastApplied",
    ]);
    expect(snap.lastApplied).toEqual({});
  });

  test("normalize memory: descarta intent/tono/who/delta inválidos; recorta capacity", () => {
    const n = normalizePossession({
      memory: {
        "": [{ who: "player", intent: "calmar", trustDelta: 14, tone: "ruega" }],
        keep: [
          { who: "", intent: "calmar", trustDelta: 14, tone: "ruega" },
          { who: "player", intent: "scream", trustDelta: 14, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: 14, tone: "scream" },
          { who: "player", intent: "calmar", trustDelta: Number.NaN, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: Infinity, tone: "ruega" },
          { who: "player", intent: "preguntar", trustDelta: 6, tone: "lucidez" },
          { who: "player", intent: "amenazar", trustDelta: -20, tone: "demonio" },
        ],
        empty: [],
        junk: "nope",
        overflow: [
          { who: "player", intent: "calmar", trustDelta: 1, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: 2, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: 3, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: 4, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: 5, tone: "ruega" },
          { who: "player", intent: "calmar", trustDelta: 6, tone: "ruega" },
        ],
      },
    });
    expect(n.memory[""]).toBeUndefined();
    expect(n.memory.empty).toBeUndefined();
    expect(n.memory.junk).toBeUndefined();
    expect(n.memory.keep).toEqual([
      { who: "player", intent: "preguntar", trustDelta: 6, tone: "lucidez" },
      { who: "player", intent: "amenazar", trustDelta: -20, tone: "demonio" },
    ]);
    expect(n.memory.overflow?.map((e) => e.trustDelta)).toEqual([2, 3, 4, 5, 6]);
  });
});
