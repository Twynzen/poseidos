/**
 * Config de sandbox (kernel). Flags opt-in; defaults conservadores.
 * `llm.enabled` apagado = cero costo, comportamiento idéntico al banco.
 */

export interface LlmConfig {
  /** Opt-in al bridge LLM. Default false. */
  enabled: boolean;
  /** Timeout de espera stub/daemon (ms). 0 = un solo intento / inmediato. */
  timeoutMs: number;
}

export interface GameConfig {
  llm: LlmConfig;
}

export const DEFAULT_CONFIG: GameConfig = {
  llm: {
    enabled: false,
    timeoutMs: 0,
  },
};

/** Merge superficial de llm + resto; no muta el default. */
export function mergeConfig(
  partial?: Partial<{ llm: Partial<LlmConfig> }>,
): GameConfig {
  return {
    llm: {
      ...DEFAULT_CONFIG.llm,
      ...(partial?.llm ?? {}),
    },
  };
}

/** Segundos reales de un ciclo día/noche completo (demo jugable ~4 min). Antes 48. */
export const DEFAULT_DAY_LENGTH_SEC = 240;

/**
 * Ciclo ultra-corto (~48s) para demos/debug de día-noche rápido.
 * No usar en partida normal — ver DEFAULT_DAY_LENGTH_SEC.
 */
export const DEMO_DAY_LENGTH_SEC = 48;
