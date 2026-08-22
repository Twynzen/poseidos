import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  DIALOGUE_OPEN_HUD_PREFIX,
  DialogueSession,
  dialogueOpenHudMsg,
  nextDialogueCloseHud,
  talkInputApplies,
  applyTalkInput,
  cancelInputApplies,
  applyCancelInput,
  ShortMemory,
  formatMemorySummary,
  MEMORY_SUMMARY_MAX_LEN,
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
  formatLlmPrompt,
  compactLlmLine,
  LLM_LINE_MAX_LEN,
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
  GATE_LINE_MAX_LEN,
  capturePossession,
  normalizePossession,
  applyPossession,
  type LlmAskSnapshot,
  type LlmBridge,
} from "../src/possession";
import { formatGateLine } from "../src/ui/dialoguePanel";
import { NoiseBus } from "../src/world/noise";
import { DEFAULT_CONFIG, mergeConfig } from "../src/core/config";
import {
  HostileSim,
  defaultHostileSpawns,
  defaultPossessedSpawns,
  SPAWN_GRACE_SECONDS,
  loadAliveRuntime,
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
    expect(active!.lineSource).toBe("bank");
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
    expect(dir.getActive("poss-d")?.lineSource).toBe("bank");
    dir.forceSpeak("poss-d", "lucidez", "El puente habla.", "dialogue", "llm");
    expect(dir.getActive("poss-d")?.lineSource).toBe("llm");
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

  test("DialogueSession cierra si el target muere", () => {
    const session = new DialogueSession();
    session.begin("poss-a");
    const dead = session.validate([], 1.2, 1.1);
    expect(dead).toBe(false);
    expect(session.open).toBe(false);
  });
});

describe("nextDialogueCloseHud (T / Esc / validate HUD)", () => {
  test("T/Esc cierran: quita leftover diálogo id y pide refresh; Esc ya cerrado no-op", () => {
    const openMsg = dialogueOpenHudMsg("poss-a");
    expect(DIALOGUE_OPEN_HUD_PREFIX).toBe("diálogo ");
    expect(openMsg).toBe("diálogo poss-a");

    const viaT = nextDialogueCloseHud(true, openMsg);
    expect(viaT).toEqual({ closed: true, lastLootMsg: "" });

    const viaEsc = nextDialogueCloseHud(true, openMsg);
    expect(viaEsc).toEqual({ closed: true, lastLootMsg: "" });

    const alreadyClosed = nextDialogueCloseHud(false, openMsg);
    expect(alreadyClosed).toEqual({ closed: false, lastLootMsg: openMsg });

    const trustKeep = nextDialogueCloseHud(
      true,
      "calmar → trust 64 (+14)",
    );
    expect(trustKeep).toEqual({
      closed: true,
      lastLootMsg: "calmar → trust 64 (+14)",
    });

    const closedTrust = nextDialogueCloseHud(
      false,
      "calmar → trust 64 (+14)",
    );
    expect(closedTrust.closed).toBe(false);
    expect(closedTrust.lastLootMsg).toBe("calmar → trust 64 (+14)");
  });

  test("validate close: HUD como T/Esc; still-open no toca lastLootMsg", () => {
    const session = new DialogueSession();
    session.begin("poss-a");
    const openMsg = dialogueOpenHudMsg("poss-a");
    const trustMsg = "calmar → trust 64 (+14)";

    const keep = session.validate(
      [{ id: "poss-a", x: 1, y: 1, kind: "possessed" }],
      1.2,
      1.1,
    );
    expect(keep).toBe(true);
    expect(session.open).toBe(true);
    // Game: HUD solo si validate cerró (still-open = no llamar / no-op).
    const noSpam = session.open
      ? { closed: false, lastLootMsg: openMsg }
      : nextDialogueCloseHud(true, openMsg);
    expect(noSpam).toEqual({ closed: false, lastLootMsg: openMsg });
    expect(nextDialogueCloseHud(false, openMsg)).toEqual({
      closed: false,
      lastLootMsg: openMsg,
    });
    expect(nextDialogueCloseHud(false, trustMsg).lastLootMsg).toBe(trustMsg);

    const walk = session.validate(
      [{ id: "poss-a", x: 1, y: 1, kind: "possessed" }],
      20,
      20,
    );
    expect(walk).toBe(false);
    expect(session.open).toBe(false);
    const viaWalk = nextDialogueCloseHud(true, openMsg);
    expect(viaWalk).toEqual({ closed: true, lastLootMsg: "" });
    expect(nextDialogueCloseHud(true, trustMsg).lastLootMsg).toBe(trustMsg);

    session.begin("poss-a");
    const dead = session.validate([], 1.2, 1.1);
    expect(dead).toBe(false);
    expect(session.open).toBe(false);
    const viaDead = nextDialogueCloseHud(true, openMsg);
    expect(viaDead).toEqual({ closed: true, lastLootMsg: "" });
  });

  test("muerte con panel abierto: cierra como T/Esc; ya cerrado no-op; keepable causa se queda", () => {
    const session = new DialogueSession();
    const openMsg = dialogueOpenHudMsg("poss-a");
    const combat = "golpe -12 HP";
    const starve = "hambre te debilita";

    session.begin("poss-a");
    expect(session.open).toBe(true);
    const viaDeadOpen = nextDialogueCloseHud(true, openMsg);
    expect(viaDeadOpen).toEqual({ closed: true, lastLootMsg: "" });
    session.close();
    expect(session.open).toBe(false);

    const alreadyClosed = nextDialogueCloseHud(false, openMsg);
    expect(alreadyClosed).toEqual({ closed: false, lastLootMsg: openMsg });

    session.begin("poss-a");
    const viaCombat = nextDialogueCloseHud(true, combat);
    expect(viaCombat).toEqual({ closed: true, lastLootMsg: combat });
    session.close();

    const viaStarve = nextDialogueCloseHud(true, starve);
    expect(viaStarve).toEqual({ closed: true, lastLootMsg: starve });

    const closedCombat = nextDialogueCloseHud(false, combat);
    expect(closedCombat).toEqual({ closed: false, lastLootMsg: combat });
    expect(nextDialogueCloseHud(false, starve).lastLootMsg).toBe(starve);
  });

  test("F9 load-muerto con panel abierto: cierra como enterGameOver; ya cerrado no-op; load-vivo no cierra", () => {
    const session = new DialogueSession();
    const openMsg = dialogueOpenHudMsg("poss-a");
    const cargado = "cargado";

    session.begin("poss-a");
    expect(session.open).toBe(true);
    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    // doLoad: si gameOver, closeDialogueOnGameOver (salta enterGameOver).
    const viaDeadOpen = nextDialogueCloseHud(true, openMsg);
    expect(viaDeadOpen).toEqual({ closed: true, lastLootMsg: "" });
    session.close();
    expect(session.open).toBe(false);
    // doLoad pisa lastLootMsg con cargado (no leftover diálogo id).
    expect(cargado).toBe("cargado");
    expect(cargado.startsWith(DIALOGUE_OPEN_HUD_PREFIX)).toBe(false);

    const alreadyClosed = nextDialogueCloseHud(false, openMsg);
    expect(alreadyClosed).toEqual({ closed: false, lastLootMsg: openMsg });
    const closedCargado = nextDialogueCloseHud(false, cargado);
    expect(closedCargado).toEqual({ closed: false, lastLootMsg: cargado });

    session.begin("poss-a");
    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    // load-vivo no llama closeDialogueOnGameOver: panel y leftover se quedan.
    expect(session.open).toBe(true);
    expect(session.target).toBe("poss-a");
    const keepOpen = nextDialogueCloseHud(false, openMsg);
    expect(keepOpen).toEqual({ closed: false, lastLootMsg: openMsg });
    session.close();
  });

  test("Game T close y Esc close asignan lastLootMsg/hudAcc via nextDialogueCloseHud (sin lootToast)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("nextDialogueCloseHud(");
    expect(src).toContain("dialogueOpenHudMsg(");
    expect(src).toContain("this.lastLootMsg = dialogueOpenHudMsg(near.id)");
    const closeHits = src.match(/nextDialogueCloseHud\(/g);
    expect(closeHits?.length).toBe(4);
    expect(src).toMatch(
      /if \(this\.dialogue\.open\) \{[\s\S]{0,280}nextDialogueCloseHud\(true, this\.lastLootMsg\)[\s\S]{0,220}this\.hudAcc = 1/,
    );
    expect(src).toMatch(
      /cancelInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsCancel[\s\S]{0,200}nextDialogueCloseHud\(this\.dialogue\.open, this\.lastLootMsg\)[\s\S]{0,80}if \(next\.closed\) \{[\s\S]{0,280}this\.hudAcc = 1/,
    );
    expect(src).toMatch(
      /this\.dialogue\.validate\([\s\S]{0,180}if \(!this\.dialogue\.open\) \{[\s\S]{0,200}nextDialogueCloseHud\(true, this\.lastLootMsg\)[\s\S]{0,200}this\.hudAcc = 1/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,200}closeDialogueOnGameOver\(\)[\s\S]{0,280}isKeepableDeathCause[\s\S]{0,200}syncDialoguePanel/,
    );
    expect(src).toMatch(
      /if \(!this\.gameOver\) this\.enterGameOver\(\);[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)/,
    );
    expect(src).toMatch(
      /closeDialogueOnGameOver\(\): void \{[\s\S]{0,120}if \(!this\.dialogue\.open\) return;[\s\S]{0,80}nextDialogueCloseHud\(true, this\.lastLootMsg\)[\s\S]{0,220}this\.hudAcc = 1[\s\S]{0,80}syncDialoguePanel/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}this\.closeDialogueOnGameOver\(\);[\s\S]{0,80}if \(loaded\.gameOver\)/,
    );
    expect(src).toMatch(
      /this\.syncSpeechOverlay\(\);\s*this\.syncDialoguePanel\(\);[\s\S]{0,80}this\.hudAcc \+= dt/,
    );
    expect((src.match(/consumeTalk\(\)/g) ?? []).length).toBe(4);
    expect((src.match(/consumeCancel\(\)/g) ?? []).length).toBe(4);
    expect((src.match(/closeDialogueOnGameOver\(\)/g) ?? []).length).toBe(4);
    expect(src).not.toMatch(/tryToggleDialogue\(\)[\s\S]{0,900}lootToast/);
    expect(src).not.toMatch(/consumeCancel\(\)[\s\S]{0,400}lootToast/);
    expect(src).not.toMatch(/dialogue\.validate\([\s\S]{0,400}lootToast/);
    expect(src).not.toMatch(/enterGameOver\(\)[\s\S]{0,400}lootToast/);
    expect(src).not.toMatch(/doLoad\(\)[\s\S]{0,500}lootToast/);
  });
});

describe("talkInputApplies / applyTalkInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: T no aplica; vivo / load-vivo sí", () => {
    expect(talkInputApplies(true)).toBe(false);
    expect(talkInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(talkInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(talkInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsTalk no abre ni cierra diálogo; vivo T togglea", () => {
    const deadClosed = new DialogueSession();
    expect(
      applyTalkInput(true, true, () => {
        deadClosed.begin("poss-a");
        return deadClosed;
      }),
    ).toBeNull();
    expect(deadClosed.open).toBe(false);
    expect(deadClosed.target).toBeNull();

    const deadRt = loadAliveRuntime(false);
    expect(
      applyTalkInput(deadRt.gameOver, true, () => {
        deadClosed.begin("poss-a");
        return deadClosed;
      }),
    ).toBeNull();
    expect(deadClosed.open).toBe(false);

    const deadOpen = new DialogueSession();
    deadOpen.begin("poss-a");
    expect(
      applyTalkInput(true, true, () => {
        deadOpen.close();
        return deadOpen;
      }),
    ).toBeNull();
    expect(deadOpen.open).toBe(true);
    expect(deadOpen.target).toBe("poss-a");

    const live = new DialogueSession();
    const opened = applyTalkInput(false, true, () => {
      live.begin("poss-a");
      return live;
    });
    expect(opened?.open).toBe(true);
    expect(opened?.target).toBe("poss-a");
    expect(
      applyTalkInput(false, false, () => {
        live.close();
        return live;
      }),
    ).toBeNull();
    expect(live.open).toBe(true);

    const liveRt = loadAliveRuntime(true);
    const closed = applyTalkInput(liveRt.gameOver, true, () => {
      live.close();
      return live;
    });
    expect(closed?.open).toBe(false);
    expect(live.target).toBeNull();
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan T sin toggle; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("talkInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeTalk\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2600}consumeTalk\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,3000}if \(loaded\.gameOver\) this\.input\.consumeTalk\(\)/,
    );
    expect(gameSrc).toMatch(
      /talkInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsTalk[\s\S]{0,200}tryToggleDialogue/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tryToggleDialogue/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}tryToggleDialogue/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
  });
});

describe("cancelInputApplies / applyCancelInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: Esc no aplica; vivo / load-vivo sí", () => {
    expect(cancelInputApplies(true)).toBe(false);
    expect(cancelInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(cancelInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(cancelInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsCancel no cierra diálogo; vivo Esc cierra", () => {
    const deadClosed = new DialogueSession();
    expect(
      applyCancelInput(true, true, () => {
        deadClosed.close();
        return deadClosed;
      }),
    ).toBeNull();
    expect(deadClosed.open).toBe(false);
    expect(deadClosed.target).toBeNull();

    const deadRt = loadAliveRuntime(false);
    expect(
      applyCancelInput(deadRt.gameOver, true, () => {
        deadClosed.close();
        return deadClosed;
      }),
    ).toBeNull();
    expect(deadClosed.open).toBe(false);

    const deadOpen = new DialogueSession();
    deadOpen.begin("poss-a");
    expect(
      applyCancelInput(true, true, () => {
        deadOpen.close();
        return deadOpen;
      }),
    ).toBeNull();
    expect(deadOpen.open).toBe(true);
    expect(deadOpen.target).toBe("poss-a");

    const live = new DialogueSession();
    live.begin("poss-a");
    const closed = applyCancelInput(false, true, () => {
      live.close();
      return live;
    });
    expect(closed?.open).toBe(false);
    expect(live.target).toBeNull();
    expect(
      applyCancelInput(false, false, () => {
        live.begin("poss-a");
        return live;
      }),
    ).toBeNull();
    expect(live.open).toBe(false);

    const liveRt = loadAliveRuntime(true);
    const liveOpen = new DialogueSession();
    liveOpen.begin("poss-a");
    const closedLive = applyCancelInput(liveRt.gameOver, true, () => {
      liveOpen.close();
      return liveOpen;
    });
    expect(closedLive?.open).toBe(false);
    expect(liveOpen.target).toBeNull();
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan Esc sin apply; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("cancelInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeCancel\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2600}consumeCancel\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,3000}if \(loaded\.gameOver\) this\.input\.consumeCancel\(\)/,
    );
    expect(gameSrc).toMatch(
      /cancelInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsCancel[\s\S]{0,200}nextDialogueCloseHud/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}cancelInputApplies/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}cancelInputApplies/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
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

  test("formatMemorySummary compacta intent/tono/delta; vacío → \"\"", () => {
    expect(formatMemorySummary([])).toBe("");
    const mem = new ShortMemory();
    mem.remember("p", {
      who: "player",
      intent: "calmar",
      trustDelta: 14,
      tone: "ruega",
    });
    mem.remember("p", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });
    const summary = formatMemorySummary(mem.recent("p"));
    expect(summary).toContain("calmar");
    expect(summary).toContain("ruega");
    expect(summary).toContain("+14");
    expect(summary).toContain("amenazar");
    expect(summary).toContain("demonio");
    expect(summary).toContain("-20");
    expect(summary.length).toBeLessThanOrEqual(MEMORY_SUMMARY_MAX_LEN);
  });

  test("formatMemorySummary recorta a cap (~140) por recencia", () => {
    const many = Array.from({ length: 8 }, () => ({
      who: "player" as const,
      intent: "preguntar" as const,
      trustDelta: 6,
      tone: "lucidez" as const,
    }));
    const summary = formatMemorySummary(many, 40);
    expect(summary.length).toBeLessThanOrEqual(40);
    expect(summary).toContain("preguntar");
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

  test("compactLlmLine: null / no-string / whitespace se rechaza; ES se acepta; over-cap se trunca", () => {
    expect(compactLlmLine(null)).toBeNull();
    expect(compactLlmLine(undefined)).toBeNull();
    expect(compactLlmLine(12)).toBeNull();
    expect(compactLlmLine("")).toBeNull();
    expect(compactLlmLine("   \n\t  ")).toBeNull();
    expect(compactLlmLine("\u0000\u0001")).toBeNull();
    const es = "¿Sé quién soy… todavía? ¡Ayúdame!";
    expect(compactLlmLine(`  ${es}  `)).toBe(es);
    expect(compactLlmLine("Hola\n\nmundo")).toBe("Hola  mundo");
    expect(compactLlmLine("Hola\u0000 mundo")).toBe("Hola mundo");
    const long = "x".repeat(LLM_LINE_MAX_LEN + 8);
    expect(compactLlmLine(long)).toBe("x".repeat(LLM_LINE_MAX_LEN));
    expect(compactLlmLine(long)!.length).toBe(LLM_LINE_MAX_LEN);
  });

  test("línea vacía / whitespace / null del stub cae al banco", async () => {
    const ledger = new TrustLedger();
    ledger.register("poss-empty", 50);
    for (const response of [null, "", "   ", "\n\t"] as const) {
      const r = await applyDialogueChoiceAsync(
        ledger,
        "poss-empty",
        "calmar",
        seqRng([0]),
        undefined,
        { enabled: true, bridge: new StubLlmBridge({ response }) },
      );
      expect(r.lineSource).toBe("bank");
      expect(r.line).toBe(LINE_BANK.ruega[0]);
    }
    const raw: LlmBridge = { ask: async () => "\u0000\u0007" };
    const fromCtrl = await resolveLineWithBridge({
      enabled: true,
      bridge: raw,
      snapshot: { entityId: "poss-empty", tone: "ruega" },
      fallback: () => LINE_BANK.ruega[0],
    });
    expect(fromCtrl).toEqual({ line: LINE_BANK.ruega[0], source: "bank" });
  });

  test("línea ES normal del stub pasa como llm; over-cap se trunca", async () => {
    const es = "¿Sé quién soy… todavía? ¡Ayúdame!";
    const ledger = new TrustLedger();
    ledger.register("poss-gate-line", 50);
    const ok = await applyDialogueChoiceAsync(
      ledger,
      "poss-gate-line",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge: new StubLlmBridge({ response: `  ${es}  ` }) },
    );
    expect(ok.lineSource).toBe("llm");
    expect(ok.line).toBe(es);
    expect(ok.trustAfter).toBe(56);

    const long = "á".repeat(LLM_LINE_MAX_LEN + 12);
    const raw: LlmBridge = { ask: async () => long };
    const capped = await resolveLineWithBridge({
      enabled: true,
      bridge: raw,
      snapshot: { entityId: "poss-gate-line", tone: "lucidez" },
      fallback: () => "banco",
    });
    expect(capped.source).toBe("llm");
    expect(capped.line).toBe("á".repeat(LLM_LINE_MAX_LEN));
    expect(capped.line.length).toBe(LLM_LINE_MAX_LEN);
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

  test("file-io: solo line|say string; JSON inválido / sin clave / no-JSON / vacío → banco", async () => {
    const fallback = LINE_BANK.ruega[0];
    const snap = { entityId: "poss-parse", tone: "ruega" as const };
    const via = (body: string) =>
      resolveLineWithBridge({
        enabled: true,
        bridge: new StubLlmBridge({
          files: {
            writeRequest: async () => {},
            readResponse: async () => body,
          },
          timeoutMs: 25,
          pollMs: 5,
        }),
        snapshot: snap,
        fallback: () => fallback,
      });

    const fromLine = await via(JSON.stringify({ line: "  Desde line.  " }));
    expect(fromLine).toEqual({ line: "Desde line.", source: "llm" });

    const fromSay = await via(JSON.stringify({ say: "Desde say." }));
    expect(fromSay).toEqual({ line: "Desde say.", source: "llm" });

    const rejected = [
      JSON.stringify({ ok: true }),
      JSON.stringify({ line: 12 }),
      '{ "line": ',
      "texto plano",
      JSON.stringify({ line: "" }),
      JSON.stringify({ line: "   " }),
      JSON.stringify({ say: null }),
    ];
    for (const body of rejected) {
      const r = await via(body);
      expect(r).toEqual({ line: fallback, source: "bank" });
      expect(r.line).not.toBe(body);
      expect(r.line).not.toContain("{");
    }

    const ledger = new TrustLedger();
    ledger.register("poss-parse-ok", 50);
    const rawJson = await applyDialogueChoiceAsync(
      ledger,
      "poss-parse-ok",
      "calmar",
      seqRng([0]),
      undefined,
      {
        enabled: true,
        bridge: new StubLlmBridge({
          files: {
            writeRequest: async () => {},
            readResponse: async () => JSON.stringify({ ok: true }),
          },
          timeoutMs: 25,
          pollMs: 5,
        }),
      },
    );
    expect(rawJson.lineSource).toBe("bank");
    expect(rawJson.line).toBe(LINE_BANK.ruega[0]);
    expect(rawJson.line).not.toContain("ok");
    expect(rawJson.trustAfter).toBe(64);
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
    expect(dirOn.getActive("p1")?.lineSource).toBe("llm");

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
    expect(dirOff.getActive("p2")?.lineSource).toBe("bank");
    expect(LINE_BANK.demonio).toContain(u2.line);
  });

  test("formatLlmPrompt incluye intent, trust y memoria si hay", () => {
    const bare = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
    });
    expect(bare).toContain("lucidez");
    expect(bare).toContain("preguntar");
    expect(bare).toContain("56");
    expect(bare.toLowerCase()).not.toContain("memoria:");
    expect(bare.toLowerCase()).not.toContain("gate:");
    expect(bare.toLowerCase()).not.toContain("aplicado:");
    expect(bare.toLowerCase()).not.toContain("rechazado:");
    expect(bare.toLowerCase()).not.toContain("sesgo:");
    expect(bare.toLowerCase()).not.toContain("memoriatono:");
    expect(bare.toLowerCase()).not.toContain("calma:");
    expect(bare.toLowerCase()).not.toContain("furia:");

    const withMem = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      memorySummary: "calmar/ruega/+14",
    });
    expect(withMem).toContain("calmar");
    expect(withMem).toContain("64");
    expect(withMem).toContain("calmar/ruega/+14");
    expect(withMem.toLowerCase()).not.toContain("gate:");
    expect(withMem.toLowerCase()).not.toContain("aplicado:");
    expect(withMem.toLowerCase()).not.toContain("rechazado:");
    expect(withMem.toLowerCase()).not.toContain("sesgo:");
    expect(withMem.toLowerCase()).not.toContain("memoriatono:");
    expect(withMem.toLowerCase()).not.toContain("calma:");
    expect(withMem.toLowerCase()).not.toContain("furia:");
  });

  test("formatLlmPrompt incluye Gate si hay; vacío se omite", () => {
    const withGate = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      gateLine: "código: aplicado (pacify_ttl)",
    });
    expect(withGate).toContain("Gate: código: aplicado (pacify_ttl)");
    expect(withGate).toContain("calmar");
    expect(withGate).toContain("64");

    const emptyGate = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
      gateLine: "   ",
    });
    expect(emptyGate.toLowerCase()).not.toContain("gate:");
    expect(emptyGate.toLowerCase()).not.toContain("aplicado:");
    expect(emptyGate.toLowerCase()).not.toContain("rechazado:");
    expect(emptyGate.toLowerCase()).not.toContain("sesgo:");
    expect(emptyGate.toLowerCase()).not.toContain("memoriatono:");
    expect(emptyGate.toLowerCase()).not.toContain("calma:");
    expect(emptyGate.toLowerCase()).not.toContain("furia:");
  });

  test("formatLlmPrompt incluye Aplicado si hay lastApplied; vacío se omite", () => {
    const withApplied = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      lastApplied: ["pacify_ttl", "offer_food"],
    });
    expect(withApplied).toContain("Aplicado: pacify_ttl, offer_food");
    expect(withApplied).toContain("calmar");
    expect(withApplied).toContain("64");

    const emptyApplied = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
      lastApplied: [],
    });
    expect(emptyApplied.toLowerCase()).not.toContain("aplicado:");
    expect(emptyApplied.toLowerCase()).not.toContain("rechazado:");
    expect(emptyApplied.toLowerCase()).not.toContain("sesgo:");
    expect(emptyApplied.toLowerCase()).not.toContain("memoriatono:");
    expect(emptyApplied.toLowerCase()).not.toContain("calma:");
    expect(emptyApplied.toLowerCase()).not.toContain("furia:");

    const unknownOnly = formatLlmPrompt({
      tone: "demonio",
      intent: "amenazar",
      trust: 30,
      lastApplied: ["not_a_tag" as unknown as "pacify_ttl"],
    });
    expect(unknownOnly.toLowerCase()).not.toContain("aplicado:");
    expect(unknownOnly.toLowerCase()).not.toContain("rechazado:");
    expect(unknownOnly.toLowerCase()).not.toContain("sesgo:");
    expect(unknownOnly.toLowerCase()).not.toContain("memoriatono:");
    expect(unknownOnly.toLowerCase()).not.toContain("calma:");
    expect(unknownOnly.toLowerCase()).not.toContain("furia:");
  });

  test("formatLlmPrompt incluye Rechazado si hay lastRejected; vacío se omite", () => {
    const withRejected = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      lastRejected: ["pacify_ttl", "offer_food"],
    });
    expect(withRejected).toContain("Rechazado: pacify_ttl, offer_food");
    expect(withRejected).toContain("calmar");
    expect(withRejected).toContain("64");
    expect(withRejected.toLowerCase()).not.toContain("aplicado:");

    const emptyRejected = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
      lastRejected: [],
    });
    expect(emptyRejected.toLowerCase()).not.toContain("rechazado:");
    expect(emptyRejected.toLowerCase()).not.toContain("sesgo:");
    expect(emptyRejected.toLowerCase()).not.toContain("memoriatono:");
    expect(emptyRejected.toLowerCase()).not.toContain("calma:");
    expect(emptyRejected.toLowerCase()).not.toContain("furia:");

    const unknownOnly = formatLlmPrompt({
      tone: "demonio",
      intent: "amenazar",
      trust: 30,
      lastRejected: ["not_a_tag" as unknown as "pacify_ttl"],
    });
    expect(unknownOnly.toLowerCase()).not.toContain("rechazado:");
    expect(unknownOnly.toLowerCase()).not.toContain("sesgo:");
    expect(unknownOnly.toLowerCase()).not.toContain("memoriatono:");
    expect(unknownOnly.toLowerCase()).not.toContain("calma:");
    expect(unknownOnly.toLowerCase()).not.toContain("furia:");
  });

  test("formatLlmPrompt incluye Sesgo si hay moodBias; vacío se omite", () => {
    const withBias = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      moodBias: "lucidez",
    });
    expect(withBias).toContain("Sesgo: lucidez");
    expect(withBias).toContain("calmar");
    expect(withBias).toContain("64");
    expect(withBias.toLowerCase()).not.toContain("aplicado:");
    expect(withBias.toLowerCase()).not.toContain("rechazado:");
    expect(withBias.toLowerCase()).not.toContain("memoriatono:");

    const emptyBias = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
    });
    expect(emptyBias.toLowerCase()).not.toContain("sesgo:");
    expect(emptyBias.toLowerCase()).not.toContain("memoriatono:");
    expect(emptyBias.toLowerCase()).not.toContain("calma:");
    expect(emptyBias.toLowerCase()).not.toContain("furia:");

    const unknownOnly = formatLlmPrompt({
      tone: "demonio",
      intent: "amenazar",
      trust: 30,
      moodBias: "scream" as unknown as "lucidez",
    });
    expect(unknownOnly.toLowerCase()).not.toContain("sesgo:");
    expect(unknownOnly.toLowerCase()).not.toContain("memoriatono:");
    expect(unknownOnly.toLowerCase()).not.toContain("calma:");
    expect(unknownOnly.toLowerCase()).not.toContain("furia:");
  });

  test("formatLlmPrompt incluye MemoriaTono si hay toneBias; vacío se omite", () => {
    const withTone = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      toneBias: "lucidez",
    });
    expect(withTone).toContain("MemoriaTono: lucidez");
    expect(withTone).toContain("calmar");
    expect(withTone).toContain("64");
    expect(withTone.toLowerCase()).not.toContain("sesgo:");
    expect(withTone.toLowerCase()).not.toContain("aplicado:");
    expect(withTone.toLowerCase()).not.toContain("rechazado:");

    const emptyTone = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
    });
    expect(emptyTone.toLowerCase()).not.toContain("memoriatono:");
    expect(emptyTone.toLowerCase()).not.toContain("calma:");
    expect(emptyTone.toLowerCase()).not.toContain("furia:");

    const unknownOnly = formatLlmPrompt({
      tone: "demonio",
      intent: "amenazar",
      trust: 30,
      toneBias: "scream" as unknown as "lucidez",
    });
    expect(unknownOnly.toLowerCase()).not.toContain("memoriatono:");
    expect(unknownOnly.toLowerCase()).not.toContain("calma:");
    expect(unknownOnly.toLowerCase()).not.toContain("furia:");
  });

  test("formatLlmPrompt incluye Calma/Furia si hay TTL; 0 se omite", () => {
    const withBoth = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      pacifiedLeft: GATE_CALM_PACIFY_TTL,
      speedBumpLeft: GATE_THREAT_SPEED_TTL,
    });
    expect(withBoth).toContain(`Calma: ${GATE_CALM_PACIFY_TTL}`);
    expect(withBoth).toContain(`Furia: ${GATE_THREAT_SPEED_TTL}`);
    expect(withBoth).toContain("calmar");
    expect(withBoth).toContain("64");
    expect(withBoth.toLowerCase()).not.toContain("sesgo:");
    expect(withBoth.toLowerCase()).not.toContain("memoriatono:");

    const onlyCalma = formatLlmPrompt({
      tone: "ruega",
      intent: "calmar",
      trust: 64,
      pacifiedLeft: GATE_CALM_PACIFY_TTL,
    });
    expect(onlyCalma).toContain(`Calma: ${GATE_CALM_PACIFY_TTL}`);
    expect(onlyCalma.toLowerCase()).not.toContain("furia:");

    const onlyFuria = formatLlmPrompt({
      tone: "demonio",
      intent: "amenazar",
      trust: 30,
      speedBumpLeft: GATE_THREAT_SPEED_TTL,
    });
    expect(onlyFuria).toContain(`Furia: ${GATE_THREAT_SPEED_TTL}`);
    expect(onlyFuria.toLowerCase()).not.toContain("calma:");

    const emptyTtl = formatLlmPrompt({
      tone: "lucidez",
      intent: "preguntar",
      trust: 56,
      pacifiedLeft: 0,
      speedBumpLeft: 0,
    });
    expect(emptyTtl.toLowerCase()).not.toContain("calma:");
    expect(emptyTtl.toLowerCase()).not.toContain("furia:");
  });

  test("applyDialogueChoiceAsync rellena memorySummary tras remember(); vacío se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-sum", 50);
    const mem = new ShortMemory();

    const empty = await applyDialogueChoiceAsync(
      ledger,
      "poss-sum",
      "calmar",
      seqRng([0]),
      mem,
      { enabled: true, bridge },
    );
    expect(empty.lineSource).toBe("bank");
    expect(snaps[0]!.memorySummary ?? "").toBe("");
    expect(snaps[0]!.gateLine ?? "").toBe("");
    expect(snaps[0]!.lastApplied ?? []).toEqual([]);
    expect(snaps[0]!.lastRejected ?? []).toEqual([]);
    expect(snaps[0]!.moodBias ?? "").toBe("");
    expect(snaps[0]!.toneBias ?? "").toBe("");
    expect(snaps[0]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[0]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[0]!.prompt).toContain("calmar");
    expect(snaps[0]!.prompt).toContain("64");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("gate:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("aplicado:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("memoriatono:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("furia:");

    mem.remember("poss-sum", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });
    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-sum",
      "preguntar",
      seqRng([0]),
      mem,
      { enabled: true, bridge },
    );
    expect(filled.trustAfter).toBe(ledger.get("poss-sum"));
    expect(snaps[1]!.memorySummary).toBeTruthy();
    expect(snaps[1]!.memorySummary).toContain("amenazar");
    expect(snaps[1]!.memorySummary).toContain("demonio");
    expect(snaps[1]!.memorySummary).toContain("-20");
    expect(snaps[1]!.prompt).toContain("preguntar");
    expect(snaps[1]!.prompt).toContain(String(snaps[1]!.trust));
    expect(snaps[1]!.prompt).toContain(snaps[1]!.memorySummary!);
  });

  test("applyDialogueChoiceAsync sin memory: memorySummary omitido; prompt con intent/trust", async () => {
    let seen: LlmAskSnapshot | undefined;
    const bridge = new StubLlmBridge({
      responder: (s) => {
        seen = s;
        return "línea stub";
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-nomem", 50);
    const r = await applyDialogueChoiceAsync(
      ledger,
      "poss-nomem",
      "ofrecer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(r.lineSource).toBe("llm");
    expect(seen!.memorySummary ?? "").toBe("");
    expect(seen!.gateLine ?? "").toBe("");
    expect(seen!.lastApplied ?? []).toEqual([]);
    expect(seen!.lastRejected ?? []).toEqual([]);
    expect(seen!.moodBias ?? "").toBe("");
    expect(seen!.toneBias ?? "").toBe("");
    expect(seen!.pacifiedLeft ?? 0).toBe(0);
    expect(seen!.speedBumpLeft ?? 0).toBe(0);
    expect(seen!.prompt).toContain("ofrecer");
    expect(seen!.prompt).toContain(String(seen!.trust));
    expect(seen!.intent).toBe("ofrecer");
    expect(seen!.prompt!.toLowerCase()).not.toContain("gate:");
    expect(seen!.prompt!.toLowerCase()).not.toContain("aplicado:");
    expect(seen!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(seen!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(seen!.prompt!.toLowerCase()).not.toContain("memoriatono:");
    expect(seen!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(seen!.prompt!.toLowerCase()).not.toContain("furia:");
  });

  test("applyDialogueChoiceAsync rellena gateLine si se pasa; vacío se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-gate", 50);

    const omitted = await applyDialogueChoiceAsync(
      ledger,
      "poss-gate",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(omitted.lineSource).toBe("bank");
    expect(snaps[0]!.gateLine ?? "").toBe("");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("gate:");

    const empty = await applyDialogueChoiceAsync(
      ledger,
      "poss-gate",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      "",
    );
    expect(empty.trustAfter).toBe(ledger.get("poss-gate"));
    expect(snaps[1]!.gateLine ?? "").toBe("");
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("gate:");

    const fromNull = await applyDialogueChoiceAsync(
      ledger,
      "poss-gate",
      "distraer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      null,
    );
    expect(snaps[2]!.gateLine ?? "").toBe("");
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("gate:");

    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-gate",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      "código: aplicado (pacify_ttl)",
    );
    expect(filled.tone).toBe("demonio");
    expect(snaps[3]!.gateLine).toBe("código: aplicado (pacify_ttl)");
    expect(snaps[3]!.prompt).toContain("Gate: código: aplicado (pacify_ttl)");
    expect(snaps[3]!.prompt).toContain("amenazar");
    expect(snaps[3]!.prompt).toContain(String(snaps[3]!.trust));

    const long = "x".repeat(GATE_LINE_MAX_LEN + 8);
    await applyDialogueChoiceAsync(
      ledger,
      "poss-gate",
      "ofrecer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      long,
    );
    expect(snaps[4]!.gateLine).toBe("x".repeat(GATE_LINE_MAX_LEN));
    expect(snaps[4]!.gateLine!.length).toBe(GATE_LINE_MAX_LEN);
    expect(snaps[4]!.lastApplied ?? []).toEqual([]);
    expect(snaps[4]!.lastRejected ?? []).toEqual([]);
    expect(snaps[4]!.moodBias ?? "").toBe("");
    expect(snaps[4]!.toneBias ?? "").toBe("");
    expect(snaps[4]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[4]!.speedBumpLeft ?? 0).toBe(0);
  });

  test("applyDialogueChoiceAsync rellena lastApplied si se pasa; vacío/null se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-applied", 50);

    const omitted = await applyDialogueChoiceAsync(
      ledger,
      "poss-applied",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(omitted.lineSource).toBe("bank");
    expect(snaps[0]!.lastApplied ?? []).toEqual([]);
    expect(snaps[0]!.lastRejected ?? []).toEqual([]);
    expect(snaps[0]!.moodBias ?? "").toBe("");
    expect(snaps[0]!.toneBias ?? "").toBe("");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("aplicado:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("memoriatono:");

    const empty = await applyDialogueChoiceAsync(
      ledger,
      "poss-applied",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      [],
    );
    expect(snaps[1]!.lastApplied ?? []).toEqual([]);
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("aplicado:");

    const fromNull = await applyDialogueChoiceAsync(
      ledger,
      "poss-applied",
      "distraer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      null,
    );
    expect(snaps[2]!.lastApplied ?? []).toEqual([]);
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("aplicado:");

    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-applied",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      ["pacify_ttl", "not_a_real_tag", "offer_food", "pacify_ttl"],
    );
    expect(filled.tone).toBe("demonio");
    expect(snaps[3]!.lastApplied).toEqual(["pacify_ttl", "offer_food"]);
    expect(snaps[3]!.prompt).toContain("Aplicado: pacify_ttl, offer_food");
    expect(snaps[3]!.prompt).toContain("amenazar");
    expect(snaps[3]!.prompt).toContain(String(snaps[3]!.trust));

    const unknownOnly = await applyDialogueChoiceAsync(
      ledger,
      "poss-applied",
      "ofrecer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      ["nope", "also_nope"],
    );
    expect(unknownOnly.lineSource).toBe("bank");
    expect(snaps[4]!.lastApplied ?? []).toEqual([]);
    expect(snaps[4]!.lastRejected ?? []).toEqual([]);
    expect(snaps[4]!.moodBias ?? "").toBe("");
    expect(snaps[4]!.toneBias ?? "").toBe("");
    expect(snaps[4]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[4]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("aplicado:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("memoriatono:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("furia:");
  });

  test("applyDialogueChoiceAsync rellena lastRejected si se pasa; vacío/null se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-rejected", 50);

    const omitted = await applyDialogueChoiceAsync(
      ledger,
      "poss-rejected",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(omitted.lineSource).toBe("bank");
    expect(snaps[0]!.lastRejected ?? []).toEqual([]);
    expect(snaps[0]!.moodBias ?? "").toBe("");
    expect(snaps[0]!.toneBias ?? "").toBe("");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("memoriatono:");

    const empty = await applyDialogueChoiceAsync(
      ledger,
      "poss-rejected",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      [],
    );
    expect(snaps[1]!.lastRejected ?? []).toEqual([]);
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("rechazado:");

    const fromNull = await applyDialogueChoiceAsync(
      ledger,
      "poss-rejected",
      "distraer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      null,
    );
    expect(snaps[2]!.lastRejected ?? []).toEqual([]);
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("rechazado:");

    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-rejected",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      ["pacify_ttl", "not_a_real_tag", "offer_food", "pacify_ttl"],
    );
    expect(filled.tone).toBe("demonio");
    expect(snaps[3]!.lastRejected).toEqual(["pacify_ttl", "offer_food"]);
    expect(snaps[3]!.prompt).toContain("Rechazado: pacify_ttl, offer_food");
    expect(snaps[3]!.prompt).toContain("amenazar");
    expect(snaps[3]!.prompt).toContain(String(snaps[3]!.trust));
    expect(snaps[3]!.lastApplied ?? []).toEqual([]);
    expect(snaps[3]!.prompt!.toLowerCase()).not.toContain("aplicado:");

    const unknownOnly = await applyDialogueChoiceAsync(
      ledger,
      "poss-rejected",
      "ofrecer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      ["nope", "also_nope"],
    );
    expect(unknownOnly.lineSource).toBe("bank");
    expect(snaps[4]!.lastRejected ?? []).toEqual([]);
    expect(snaps[4]!.moodBias ?? "").toBe("");
    expect(snaps[4]!.toneBias ?? "").toBe("");
    expect(snaps[4]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[4]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("memoriatono:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("furia:");
  });

  test("applyDialogueChoiceAsync rellena moodBias si se pasa; vacío/null se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-bias", 50);

    const omitted = await applyDialogueChoiceAsync(
      ledger,
      "poss-bias",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(omitted.lineSource).toBe("bank");
    expect(snaps[0]!.moodBias ?? "").toBe("");
    expect(snaps[0]!.toneBias ?? "").toBe("");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("memoriatono:");

    const empty = await applyDialogueChoiceAsync(
      ledger,
      "poss-bias",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      "",
    );
    expect(snaps[1]!.moodBias ?? "").toBe("");
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("sesgo:");

    const fromNull = await applyDialogueChoiceAsync(
      ledger,
      "poss-bias",
      "distraer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      null,
    );
    expect(snaps[2]!.moodBias ?? "").toBe("");
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("sesgo:");

    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-bias",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      "lucidez",
    );
    expect(filled.tone).toBe("demonio");
    expect(snaps[3]!.moodBias).toBe("lucidez");
    expect(snaps[3]!.prompt).toContain("Sesgo: lucidez");
    expect(snaps[3]!.prompt).toContain("amenazar");
    expect(snaps[3]!.prompt).toContain(String(snaps[3]!.trust));
    expect(snaps[3]!.lastApplied ?? []).toEqual([]);
    expect(snaps[3]!.lastRejected ?? []).toEqual([]);
    expect(snaps[3]!.toneBias ?? "").toBe("");
    expect(snaps[3]!.prompt!.toLowerCase()).not.toContain("aplicado:");
    expect(snaps[3]!.prompt!.toLowerCase()).not.toContain("rechazado:");
    expect(snaps[3]!.prompt!.toLowerCase()).not.toContain("memoriatono:");

    const unknownOnly = await applyDialogueChoiceAsync(
      ledger,
      "poss-bias",
      "ofrecer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      "scream",
    );
    expect(unknownOnly.lineSource).toBe("bank");
    expect(snaps[4]!.moodBias ?? "").toBe("");
    expect(snaps[4]!.toneBias ?? "").toBe("");
    expect(snaps[4]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[4]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("memoriatono:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("furia:");
  });

  test("applyDialogueChoiceAsync rellena toneBias desde memory; vacío/undefined se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-tone", 50);
    const mem = new ShortMemory();

    const empty = await applyDialogueChoiceAsync(
      ledger,
      "poss-tone",
      "calmar",
      seqRng([0]),
      mem,
      { enabled: true, bridge },
    );
    expect(empty.lineSource).toBe("bank");
    expect(snaps[0]!.toneBias ?? "").toBe("");
    expect(snaps[0]!.moodBias ?? "").toBe("");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("memoriatono:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    // remember() es posterior: el stub no ve el calmar de este turno.
    expect(mem.toneBias("poss-tone")).toBe("ruega");

    const noMem = await applyDialogueChoiceAsync(
      ledger,
      "poss-tone-nomem",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(noMem.lineSource).toBe("bank");
    expect(snaps[1]!.toneBias ?? "").toBe("");
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("memoriatono:");

    mem.remember("poss-tone", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });
    expect(mem.toneBias("poss-tone")).toBe("demonio");
    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-tone",
      "preguntar",
      seqRng([0]),
      mem,
      { enabled: true, bridge },
    );
    expect(filled.trustAfter).toBe(ledger.get("poss-tone"));
    expect(snaps[2]!.toneBias).toBe("demonio");
    expect(snaps[2]!.prompt).toContain("MemoriaTono: demonio");
    expect(snaps[2]!.prompt).toContain("preguntar");
    expect(snaps[2]!.prompt).toContain(String(snaps[2]!.trust));
    expect(snaps[2]!.moodBias ?? "").toBe("");
    expect(snaps[2]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[2]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("sesgo:");
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("furia:");
  });

  test("applyDialogueChoiceAsync rellena TTLs si se pasan > 0; 0/null/undefined se omite", async () => {
    const snaps: LlmAskSnapshot[] = [];
    const bridge = new StubLlmBridge({
      responder: (s) => {
        snaps.push(s);
        return null;
      },
    });
    const ledger = new TrustLedger();
    ledger.register("poss-ttl", 50);

    const omitted = await applyDialogueChoiceAsync(
      ledger,
      "poss-ttl",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
    );
    expect(omitted.lineSource).toBe("bank");
    expect(snaps[0]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[0]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[0]!.prompt!.toLowerCase()).not.toContain("furia:");

    const fromZero = await applyDialogueChoiceAsync(
      ledger,
      "poss-ttl",
      "preguntar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      0,
    );
    expect(snaps[1]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[1]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[1]!.prompt!.toLowerCase()).not.toContain("furia:");

    const fromNull = await applyDialogueChoiceAsync(
      ledger,
      "poss-ttl",
      "distraer",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      undefined,
      null,
      null,
    );
    expect(snaps[2]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[2]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("calma:");
    expect(snaps[2]!.prompt!.toLowerCase()).not.toContain("furia:");

    const filled = await applyDialogueChoiceAsync(
      ledger,
      "poss-ttl",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      undefined,
      GATE_CALM_PACIFY_TTL,
      GATE_THREAT_SPEED_TTL,
    );
    expect(filled.tone).toBe("demonio");
    expect(snaps[3]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(snaps[3]!.speedBumpLeft).toBe(GATE_THREAT_SPEED_TTL);
    expect(snaps[3]!.prompt).toContain(`Calma: ${GATE_CALM_PACIFY_TTL}`);
    expect(snaps[3]!.prompt).toContain(`Furia: ${GATE_THREAT_SPEED_TTL}`);
    expect(snaps[3]!.prompt).toContain("amenazar");
    expect(snaps[3]!.prompt).toContain(String(snaps[3]!.trust));
    expect(snaps[3]!.moodBias ?? "").toBe("");
    expect(snaps[3]!.toneBias ?? "").toBe("");
    expect(snaps[3]!.lastApplied ?? []).toEqual([]);
    expect(snaps[3]!.lastRejected ?? []).toEqual([]);

    const onlyCalma = await applyDialogueChoiceAsync(
      ledger,
      "poss-ttl",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      undefined,
      GATE_CALM_PACIFY_TTL,
      0,
    );
    expect(onlyCalma.lineSource).toBe("bank");
    expect(snaps[4]!.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(snaps[4]!.speedBumpLeft ?? 0).toBe(0);
    expect(snaps[4]!.prompt).toContain(`Calma: ${GATE_CALM_PACIFY_TTL}`);
    expect(snaps[4]!.prompt!.toLowerCase()).not.toContain("furia:");

    const onlyFuria = await applyDialogueChoiceAsync(
      ledger,
      "poss-ttl",
      "amenazar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      GATE_THREAT_SPEED_TTL,
    );
    expect(snaps[5]!.pacifiedLeft ?? 0).toBe(0);
    expect(snaps[5]!.speedBumpLeft).toBe(GATE_THREAT_SPEED_TTL);
    expect(snaps[5]!.prompt).toContain(`Furia: ${GATE_THREAT_SPEED_TTL}`);
    expect(snaps[5]!.prompt!.toLowerCase()).not.toContain("calma:");
  });

  test("StubLlmBridge file IO: body incluye memorySummary y prompt", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio", 50);
    const mem = new ShortMemory();
    mem.remember("poss-fio", {
      who: "player",
      intent: "calmar",
      trustDelta: 14,
      tone: "ruega",
    });
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio",
      "preguntar",
      seqRng([0]),
      mem,
      { enabled: true, bridge },
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      memorySummary: string | null;
      prompt: string | null;
      intent: string | null;
      trust: number | null;
      gateLine: string | null;
      lastApplied: string[] | null;
      lastRejected: string[] | null;
      moodBias: string | null;
      toneBias: string | null;
      pacifiedLeft: number | null;
      speedBumpLeft: number | null;
    };
    expect(parsed.memorySummary).toContain("calmar");
    expect(parsed.memorySummary).toContain("ruega");
    expect(parsed.memorySummary).toContain("+14");
    expect(parsed.prompt).toContain("preguntar");
    expect(parsed.prompt).toContain(String(parsed.trust));
    expect(parsed.intent).toBe("preguntar");
    expect(parsed.gateLine).toBeNull();
    expect(parsed.lastApplied).toBeNull();
    expect(parsed.lastRejected).toBeNull();
    expect(parsed.moodBias).toBeNull();
    expect(parsed.toneBias).toBe("ruega");
    expect(parsed.pacifiedLeft).toBeNull();
    expect(parsed.speedBumpLeft).toBeNull();
    expect(parsed.prompt).toContain("MemoriaTono: ruega");
    expect(parsed.prompt!.toLowerCase()).not.toContain("calma:");
    expect(parsed.prompt!.toLowerCase()).not.toContain("furia:");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con memoria." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con memoria.");
    expect(r.lineSource).toBe("llm");
  });

  test("StubLlmBridge file IO: body incluye gateLine", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio-gate", 50);
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio-gate",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      "código: rechazado (trust)",
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      gateLine: string | null;
      prompt: string | null;
      intent: string | null;
    };
    expect(parsed.gateLine).toBe("código: rechazado (trust)");
    expect(parsed.prompt).toContain("Gate: código: rechazado (trust)");
    expect(parsed.intent).toBe("calmar");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con gate." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con gate.");
    expect(r.lineSource).toBe("llm");
  });

  test("StubLlmBridge file IO: body incluye lastApplied", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio-applied", 50);
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio-applied",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      ["pacify_ttl", "offer_pacify"],
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      lastApplied: string[] | null;
      lastRejected: string[] | null;
      prompt: string | null;
      intent: string | null;
    };
    expect(parsed.lastApplied).toEqual(["pacify_ttl", "offer_pacify"]);
    expect(parsed.lastRejected).toBeNull();
    expect(parsed.prompt).toContain("Aplicado: pacify_ttl, offer_pacify");
    expect(parsed.intent).toBe("calmar");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con aplicado." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con aplicado.");
    expect(r.lineSource).toBe("llm");
  });

  test("StubLlmBridge file IO: body incluye lastRejected", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio-rejected", 50);
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio-rejected",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      ["pacify_ttl", "offer_pacify"],
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      lastRejected: string[] | null;
      lastApplied: string[] | null;
      prompt: string | null;
      intent: string | null;
    };
    expect(parsed.lastRejected).toEqual(["pacify_ttl", "offer_pacify"]);
    expect(parsed.lastApplied).toBeNull();
    expect(parsed.prompt).toContain("Rechazado: pacify_ttl, offer_pacify");
    expect(parsed.intent).toBe("calmar");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con rechazado." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con rechazado.");
    expect(r.lineSource).toBe("llm");
  });

  test("StubLlmBridge file IO: body incluye moodBias", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio-bias", 50);
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio-bias",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      "demonio",
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      moodBias: string | null;
      toneBias: string | null;
      lastApplied: string[] | null;
      lastRejected: string[] | null;
      prompt: string | null;
      intent: string | null;
    };
    expect(parsed.moodBias).toBe("demonio");
    expect(parsed.lastApplied).toBeNull();
    expect(parsed.lastRejected).toBeNull();
    expect(parsed.toneBias).toBeNull();
    expect(parsed.prompt).toContain("Sesgo: demonio");
    expect(parsed.intent).toBe("calmar");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con sesgo." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con sesgo.");
    expect(r.lineSource).toBe("llm");
  });

  test("StubLlmBridge file IO: body incluye toneBias", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio-tone", 50);
    const mem = new ShortMemory();
    mem.remember("poss-fio-tone", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio-tone",
      "calmar",
      seqRng([0]),
      mem,
      { enabled: true, bridge },
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      toneBias: string | null;
      moodBias: string | null;
      lastApplied: string[] | null;
      lastRejected: string[] | null;
      prompt: string | null;
      intent: string | null;
    };
    expect(parsed.toneBias).toBe("demonio");
    expect(parsed.moodBias).toBeNull();
    expect(parsed.lastApplied).toBeNull();
    expect(parsed.lastRejected).toBeNull();
    expect(parsed.prompt).toContain("MemoriaTono: demonio");
    expect(parsed.intent).toBe("calmar");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con memoria tono." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con memoria tono.");
    expect(r.lineSource).toBe("llm");
  });

  test("StubLlmBridge file IO: body incluye pacifiedLeft y speedBumpLeft", async () => {
    const files = new MemoryLlmFileIo();
    const bridge = new StubLlmBridge({ files, timeoutMs: 80, pollMs: 5 });
    const ledger = new TrustLedger();
    ledger.register("poss-fio-ttl", 50);
    const askP = applyDialogueChoiceAsync(
      ledger,
      "poss-fio-ttl",
      "calmar",
      seqRng([0]),
      undefined,
      { enabled: true, bridge },
      undefined,
      undefined,
      undefined,
      undefined,
      GATE_CALM_PACIFY_TTL,
      GATE_THREAT_SPEED_TTL,
    );
    await new Promise((r) => setTimeout(r, 15));
    expect(files.requests.size).toBe(1);
    const reqId = [...files.requests.keys()][0]!;
    const body = files.requests.get(reqId)!;
    const parsed = JSON.parse(body) as {
      pacifiedLeft: number | null;
      speedBumpLeft: number | null;
      moodBias: string | null;
      toneBias: string | null;
      lastApplied: string[] | null;
      lastRejected: string[] | null;
      prompt: string | null;
      intent: string | null;
    };
    expect(parsed.pacifiedLeft).toBe(GATE_CALM_PACIFY_TTL);
    expect(parsed.speedBumpLeft).toBe(GATE_THREAT_SPEED_TTL);
    expect(parsed.moodBias).toBeNull();
    expect(parsed.toneBias).toBeNull();
    expect(parsed.lastApplied).toBeNull();
    expect(parsed.lastRejected).toBeNull();
    expect(parsed.prompt).toContain(`Calma: ${GATE_CALM_PACIFY_TTL}`);
    expect(parsed.prompt).toContain(`Furia: ${GATE_THREAT_SPEED_TTL}`);
    expect(parsed.intent).toBe("calmar");
    files.seedResponse(reqId, JSON.stringify({ line: "Desde el archivo con ttl." }));
    const r = await askP;
    expect(r.line).toBe("Desde el archivo con ttl.");
    expect(r.lineSource).toBe("llm");
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

  test("restoreGateLine; tick no borra; clear/unregister limpian", () => {
    const gates = new DialogueBehaviorGates();
    expect(gates.gateLine("p")).toBeNull();
    const applied = formatGateLine(proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST));
    expect(applied).toBe("código: aplicado (pacify_ttl)");
    gates.apply("p", proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST));
    gates.restoreGateLine("p", applied!);
    expect(gates.gateLine("p")).toBe(applied);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);

    gates.tick(GATE_CALM_PACIFY_TTL + 1);
    expect(gates.pacifiedLeft("p")).toBe(0);
    expect(gates.gateLine("p")).toBe(applied);

    gates.restoreGateLine("q", "código: rechazado (trust)");
    gates.unregister("p");
    expect(gates.gateLine("p")).toBeNull();
    expect(gates.gateLine("q")).toBe("código: rechazado (trust)");

    gates.clear();
    expect(gates.gateLine("q")).toBeNull();
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
    expect(snap.lastRejected).toEqual({});
    expect(snap.gateLine).toEqual({});

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
    expect(gates2.lastRejected("poss-a")).toEqual([]);
    expect(gates2.lastApplied("stale")).toEqual([]);
    expect(gates2.lastRejected("stale")).toEqual([]);
    expect(gates2.gateLine("poss-a")).toBeNull();
    expect(gates2.gateLine("stale")).toBeNull();
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

  test("blob viejo sin memory / lastApplied / lastRejected / gateLine carga vacío; leftover ids se reemplazan", () => {
    const n = normalizePossession({
      trust: { a: 50 },
      gates: {},
      moodBias: { a: "ruega" },
    });
    expect(n.memory).toEqual({});
    expect(n.lastApplied).toEqual({});
    expect(n.lastRejected).toEqual({});
    expect(n.gateLine).toEqual({});

    const memory = new ShortMemory();
    memory.remember("leftover", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    const leftoverGates = new DialogueBehaviorGates();
    leftoverGates.apply("leftover", proposeDialogueGates("calmar", 80));
    leftoverGates.apply(
      "leftover",
      proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1),
    );
    leftoverGates.restoreGateLine("leftover", "código: rechazado (trust)");
    expect(leftoverGates.lastRejected("leftover")).toEqual(["pacify_ttl"]);
    expect(leftoverGates.gateLine("leftover")).toBe("código: rechazado (trust)");
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
    expect(leftoverGates.lastRejected("leftover")).toEqual([]);
    expect(leftoverGates.gateLine("leftover")).toBeNull();
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
    expect(n.lastRejected).toEqual({});
    expect(n.gateLine).toEqual({});
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

  test("roundtrip lastRejected tras TTL 0; leftover lastRejected se reemplaza", () => {
    const ledger = new TrustLedger();
    const gates = new DialogueBehaviorGates();
    const speech = new SpeechDirector({}, () => 0.2);
    const memory = new ShortMemory();
    gates.apply("p", proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1));
    gates.apply("p", proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST));
    gates.tick(GATE_CALM_PACIFY_TTL + 1);
    expect(gates.pacifiedLeft("p")).toBe(0);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates.lastRejected("p")).toEqual(["pacify_ttl"]);

    const snap = capturePossession(ledger, gates, speech, memory);
    expect(snap.gates["p"]).toBeUndefined();
    expect(snap.lastApplied["p"]).toEqual(["pacify_ttl"]);
    expect(snap.lastRejected["p"]).toEqual(["pacify_ttl"]);

    const gates2 = new DialogueBehaviorGates();
    gates2.apply("stale", proposeDialogueGates("ofrecer", GATE_OFFER_MIN_TRUST));
    expect(gates2.lastRejected("stale")).toEqual(["offer_food", "offer_pacify"]);
    applyPossession(
      new TrustLedger(),
      gates2,
      new SpeechDirector({}, () => 0.1),
      new ShortMemory(),
      snap,
    );
    expect(gates2.pacifiedLeft("p")).toBe(0);
    expect(gates2.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates2.lastRejected("p")).toEqual(["pacify_ttl"]);
    expect(gates2.lastApplied("stale")).toEqual([]);
    expect(gates2.lastRejected("stale")).toEqual([]);
  });

  test("normalize lastRejected: descarta tags desconocidos; omite listas vacías", () => {
    const n = normalizePossession({
      lastRejected: {
        "": ["pacify_ttl"],
        keep: ["pacify_ttl", "not_a_tag", "offer_food"],
        unknownOnly: ["scream", 12, null],
        empty: [],
        junk: "nope",
      },
    });
    expect(n.lastRejected[""]).toBeUndefined();
    expect(n.lastRejected.empty).toBeUndefined();
    expect(n.lastRejected.junk).toBeUndefined();
    expect(n.lastRejected.unknownOnly).toBeUndefined();
    expect(n.lastRejected.keep).toEqual(["pacify_ttl", "offer_food"]);
    expect(n.lastApplied).toEqual({});
  });

  test("capturePossession serializa lastRejected (hermano de lastApplied)", () => {
    const gates = new DialogueBehaviorGates();
    gates.apply("p", proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST - 1));
    expect(gates.lastRejected("p")).toEqual(["pacify_ttl"]);
    const snap = capturePossession(
      new TrustLedger(),
      gates,
      new SpeechDirector({}, () => 0.2),
      new ShortMemory(),
    );
    expect(Object.keys(snap)).toEqual([
      "trust",
      "gates",
      "moodBias",
      "memory",
      "lastApplied",
      "lastRejected",
      "gateLine",
    ]);
    expect(snap.lastApplied).toEqual({});
    expect(snap.lastRejected["p"]).toEqual(["pacify_ttl"]);
    expect(snap.gateLine).toEqual({});
  });

  test("roundtrip gateLine; leftover se reemplaza; blob viejo vacío", () => {
    const ledger = new TrustLedger();
    const gates = new DialogueBehaviorGates();
    const speech = new SpeechDirector({}, () => 0.2);
    const memory = new ShortMemory();
    const applied = proposeDialogueGates("calmar", GATE_CALM_MIN_TRUST);
    const line = formatGateLine(applied);
    expect(line).toBe("código: aplicado (pacify_ttl)");
    gates.apply("p", applied);
    gates.restoreGateLine("p", line!);
    gates.tick(GATE_CALM_PACIFY_TTL + 1);
    expect(gates.pacifiedLeft("p")).toBe(0);
    expect(gates.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates.gateLine("p")).toBe(line);

    const snap = capturePossession(ledger, gates, speech, memory);
    expect(snap.gates["p"]).toBeUndefined();
    expect(snap.lastApplied["p"]).toEqual(["pacify_ttl"]);
    expect(snap.gateLine["p"]).toBe(line);

    const gates2 = new DialogueBehaviorGates();
    gates2.apply("stale", proposeDialogueGates("ofrecer", GATE_OFFER_MIN_TRUST));
    gates2.restoreGateLine("stale", "código: rechazado (trust)");
    expect(gates2.gateLine("stale")).toBe("código: rechazado (trust)");
    applyPossession(
      new TrustLedger(),
      gates2,
      new SpeechDirector({}, () => 0.1),
      new ShortMemory(),
      snap,
    );
    expect(gates2.gateLine("p")).toBe(line);
    expect(gates2.lastApplied("p")).toEqual(["pacify_ttl"]);
    expect(gates2.gateLine("stale")).toBeNull();
    expect(gates2.lastRejected("stale")).toEqual([]);
  });

  test("normalize gateLine: drop empty / non-string; cap length", () => {
    const n = normalizePossession({
      gateLine: {
        "": "código: aplicado (pacify_ttl)",
        keep: "  código: rechazado (trust)  ",
        empty: "",
        spaces: "   ",
        junk: 12,
        long: "x".repeat(GATE_LINE_MAX_LEN + 8),
      },
    });
    expect(n.gateLine[""]).toBeUndefined();
    expect(n.gateLine.empty).toBeUndefined();
    expect(n.gateLine.spaces).toBeUndefined();
    expect(n.gateLine.junk).toBeUndefined();
    expect(n.gateLine.keep).toBe("código: rechazado (trust)");
    expect(n.gateLine.long).toBe("x".repeat(GATE_LINE_MAX_LEN));
    expect(n.lastApplied).toEqual({});
    expect(n.lastRejected).toEqual({});
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
