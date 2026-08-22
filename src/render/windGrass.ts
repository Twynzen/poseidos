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
export const MAX_GRASS_INSTANCES = 368;

/** Hojas por tile outdoor (antes del cap). 3 × 1.15 → 3.45, redondeado a 4 para el loop. */
export const BLADES_PER_TILE = 4;

/** Amplitud de oscilación horizontal (unidades mundo). 0.05175 × 1.15 para leer de noche. */
export const WIND_SWAY = 0.0595125;

/** Multiplicador Z del sway (relativo a WIND_SWAY). 0.65 × 1.15 para leer de noche. */
export const WIND_SWAY_Z_MUL = 0.7475;

/** Amplitud de yaw por viento (radianes). 0.322 × 1.15 para leer de noche. */
export const WIND_YAW = 0.3703;

/** Velocidad del viento (rad/s en el argumento de sin). 2.76 × 1.15 para leer de noche. */
export const WIND_SPEED = 3.174;

/** Multiplicador Z de la velocidad del viento (relativo a WIND_SPEED). 1.37 × 1.15 para leer de noche. */
export const WIND_SPEED_Z_MUL = 1.5755;

/** Multiplicador Z de la fase del viento (relativo a phase). 1.7 × 1.15 para leer de noche. */
export const WIND_PHASE_Z_MUL = 1.955;

/** Paso de seed de viento entre hojas vecinas. 0.17 × 1.15 para desincronizar de noche. */
export const BLADE_WIND_SEED_STEP = 0.1955;

/** Escala Y base de la hoja. 0.75 × 1.15 para leer de noche. */
export const BLADE_SY_BASE = 0.8625;

/** Rango de variación de altura de la hoja. 0.55 × 1.15 para leer de noche. */
export const BLADE_SY_RANGE = 0.6325;

/** Rango XZ de la hoja dentro del tile. 0.64 × 1.15 para leer de noche. */
export const BLADE_XZ_RANGE = 0.736;

/** Pad XZ de la hoja dentro del tile. 0.18 × 0.87 para leer de noche. */
export const BLADE_XZ_PAD = 0.1566;

/** Multiplicador Y de la hoja (offset de altura). 0.18 × 1.15 para leer de noche. */
export const BLADE_Y_MUL = 0.207;

/** Albedo de la hoja instanced (histórico 0x4a6a38 en worldView). 0x4a6a38 × 1.15 por canal para leer de noche. */
export const BLADE_COLOR = 0x557a40;

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

/** Spawn barrio (neighborhood 24.5, 15.5). NaN / tiles vacíos = leftover Three default. */
export const GRASS_LOOK_X_SPAWN = 24.5;
export const GRASS_LOOK_Z_SPAWN = 15.5;
/** Tile ancla = floor(spawn). leftover ctor NaN ≠ fresco 24, 15. */
export const GRASS_ANCHOR_TX_SPAWN = 24;
export const GRASS_ANCHOR_TY_SPAWN = 15;

/**
 * Ancla X que lee rebuildGrassTiles (wx fresco o vivo).
 * leftover mid-life (ctor NaN / far 40) ≠ ancla fresco (spawn 24).
 */
export function grassAnchorTxFromLook(wx: number): number {
  return Math.floor(wx);
}

/**
 * Ancla Z que lee rebuildGrassTiles (wy fresco o vivo).
 * leftover mid-life (ctor NaN / far 30) ≠ ancla fresco (spawn 15).
 */
export function grassAnchorTyFromLook(wy: number): number {
  return Math.floor(wy);
}

/**
 * R / softReset: ancla X fresco (spawn 24).
 * WorldView nace `grassAnchorTx = grassAnchorTxAfterRestart()`;
 * leftover ctor NaN no filtra.
 * rebuildGrassTiles lee grassAnchorTxFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function grassAnchorTxAfterRestart(
  wx = GRASS_LOOK_X_SPAWN,
): number {
  return grassAnchorTxFromLook(wx);
}

/**
 * R / softReset: ancla Z fresco (spawn 15).
 * WorldView nace `grassAnchorTy = grassAnchorTyAfterRestart()`;
 * leftover ctor NaN no filtra.
 * rebuildGrassTiles lee grassAnchorTyFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function grassAnchorTyAfterRestart(
  wy = GRASS_LOOK_Z_SPAWN,
): number {
  return grassAnchorTyFromLook(wy);
}

/**
 * Tiles que lee rebuildGrassTiles (look fresco o vivo).
 * leftover empty / origin 0,0 / far 40,30 ≠ tiles fresco (spawn).
 */
export function grassTilesFromLook(
  wx: number,
  wy: number,
  getKind: (x: number, y: number) => TileKind | undefined,
  radius = GRASS_RADIUS,
): GrassTile[] {
  return collectGrassTiles(
    grassAnchorTxFromLook(wx),
    grassAnchorTyFromLook(wy),
    getKind,
    radius,
  );
}

/**
 * R / softReset: tiles fresco (spawn 24.5, 15.5).
 * WorldView nace `grassTiles = grassTilesAfterRestart(...)`;
 * leftover empty / NaN no filtra.
 * rebuildGrassTiles lee grassTilesFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function grassTilesAfterRestart(
  getKind: (x: number, y: number) => TileKind | undefined,
  radius = GRASS_RADIUS,
): GrassTile[] {
  return grassTilesFromLook(
    GRASS_LOOK_X_SPAWN,
    GRASS_LOOK_Z_SPAWN,
    getKind,
    radius,
  );
}

/** Count de instancias que lee applyGrassPoses (tiles fresco o vivo). */
export function grassInstanceCountFromTiles(
  tiles: ReadonlyArray<GrassTile>,
  bladesPerTile = BLADES_PER_TILE,
  max = MAX_GRASS_INSTANCES,
): number {
  return Math.min(tiles.length * bladesPerTile, max);
}

/** Visible si hay instancias (n > 0). leftover ctor hide / count 0 ≠ fresco. */
export function grassVisibleFromCount(n: number): boolean {
  return n > 0;
}

/**
 * R / softReset: count fresco (spawn outdoor).
 * leftover ctor 0 / origin 0,0 no filtra.
 */
export function grassInstanceCountAfterRestart(
  getKind: (x: number, y: number) => TileKind | undefined,
  radius = GRASS_RADIUS,
): number {
  return grassInstanceCountFromTiles(grassTilesAfterRestart(getKind, radius));
}

/**
 * R / softReset: visible fresco (spawn outdoor = true).
 * leftover ctor hide no filtra.
 */
export function grassVisibleAfterRestart(
  getKind: (x: number, y: number) => TileKind | undefined,
  radius = GRASS_RADIUS,
): boolean {
  return grassVisibleFromCount(grassInstanceCountAfterRestart(getKind, radius));
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
  const ox = BLADE_XZ_PAD + a * BLADE_XZ_RANGE;
  const oz = BLADE_XZ_PAD + b * BLADE_XZ_RANGE;
  const yaw = (seed + a) * Math.PI * 2;
  const sy = BLADE_SY_BASE + b * BLADE_SY_RANGE;
  return {
    x: tx + ox,
    y: BLADE_Y_MUL * sy,
    z: ty + oz,
    yaw,
    sy,
  };
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar tiempo de viento.
 * Vivo (incl. F9 load-vivo): dt/animación de hoy.
 * No esconde el césped; solo gate de dt. gameOver no inventa hide.
 */
export function grassVisualApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * Avanza tiempo de viento si aplica; gameOver no muta (congela sway).
 * dt no finito / ≤0 no avanza (igual que un tick vacío).
 */
export function tickGrassWindTime(
  time: number,
  dt: number,
  gameOver = false,
): number {
  if (!grassVisualApplies(gameOver)) return time;
  if (!Number.isFinite(dt) || dt <= 0) return time;
  return time + dt;
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
  const w2 = Math.sin(time * (WIND_SPEED * WIND_SPEED_Z_MUL) + phase * WIND_PHASE_Z_MUL);
  return {
    dx: w * WIND_SWAY,
    dz: w2 * WIND_SWAY * WIND_SWAY_Z_MUL,
    dyaw: w * WIND_YAW,
  };
}

/**
 * Offset/yaw de viento que lee applyGrassPoses (time fresco o vivo).
 * leftover time de la vida anterior ≠ time 0.
 */
export function bladeWindFromTime(
  time: number,
  seed: number,
): { dx: number; dz: number; dyaw: number } {
  return bladeWind(time, seed);
}

/**
 * R / softReset: tiempo de viento fresco (0).
 * WorldView nace en 0; leftover sway de la vida anterior no filtra.
 * F9 / enterGameOver / freeze death no assign — view.dispose + createWorldView.
 */
export function grassWindTimeAfterRestart(): number {
  return 0;
}

/**
 * Offset/yaw de viento fresco (time 0). leftover time no filtra.
 */
export function bladeWindAfterRestart(
  seed: number,
): { dx: number; dz: number; dyaw: number } {
  return bladeWindFromTime(grassWindTimeAfterRestart(), seed);
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
  const wind = bladeWindFromTime(time, seed + bladeIndex * BLADE_WIND_SEED_STEP);
  return {
    x: base.x + wind.dx,
    y: base.y,
    z: base.z + wind.dz,
    yaw: base.yaw + wind.dyaw,
    sy: base.sy,
  };
}

/**
 * Pose que lee applyGrassPoses (time fresco o vivo).
 */
export function bladePoseFromWindTime(
  tx: number,
  ty: number,
  bladeIndex: number,
  seed: number,
  time: number,
): BladePose {
  return bladePoseAt(tx, ty, bladeIndex, seed, time);
}

/**
 * Pose de hoja al viento fresco (time 0). leftover time no filtra.
 */
export function bladePoseAfterRestart(
  tx: number,
  ty: number,
  bladeIndex: number,
  seed: number,
): BladePose {
  return bladePoseFromWindTime(
    tx,
    ty,
    bladeIndex,
    seed,
    grassWindTimeAfterRestart(),
  );
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
