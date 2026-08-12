import type { TileMap } from "./tilemap";

export interface GridPos {
  x: number;
  y: number;
}

const NEIGHBORS: ReadonlyArray<GridPos> = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * A* en grid (4-dir). Evita tiles no walkable (wall / barricade / puerta cerrada).
 * Devuelve camino desde start hasta goal (incluye ambos) o [] si no hay ruta.
 * `maxExpand` limita nodos expandidos (seguridad en mapas grandes).
 */
export function findPath(
  map: TileMap,
  start: GridPos,
  goal: GridPos,
  maxExpand = 2048,
): GridPos[] {
  const sx = Math.floor(start.x);
  const sy = Math.floor(start.y);
  const gx = Math.floor(goal.x);
  const gy = Math.floor(goal.y);

  if (!map.inBounds(sx, sy) || !map.inBounds(gx, gy)) return [];
  if (!map.walkable(sx, sy) || !map.walkable(gx, gy)) return [];
  if (sx === gx && sy === gy) return [{ x: sx, y: sy }];

  const open: string[] = [];
  const openSet = new Set<string>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const startKey = key(sx, sy);
  open.push(startKey);
  openSet.add(startKey);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(sx, sy, gx, gy));

  let expanded = 0;

  while (open.length > 0 && expanded < maxExpand) {
    // Nodo con menor f
    let bestI = 0;
    let bestF = Infinity;
    for (let i = 0; i < open.length; i++) {
      const f = fScore.get(open[i]!) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        bestI = i;
      }
    }
    const current = open[bestI]!;
    open.splice(bestI, 1);
    openSet.delete(current);
    expanded++;

    const [cx, cy] = current.split(",").map(Number) as [number, number];
    if (cx === gx && cy === gy) {
      return reconstruct(cameFrom, current);
    }

    for (const n of NEIGHBORS) {
      const nx = cx + n.x;
      const ny = cy + n.y;
      if (!map.walkable(nx, ny)) continue;
      const nk = key(nx, ny);
      const tentative = (gScore.get(current) ?? Infinity) + 1;
      if (tentative >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, current);
      gScore.set(nk, tentative);
      fScore.set(nk, tentative + heuristic(nx, ny, gx, gy));
      if (!openSet.has(nk)) {
        open.push(nk);
        openSet.add(nk);
      }
    }
  }

  return [];
}

function reconstruct(cameFrom: Map<string, string>, current: string): GridPos[] {
  const path: GridPos[] = [];
  let cur: string | undefined = current;
  while (cur) {
    const [x, y] = cur.split(",").map(Number) as [number, number];
    path.push({ x, y });
    cur = cameFrom.get(cur);
  }
  path.reverse();
  return path;
}

/** Siguiente paso hacia goal (tile adyacente) o null si ya está / sin ruta. */
export function nextStep(
  map: TileMap,
  from: GridPos,
  goal: GridPos,
): GridPos | null {
  const path = findPath(map, from, goal);
  if (path.length < 2) return null;
  return path[1]!;
}
