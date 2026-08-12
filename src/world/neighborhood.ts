import { makeBed, makeDoor, makeFloor, makeFurniture, makeWall } from "./tile";
import { TileMap } from "./tilemap";
import {
  ContainerRegistry,
  createWorldContainer,
  LOOT_CABINET,
  LOOT_KITCHEN,
  LOOT_SHED,
  rollLoot,
  type LootEntry,
  type WorldContainer,
} from "../items";

export interface Neighborhood {
  map: TileMap;
  /** Spawn del jugador en coords de mundo (centro tile). */
  spawn: { x: number; y: number };
  /** Contenedores (muebles) con loot. */
  containers: ContainerRegistry;
}

/**
 * Barrio fijo 48×48: calles + casas/cobertizos con puertas y muebles/loot.
 * Hand-authored procedural simple (sin PZ assets).
 * Casas grandes (≥8×8) llevan mueble central + segundo en esquina.
 */
export function createNeighborhood(size = 48): Neighborhood {
  const map = new TileMap(size, size, makeFloor);
  const containers = new ContainerRegistry();

  // Borde sólido
  for (let i = 0; i < size; i++) {
    map.set(i, 0, makeWall());
    map.set(i, size - 1, makeWall());
    map.set(0, i, makeWall());
    map.set(size - 1, i, makeWall());
  }

  // Calles principales; casas con puerta + mueble interior (+ 2º si cabe)
  placeHouse(map, containers, 4, 4, 10, 8, "south", "cocina-a", "cocina", LOOT_KITCHEN, 1);
  placeHouse(map, containers, 18, 4, 10, 8, "east", "armario-b", "armario", LOOT_CABINET, 2);
  placeHouse(map, containers, 34, 4, 10, 8, "west", "cocina-c", "cocina", LOOT_KITCHEN, 3);

  placeHouse(map, containers, 4, 18, 12, 10, "north", "armario-d", "armario", LOOT_CABINET, 4);
  // Casa cerca del spawn (sur): cocina con comida/agua — demo fácil
  placeHouse(map, containers, 22, 20, 8, 8, "south", "cocina-spawn", "cocina", LOOT_KITCHEN, 5);
  placeHouse(map, containers, 34, 18, 10, 10, "west", "armario-f", "armario", LOOT_CABINET, 6);

  placeHouse(map, containers, 4, 34, 10, 10, "north", "cocina-g", "cocina", LOOT_KITCHEN, 7);
  placeHouse(map, containers, 18, 34, 12, 10, "east", "armario-h", "armario", LOOT_CABINET, 8);
  placeHouse(map, containers, 34, 34, 10, 10, "north", "cocina-i", "cocina", LOOT_KITCHEN, 9);

  // Cobertizos en franja libre y=28–32 (entre filas media/sur) — loot craft
  placeHouse(map, containers, 14, 28, 6, 5, "north", "caja-j", "caja", LOOT_SHED, 10);
  placeHouse(map, containers, 30, 28, 6, 5, "south", "taller-k", "taller", LOOT_SHED, 11);

  // Algunos muros sueltos / escombros en calle
  map.set(15, 15, makeWall());
  map.set(16, 15, makeWall());
  map.set(28, 28, makeWall());

  // Camas (≥2): furniture especial en casas indoor (reemplaza 2º mueble).
  // Casa NW (4,4): esquina (6,6). Casa cerca spawn (22,20): esquina (24,22).
  // Contenedores asociados se mantienen; kind sigue siendo furniture.
  if (map.getTile(6, 6)?.kind === "furniture") map.set(6, 6, makeBed());
  if (map.getTile(24, 22)?.kind === "furniture") map.set(24, 22, makeBed());

  const spawn = { x: 24.5, y: 15.5 };
  // Asegurar spawn libre
  map.set(24, 15, makeFloor());
  map.set(23, 15, makeFloor());
  map.set(25, 15, makeFloor());

  // Pila de madera cerca del spawn (demo craft/barricadas)
  map.set(26, 15, makeFurniture());
  containers.add(
    createWorldContainer("madera-spawn", 26, 15, "pila de madera", [
      { id: "wood", qty: 6 },
      { id: "cloth", qty: 3 },
      { id: "scrap", qty: 3 },
    ]),
  );

  return { map, spawn, containers };
}

type DoorSide = "north" | "south" | "east" | "west";

function placeHouse(
  map: TileMap,
  containers: ContainerRegistry,
  x: number,
  y: number,
  w: number,
  h: number,
  door: DoorSide,
  containerId: string,
  name: string,
  lootTable: readonly LootEntry[],
  seed: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      const edge = dx === 0 || dy === 0 || dx === w - 1 || dy === h - 1;
      map.set(tx, ty, edge ? makeWall() : makeFloor());
    }
  }
  // Hueco de puerta
  let dx = 0;
  let dy = 0;
  if (door === "north") {
    dx = Math.floor(w / 2);
    dy = 0;
  } else if (door === "south") {
    dx = Math.floor(w / 2);
    dy = h - 1;
  } else if (door === "west") {
    dx = 0;
    dy = Math.floor(h / 2);
  } else {
    dx = w - 1;
    dy = Math.floor(h / 2);
  }
  const doorX = x + dx;
  const doorY = y + dy;
  map.set(doorX, doorY, makeDoor(false));

  // Mueble en centro interior + contenedor con loot
  const fx = x + Math.floor(w / 2);
  const fy = y + Math.floor(h / 2);
  map.set(fx, fy, makeFurniture());
  const rng = mulberry32(seed * 9973 + 42);
  const stacks = rollLoot(lootTable, rng);
  const c: WorldContainer = createWorldContainer(
    containerId,
    fx,
    fy,
    name,
    stacks,
  );
  containers.add(c);

  // Segundo mueble en esquina interior (casas ≥8×8) — variedad de loot
  if (w >= 8 && h >= 8) {
    const fx2 = x + 2;
    const fy2 = y + 2;
    if (
      (fx2 !== fx || fy2 !== fy) &&
      (fx2 !== doorX || fy2 !== doorY) &&
      map.getTile(fx2, fy2)?.kind === "floor"
    ) {
      map.set(fx2, fy2, makeFurniture());
      const altTable =
        lootTable === LOOT_KITCHEN
          ? LOOT_CABINET
          : lootTable === LOOT_CABINET
            ? LOOT_SHED
            : LOOT_KITCHEN;
      const altName =
        altTable === LOOT_KITCHEN
          ? "cocina"
          : altTable === LOOT_CABINET
            ? "armario"
            : "caja";
      const rng2 = mulberry32(seed * 9973 + 1337);
      const stacks2 = rollLoot(altTable, rng2);
      containers.add(
        createWorldContainer(
          `${containerId}-2`,
          fx2,
          fy2,
          altName,
          stacks2,
        ),
      );
    }
  }
}

/** RNG seeded simple (determinista por casa). */
function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
