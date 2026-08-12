/**
 * Bridge LLM opcional (Fase 6 stub) — sin API keys ni red.
 * Contrato: ask(snapshot) → línea o null (timeout/error → fallback banco).
 * Estilo Vivant: ai-req / ai-resp por archivos inyectables; nunca bloquea el sim.
 */

import type { PossessionTone } from "./lineBank";

export interface LlmAskSnapshot {
  entityId: string;
  tone: PossessionTone;
  /** periodic | see_player | dialogue | otro. */
  trigger?: string;
  /** DialogueIntent u otro tag libre. */
  intent?: string;
  trust?: number;
  prompt?: string;
  memorySummary?: string;
}

/** Interfaz mínima del bridge (stub hoy; API real después). */
export interface LlmBridge {
  ask(snapshot: LlmAskSnapshot): Promise<string | null>;
}

/**
 * IO estilo ai-req-{id}.txt / ai-resp-{id}.txt (headless).
 * Inyectable: memoria en tests, fs en tooling — no acopla a Node en el bundle.
 */
export interface LlmFileIo {
  writeRequest(requestId: string, body: string): Promise<void>;
  readResponse(requestId: string): Promise<string | null>;
}

export interface StubLlmBridgeOptions {
  /**
   * Respuesta fija. `null` = timeout simulado.
   * Si no se pasa (y no hay responder/files) → null.
   */
  response?: string | null;
  /** Gana sobre `response` cuando está definido. */
  responder?: (
    snapshot: LlmAskSnapshot,
  ) => string | null | Promise<string | null>;
  /** Exchange ai-req/ai-resp en dir lógico (vía LlmFileIo). */
  files?: LlmFileIo;
  /** Timeout de poll de archivos (ms). Default 40. */
  timeoutMs?: number;
  /** Intervalo de poll (ms). Default 5. */
  pollMs?: number;
}

/** FileIo en memoria — tests / headless sin disco. */
export class MemoryLlmFileIo implements LlmFileIo {
  readonly requests = new Map<string, string>();
  readonly responses = new Map<string, string>();

  async writeRequest(requestId: string, body: string): Promise<void> {
    this.requests.set(requestId, body);
  }

  async readResponse(requestId: string): Promise<string | null> {
    return this.responses.has(requestId)
      ? (this.responses.get(requestId) ?? null)
      : null;
  }

  /** Simula daemon: escribe ai-resp a partir del último req (o id dado). */
  seedResponse(requestId: string, line: string): void {
    this.responses.set(requestId, line);
  }
}

let stubSeq = 0;

/**
 * Stub sin red: respuesta fija, responder inyectado, o poll de archivos.
 * Cualquier fallo / timeout → null (el caller cae al lineBank).
 */
export class StubLlmBridge implements LlmBridge {
  private readonly response: string | null | undefined;
  private readonly responder?: StubLlmBridgeOptions["responder"];
  private readonly files?: LlmFileIo;
  private readonly timeoutMs: number;
  private readonly pollMs: number;

  constructor(opts: StubLlmBridgeOptions = {}) {
    this.response = opts.response;
    this.responder = opts.responder;
    this.files = opts.files;
    this.timeoutMs = opts.timeoutMs ?? 40;
    this.pollMs = opts.pollMs ?? 5;
  }

  async ask(snapshot: LlmAskSnapshot): Promise<string | null> {
    try {
      if (this.responder) {
        return normalizeLine(await this.responder(snapshot));
      }
      if (this.response !== undefined) {
        return normalizeLine(this.response);
      }
      if (this.files) {
        return await this.askViaFiles(snapshot);
      }
      // Sin fuente → timeout simulado (fuerza fallback).
      return null;
    } catch {
      return null;
    }
  }

  private async askViaFiles(snapshot: LlmAskSnapshot): Promise<string | null> {
    const files = this.files!;
    stubSeq += 1;
    const requestId = `stub-${Date.now()}-${stubSeq}`;
    const body = JSON.stringify({
      id: requestId,
      entityId: snapshot.entityId,
      tone: snapshot.tone,
      trigger: snapshot.trigger ?? null,
      intent: snapshot.intent ?? null,
      trust: snapshot.trust ?? null,
      prompt: snapshot.prompt ?? null,
      memorySummary: snapshot.memorySummary ?? null,
    });
    await files.writeRequest(requestId, body);

    const deadline = Date.now() + Math.max(0, this.timeoutMs);
    do {
      const raw = await files.readResponse(requestId);
      const line = parseRespBody(raw);
      if (line !== null) return line;
      if (Date.now() >= deadline) break;
      await sleep(this.pollMs);
    } while (Date.now() < deadline);

    return null;
  }
}

function normalizeLine(line: string | null): string | null {
  if (line === null) return null;
  const t = line.trim();
  return t.length > 0 ? t : null;
}

/** Acepta texto plano o JSON `{ "line": "..." }` / `{ "say": "..." }`. */
function parseRespBody(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed) as { line?: unknown; say?: unknown };
      const v = obj.line ?? obj.say;
      if (typeof v === "string") return normalizeLine(v);
    } catch {
      // cae a texto plano
    }
  }
  // Primera línea no vacía
  const first = trimmed.split(/\r?\n/).find((l) => l.trim().length > 0);
  return normalizeLine(first ?? null);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

export interface ResolveLineOptions {
  enabled: boolean;
  bridge?: LlmBridge | null;
  snapshot: LlmAskSnapshot;
  fallback: () => string;
}

export type LineSource = "llm" | "bank";

/**
 * Si bridge habilitado y responde string → esa línea; si no / null / error → fallback.
 * Nunca lanza; nunca deja al caller sin línea.
 */
export async function resolveLineWithBridge(
  opts: ResolveLineOptions,
): Promise<{ line: string; source: LineSource }> {
  if (!opts.enabled || !opts.bridge) {
    return { line: opts.fallback(), source: "bank" };
  }
  try {
    const line = await opts.bridge.ask(opts.snapshot);
    if (typeof line === "string" && line.trim().length > 0) {
      return { line: line.trim(), source: "llm" };
    }
  } catch {
    // fallback
  }
  return { line: opts.fallback(), source: "bank" };
}
