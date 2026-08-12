import { isWalkable, type Tile, type TileKind } from "./tile";
import {
  CHUNK_SIZE,
  Chunk,
  chunkKey,
  worldToChunkCoord,
  worldToLocalInChunk,
} from "./chunk";

export interface TileMapSize {
  width: number;
  height: number;
}

/**
 * Mapa de tiles chunked (sim headless).
 * Coords: x columna [0..w), y fila [0..h). Mundo Three usa (x, z=y).
 * Storage: chunks CHUNK_SIZE×CHUNK_SIZE; API pública por world coords.
 */
export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly chunkSize = CHUNK_SIZE;
  /** Chunks en X que cubren el mapa (ceil). */
  readonly chunksX: number;
  /** Chunks en Y que cubren el mapa (ceil). */
  readonly chunksY: number;
  private readonly chunks = new Map<string, Chunk>();

  constructor(width: number, height: number, fill: () => Tile) {
    this.width = width;
    this.height = height;
    this.chunksX = Math.max(1, Math.ceil(width / CHUNK_SIZE));
    this.chunksY = Math.max(1, Math.ceil(height / CHUNK_SIZE));
    for (let cy = 0; cy < this.chunksY; cy++) {
      for (let cx = 0; cx < this.chunksX; cx++) {
        this.chunks.set(chunkKey(cx, cy), new Chunk(cx, cy, fill));
      }
    }
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getChunk(cx: number, cy: number): Chunk | undefined {
    return this.chunks.get(chunkKey(cx, cy));
  }

  /** Alias claro: tile por world coords. */
  getTile(x: number, y: number): Tile | undefined {
    return this.get(x, y);
  }

  /** Alias claro: set por world coords. */
  setTile(x: number, y: number, tile: Tile): void {
    this.set(x, y, tile);
  }

  get(x: number, y: number): Tile | undefined {
    if (!this.inBounds(x, y)) return undefined;
    const { cx, cy } = worldToChunkCoord(x, y);
    const { lx, ly } = worldToLocalInChunk(x, y);
    return this.getChunk(cx, cy)?.getTile(lx, ly);
  }

  set(x: number, y: number, tile: Tile): void {
    if (!this.inBounds(x, y)) return;
    const { cx, cy } = worldToChunkCoord(x, y);
    const { lx, ly } = worldToLocalInChunk(x, y);
    this.getChunk(cx, cy)?.setTile(lx, ly, tile);
  }

  walkable(x: number, y: number): boolean {
    return isWalkable(this.getTile(x, y));
  }

  /**
   * Colisión AABB del jugador (círculo aproximado por radio) contra tiles.
   * Posición en coords de mundo (centro del tile = x+0.5, y+0.5).
   */
  canOccupy(wx: number, wy: number, radius: number): boolean {
    const minX = Math.floor(wx - radius);
    const maxX = Math.floor(wx + radius);
    const minY = Math.floor(wy - radius);
    const maxY = Math.floor(wy + radius);
    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        if (!this.walkable(tx, ty)) {
          const closestX = clamp(wx, tx, tx + 1);
          const closestY = clamp(wy, ty, ty + 1);
          const dx = wx - closestX;
          const dy = wy - closestY;
          if (dx * dx + dy * dy < radius * radius) return false;
        }
      }
    }
    return true;
  }

  /** Puerta más cercana al punto (centro tile) dentro de `reach` tiles. */
  nearestDoor(
    wx: number,
    wy: number,
    reach: number,
  ): { x: number; y: number; tile: Tile } | null {
    const cx = Math.floor(wx);
    const cy = Math.floor(wy);
    const r = Math.ceil(reach);
    let best: { x: number; y: number; tile: Tile; d: number } | null = null;
    for (let ty = cy - r; ty <= cy + r; ty++) {
      for (let tx = cx - r; tx <= cx + r; tx++) {
        const t = this.getTile(tx, ty);
        if (!t || t.kind !== "door") continue;
        const dx = wx - (tx + 0.5);
        const dy = wy - (ty + 0.5);
        const d = Math.hypot(dx, dy);
        if (d <= reach && (!best || d < best.d)) {
          best = { x: tx, y: ty, tile: t, d };
        }
      }
    }
    return best ? { x: best.x, y: best.y, tile: best.tile } : null;
  }

  /** Abre/cierra puerta en (x,y). Devuelve el nuevo estado open, o null si no hay puerta. */
  toggleDoor(x: number, y: number): boolean | null {
    const t = this.getTile(x, y);
    if (!t || t.kind !== "door") return null;
    t.open = !t.open;
    return t.open;
  }

  forEach(fn: (x: number, y: number, tile: Tile) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        fn(x, y, this.getTile(x, y)!);
      }
    }
  }

  /** Itera todos los chunks existentes (orden cx, luego cy). */
  forEachChunk(fn: (chunk: Chunk) => void): void {
    for (let cy = 0; cy < this.chunksY; cy++) {
      for (let cx = 0; cx < this.chunksX; cx++) {
        const c = this.getChunk(cx, cy);
        if (c) fn(c);
      }
    }
  }

  /**
   * Itera chunks en un radio (en unidades de chunk) alrededor de world (wx, wy).
   * Útil para culling de render / streaming.
   */
  forEachVisibleChunks(
    wx: number,
    wy: number,
    chunkRadius: number,
    fn: (chunk: Chunk) => void,
  ): void {
    const { cx, cy } = worldToChunkCoord(Math.floor(wx), Math.floor(wy));
    const r = Math.max(0, Math.floor(chunkRadius));
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const c = this.getChunk(cx + dx, cy + dy);
        if (c) fn(c);
      }
    }
  }

  /** Claves de chunks visibles (para tests / debug). */
  visibleChunkKeys(wx: number, wy: number, chunkRadius: number): string[] {
    const keys: string[] = [];
    this.forEachVisibleChunks(wx, wy, chunkRadius, (c) => {
      keys.push(chunkKey(c.cx, c.cy));
    });
    return keys;
  }

  countKind(kind: TileKind): number {
    let n = 0;
    this.forEach((_x, _y, t) => {
      if (t.kind === kind) n++;
    });
    return n;
  }

  get chunkCount(): number {
    return this.chunks.size;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
