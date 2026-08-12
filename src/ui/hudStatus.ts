/**
 * HUD de estado compacto (texto) — sin muro de controles por defecto.
 * F1 (showHelp) revela CONTROLS_HELP.
 */

export const CONTROLS_HELP =
  "WASD mover · Shift correr · Espacio/V atacar · X disparar · E puerta/loot · G loot · Q usar/lluvia · I inv · B barricada · C vendaje · H cocinar · T diálogo · L linterna · R descanso · Z dormir · M mute · +/- zoom · F5 guardar · F9 cargar";

export type HudStatusInput = {
  modo: string;
  /** 0–100 */
  phasePct: number;
  muteN: number;
  possN: number;
  invLine: string;
  /** Sin separador inicial, p.ej. "cerca: chest […] G/E loot" */
  nearHint?: string;
  /** p.ej. "ruido run r6" */
  noiseHint?: string;
  talkHint?: string;
  dlgHint?: string;
  indoor?: boolean;
  /** "safehouse" | "safehouse cama" */
  safeHint?: string;
  raining?: boolean;
  flashlight?: boolean;
  /** Ambient stub: "♪" | "mute" | "lluvia♪" */
  audioHint?: string;
  /** Mensaje contextual (loot, daño, etc.) sin separador */
  msg?: string;
  /** "I cerrar inv" cuando el panel está abierto */
  invDetailHint?: string;
  tileX: number;
  tileY: number;
  chunksLoaded: number;
  chunksTotal: number;
  fov: number;
  gameOver?: boolean;
  showHelp?: boolean;
};

function joinParts(parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" · ");
}

/**
 * Formato compacto por defecto (sin muro WASD).
 * Con showHelp: CONTROLS_HELP + línea de estado + F1 cerrar.
 * Con gameOver: mensaje de muerte.
 */
export function formatHudStatus(input: HudStatusInput): string {
  if (input.gameOver) {
    const base = "HAS MUERTO — R reiniciar · F9 cargar";
    const msg = input.msg?.trim();
    return msg ? `${base} · ${msg}` : base;
  }

  const status = joinParts([
    `${input.modo} (${input.phasePct}%)`,
    input.raining ? "lluvia" : null,
    input.indoor ? "indoor" : null,
    input.safeHint?.trim() || null,
    input.flashlight ? "linterna" : null,
    input.audioHint?.trim() || null,
    `mudos ${input.muteN}`,
    `poseídos ${input.possN}`,
    input.noiseHint?.trim() || null,
    input.invLine?.trim() || null,
    input.nearHint?.trim() || null,
    input.invDetailHint?.trim() || null,
    input.talkHint?.trim() || null,
    input.dlgHint?.trim() || null,
    input.msg?.trim() || null,
    `tile ${input.tileX},${input.tileY}`,
    `chunks ${input.chunksLoaded}/${input.chunksTotal}`,
    `fov ${input.fov}`,
    input.showHelp ? "F1 cerrar ayuda" : "F1 ayuda",
  ]);

  if (input.showHelp) {
    return `${CONTROLS_HELP}\n${status}`;
  }
  return status;
}
