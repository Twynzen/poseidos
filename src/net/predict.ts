/**
 * Stub client predict + reconcile (F7) — headless, sin sockets.
 * Predice move local; corrige contra snapshot del host (ack = snap.seq).
 */
import type { NetInput, NetSnapshot } from "./session";

export interface PredictedInput {
  seq: number;
  dx: number;
  dy: number;
  /** dt (s) con el que se aplicó en predict — se reusa en reconcile. */
  dt: number;
  /** Pos predicha tras aplicar este input (tracking opcional). */
  x: number;
  y: number;
}

/**
 * Buffer de predicción del cliente.
 * pushMove encola + avanza pred; reconcile descarta ack'd y re-simula pending.
 */
export class ClientPredictBuffer {
  /** Última pos autoritativa (ack). */
  authX: number;
  authY: number;
  /** Pos predicha actual. */
  predX: number;
  predY: number;
  private pending: PredictedInput[] = [];
  private nextSeq = 1;
  private _lastAck = 0;
  readonly moveSpeed: number;

  constructor(x: number, y: number, opts?: { moveSpeed?: number }) {
    this.authX = x;
    this.authY = y;
    this.predX = x;
    this.predY = y;
    this.moveSpeed = opts?.moveSpeed ?? 3;
  }

  /**
   * Genera NetInput, aplica predict local, encola.
   * Devuelve el input a enviar al host (sin dt en wire).
   */
  pushMove(dx: number, dy: number, dt: number): NetInput {
    const safeDx = Number.isFinite(dx) ? dx : 0;
    const safeDy = Number.isFinite(dy) ? dy : 0;
    const step = Math.max(0, Number.isFinite(dt) ? dt : 0);
    const seq = this.nextSeq++;

    this.applyMove(safeDx, safeDy, step);

    const input: NetInput = { seq, dx: safeDx, dy: safeDy };
    this.pending.push({
      seq,
      dx: safeDx,
      dy: safeDy,
      dt: step,
      x: this.predX,
      y: this.predY,
    });
    return input;
  }

  /**
   * Tras snapshot del host: ack = snap.ack ?? snap.seq;
   * drop pending seq<=ack; reset a snap pos; re-aplica pending restantes.
   */
  reconcile(
    snap: Pick<NetSnapshot, "seq" | "playerX" | "playerY"> & { ack?: number },
  ): void {
    const ack = snap.ack ?? snap.seq;
    this._lastAck = ack;
    this.pending = this.pending.filter((p) => p.seq > ack);

    this.authX = snap.playerX;
    this.authY = snap.playerY;
    this.predX = snap.playerX;
    this.predY = snap.playerY;

    for (const p of this.pending) {
      this.applyMove(p.dx, p.dy, p.dt);
      p.x = this.predX;
      p.y = this.predY;
    }
  }

  pendingCount(): number {
    return this.pending.length;
  }

  lastAck(): number {
    return this._lastAck;
  }

  /** Aplica dx/dy (normalizados por hypot) * moveSpeed * dt sobre pred. */
  private applyMove(dx: number, dy: number, dt: number): void {
    const len = Math.hypot(dx, dy);
    if (len <= 0 || dt <= 0) return;
    const scale = (this.moveSpeed * dt) / len;
    this.predX += dx * scale;
    this.predY += dy * scale;
  }
}
