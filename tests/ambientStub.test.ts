import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  createAmbientBus,
  resetAmbientAfterRestart,
  tickAmbient,
  ambientTickApplies,
  ambientLevels,
  ambientTargets,
  describeAmbient,
  toggleAmbientMute,
  muteHudMsg,
  MUTE_HUD_MSG,
  SOUND_HUD_MSG,
  type AmbientState,
} from "../src/audio/ambientStub";

function settle(
  bus: ReturnType<typeof createAmbientBus>,
  state: AmbientState,
  seconds = 2,
): void {
  // Varios ticks cortos = mismo resultado determinista que un dt largo (lerp exp).
  const steps = 20;
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) tickAmbient(bus, state, dt);
}

const dayClearOutdoor: AmbientState = {
  raining: false,
  isNight: false,
  indoor: false,
  threatNearby: false,
};

describe("ambientTargets", () => {
  test("rain outdoor alto; indoor atenúa", () => {
    const out = ambientTargets({
      ...dayClearOutdoor,
      raining: true,
      indoor: false,
    });
    const inn = ambientTargets({
      ...dayClearOutdoor,
      raining: true,
      indoor: true,
    });
    expect(out.rain).toBeGreaterThan(0.7);
    expect(inn.rain).toBeGreaterThan(0);
    expect(inn.rain).toBeLessThan(out.rain);
  });

  test("night outdoor > 0; day ~0", () => {
    const night = ambientTargets({ ...dayClearOutdoor, isNight: true });
    const day = ambientTargets(dayClearOutdoor);
    expect(night.night).toBeGreaterThan(0.2);
    expect(day.night).toBe(0);
  });

  test("threatNearby → threat > 0", () => {
    const t = ambientTargets({ ...dayClearOutdoor, threatNearby: true }, 0);
    expect(t.threat).toBeGreaterThan(0.3);
    const calm = ambientTargets(dayClearOutdoor);
    expect(calm.threat).toBe(0);
  });
});

describe("tickAmbient / ambientLevels", () => {
  test("rain outdoor → rain level alto; indoor → más bajo", () => {
    const a = createAmbientBus();
    settle(a, { ...dayClearOutdoor, raining: true, indoor: false });
    const outdoorRain = ambientLevels(a).rain;
    expect(outdoorRain).toBeGreaterThan(0.7);

    const b = createAmbientBus();
    settle(b, { ...dayClearOutdoor, raining: true, indoor: true });
    expect(ambientLevels(b).rain).toBeGreaterThan(0);
    expect(ambientLevels(b).rain).toBeLessThan(outdoorRain);
  });

  test("night outdoor → night layer > 0; day → ~0", () => {
    const night = createAmbientBus();
    settle(night, { ...dayClearOutdoor, isNight: true });
    expect(ambientLevels(night).night).toBeGreaterThan(0.2);

    const day = createAmbientBus();
    settle(day, dayClearOutdoor);
    expect(ambientLevels(day).night).toBeLessThan(0.05);
  });

  test("threatNearby true → threat > 0", () => {
    const bus = createAmbientBus();
    settle(bus, { ...dayClearOutdoor, threatNearby: true });
    expect(ambientLevels(bus).threat).toBeGreaterThan(0.25);
  });

  test("muted → all levels 0 y describe dice mute", () => {
    const bus = createAmbientBus();
    settle(bus, {
      raining: true,
      isNight: true,
      indoor: true,
      threatNearby: true,
    });
    expect(ambientLevels(bus).rain).toBeGreaterThan(0);
    bus.muted = true;
    const L = ambientLevels(bus);
    expect(L.rain).toBe(0);
    expect(L.night).toBe(0);
    expect(L.indoor).toBe(0);
    expect(L.threat).toBe(0);
    expect(describeAmbient(bus)).toBe("mute");
  });

  test("tick es determinista / estable", () => {
    const s: AmbientState = {
      raining: true,
      isNight: true,
      indoor: false,
      threatNearby: true,
    };
    const a = createAmbientBus();
    const b = createAmbientBus();
    for (let i = 0; i < 15; i++) {
      tickAmbient(a, s, 0.1);
      tickAmbient(b, s, 0.1);
    }
    expect(ambientLevels(a)).toEqual(ambientLevels(b));
    // Un tick extra no explota
    const before = { ...ambientLevels(a) };
    tickAmbient(a, s, 0.1);
    const after = ambientLevels(a);
    for (const k of ["rain", "night", "indoor", "threat"] as const) {
      expect(after[k]).toBeGreaterThanOrEqual(0);
      expect(after[k]).toBeLessThanOrEqual(1);
      expect(Math.abs(after[k] - before[k])).toBeLessThan(0.15);
    }
  });

  test("describeAmbient: lluvia♪ / ♪ / mute", () => {
    const rain = createAmbientBus();
    settle(rain, { ...dayClearOutdoor, raining: true });
    expect(describeAmbient(rain)).toBe("lluvia♪");

    const night = createAmbientBus();
    settle(night, { ...dayClearOutdoor, isNight: true });
    expect(describeAmbient(night)).toBe("♪");

    const silent = createAmbientBus();
    settle(silent, dayClearOutdoor);
    expect(describeAmbient(silent)).toBeNull();

    toggleAmbientMute(silent);
    expect(describeAmbient(silent)).toBe(MUTE_HUD_MSG);
    expect(describeAmbient(silent)).toBe("mute");
  });

  test("muteHudMsg: mute vs sonido según el estado nuevo", () => {
    expect(MUTE_HUD_MSG).toBe("mute");
    expect(SOUND_HUD_MSG).toBe("sonido");
    expect(muteHudMsg(true)).toBe(MUTE_HUD_MSG);
    expect(muteHudMsg(false)).toBe(SOUND_HUD_MSG);
    expect(MUTE_HUD_MSG).not.toBe(SOUND_HUD_MSG);

    const bus = createAmbientBus();
    expect(bus.muted).toBe(false);
    const afterMute = muteHudMsg(toggleAmbientMute(bus));
    expect(bus.muted).toBe(true);
    expect(afterMute).toBe(MUTE_HUD_MSG);
    expect(ambientLevels(bus).rain).toBe(0);
    expect(describeAmbient(bus)).toBe(MUTE_HUD_MSG);

    const afterUnmute = muteHudMsg(toggleAmbientMute(bus));
    expect(bus.muted).toBe(false);
    expect(afterUnmute).toBe(SOUND_HUD_MSG);
    expect(describeAmbient(bus)).not.toBe(MUTE_HUD_MSG);
  });
});

describe("ambientTickApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; load-muerto no; vivo/load-vivo sí", () => {
    expect(ambientTickApplies(true)).toBe(false);
    expect(ambientTickApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(ambientTickApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(ambientTickApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza threatPhase ni lerp; vivo sí; dt<=0 no-op", () => {
    const threatState: AmbientState = {
      ...dayClearOutdoor,
      threatNearby: true,
    };
    const dead = createAmbientBus();
    tickAmbient(dead, threatState, 0.2, false);
    const frozenPhase = dead.threatPhase;
    const frozenLevels = { ...dead.levels };
    expect(frozenPhase).toBeGreaterThan(0);
    expect(frozenLevels.threat).toBeGreaterThan(0);

    tickAmbient(dead, threatState, 0.5, true);
    expect(dead.threatPhase).toBe(frozenPhase);
    expect(dead.levels).toEqual(frozenLevels);
    expect(dead.muted).toBe(false);

    const rainState: AmbientState = { ...dayClearOutdoor, raining: true };
    const rainDead = createAmbientBus();
    tickAmbient(rainDead, rainState, 0.5, true);
    expect(rainDead.levels.rain).toBe(0);
    expect(rainDead.threatPhase).toBe(0);

    const live = createAmbientBus();
    tickAmbient(live, threatState, 0.2, false);
    const livePhase = live.threatPhase;
    tickAmbient(live, threatState, 0.5, false);
    expect(live.threatPhase).toBeGreaterThan(livePhase);
    expect(live.levels.threat).toBeGreaterThan(0);

    const still = createAmbientBus();
    still.threatPhase = 1.25;
    still.levels.threat = 0.4;
    const stillLevels = { ...still.levels };
    tickAmbient(still, threatState, 0, false);
    expect(still.threatPhase).toBe(1.25);
    expect(still.levels).toEqual(stillLevels);
    tickAmbient(still, threatState, -1, false);
    expect(still.threatPhase).toBe(1.25);
    expect(still.levels).toEqual(stillLevels);

    const helperDt = ambientTickApplies(true) ? 0.5 : 0;
    tickAmbient(dead, threatState, helperDt);
    expect(dead.threatPhase).toBe(frozenPhase);
    expect(dead.levels).toEqual(frozenLevels);
  });

  test("Game freeze / enterGameOver / F9 load-muerto congelan ambient; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("ambientTickApplies(");
    expect(src).toMatch(
      /syncAmbient\(dt = 0\): void \{[\s\S]{0,480}ambientTickApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}this\.syncAmbient\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2200}this\.syncAmbient\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncAmbient\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}tickAmbient\([\s\S]{0,200}\bdt\b/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
    expect(src).toMatch(
      /Mixer must keep ticking during freeze[\s\S]{0,160}this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );

    const stubSrc = readFileSync(
      resolve(process.cwd(), "src/audio/ambientStub.ts"),
      "utf8",
    );
    expect(stubSrc).toContain("ambientTickApplies(");
    expect(stubSrc).toMatch(
      /if \(!ambientTickApplies\(gameOver\)\) dt = 0/,
    );
    expect(stubSrc).not.toMatch(/if \(gameOver\)[\s\S]{0,80}bus\.muted = true/);
  });
});

describe("resetAmbientAfterRestart (R / softReset)", () => {
  test("reinicio → threatPhase 0 + levels 0; night/indoor/threat previo no filtra", () => {
    const boot = createAmbientBus();
    const bus = createAmbientBus();
    settle(bus, {
      raining: false,
      isNight: true,
      indoor: true,
      threatNearby: true,
    });
    expect(bus.threatPhase).toBeGreaterThan(0);
    expect(bus.levels.night).toBeGreaterThan(0);
    expect(bus.levels.indoor).toBeGreaterThan(0);
    expect(bus.levels.threat).toBeGreaterThan(0);
    expect(bus.levels.rain).toBe(0);

    resetAmbientAfterRestart(bus);
    expect(bus.threatPhase).toBe(0);
    expect(bus.threatPhase).toBe(boot.threatPhase);
    expect(bus.levels).toEqual(boot.levels);
    expect(bus.levels).toEqual({ rain: 0, night: 0, indoor: 0, threat: 0 });
    expect(bus.muted).toBe(false);

    const leaked = createAmbientBus();
    leaked.threatPhase = 4.2;
    leaked.levels = { rain: 0.22, night: 0.12, indoor: 0.4, threat: 0.7 };
    resetAmbientAfterRestart(leaked);
    expect(leaked.threatPhase).toBe(0);
    expect(leaked.threatPhase).not.toBe(4.2);
    expect(leaked.levels.night).toBe(0);
    expect(leaked.levels.indoor).toBe(0);
    expect(leaked.levels.threat).toBe(0);
    expect(leaked.levels.rain).toBe(0);
  });

  test("muted se preserva; tick vivo no usa el helper (igual que hoy)", () => {
    const muted = createAmbientBus();
    muted.muted = true;
    muted.threatPhase = 2.5;
    muted.levels = { rain: 0.9, night: 0.45, indoor: 0.4, threat: 0.6 };
    resetAmbientAfterRestart(muted);
    expect(muted.muted).toBe(true);
    expect(muted.threatPhase).toBe(0);
    expect(muted.levels).toEqual({ rain: 0, night: 0, indoor: 0, threat: 0 });
    expect(ambientLevels(muted)).toEqual({
      rain: 0,
      night: 0,
      indoor: 0,
      threat: 0,
    });
    expect(describeAmbient(muted)).toBe(MUTE_HUD_MSG);

    const unmuted = createAmbientBus(true);
    unmuted.threatPhase = 1;
    unmuted.levels.threat = 0.5;
    resetAmbientAfterRestart(unmuted);
    expect(unmuted.muted).toBe(true);
    toggleAmbientMute(unmuted);
    expect(unmuted.muted).toBe(false);
    resetAmbientAfterRestart(unmuted);
    expect(unmuted.muted).toBe(false);
    expect(unmuted.threatPhase).toBe(0);

    const live = createAmbientBus();
    const threatState: AmbientState = {
      ...dayClearOutdoor,
      threatNearby: true,
    };
    tickAmbient(live, threatState, 0.2);
    expect(live.threatPhase).toBeGreaterThan(0);
    expect(live.levels.threat).toBeGreaterThan(0);
    expect(live.threatPhase).not.toBe(createAmbientBus().threatPhase);
    expect(ambientTickApplies(false)).toBe(true);
    expect(ambientTickApplies(true)).toBe(false);
  });

  test("Game softReset usa helper; F9 load no toca mix; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetAmbientAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,1800}resetAmbientAfterRestart\(this\.ambient\)/,
    );
    expect(gameSrc).toMatch(
      /this\.weather = weatherAfterRestart\(\);[\s\S]{0,200}resetAmbientAfterRestart\(this\.ambient\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetAmbientAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetAmbientAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetAmbientAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
  });
});

describe("Game M mute (HAS MUERTO)", () => {
  test("Game M vivo y muerto asignan lastLootMsg via muteHudMsg (sin lootToast)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    const assign =
      "this.lastLootMsg = muteHudMsg(toggleAmbientMute(this.ambient))";
    const hits = src.match(
      /this\.lastLootMsg = muteHudMsg\(toggleAmbientMute\(this\.ambient\)\)/g,
    );
    expect(hits?.length).toBe(2);
    expect(src).toContain(assign);
    expect((src.match(/consumeMute\(\)/g) ?? []).length).toBe(2);
    expect(src).not.toMatch(
      /consumeMute\(\)[\s\S]{0,180}lootToast/,
    );
  });
});
