import { makeFloor, type Tile } from "./tile";

/** Tamaño de chunk en tiles (F1: 16×16). */
export const CHUNK_SIZE = 16;

export function worldToChunkCoord(
  wx: number,
  wy: number,
): { cx: number; cy: number } {
  return {
    cx: Math.floor(wx / CHUNK_SIZE),
    cy: Math.floor(wy / CHUNK_SIZE),
  };
}

/** Coord local [0..CHUNK_SIZE) dentro del chunk que contiene (wx, wy). */
export function worldToLocalInChunk(
  wx: number,
  wy: number,
): { lx: number; ly: number } {
  const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return { lx, ly };
}

export function chunkOrigin(cx: number, cy: number): { x: number; y: number } {
  return { x: cx * CHUNK_SIZE, y: cy * CHUNK_SIZE };
}

export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

/**
 * Bloque de tiles. Sim headless — sin meshes.
 * Almacena siempre CHUNK_SIZE²; el TileMap filtra por bounds del mundo.
 */
export class Chunk {
  readonly cx: number;
  readonly cy: number;
  private readonly tiles: Tile[];

  constructor(cx: number, cy: number, fill: () => Tile = makeFloor) {
    this.cx = cx;
    this.cy = cy;
    this.tiles = Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }, fill);
  }

  get originX(): number {
    return this.cx * CHUNK_SIZE;
  }

  get originY(): number {
    return this.cy * CHUNK_SIZE;
  }

  private idx(lx: number, ly: number): number {
    return ly * CHUNK_SIZE + lx;
  }

  inChunk(lx: number, ly: number): boolean {
    return lx >= 0 && ly >= 0 && lx < CHUNK_SIZE && ly < CHUNK_SIZE;
  }

  getTile(lx: number, ly: number): Tile | undefined {
    if (!this.inChunk(lx, ly)) return undefined;
    return this.tiles[this.idx(lx, ly)];
  }

  setTile(lx: number, ly: number, tile: Tile): void {
    if (!this.inChunk(lx, ly)) return;
    this.tiles[this.idx(lx, ly)] = tile;
  }

  forEachTile(fn: (wx: number, wy: number, tile: Tile) => void): void {
    const ox = this.originX;
    const oy = this.originY;
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        fn(ox + lx, oy + ly, this.tiles[this.idx(lx, ly)]!);
      }
    }
  }
}
