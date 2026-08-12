/**
 * Collectors para snapshot wire F7 — doors / barricades / containers.
 * Compactos respecto a save (solo slots qty>0).
 */
import type { TileMap } from "../world/tilemap";
import type { ContainerRegistry } from "../items";
import type {
  NetBarricadeSnap,
  NetContainerSnap,
  NetDoorSnap,
} from "./session";

/** Itera tiles door → { x, y, open }. */
export function collectDoorsFromMap(map: TileMap): NetDoorSnap[] {
  const doors: NetDoorSnap[] = [];
  map.forEach((x, y, tile) => {
    if (tile.kind === "door") {
      doors.push({ x, y, open: !!tile.open });
    }
  });
  return doors;
}

/** Itera tiles barricade → { x, y }. */
export function collectBarricadesFromMap(map: TileMap): NetBarricadeSnap[] {
  const barricades: NetBarricadeSnap[] = [];
  map.forEach((x, y, tile) => {
    if (tile.kind === "barricade") {
      barricades.push({ x, y });
    }
  });
  return barricades;
}

/**
 * Contenedores del registry → snap compacto.
 * Solo stacks con qty > 0; id como string (ItemId).
 */
export function collectContainersFromRegistry(
  reg: ContainerRegistry,
): NetContainerSnap[] {
  return reg.list.map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    slots: c.inv.slots
      .filter((s) => s.qty > 0)
      .map((s) => ({ id: s.id as string, qty: s.qty })),
  }));
}
