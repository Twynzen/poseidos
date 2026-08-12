/** Tipos de tile de la sim (sin render). */
export type TileKind = "floor" | "wall" | "door" | "furniture" | "barricade";

/** Variante opcional de furniture (saves antiguos sin variant siguen ok). */
export type TileVariant = "bed";

export interface Tile {
  kind: TileKind;
  /** Solo relevante para puertas. */
  open: boolean;
  /** Furniture especial (p.ej. cama). Opcional para compat. con saves. */
  variant?: TileVariant;
}

export function makeFloor(): Tile {
  return { kind: "floor", open: false };
}

export function makeWall(): Tile {
  return { kind: "wall", open: false };
}

export function makeDoor(open = false): Tile {
  return { kind: "door", open };
}

/** Mueble / contenedor en el suelo: caminable, no bloquea vista. */
export function makeFurniture(): Tile {
  return { kind: "furniture", open: false };
}

/**
 * Cama: furniture con variant "bed".
 * Dormir cerca da mejor descanso que el suelo indoor.
 */
export function makeBed(): Tile {
  return { kind: "furniture", open: false, variant: "bed" };
}

/** ¿Es tile de cama? */
export function isBedTile(tile: Tile | undefined): boolean {
  return tile?.kind === "furniture" && tile.variant === "bed";
}

/** Barricada temporal: bloquea movimiento y visión (como muro). */
export function makeBarricade(): Tile {
  return { kind: "barricade", open: false };
}

/** ¿Se puede caminar sobre este tile? */
export function isWalkable(tile: Tile | undefined): boolean {
  if (!tile) return false;
  if (tile.kind === "wall" || tile.kind === "barricade") return false;
  if (tile.kind === "door") return tile.open;
  // floor + furniture (incl. bed)
  return true;
}

/**
 * ¿Bloquea la línea de visión?
 * Paredes y barricadas sí; puertas cerradas sí; abiertas no; floor/furniture no.
 * Fuera de mapa / undefined = bloquea.
 */
export function blocksSight(tile: Tile | undefined): boolean {
  if (!tile) return true;
  if (tile.kind === "wall" || tile.kind === "barricade") return true;
  if (tile.kind === "door") return !tile.open;
  return false;
}
