/**
 * Césped instanced cerca del player (headless).
 * Ideas: three-stylized (viento sin + seed determinista); radio acotado para coste fijo.
 * worldView aplica InstancedMesh; aquí solo tiles + transforms.
 */

import type { TileKind } from "../world/tile";
import { floorIsOutdoor, tileSeed01 } from "./floorStyle";
import { INDOOR_RADIUS } from "../world/indoor";

/** Radio Chebyshev en tiles alrededor del player. */
export const GRASS_RADIUS = 8;

/** Cap duro de instancias (GPU barato). */
export const MAX_GRASS_INSTANCES = 320;

/** Hojas por tile outdoor (antes del cap). */
export const BLADES_PER_TILE = 3;

/** Amplitud de oscilación horizontal (unidades mundo). 0.05175 × 1.15 para leer de noche. */
export const WIND_SWAY = 0.0595125;

/** Amplitud de yaw por viento (radianes). 0.322 × 1.15 para leer de noche. */
export const WIND_YAW = 0.3703;

/** Velocidad del viento (rad/s en el argumento de sin). 2.76 × 1.15 para leer de noche. */
export const WIND_SPEED = 3.174;

export interface GrassTile {
  tx: number;
  ty: number;
  /** Seed [0,1) del tile. */
  seed: number;
}

export interface BladePose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Escala Y de la hoja (variación de altura). */
  sy: number;
}

/**
 * ¿Este tile recibe césped?
 * Solo floor outdoor walkable — no walls, doors, furniture, barricades, indoor.
 */
export function tileAcceptsGrass(
  kind: TileKind | undefined,
  outdoor: boolean,
): boolean {
  return kind === "floor" && outdoor;
}

/**
 * Cuenta sólidos (wall/furniture/barricade) en radio indoor alrededor de (tx,ty).
 */
export function countSolidsNear(
  getKind: (x: number, y: number) => TileKind | undefined,
  tx: number,
  ty: number,
  radius = INDOOR_RADIUS,
): number {
  let solids = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const k = getKind(tx + dx, ty + dy);
      if (k === "wall" || k === "furniture" || k === "barricade") solids++;
    }
  }
  return solids;
}

/**
 * Tiles outdoor floor en radio Chebyshev del ancla (tile del player).
 * Orden determinista (scan Y luego X); truncado implícito por el caller vía blades.
 */
export function collectGrassTiles(
  anchorTx: number,
  anchorTy: number,
  getKind: (x: number, y: number) => TileKind | undefined,
  radius = GRASS_RADIUS,
): GrassTile[] {
  const out: GrassTile[] = [];
  for (let ty = anchorTy - radius; ty <= anchorTy + radius; ty++) {
    for (let tx = anchorTx - radius; tx <= anchorTx + radius; tx++) {
      const kind = getKind(tx, ty);
      const outdoor = floorIsOutdoor(countSolidsNear(getKind, tx, ty));
      if (!tileAcceptsGrass(kind, outdoor)) continue;
      out.push({ tx, ty, seed: tileSeed01(tx, ty) });
    }
  }
  return out;
}

/**
 * Pose base de una hoja dentro del tile (sin viento).
 * `bladeIndex` ∈ [0, BLADES_PER_TILE).
 */
export function bladeBasePose(
  tx: number,
  ty: number,
  bladeIndex: number,
  seed: number,
): BladePose {
  const i = bladeIndex | 0;
  // Offsets deterministas dentro del tile (evita clumping en el centro)
  const a = tileSeed01(tx * 3 + i, ty);
  const b = tileSeed01(ty * 5 + i, tx + i);
  const ox = 0.18 + a * 0.64;
  const oz = 0.18 + b * 0.64;
  const yaw = (seed + a) * Math.PI * 2;
  const sy = 0.75 + b * 0.55;
  return {
    x: tx + ox,
    y: 0.18 * sy,
    z: ty + oz,
    yaw,
    sy,
  };
}

/**
 * Desplazamiento / yaw de viento barato: sin(time * speed + seed fase).
 */
export function bladeWind(
  time: number,
  seed: number,
): { dx: number; dz: number; dyaw: number } {
  const phase = seed * Math.PI * 2;
  const w = Math.sin(time * WIND_SPEED + phase);
  const w2 = Math.sin(time * (WIND_SPEED * 1.37) + phase * 1.7);
  return {
    dx: w * WIND_SWAY,
    dz: w2 * WIND_SWAY * 0.65,
    dyaw: w * WIND_YAW,
  };
}

/**
 * Pose final (base + viento) lista para setMatrixAt.
 */
export function bladePoseAt(
  tx: number,
  ty: number,
  bladeIndex: number,
  seed: number,
  time: number,
): BladePose {
  const base = bladeBasePose(tx, ty, bladeIndex, seed);
  const wind = bladeWind(time, seed + bladeIndex * 0.17);
  return {
    x: base.x + wind.dx,
    y: base.y,
    z: base.z + wind.dz,
    yaw: base.yaw + wind.dyaw,
    sy: base.sy,
  };
}

/**
 * Genera hasta `max` poses de hojas para los tiles dados (orden fijo).
 */
export function buildBladePoses(
  tiles: ReadonlyArray<GrassTile>,
  time: number,
  max = MAX_GRASS_INSTANCES,
  bladesPerTile = BLADES_PER_TILE,
): BladePose[] {
  const poses: BladePose[] = [];
  for (const t of tiles) {
    for (let b = 0; b < bladesPerTile; b++) {
      if (poses.length >= max) return poses;
      poses.push(bladePoseAt(t.tx, t.ty, b, t.seed, time));
    }
  }
  return poses;
}
