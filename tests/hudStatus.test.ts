import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  HostileSim,
  defaultHostileSpawns,
  defaultPossessedSpawns,
  loadAliveRuntime,
  SPAWN_GRACE_SECONDS,
} from "../src/ai";
import {
  CONTROLS_HELP,
  GAME_OVER_LINE,
  applyHelpInput,
  formatHudDebugTokens,
  formatHudStatus,
  helpInputApplies,
  nextShowHelp,
  formatPacifyHud,
  formatSpeedBumpHud,
  formatMoodBiasHud,
  formatMemoryToneHud,
  formatLastGateHud,
  formatLastRejectedHud,
  formatLineSourceHud,
  resolveGameOverCause,
  isKeepableDeathCause,
  type HudStatusInput,
} from "../src/ui/hudStatus";
import { REST_HUD_MSG } from "../src/actors/needs";
import { MUTE_HUD_MSG, SOUND_HUD_MSG } from "../src/audio/ambientStub";
import {
  ZOOM_IN_HUD_MSG,
  ZOOM_OUT_HUD_MSG,
} from "../src/render/cameraConfig";
import { dialogueOpenHudMsg } from "../src/possession";

function base(over: Partial<HudStatusInput> = {}): HudStatusInput {
  return {
    modo: "día",
    phasePct: 21,
    muteN: 3,
    possN: 2,
    invLine: "inv food×1 (0.5kg)",
    tileX: 10,
    tileY: 12,
    chunksLoaded: 4,
    chunksTotal: 9,
    fov: 8,
    ...over,
  };
}

describe("formatHudDebugTokens", () => {
  test("tile / chunks / fov compactos", () => {
    expect(formatHudDebugTokens(base())).toBe("tile 10,12 · chunks 4/9 · fov 8");
  });
});

describe("formatHudStatus compact", () => {
  test("línea de jugador sin dump tile/chunks/fov", () => {
    const s = formatHudStatus(base());
    expect(s).not.toContain("WASD");
    expect(s).not.toContain(CONTROLS_HELP);
    expect(s).toBe(
      "día (21%) · mudos 3 · poseídos 2 · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(s).not.toContain("tile ");
    expect(s).not.toContain("chunks ");
    expect(s).not.toContain("fov ");
  });

  test("hint F1 ayuda en compacto", () => {
    const s = formatHudStatus(base());
    expect(s).toMatch(/F1 ayuda/);
    expect(s).not.toMatch(/F1 cerrar ayuda/);
  });

  test("showHelp incluye CONTROLS_HELP agrupado por líneas y F1 cerrar", () => {
    const s = formatHudStatus(base({ showHelp: true }));
    expect(s).toContain("WASD");
    expect(s).toContain(CONTROLS_HELP);
    expect(s.startsWith(CONTROLS_HELP + "\n")).toBe(true);
    expect(CONTROLS_HELP).toContain("\n");
    expect(CONTROLS_HELP.split("\n")).toHaveLength(5);
    expect(CONTROLS_HELP).toMatch(/^Mover:/);
    expect(CONTROLS_HELP).toContain("Combate:");
    expect(CONTROLS_HELP).toContain("Loot:");
    expect(CONTROLS_HELP).toContain("Inventario:");
    expect(CONTROLS_HELP).toContain("Mundo:");
    expect(CONTROLS_HELP).toMatch(/\+\/- zoom/);
    expect(CONTROLS_HELP).toMatch(/Espacio\/V melee/);
    expect(CONTROLS_HELP).toMatch(/1-5 hotbar/);
    expect(CONTROLS_HELP).toMatch(/rueda hotbar/);
    expect(CONTROLS_HELP).toMatch(/clic hotbar/);
    expect(CONTROLS_HELP).toMatch(/arrastrar hotbar/);
    expect(CONTROLS_HELP).toMatch(/doble clic usar/);
    expect(CONTROLS_HELP).toMatch(/clic der\. info/);
    expect(CONTROLS_HELP).toContain("clic inv usar");
    expect(CONTROLS_HELP).toContain("doble clic inv");
    expect(CONTROLS_HELP).toContain("arrastrar inv");
    expect(CONTROLS_HELP).toContain("clic der. inv");
    expect(CONTROLS_HELP).toContain("Shift+clic inv partir");
    expect(CONTROLS_HELP).toContain("Ctrl+clic inv juntar");
    expect(CONTROLS_HELP).toContain("Shift+clic hotbar partir");
    expect(CONTROLS_HELP).toContain("Ctrl+clic hotbar juntar");
    expect(CONTROLS_HELP).toMatch(/Q usar slot \/ rellenar botella \(lluvia\)/);
    expect(CONTROLS_HELP).toMatch(/G loot · Shift\+G stack/);
    expect(CONTROLS_HELP).toMatch(/U tirar/);
    expect(CONTROLS_HELP).toMatch(/Shift\+U stack/);
    expect(CONTROLS_HELP).toContain("U inv tirar");
    expect(CONTROLS_HELP).toMatch(
      /T diálogo \(calmar \/ preguntar \/ amenazar \/ ofrecer comida \/ Distraer\)/,
    );
    expect(CONTROLS_HELP).toMatch(/Z cama o suelo indoor/);
    expect(CONTROLS_HELP).toMatch(/R descanso\/reinicio/);
    expect(CONTROLS_HELP).toMatch(/F1 ayuda/);
    expect(s).toMatch(/F1 cerrar ayuda/);
    expect(s).toContain("tile 10,12 · chunks 4/9 · fov 8");
    expect(s.endsWith("tile 10,12 · chunks 4/9 · fov 8 · F1 cerrar ayuda")).toBe(
      true,
    );
    expect(s).toBe(
      `${CONTROLS_HELP}\ndía (21%) · mudos 3 · poseídos 2 · inv food×1 (0.5kg) · tile 10,12 · chunks 4/9 · fov 8 · F1 cerrar ayuda`,
    );
  });

  test("gameOver formato: HAS MUERTO una sola vez", () => {
    const bare = formatHudStatus(base({ gameOver: true }));
    expect(bare).toBe(GAME_OVER_LINE);
    expect(bare).toBe("HAS MUERTO — R reiniciar · F9 cargar");
    expect(bare.match(/HAS MUERTO/g)).toEqual(["HAS MUERTO"]);

    const stamped = formatHudStatus(base({ gameOver: true, msg: "HAS MUERTO" }));
    expect(stamped).toBe(GAME_OVER_LINE);
    expect(stamped.match(/HAS MUERTO/g)).toEqual(["HAS MUERTO"]);

    const padded = formatHudStatus(
      base({ gameOver: true, msg: "  HAS MUERTO  " }),
    );
    expect(padded).toBe(GAME_OVER_LINE);
    expect(padded.match(/HAS MUERTO/g)).toHaveLength(1);
  });

  test("gameOver conserva causa combate/hambre-sed sin duplicar HAS MUERTO", () => {
    const starve = formatHudStatus(
      base({ gameOver: true, msg: "hambre te debilita" }),
    );
    expect(starve).toBe(`${GAME_OVER_LINE} · hambre te debilita`);
    expect(starve.match(/HAS MUERTO/g)).toHaveLength(1);

    const combat = formatHudStatus(
      base({ gameOver: true, msg: "golpe -12 HP" }),
    );
    expect(combat).toBe(`${GAME_OVER_LINE} · golpe -12 HP`);
    expect(combat.match(/HAS MUERTO/g)).toHaveLength(1);

    expect(resolveGameOverCause("HAS MUERTO")).toBeNull();
    expect(resolveGameOverCause("")).toBeNull();
    expect(resolveGameOverCause("hambre te debilita")).toBe(
      "hambre te debilita",
    );
    expect(isKeepableDeathCause("HAS MUERTO")).toBe(false);
    expect(isKeepableDeathCause("cocinaste un plato caliente")).toBe(false);
    expect(isKeepableDeathCause(REST_HUD_MSG)).toBe(false);
    expect(isKeepableDeathCause(MUTE_HUD_MSG)).toBe(false);
    expect(isKeepableDeathCause(SOUND_HUD_MSG)).toBe(false);
    expect(isKeepableDeathCause(ZOOM_IN_HUD_MSG)).toBe(false);
    expect(isKeepableDeathCause(ZOOM_OUT_HUD_MSG)).toBe(false);
    expect(isKeepableDeathCause(dialogueOpenHudMsg("poss-a"))).toBe(false);
    expect(isKeepableDeathCause("golpe -5 HP")).toBe(true);
    expect(isKeepableDeathCause("sed te debilita")).toBe(true);
    expect(isKeepableDeathCause("hambre y sed te debilitan")).toBe(true);
  });

  test("rain / noise solo cuando flags / hints aplican", () => {
    const dry = formatHudStatus(base({ raining: false }));
    expect(dry).not.toContain("lluvia");
    expect(dry).not.toContain("ruido");

    const wet = formatHudStatus(
      base({ raining: true, noiseHint: "ruido run r6" }),
    );
    expect(wet).toContain("lluvia");
    expect(wet).toContain("ruido run r6");
  });

  test("indoor / flashlight contextuales", () => {
    const out = formatHudStatus(base());
    expect(out).not.toContain("indoor");
    expect(out).not.toContain("linterna");

    const inn = formatHudStatus(
      base({ indoor: true, flashlight: true, safeHint: "safehouse cama" }),
    );
    expect(inn).toContain("indoor");
    expect(inn).toContain("linterna");
    expect(inn).toContain("safehouse cama");
  });

  test("nearHint cerca: solo si hay loot; vacío/blank no aparece", () => {
    const bare = formatHudStatus(base());
    expect(bare).not.toContain("cerca:");

    const hinted = formatHudStatus(
      base({ nearHint: "cerca: cocina [lata×2] G/E recoger" }),
    );
    expect(hinted).toContain("cerca: cocina [lata×2] G/E recoger");

    expect(formatHudStatus(base({ nearHint: "" }))).not.toContain("cerca:");
    expect(formatHudStatus(base({ nearHint: "   " }))).not.toContain("cerca:");
  });

  test("audioHint compacto", () => {
    const bare = formatHudStatus(base());
    expect(bare).not.toContain("♪");
    expect(bare).not.toContain("mute");

    expect(formatHudStatus(base({ audioHint: "♪" }))).toContain("♪");
    expect(formatHudStatus(base({ audioHint: "mute" }))).toContain("mute");
    expect(formatHudStatus(base({ audioHint: "lluvia♪" }))).toContain("lluvia♪");
  });

  test("pacifyLeft 0 / ausente no pinta CALMA; > 0 sí", () => {
    expect(formatPacifyHud(undefined)).toBeNull();
    expect(formatPacifyHud(0)).toBeNull();
    expect(formatPacifyHud(-1)).toBeNull();
    expect(formatPacifyHud(8)).toBe("CALMA 8");
    expect(formatPacifyHud(7.2)).toBe("CALMA 8");
    expect(formatPacifyHud(0.4)).toBe("CALMA 1");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("CALMA");
    expect(formatHudStatus(base({ pacifyLeft: 0 }))).not.toContain("CALMA");
    expect(formatHudStatus(base({ pacifyLeft: 8 }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ pacifyLeft: 7.2 }))).toContain("CALMA 8");
    expect(
      formatHudStatus(base({ gameOver: true, pacifyLeft: 8 })),
    ).not.toContain("CALMA");
  });

  test("speedBumpLeft 0 / ausente no pinta FURIA; > 0 sí", () => {
    expect(formatSpeedBumpHud(undefined)).toBeNull();
    expect(formatSpeedBumpHud(0)).toBeNull();
    expect(formatSpeedBumpHud(-1)).toBeNull();
    expect(formatSpeedBumpHud(3.5)).toBe("FURIA 4");
    expect(formatSpeedBumpHud(2.1)).toBe("FURIA 3");
    expect(formatSpeedBumpHud(0.4)).toBe("FURIA 1");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("FURIA");
    expect(formatHudStatus(base({ speedBumpLeft: 0 }))).not.toContain("FURIA");
    expect(formatHudStatus(base({ speedBumpLeft: 3.5 }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · FURIA 4 · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ speedBumpLeft: 2.1 }))).toContain("FURIA 3");
    expect(
      formatHudStatus(base({ gameOver: true, speedBumpLeft: 3.5 })),
    ).not.toContain("FURIA");
  });

  test("CALMA y FURIA conviven; CALMA no cambia", () => {
    expect(
      formatHudStatus(base({ pacifyLeft: 8, speedBumpLeft: 3.5 })),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ pacifyLeft: 8 }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ pacifyLeft: 8, speedBumpLeft: 0 }))).not.toContain(
      "FURIA",
    );
  });

  test("moodBias null / ausente no pinta token; lucidez → LUCIDEZ", () => {
    expect(formatMoodBiasHud(undefined)).toBeNull();
    expect(formatMoodBiasHud(null)).toBeNull();
    expect(formatMoodBiasHud("lucidez")).toBe("LUCIDEZ");
    expect(formatMoodBiasHud("demonio")).toBe("DEMONIO");
    expect(formatMoodBiasHud("ruega")).toBe("RUEGA");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("LUCIDEZ");
    expect(bare).not.toContain("DEMONIO");
    expect(bare).not.toContain("RUEGA");
    expect(formatHudStatus(base({ moodBias: null }))).not.toContain("LUCIDEZ");
    expect(formatHudStatus(base({ moodBias: "lucidez" }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · LUCIDEZ · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ moodBias: "demonio" }))).toContain("DEMONIO");
    expect(formatHudStatus(base({ moodBias: "ruega" }))).toContain("RUEGA");
    expect(
      formatHudStatus(base({ gameOver: true, moodBias: "lucidez" })),
    ).not.toContain("LUCIDEZ");
  });

  test("CALMA / FURIA siguen iguales con LUCIDEZ", () => {
    expect(
      formatHudStatus(
        base({ pacifyLeft: 8, speedBumpLeft: 3.5, moodBias: "lucidez" }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ pacifyLeft: 8, speedBumpLeft: 3.5 }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ pacifyLeft: 8 }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · inv food×1 (0.5kg) · F1 ayuda",
    );
  });

  test("memoryTone null / ausente no pinta MEMORIA; lucidez → MEMORIA LUCIDEZ", () => {
    expect(formatMemoryToneHud(undefined)).toBeNull();
    expect(formatMemoryToneHud(null)).toBeNull();
    expect(formatMemoryToneHud("lucidez")).toBe("MEMORIA LUCIDEZ");
    expect(formatMemoryToneHud("demonio")).toBe("MEMORIA DEMONIO");
    expect(formatMemoryToneHud("ruega")).toBe("MEMORIA RUEGA");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("MEMORIA");
    expect(formatHudStatus(base({ memoryTone: null }))).not.toContain("MEMORIA");
    expect(formatHudStatus(base({ memoryTone: "lucidez" }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · MEMORIA LUCIDEZ · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ memoryTone: "demonio" }))).toContain(
      "MEMORIA DEMONIO",
    );
    expect(formatHudStatus(base({ memoryTone: "ruega" }))).toContain(
      "MEMORIA RUEGA",
    );
    expect(
      formatHudStatus(base({ gameOver: true, memoryTone: "lucidez" })),
    ).not.toContain("MEMORIA");
  });

  test("MEMORIA no choca con LUCIDEZ; CALMA / FURIA / mood iguales", () => {
    expect(formatMoodBiasHud("lucidez")).toBe("LUCIDEZ");
    expect(formatMemoryToneHud("lucidez")).toBe("MEMORIA LUCIDEZ");
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(
        base({ pacifyLeft: 8, speedBumpLeft: 3.5, moodBias: "lucidez" }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ moodBias: "lucidez" }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · LUCIDEZ · inv food×1 (0.5kg) · F1 ayuda",
    );
  });

  test("lastApplied vacío / ausente no pinta CÓDIGO; tags → CÓDIGO tag", () => {
    expect(formatLastGateHud(undefined)).toBeNull();
    expect(formatLastGateHud(null)).toBeNull();
    expect(formatLastGateHud([])).toBeNull();
    expect(formatLastGateHud(["pacify_ttl"])).toBe("CÓDIGO pacify_ttl");
    expect(formatLastGateHud(["offer_food", "offer_pacify"])).toBe(
      "CÓDIGO offer_food,offer_pacify",
    );
    expect(
      formatLastGateHud(["threat_noise", "threat_chase", "threat_speed"]),
    ).toBe("CÓDIGO threat_noise,threat_chase,threat_speed");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("CÓDIGO");
    expect(formatHudStatus(base({ lastApplied: null }))).not.toContain("CÓDIGO");
    expect(formatHudStatus(base({ lastApplied: [] }))).not.toContain("CÓDIGO");
    expect(formatHudStatus(base({ lastApplied: ["pacify_ttl"] }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CÓDIGO pacify_ttl · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(base({ lastApplied: ["offer_food", "offer_pacify"] })),
    ).toContain("CÓDIGO offer_food,offer_pacify");
    expect(
      formatHudStatus(base({ gameOver: true, lastApplied: ["pacify_ttl"] })),
    ).not.toContain("CÓDIGO");
  });

  test("CÓDIGO no choca con CALMA / FURIA / LUCIDEZ / MEMORIA", () => {
    expect(formatLastGateHud(["pacify_ttl"])).toBe("CÓDIGO pacify_ttl");
    expect(formatMemoryToneHud("lucidez")).toBe("MEMORIA LUCIDEZ");
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
          lastApplied: ["pacify_ttl"],
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · CÓDIGO pacify_ttl · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ memoryTone: "lucidez" }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · MEMORIA LUCIDEZ · inv food×1 (0.5kg) · F1 ayuda",
    );
  });

  test("lastRejected vacío / ausente no pinta RECHAZO; tags → RECHAZO tag", () => {
    expect(formatLastRejectedHud(undefined)).toBeNull();
    expect(formatLastRejectedHud(null)).toBeNull();
    expect(formatLastRejectedHud([])).toBeNull();
    expect(formatLastRejectedHud(["pacify_ttl"])).toBe("RECHAZO pacify_ttl");
    expect(formatLastRejectedHud(["offer_food", "offer_pacify"])).toBe(
      "RECHAZO offer_food,offer_pacify",
    );
    expect(
      formatLastRejectedHud(["threat_noise", "threat_chase", "threat_speed"]),
    ).toBe("RECHAZO threat_noise,threat_chase,threat_speed");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("RECHAZO");
    expect(formatHudStatus(base({ lastRejected: null }))).not.toContain(
      "RECHAZO",
    );
    expect(formatHudStatus(base({ lastRejected: [] }))).not.toContain("RECHAZO");
    expect(formatHudStatus(base({ lastRejected: ["pacify_ttl"] }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · RECHAZO pacify_ttl · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(base({ lastRejected: ["offer_food", "offer_pacify"] })),
    ).toContain("RECHAZO offer_food,offer_pacify");
    expect(
      formatHudStatus(base({ gameOver: true, lastRejected: ["pacify_ttl"] })),
    ).not.toContain("RECHAZO");
  });

  test("RECHAZO no choca con CÓDIGO / CALMA / FURIA / LUCIDEZ / MEMORIA", () => {
    expect(formatLastGateHud(["pacify_ttl"])).toBe("CÓDIGO pacify_ttl");
    expect(formatLastRejectedHud(["pacify_ttl"])).toBe("RECHAZO pacify_ttl");
    expect(formatLastRejectedHud(["offer_food", "offer_pacify"])).toBe(
      "RECHAZO offer_food,offer_pacify",
    );
    expect(formatMemoryToneHud("lucidez")).toBe("MEMORIA LUCIDEZ");
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
          lastApplied: ["pacify_ttl"],
          lastRejected: ["offer_food", "offer_pacify"],
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · CÓDIGO pacify_ttl · RECHAZO offer_food,offer_pacify · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
          lastApplied: ["pacify_ttl"],
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · CÓDIGO pacify_ttl · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ lastApplied: ["pacify_ttl"] }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CÓDIGO pacify_ttl · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ lastApplied: ["pacify_ttl"] }))).not.toContain(
      "RECHAZO",
    );
    expect(
      formatHudStatus(base({ lastRejected: ["pacify_ttl"] })),
    ).not.toContain("CÓDIGO");
  });

  test("lineSource ausente no pinta token; llm → STUB; bank → BANCO", () => {
    expect(formatLineSourceHud(undefined)).toBeNull();
    expect(formatLineSourceHud(null)).toBeNull();
    expect(formatLineSourceHud("llm")).toBe("STUB");
    expect(formatLineSourceHud("bank")).toBe("BANCO");

    const bare = formatHudStatus(base());
    expect(bare).not.toContain("STUB");
    expect(bare).not.toContain("BANCO");
    expect(formatHudStatus(base({ lineSource: null }))).not.toContain("STUB");
    expect(formatHudStatus(base({ lineSource: null }))).not.toContain("BANCO");
    expect(formatHudStatus(base({ lineSource: "llm" }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · STUB · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ lineSource: "bank" }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · BANCO · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ lineSource: "llm" }))).not.toContain("BANCO");
    expect(formatHudStatus(base({ lineSource: "bank" }))).not.toContain("STUB");
    expect(
      formatHudStatus(base({ gameOver: true, lineSource: "llm" })),
    ).not.toContain("STUB");
  });

  test("STUB / BANCO no chocan con CÓDIGO / RECHAZO / CALMA / FURIA / LUCIDEZ / MEMORIA", () => {
    expect(formatLineSourceHud("llm")).toBe("STUB");
    expect(formatLineSourceHud("bank")).toBe("BANCO");
    expect(formatLastGateHud(["pacify_ttl"])).toBe("CÓDIGO pacify_ttl");
    expect(formatLastRejectedHud(["pacify_ttl"])).toBe("RECHAZO pacify_ttl");
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
          lastApplied: ["pacify_ttl"],
          lastRejected: ["offer_food", "offer_pacify"],
          lineSource: "llm",
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · CÓDIGO pacify_ttl · RECHAZO offer_food,offer_pacify · STUB · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
          lastApplied: ["pacify_ttl"],
          lastRejected: ["offer_food", "offer_pacify"],
          lineSource: "bank",
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · CÓDIGO pacify_ttl · RECHAZO offer_food,offer_pacify · BANCO · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(
      formatHudStatus(
        base({
          pacifyLeft: 8,
          speedBumpLeft: 3.5,
          moodBias: "lucidez",
          memoryTone: "demonio",
          lastApplied: ["pacify_ttl"],
          lastRejected: ["offer_food", "offer_pacify"],
        }),
      ),
    ).toBe(
      "día (21%) · mudos 3 · poseídos 2 · CALMA 8 · FURIA 4 · LUCIDEZ · MEMORIA DEMONIO · CÓDIGO pacify_ttl · RECHAZO offer_food,offer_pacify · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ lastRejected: ["pacify_ttl"] }))).toBe(
      "día (21%) · mudos 3 · poseídos 2 · RECHAZO pacify_ttl · inv food×1 (0.5kg) · F1 ayuda",
    );
    expect(formatHudStatus(base({ lastRejected: ["pacify_ttl"] }))).not.toContain(
      "STUB",
    );
    expect(formatHudStatus(base({ lastRejected: ["pacify_ttl"] }))).not.toContain(
      "BANCO",
    );
    expect(formatHudStatus(base({ lineSource: "llm" }))).not.toContain("CÓDIGO");
    expect(formatHudStatus(base({ lineSource: "llm" }))).not.toContain(
      "RECHAZO",
    );
  });
});

describe("death → R HUD vivo (mudos/poseídos, sin HAS MUERTO)", () => {
  function countKinds(sim: HostileSim): { muteN: number; possN: number } {
    return {
      muteN: sim.hostiles.filter((h) => h.kind === "mute").length,
      possN: sim.hostiles.filter((h) => h.kind === "possessed").length,
    };
  }

  function spawnDefaults(): HostileSim {
    const sim = new HostileSim();
    for (const s of defaultHostileSpawns()) sim.add(s.id, s.x, s.y);
    for (const s of defaultPossessedSpawns()) {
      sim.add(s.id, s.x, s.y, undefined, "possessed");
    }
    return sim;
  }

  test("spawns default = mudos 3 / poseídos 2; game-over no los pinta", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    expect(muteN).toBe(3);
    expect(possN).toBe(2);
    expect(defaultHostileSpawns()).toHaveLength(3);
    expect(defaultPossessedSpawns()).toHaveLength(2);

    const living = formatHudStatus(base({ muteN, possN }));
    expect(living).toContain("mudos 3");
    expect(living).toContain("poseídos 2");
    expect(living).not.toContain("HAS MUERTO");

    const dead = formatHudStatus(base({ muteN, possN, gameOver: true }));
    expect(dead).toBe(GAME_OVER_LINE);
    expect(dead).not.toContain("mudos");
    expect(dead).not.toContain("poseídos");
    expect(dead.match(/HAS MUERTO/g)).toEqual(["HAS MUERTO"]);
  });

  test("R respawn: gameOver false + msg reinicio → línea viva, una sola vez", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    const afterR = formatHudStatus(
      base({ muteN, possN, msg: "reinicio" }),
    );
    expect(afterR).toContain("mudos 3");
    expect(afterR).toContain("poseídos 2");
    expect(afterR).toContain("reinicio");
    expect(afterR).not.toContain("HAS MUERTO");
    expect(afterR).not.toMatch(/HAS MUERTO/);

    const f9Alive = formatHudStatus(
      base({ muteN, possN, msg: "cargado" }),
    );
    expect(f9Alive).toContain("mudos 3");
    expect(f9Alive).toContain("cargado");
    expect(f9Alive).not.toContain("HAS MUERTO");
  });

  test("R vivo: descansaste en HUD; R muerto: reinicio, no descansaste", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    expect(REST_HUD_MSG).toBe("descansaste");
    expect(REST_HUD_MSG).not.toBe("reinicio");

    const aliveRest = formatHudStatus(
      base({ muteN, possN, msg: REST_HUD_MSG }),
    );
    expect(aliveRest).toContain("descansaste");
    expect(aliveRest).toContain("mudos 3");
    expect(aliveRest).toContain("poseídos 2");
    expect(aliveRest).not.toContain("HAS MUERTO");
    expect(aliveRest).not.toContain("reinicio");

    const afterDeadR = formatHudStatus(
      base({ muteN, possN, msg: "reinicio" }),
    );
    expect(afterDeadR).toContain("reinicio");
    expect(afterDeadR).toContain("mudos 3");
    expect(afterDeadR).not.toContain("descansaste");
    expect(afterDeadR).not.toContain("HAS MUERTO");

    const stillDead = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: "reinicio" }),
    );
    expect(stillDead).toContain("HAS MUERTO");
    expect(stillDead).not.toContain("descansaste");
  });

  test("M mute/sonido en HUD; game-over también pinta lastLootMsg", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    expect(MUTE_HUD_MSG).toBe("mute");
    expect(SOUND_HUD_MSG).toBe("sonido");
    expect(MUTE_HUD_MSG).not.toBe(SOUND_HUD_MSG);

    const muted = formatHudStatus(
      base({ muteN, possN, audioHint: MUTE_HUD_MSG, msg: MUTE_HUD_MSG }),
    );
    expect(muted).toContain("mute");
    expect(muted).toContain("mudos 3");
    expect(muted).not.toContain("sonido");
    expect(muted).not.toContain("HAS MUERTO");

    const unmuted = formatHudStatus(
      base({ muteN, possN, msg: SOUND_HUD_MSG }),
    );
    expect(unmuted).toContain("sonido");
    expect(unmuted).toContain("mudos 3");
    expect(unmuted).not.toContain("mute");
    expect(unmuted).not.toContain("HAS MUERTO");

    const deadMute = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: MUTE_HUD_MSG }),
    );
    expect(deadMute).toBe(`${GAME_OVER_LINE} · ${MUTE_HUD_MSG}`);
    expect(deadMute).toContain("mute");
    expect(deadMute).not.toContain("sonido");

    const deadSound = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: SOUND_HUD_MSG }),
    );
    expect(deadSound).toBe(`${GAME_OVER_LINE} · ${SOUND_HUD_MSG}`);
    expect(deadSound).toContain("sonido");
    expect(deadSound).not.toContain("mute");
  });

  test("+/- zoom: acercaste/alejaste en HUD; game-over también pinta lastLootMsg", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    expect(ZOOM_IN_HUD_MSG).toBe("acercaste");
    expect(ZOOM_OUT_HUD_MSG).toBe("alejaste");
    expect(ZOOM_IN_HUD_MSG).not.toBe(ZOOM_OUT_HUD_MSG);

    const zoomedIn = formatHudStatus(
      base({ muteN, possN, msg: ZOOM_IN_HUD_MSG }),
    );
    expect(zoomedIn).toContain("acercaste");
    expect(zoomedIn).toContain("mudos 3");
    expect(zoomedIn).not.toContain("alejaste");
    expect(zoomedIn).not.toContain("HAS MUERTO");

    const zoomedOut = formatHudStatus(
      base({ muteN, possN, msg: ZOOM_OUT_HUD_MSG }),
    );
    expect(zoomedOut).toContain("alejaste");
    expect(zoomedOut).toContain("mudos 3");
    expect(zoomedOut).not.toContain("acercaste");
    expect(zoomedOut).not.toContain("HAS MUERTO");

    const deadIn = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: ZOOM_IN_HUD_MSG }),
    );
    expect(deadIn).toBe(`${GAME_OVER_LINE} · ${ZOOM_IN_HUD_MSG}`);
    expect(deadIn).toContain("acercaste");
    expect(deadIn).not.toContain("alejaste");

    const deadOut = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: ZOOM_OUT_HUD_MSG }),
    );
    expect(deadOut).toBe(`${GAME_OVER_LINE} · ${ZOOM_OUT_HUD_MSG}`);
    expect(deadOut).toContain("alejaste");
    expect(deadOut).not.toContain("acercaste");
  });

  test("T/Esc cierra diálogo: diálogo id no queda; talkHint sí; open sigue pintando", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    const dlg = dialogueOpenHudMsg("poss-a");
    expect(dlg).toBe("diálogo poss-a");

    const opened = formatHudStatus(
      base({ muteN, possN, dlgHint: dlg, msg: dlg }),
    );
    expect(opened).toContain("diálogo poss-a");
    expect(opened).toContain("mudos 3");
    expect(opened).not.toContain("HAS MUERTO");

    const closed = formatHudStatus(
      base({
        muteN,
        possN,
        talkHint: "T hablar poss-a (trust 50)",
      }),
    );
    expect(closed).not.toContain("diálogo poss-a");
    expect(closed).toContain("T hablar poss-a (trust 50)");
    expect(closed).toContain("mudos 3");
    expect(closed).not.toContain("HAS MUERTO");

    const lingerWould = formatHudStatus(
      base({ muteN, possN, msg: dlg }),
    );
    expect(lingerWould).toContain("diálogo poss-a");
    expect(closed).not.toBe(lingerWould);
  });

  test("validate cierra diálogo: diálogo id no queda; still-open sí pinta; msg linger evitado", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    const dlg = dialogueOpenHudMsg("poss-a");
    const trust = "calmar → trust 64 (+14)";

    const stillOpen = formatHudStatus(
      base({ muteN, possN, dlgHint: dlg, msg: dlg }),
    );
    expect(stillOpen).toContain("diálogo poss-a");
    expect(stillOpen).toContain("mudos 3");
    expect(stillOpen).not.toContain("HAS MUERTO");

    const closed = formatHudStatus(
      base({
        muteN,
        possN,
        talkHint: "T hablar poss-a (trust 50)",
      }),
    );
    expect(closed).not.toContain("diálogo poss-a");
    expect(closed).toContain("T hablar poss-a (trust 50)");
    expect(closed).not.toContain("HAS MUERTO");

    const lingerWould = formatHudStatus(
      base({ muteN, possN, msg: dlg }),
    );
    expect(lingerWould).toContain("diálogo poss-a");
    expect(closed).not.toBe(lingerWould);

    const closedTrust = formatHudStatus(
      base({ muteN, possN, msg: trust }),
    );
    expect(closedTrust).toContain(trust);
    expect(closedTrust).not.toContain("diálogo poss-a");
  });

  test("muerte con panel abierto: HAS MUERTO sin leftover diálogo id; ya cerrado igual; keepable se queda", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    const dlg = dialogueOpenHudMsg("poss-a");
    const combat = "golpe -12 HP";
    const starve = "hambre te debilita";

    const deadOpen = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: "" }),
    );
    expect(deadOpen).toBe(GAME_OVER_LINE);
    expect(deadOpen).toContain("HAS MUERTO");
    expect(deadOpen).not.toContain("diálogo");
    expect(deadOpen).not.toContain("poss-a");

    const lingerWould = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: dlg }),
    );
    expect(lingerWould).toContain("diálogo poss-a");
    expect(deadOpen).not.toBe(lingerWould);
    expect(isKeepableDeathCause(dlg)).toBe(false);

    const deadClosed = formatHudStatus(
      base({ muteN, possN, gameOver: true }),
    );
    expect(deadClosed).toBe(GAME_OVER_LINE);
    expect(deadClosed).not.toContain("diálogo");

    const deadCombat = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: combat }),
    );
    expect(deadCombat).toBe(`${GAME_OVER_LINE} · ${combat}`);
    expect(deadCombat).not.toContain("diálogo");
    expect(isKeepableDeathCause(combat)).toBe(true);

    const deadStarve = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: starve }),
    );
    expect(deadStarve).toBe(`${GAME_OVER_LINE} · ${starve}`);
    expect(isKeepableDeathCause(starve)).toBe(true);
  });

  test("F9 load-muerto con panel abierto: HAS MUERTO · cargado sin leftover diálogo id; ya cerrado igual; load-vivo sí pinta", () => {
    const { muteN, possN } = countKinds(spawnDefaults());
    const dlg = dialogueOpenHudMsg("poss-a");

    const deadOpen = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: "cargado" }),
    );
    expect(deadOpen).toBe(`${GAME_OVER_LINE} · cargado`);
    expect(deadOpen).toContain("HAS MUERTO");
    expect(deadOpen).toContain("cargado");
    expect(deadOpen).not.toContain("diálogo");
    expect(deadOpen).not.toContain("poss-a");
    expect(isKeepableDeathCause(dlg)).toBe(false);

    const lingerWould = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: dlg }),
    );
    expect(lingerWould).toContain("diálogo poss-a");
    expect(deadOpen).not.toBe(lingerWould);

    const deadClosed = formatHudStatus(
      base({ muteN, possN, gameOver: true, msg: "cargado" }),
    );
    expect(deadClosed).toBe(`${GAME_OVER_LINE} · cargado`);
    expect(deadClosed).not.toContain("diálogo");

    const liveOpen = formatHudStatus(
      base({ muteN, possN, dlgHint: dlg, msg: "cargado" }),
    );
    expect(liveOpen).toContain("cargado");
    expect(liveOpen).toContain("diálogo poss-a");
    expect(liveOpen).not.toContain("HAS MUERTO");
  });
});

describe("helpInputApplies / applyHelpInput / nextShowHelp (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: F1 no aplica; vivo / load-vivo sí", () => {
    expect(helpInputApplies(true)).toBe(false);
    expect(helpInputApplies(false)).toBe(true);

    expect(nextShowHelp(true, true, true)).toBe(true);
    expect(nextShowHelp(true, false, true)).toBe(false);
    expect(nextShowHelp(true, true, false)).toBe(true);
    expect(nextShowHelp(true, false, false)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(helpInputApplies(deadRt.gameOver)).toBe(false);
    expect(nextShowHelp(deadRt.gameOver, true, true)).toBe(true);
    expect(nextShowHelp(deadRt.gameOver, false, true)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(helpInputApplies(liveRt.gameOver)).toBe(true);
    expect(nextShowHelp(liveRt.gameOver, false, true)).toBe(true);
    expect(nextShowHelp(liveRt.gameOver, true, true)).toBe(false);
    expect(nextShowHelp(liveRt.gameOver, true, false)).toBe(true);
    expect(nextShowHelp(false, false, true)).toBe(true);
    expect(nextShowHelp(false, true, true)).toBe(false);
    expect(nextShowHelp(false, true, false)).toBe(true);
  });

  test("gameOver + wantsToggle no flippea showHelp; vivo F1 togglea", () => {
    let deadOpen = true;
    expect(
      applyHelpInput(true, true, () => {
        deadOpen = !deadOpen;
        return deadOpen;
      }),
    ).toBeNull();
    expect(deadOpen).toBe(true);
    expect(nextShowHelp(true, true, true)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    let deadClosed = false;
    expect(
      applyHelpInput(deadRt.gameOver, true, () => {
        deadClosed = !deadClosed;
        return deadClosed;
      }),
    ).toBeNull();
    expect(deadClosed).toBe(false);
    expect(nextShowHelp(deadRt.gameOver, false, true)).toBe(false);

    let live = false;
    const opened = applyHelpInput(false, true, () => {
      live = !live;
      return live;
    });
    expect(opened).toBe(true);
    expect(live).toBe(true);
    expect(
      applyHelpInput(false, false, () => {
        live = !live;
        return live;
      }),
    ).toBeNull();
    expect(live).toBe(true);

    const liveRt = loadAliveRuntime(true);
    const closed = applyHelpInput(liveRt.gameOver, true, () => {
      live = !live;
      return live;
    });
    expect(closed).toBe(false);
    expect(live).toBe(false);
    expect(nextShowHelp(false, false, true)).toBe(true);
    expect(nextShowHelp(false, true, true)).toBe(false);
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan F1 sin flip; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("helpInputApplies(");
    expect(gameSrc).toContain("nextShowHelp(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeHelp\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2800}consumeHelp\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,3200}if \(loaded\.gameOver\) this\.input\.consumeHelp\(\)/,
    );
    expect(gameSrc).toMatch(
      /helpInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsHelp[\s\S]{0,200}nextShowHelp/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}helpInputApplies/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}helpInputApplies/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}nextShowHelp/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}nextShowHelp/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}this\.showHelp\s*=/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
  });
});
