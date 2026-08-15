import { describe, expect, test } from "vitest";
import {
  CONTROLS_HELP,
  formatHudDebugTokens,
  formatHudStatus,
  formatPacifyHud,
  formatSpeedBumpHud,
  formatMoodBiasHud,
  formatMemoryToneHud,
  formatLastGateHud,
  formatLastRejectedHud,
  formatLineSourceHud,
  type HudStatusInput,
} from "../src/ui/hudStatus";

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

  test("gameOver formato", () => {
    expect(formatHudStatus(base({ gameOver: true }))).toBe(
      "HAS MUERTO — R reiniciar · F9 cargar",
    );
    expect(
      formatHudStatus(base({ gameOver: true, msg: "HAS MUERTO" })),
    ).toBe("HAS MUERTO — R reiniciar · F9 cargar · HAS MUERTO");
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
