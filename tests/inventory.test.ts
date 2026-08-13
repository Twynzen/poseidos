import { describe, expect, test } from "vitest";
import {
  addItem,
  CONTAINER_REACH,
  ContainerRegistry,
  containerHasLoot,
  createInventory,
  createWorldContainer,
  findConsumableSlot,
  fixedLoot,
  getItemDef,
  inventorySummary,
  LOOT_KITCHEN,
  LOOT_CABINET,
  LOOT_SHED,
  removeFromSlot,
  rollLoot,
  totalWeight,
  transferOne,
  buildInventoryPanelData,
  formatEquipmentLine,
  formatSlotLine,
  INVENTORY_EMPTY_MSG,
} from "../src/items";
import { createNeighborhood } from "../src/world/neighborhood";
import { isWalkable, makeFurniture, blocksSight } from "../src/world/tile";
import { PlayerSim } from "../src/actors/player";
import { NEEDS_RELIEF } from "../src/actors/needs";

describe("item defs", () => {
  test("catálogo mínimo con peso/stack/uso", () => {
    const food = getItemDef("canned_food");
    expect(food.stackable).toBe(true);
    expect(food.use).toBe("food");
    expect(food.weight).toBeGreaterThan(0);
    expect(getItemDef("water_bottle").use).toBe("drink");
    expect(getItemDef("scrap").use).toBe("none");
    expect(getItemDef("wood").name).toBe("madera");
  });
});

describe("inventory", () => {
  test("addItem apila y respeta maxStack / slots / peso", () => {
    const inv = createInventory(2, 1.0); // 2 slots, 1kg
    expect(addItem(inv, "canned_food", 3)).toBe(2); // 0.5*2=1kg
    expect(inv.slots).toHaveLength(1);
    expect(inv.slots[0]?.qty).toBe(2);
    expect(totalWeight(inv)).toBeCloseTo(1.0, 5);

    // Sin peso libre
    expect(addItem(inv, "scrap", 1)).toBe(0);

    const big = createInventory(1, 20);
    expect(addItem(big, "canned_food", 8)).toBe(5); // maxStack 5
    expect(big.slots[0]?.qty).toBe(5);
    expect(addItem(big, "water_bottle", 1)).toBe(0); // sin slots
  });

  test("removeFromSlot y summary", () => {
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 2 },
      { id: "water_bottle", qty: 1 },
    ]);
    expect(inventorySummary(inv)).toContain("lata×2");
    expect(removeFromSlot(inv, 0, 1)).toBe(1);
    expect(inv.slots[0]?.qty).toBe(1);
    removeFromSlot(inv, 0, 99);
    expect(inv.slots[0]?.id).toBe("water_bottle");
  });

  test("transferOne mueve 1 unidad entre inventarios", () => {
    const from = createInventory(4, 20, [{ id: "water_bottle", qty: 2 }]);
    const to = createInventory(4, 20);
    const moved = transferOne(from, to, 0);
    expect(moved).toEqual({ id: "water_bottle", qty: 1 });
    expect(from.slots[0]?.qty).toBe(1);
    expect(to.slots[0]?.qty).toBe(1);
  });

  test("findConsumableSlot prioriza prefer", () => {
    const inv = createInventory(8, 20, [
      { id: "scrap", qty: 1 },
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    expect(findConsumableSlot(inv, "drink")).toBe(2);
    expect(findConsumableSlot(inv, "food")).toBe(1);
    expect(findConsumableSlot(inv)).toBe(1);
  });
});

describe("loot tables", () => {
  test("rollLoot con rng fijo es determinista", () => {
    const always = () => 0; // siempre pasa chance; min qty
    const stacks = rollLoot(LOOT_KITCHEN, always);
    expect(stacks.length).toBe(5);
    expect(stacks[0]?.id).toBe("canned_food");
    expect(stacks[1]?.id).toBe("water_bottle");
    expect(stacks[2]?.id).toBe("wood");
    expect(stacks[3]?.id).toBe("cloth");
    expect(stacks[4]?.id).toBe("knife");
  });

  test("rollLoot chance 0 no dropea; fixedLoot copia", () => {
    const never = () => 1;
    expect(rollLoot([{ id: "scrap", chance: 0.5, min: 1, max: 1 }], never)).toEqual(
      [],
    );
    const f = fixedLoot([{ id: "scrap", qty: 3 }]);
    expect(f).toEqual([{ id: "scrap", qty: 3 }]);
    f[0]!.qty = 9;
    expect(fixedLoot([{ id: "scrap", qty: 3 }])[0]?.qty).toBe(3);
  });
});

describe("containers + transfer", () => {
  test("nearest y lootOne transfieren al player inv", () => {
    const reg = new ContainerRegistry([
      createWorldContainer("c1", 5, 5, "cocina", [
        { id: "canned_food", qty: 2 },
        { id: "water_bottle", qty: 1 },
      ]),
    ]);
    expect(containerHasLoot(reg.list[0]!)).toBe(true);
    expect(reg.nearest(5.4, 5.2, CONTAINER_REACH)?.id).toBe("c1");
    expect(reg.nearest(0, 0, CONTAINER_REACH)).toBeNull();

    const dest = createInventory();
    const taken = reg.lootOne(5.5, 5.5, dest);
    expect(taken).toEqual({ id: "canned_food", qty: 1 });
    expect(dest.slots[0]?.qty).toBe(1);
    expect(reg.at(5, 5)?.inv.slots[0]?.qty).toBe(1);
  });

  test("containerHasLoot y nearest saltan vacíos (slots o qty 0)", () => {
    const empty = createWorldContainer("empty", 5, 5, "caja");
    expect(empty.inv.slots).toHaveLength(0);
    expect(containerHasLoot(empty)).toBe(false);

    const qty0 = createWorldContainer("qty0", 5, 5, "caja");
    qty0.inv.slots.push({ id: "scrap", qty: 0 });
    expect(qty0.inv.slots.length).toBe(1);
    expect(containerHasLoot(qty0)).toBe(false);

    const full = createWorldContainer("full", 6, 5, "cocina", [
      { id: "scrap", qty: 1 },
    ]);
    expect(containerHasLoot(full)).toBe(true);

    const onlyEmpty = new ContainerRegistry([empty, qty0]);
    expect(onlyEmpty.nearest(5.5, 5.5, CONTAINER_REACH)).toBeNull();

    const mixed = new ContainerRegistry([empty, qty0, full]);
    expect(mixed.nearest(5.5, 5.5, CONTAINER_REACH)?.id).toBe("full");
  });

  test("furniture tile caminable y no bloquea vista", () => {
    const f = makeFurniture();
    expect(f.kind).toBe("furniture");
    expect(isWalkable(f)).toBe(true);
    expect(blocksSight(f)).toBe(false);
  });
});

describe("PlayerSim loot + consume", () => {
  test("tryLoot y tryConsume bajan needs con items reales", () => {
    const box = createWorldContainer("box", 2, 2, "cocina", [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    const reg = new ContainerRegistry([box]);
    const player = new PlayerSim(
      { x: 2.4, y: 2.3 },
      { hunger: 80, thirst: 70, fatigue: 10 },
      createInventory(8, 20),
    );

    expect(player.tryLoot(reg)?.id).toBe("canned_food");
    expect(player.tryLoot(reg)?.id).toBe("water_bottle");
    expect(player.inventory.slots).toHaveLength(2);

    expect(player.tryConsume("food")).toBe("food");
    expect(player.needs.hunger).toBeCloseTo(80 - NEEDS_RELIEF.eat, 5);
    expect(player.inventory.slots.find((s) => s.id === "canned_food")).toBeUndefined();

    expect(player.tryConsume()).toBe("drink");
    expect(player.needs.thirst).toBeCloseTo(70 - NEEDS_RELIEF.drink, 5);
    expect(player.inventory.slots.some((s) => s.id === "empty_bottle")).toBe(
      true,
    );
    expect(player.tryConsume()).toBeNull();
  });

  test("tryLoot lejos no hace nada", () => {
    const reg = new ContainerRegistry([
      createWorldContainer("far", 20, 20, "armario", [
        { id: "scrap", qty: 1 },
      ]),
    ]);
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.tryLoot(reg)).toBeNull();
  });
});

describe("loot tables shed", () => {
  test("LOOT_SHED garantiza madera con rng favorable", () => {
    const always = () => 0;
    const stacks = rollLoot(LOOT_SHED, always);
    expect(stacks.some((s) => s.id === "wood")).toBe(true);
    expect(stacks.some((s) => s.id === "scrap")).toBe(true);
    expect(stacks.find((s) => s.id === "wood")!.qty).toBeGreaterThanOrEqual(2);
  });

  test("LOOT_SHED puede dropear palanca; cocina cuchillo", () => {
    const always = () => 0;
    expect(rollLoot(LOOT_SHED, always).some((s) => s.id === "crowbar")).toBe(true);
    expect(rollLoot(LOOT_KITCHEN, always).some((s) => s.id === "knife")).toBe(true);
    expect(getItemDef("knife").meleeDamage).toBeGreaterThan(0);
    expect(getItemDef("crowbar").meleeDamage).toBeGreaterThan(
      getItemDef("knife").meleeDamage!,
    );
  });

  test("inventorySummary muestra cuchillo/palanca", () => {
    const inv = createInventory(8, 20, [
      { id: "knife", qty: 1 },
      { id: "crowbar", qty: 1 },
    ]);
    expect(inventorySummary(inv)).toContain("cuchillo×1");
    expect(inventorySummary(inv)).toContain("palanca×1");
  });

  test("LOOT_SHED/CABINET pueden dropear pistola y ammo", () => {
    const always = () => 0;
    const shed = rollLoot(LOOT_SHED, always);
    const cab = rollLoot(LOOT_CABINET, always);
    expect(shed.some((s) => s.id === "pistol")).toBe(true);
    expect(shed.some((s) => s.id === "ammo")).toBe(true);
    expect(cab.some((s) => s.id === "pistol")).toBe(true);
    expect(cab.some((s) => s.id === "ammo")).toBe(true);
    expect(getItemDef("pistol").rangedDamage!).toBeGreaterThan(
      getItemDef("knife").meleeDamage!,
    );
  });

  test("inventorySummary muestra pistola/balas", () => {
    const inv = createInventory(8, 20, [
      { id: "pistol", qty: 1 },
      { id: "ammo", qty: 5 },
    ]);
    expect(inventorySummary(inv)).toContain("pistola×1");
    expect(inventorySummary(inv)).toContain("balas×5");
  });
});

describe("neighborhood containers", () => {
  test("barrio genera muebles y contenedores con loot", () => {
    const { map, containers, spawn } = createNeighborhood(48);
    expect(map.countKind("furniture")).toBeGreaterThan(0);
    expect(containers.list.length).toBe(map.countKind("furniture"));
    // 9 casas×2 + 2 cobertizos + pila madera ≥ 20
    expect(containers.list.length).toBeGreaterThanOrEqual(20);
    const withLoot = containers.list.filter((c) => c.inv.slots.length > 0);
    expect(withLoot.length).toBeGreaterThan(0);
    // Determinismo: misma seed → mismo loot en cocina-spawn
    const a = createNeighborhood(48).containers.list.find(
      (c) => c.id === "cocina-spawn",
    );
    const b = createNeighborhood(48).containers.list.find(
      (c) => c.id === "cocina-spawn",
    );
    expect(a?.inv.slots).toEqual(b?.inv.slots);
    expect(map.canOccupy(spawn.x, spawn.y, 0.32)).toBe(true);
  });

  test("cobertizos nuevos tienen puerta, furniture y loot", () => {
    const { map, containers } = createNeighborhood(48);
    for (const id of ["caja-j", "taller-k"] as const) {
      const c = containers.list.find((x) => x.id === id);
      expect(c, id).toBeDefined();
      expect(map.getTile(c!.x, c!.y)?.kind).toBe("furniture");
      expect(c!.inv.slots.length).toBeGreaterThan(0);
      expect(c!.inv.slots.some((s) => s.id === "wood" || s.id === "scrap")).toBe(
        true,
      );
    }
    // Puertas de cobertizos en el perímetro de cada edificio
    expect(map.getTile(17, 28)?.kind).toBe("door"); // caja-j north
    expect(map.getTile(33, 32)?.kind).toBe("door"); // taller-k south
    expect(map.countKind("door")).toBeGreaterThanOrEqual(11);
    // Casa grande con segundo mueble
    const second = containers.list.find((c) => c.id === "cocina-spawn-2");
    expect(second).toBeDefined();
    expect(map.getTile(second!.x, second!.y)?.kind).toBe("furniture");
  });
});

describe("inventory panel data (headless UI format)", () => {
  test("vacío: mensaje y equipo puños", () => {
    const inv = createInventory(8, 20);
    const data = buildInventoryPanelData(inv);
    expect(data.empty).toBe(true);
    expect(data.slots).toHaveLength(0);
    expect(INVENTORY_EMPTY_MSG).toBe("inventario vacío");
    expect(data.equipment).toEqual(["puños"]);
    expect(data.equipmentLine).toBe("equipo: puños");
    expect(formatEquipmentLine(inv)).toContain("puños");
  });

  test("slots ES + qty + peso; melee auto y pistola+ammo", () => {
    const inv = createInventory(8, 20, [
      { id: "knife", qty: 1 },
      { id: "crowbar", qty: 1 },
      { id: "pistol", qty: 1 },
      { id: "ammo", qty: 6 },
      { id: "canned_food", qty: 2 },
    ]);
    const data = buildInventoryPanelData(inv);
    expect(data.empty).toBe(false);
    expect(data.slots.map((s) => s.name)).toEqual([
      "cuchillo",
      "palanca",
      "pistola",
      "munición",
      "lata de comida",
    ]);
    const food = data.slots.find((s) => s.id === "canned_food")!;
    expect(food.text).toContain("lata de comida ×2");
    expect(food.text).toContain("1.0kg");
    // crowbar dmg > knife → melee auto
    expect(data.equipment[0]).toBe("palanca");
    expect(data.equipmentLine).toContain("pistola + munición×6");
    expect(formatSlotLine("ammo", 3).text).toMatch(/munición ×3/);
  });
});
