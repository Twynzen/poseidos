import { describe, expect, test } from "vitest";
import {
  CHUNK_SIZE,
  chunkKey,
  chunkOrigin,
  worldToChunkCoord,
  worldToLocalInChunk,
} from "../src/world/chunk";
import { makeFloor, makeWall, makeDoor } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { createNeighborhood } from "../src/world/neighborhood";

describe("chunk indexing", () => {
  test("CHUNK_SIZE es 16", () => {
    expect(CHUNK_SIZE).toBe(16);
  });

  test("worldToChunkCoord en orígenes y bordes", () => {
    expect(worldToChunkCoord(0, 0)).toEqual({ cx: 0, cy: 0 });
    expect(worldToChunkCoord(15, 15)).toEqual({ cx: 0, cy: 0 });
    expect(worldToChunkCoord(16, 0)).toEqual({ cx: 1, cy: 0 });
    expect(worldToChunkCoord(0, 16)).toEqual({ cx: 0, cy: 1 });
    expect(worldToChunkCoord(47, 47)).toEqual({ cx: 2, cy: 2 });
    expect(worldToChunkCoord(32, 16)).toEqual({ cx: 2, cy: 1 });
  });

  test("worldToLocalInChunk y chunkOrigin son inversos", () => {
    const samples = [
      [0, 0],
      [15, 7],
      [16, 16],
      [31, 0],
      [47, 47],
      [24, 15],
    ] as const;
    for (const [wx, wy] of samples) {
      const { cx, cy } = worldToChunkCoord(wx, wy);
      const { lx, ly } = worldToLocalInChunk(wx, wy);
      const o = chunkOrigin(cx, cy);
      expect(o.x + lx).toBe(wx);
      expect(o.y + ly).toBe(wy);
      expect(lx).toBeGreaterThanOrEqual(0);
      expect(lx).toBeLessThan(CHUNK_SIZE);
      expect(ly).toBeGreaterThanOrEqual(0);
      expect(ly).toBeLessThan(CHUNK_SIZE);
    }
  });

  test("chunkKey estable", () => {
    expect(chunkKey(1, 2)).toBe("1,2");
    expect(chunkKey(0, 0)).toBe("0,0");
  });
});

describe("TileMap chunks API", () => {
  test("48×48 = 3×3 chunks; getTile/setTile por world coords", () => {
    const map = new TileMap(48, 48, makeFloor);
    expect(map.chunkSize).toBe(16);
    expect(map.chunksX).toBe(3);
    expect(map.chunksY).toBe(3);
    expect(map.chunkCount).toBe(9);

    map.setTile(0, 0, makeWall());
    map.setTile(16, 16, makeDoor(false));
    map.setTile(47, 47, makeWall());

    expect(map.getTile(0, 0)?.kind).toBe("wall");
    expect(map.getTile(16, 16)?.kind).toBe("door");
    expect(map.getTile(47, 47)?.kind).toBe("wall");
    expect(map.getTile(1, 1)?.kind).toBe("floor");
    expect(map.getTile(-1, 0)).toBeUndefined();
    expect(map.getTile(48, 0)).toBeUndefined();

    const c00 = map.getChunk(0, 0);
    const c11 = map.getChunk(1, 1);
    expect(c00?.getTile(0, 0)?.kind).toBe("wall");
    expect(c11?.getTile(0, 0)?.kind).toBe("door");
  });

  test("mapa no múltiplo de chunk (5×5) sigue en bounds", () => {
    const map = new TileMap(5, 5, makeFloor);
    expect(map.chunksX).toBe(1);
    expect(map.chunksY).toBe(1);
    map.setTile(4, 4, makeWall());
    expect(map.getTile(4, 4)?.kind).toBe("wall");
    expect(map.inBounds(5, 0)).toBe(false);
    expect(map.getTile(5, 0)).toBeUndefined();
  });

  test("forEachVisibleChunks / visibleChunkKeys por radio", () => {
    const map = new TileMap(48, 48, makeFloor);
    // Centro del mapa ~ chunk (1,1)
    const keys0 = map.visibleChunkKeys(24.5, 24.5, 0);
    expect(keys0).toEqual(["1,1"]);

    const keys1 = map.visibleChunkKeys(24.5, 24.5, 1);
    expect(keys1).toHaveLength(9);
    expect(keys1).toContain("0,0");
    expect(keys1).toContain("2,2");
    expect(keys1).toContain("1,1");

    // Esquina: radio 1 → solo chunks existentes
    const corner = map.visibleChunkKeys(0.5, 0.5, 1);
    expect(corner.sort()).toEqual(["0,0", "0,1", "1,0", "1,1"].sort());

    let visited = 0;
    map.forEachVisibleChunks(40, 8, 0, (c) => {
      expect(c.cx).toBe(2);
      expect(c.cy).toBe(0);
      visited++;
    });
    expect(visited).toBe(1);
  });

  test("neighborhood conserva colisión con storage chunked", () => {
    const { map, spawn } = createNeighborhood(48);
    expect(map.chunkCount).toBe(9);
    expect(map.getTile(Math.floor(spawn.x), Math.floor(spawn.y))?.kind).toBe(
      "floor",
    );
    expect(map.countKind("door")).toBeGreaterThan(0);
  });
});
