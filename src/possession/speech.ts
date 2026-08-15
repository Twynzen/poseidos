/**
 * Disparadores de habla de poseídos (F4) — headless.
 * Habla al ver al player o de forma periódica; banco determinista.
 * LLM opcional vía resolveLineWithBridge (nunca bloquea el tick).
 */

import {
  pickLine,
  pickTone,
  type PossessionTone,
} from "./lineBank";
import {
  compactLlmLine,
  resolveLineWithBridge,
  type LlmBridge,
  type LineSource,
} from "./llmBridge";

export type SpeechTrigger = "periodic" | "see_player" | "dialogue";

export interface SpeechUtterance {
  entityId: string;
  tone: PossessionTone;
  line: string;
  trigger: SpeechTrigger;
  lineSource?: LineSource;
}

export interface SpeechActive {
  line: string;
  tone: PossessionTone;
  trigger: SpeechTrigger;
}

export interface SpeechDirectorOptions {
  /** Segundos mostrando el bubble. */
  displayDuration?: number;
  /** Cooldown mínimo tras hablar. */
  cooldown?: number;
  /** Intervalo base de habla periódica (sin ver player). */
  periodicInterval?: number;
  /** Jitter 0–1 sobre periodicInterval. */
  periodicJitter?: number;
  /** Al ver player, cooldown más corto (urgencia). */
  seePlayerCooldown?: number;
  /** Opt-in bridge (default off — tick idéntico al banco). */
  llmEnabled?: boolean;
  bridge?: LlmBridge | null;
}

interface SpeechState {
  displayLeft: number;
  cooldownLeft: number;
  periodicLeft: number;
  current: SpeechActive | null;
  moodBias: PossessionTone;
  /** Generación de habla; invalida upgrades LLM tardíos. */
  speakGen: number;
}

const DEFAULTS = {
  displayDuration: 3.2,
  cooldown: 5.5,
  periodicInterval: 9,
  periodicJitter: 0.35,
  seePlayerCooldown: 3.5,
} as const;

/**
 * Director de habla por entidad poseída.
 * No conoce Three ni el mapa — solo dt + seesPlayer.
 */
export class SpeechDirector {
  readonly displayDuration: number;
  readonly cooldown: number;
  readonly periodicInterval: number;
  readonly periodicJitter: number;
  readonly seePlayerCooldown: number;
  private readonly llmEnabled: boolean;
  private readonly bridge: LlmBridge | null;
  private readonly states = new Map<string, SpeechState>();
  private readonly rng: () => number;

  constructor(opts: SpeechDirectorOptions = {}, rng: () => number = Math.random) {
    this.displayDuration = opts.displayDuration ?? DEFAULTS.displayDuration;
    this.cooldown = opts.cooldown ?? DEFAULTS.cooldown;
    this.periodicInterval = opts.periodicInterval ?? DEFAULTS.periodicInterval;
    this.periodicJitter = opts.periodicJitter ?? DEFAULTS.periodicJitter;
    this.seePlayerCooldown = opts.seePlayerCooldown ?? DEFAULTS.seePlayerCooldown;
    this.llmEnabled = opts.llmEnabled ?? false;
    this.bridge = opts.bridge ?? null;
    this.rng = rng;
  }

  register(id: string, moodBias?: PossessionTone): void {
    if (this.states.has(id)) return;
    const bias = moodBias ?? pickTone(this.rng);
    this.states.set(id, {
      displayLeft: 0,
      cooldownLeft: 0.5 + this.rng() * 1.5,
      periodicLeft: this.nextPeriodic(),
      current: null,
      moodBias: bias,
      speakGen: 0,
    });
  }

  unregister(id: string): void {
    this.states.delete(id);
  }

  clear(): void {
    this.states.clear();
  }

  has(id: string): boolean {
    return this.states.has(id);
  }

  /** Ids registrados (mood bias / timers). */
  ids(): readonly string[] {
    return [...this.states.keys()];
  }

  getActive(id: string): SpeechActive | null {
    return this.states.get(id)?.current ?? null;
  }

  /** Snapshot de bubbles activos (tests / overlay). */
  allActive(): Array<{ entityId: string } & SpeechActive> {
    const out: Array<{ entityId: string } & SpeechActive> = [];
    for (const [id, st] of this.states) {
      if (st.current) out.push({ entityId: id, ...st.current });
    }
    return out;
  }

  /**
   * Avanza timers; puede emitir 0+ utterances este frame.
   * `seesPlayer` por entidad (LOS+rango ya resuelto afuera).
   * Línea inmediata del banco; si LLM enabled, upgrade async no bloqueante.
   */
  tick(
    dt: number,
    entities: ReadonlyArray<{ id: string; seesPlayer: boolean }>,
  ): SpeechUtterance[] {
    const uttered: SpeechUtterance[] = [];
    if (dt <= 0) return uttered;

    const alive = new Set(entities.map((e) => e.id));
    for (const id of [...this.states.keys()]) {
      if (!alive.has(id)) this.states.delete(id);
    }

    for (const e of entities) {
      let st = this.states.get(e.id);
      if (!st) {
        this.register(e.id);
        st = this.states.get(e.id)!;
      }

      if (st.displayLeft > 0) {
        st.displayLeft = Math.max(0, st.displayLeft - dt);
        if (st.displayLeft <= 0) st.current = null;
      }
      if (st.cooldownLeft > 0) {
        st.cooldownLeft = Math.max(0, st.cooldownLeft - dt);
      }
      st.periodicLeft = Math.max(0, st.periodicLeft - dt);

      if (st.cooldownLeft > 0) continue;

      let trigger: SpeechTrigger | null = null;
      if (e.seesPlayer) {
        trigger = "see_player";
      } else if (st.periodicLeft <= 0) {
        trigger = "periodic";
      }
      if (!trigger) continue;

      const tone = pickTone(this.rng, st.moodBias);
      const line = pickLine(tone, this.rng);
      const u: SpeechUtterance = {
        entityId: e.id,
        tone,
        line,
        trigger,
        lineSource: "bank",
      };
      st.speakGen += 1;
      const gen = st.speakGen;
      st.current = { line, tone, trigger };
      st.displayLeft = this.displayDuration;
      st.cooldownLeft =
        trigger === "see_player" ? this.seePlayerCooldown : this.cooldown;
      st.periodicLeft = this.nextPeriodic();
      uttered.push(u);
      this.maybeUpgradeLine(e.id, tone, trigger, gen);
    }

    return uttered;
  }

  getMoodBias(id: string): PossessionTone | null {
    return this.states.get(id)?.moodBias ?? null;
  }

  /** Actualiza bias de tono (p.ej. desde memoria corta post-diálogo). */
  setMoodBias(id: string, tone: PossessionTone): void {
    let st = this.states.get(id);
    if (!st) {
      this.register(id, tone);
      st = this.states.get(id)!;
    }
    st.moodBias = tone;
  }

  /**
   * Habla forzada (respuesta a diálogo). Respeta display; resetea cooldown.
   */
  forceSpeak(
    id: string,
    tone: PossessionTone,
    line: string,
    trigger: SpeechTrigger = "dialogue",
    lineSource: LineSource = "bank",
  ): SpeechUtterance | null {
    let st = this.states.get(id);
    if (!st) {
      this.register(id, tone);
      st = this.states.get(id)!;
    }
    st.speakGen += 1;
    const u: SpeechUtterance = {
      entityId: id,
      tone,
      line,
      trigger,
      lineSource,
    };
    st.current = { line, tone, trigger };
    st.displayLeft = this.displayDuration;
    st.cooldownLeft = this.seePlayerCooldown;
    st.periodicLeft = this.nextPeriodic();
    st.moodBias = tone;
    return u;
  }

  /**
   * Habla con bridge opcional (await). Para diálogo / tests.
   * enabled false → no llama bridge; null → banco.
   */
  async speakWithBridge(
    id: string,
    tone: PossessionTone,
    trigger: SpeechTrigger = "dialogue",
    extras?: { intent?: string; trust?: number },
  ): Promise<SpeechUtterance> {
    const resolved = await resolveLineWithBridge({
      enabled: this.llmEnabled,
      bridge: this.bridge,
      snapshot: {
        entityId: id,
        tone,
        trigger,
        intent: extras?.intent,
        trust: extras?.trust,
      },
      fallback: () => pickLine(tone, this.rng),
    });
    return this.forceSpeak(
      id,
      tone,
      resolved.line,
      trigger,
      resolved.source,
    )!;
  }

  private maybeUpgradeLine(
    id: string,
    tone: PossessionTone,
    trigger: SpeechTrigger,
    gen: number,
  ): void {
    if (!this.llmEnabled || !this.bridge) return;
    const bridge = this.bridge;
    void (async () => {
      try {
        const line = compactLlmLine(
          await bridge.ask({ entityId: id, tone, trigger }),
        );
        if (!line) return;
        const st = this.states.get(id);
        if (!st || st.speakGen !== gen || !st.current) return;
        st.current = { ...st.current, line };
      } catch {
        // ignore — bubble ya tiene banco
      }
    })();
  }

  private nextPeriodic(): number {
    const j = this.periodicJitter;
    const factor = 1 - j + this.rng() * 2 * j;
    return this.periodicInterval * factor;
  }
}
