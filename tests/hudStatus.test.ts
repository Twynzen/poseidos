import { describe, expect, test } from "vitest";
import {
  CONTROLS_HELP,
  formatHudStatus,
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

describe("formatHudStatus compact", () => {
  test("no incluye muro WASD por defecto", () => {
    const s = formatHudStatus(base());
    expect(s).not.toContain("WASD");
    expect(s).not.toContain(CONTROLS_HELP);
    expect(s).toContain("día (21%)");
    expect(s).toContain("mudos 3");
    expect(s).toContain("poseídos 2");
    expect(s).toContain("inv food×1");
    expect(s).toContain("tile 10,12");
    expect(s).toContain("chunks 4/9");
    expect(s).toContain("fov 8");
  });

  test("hint F1 ayuda en compacto", () => {
    const s = formatHudStatus(base());
    expect(s).toMatch(/F1 ayuda/);
    expect(s).not.toMatch(/F1 cerrar ayuda/);
  });

  test("showHelp incluye CONTROLS_HELP / WASD y F1 cerrar", () => {
    const s = formatHudStatus(base({ showHelp: true }));
    expect(s).toContain("WASD");
    expect(s).toContain(CONTROLS_HELP);
    expect(CONTROLS_HELP).toMatch(/\+\/- zoom/);
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
    expect(CONTROLS_HELP).toMatch(/Q usar slot/);
    expect(CONTROLS_HELP).toMatch(/G loot · Shift\+G stack/);
    expect(CONTROLS_HELP).toMatch(/U tirar/);
    expect(CONTROLS_HELP).toMatch(/Shift\+U stack/);
    expect(CONTROLS_HELP).toContain("U inv tirar");
    expect(s).toMatch(/F1 cerrar ayuda/);
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
});
