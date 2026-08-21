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
  insertStackAt,
  splitStack,
  mergeStack,
  swapInventoryStacks,
  inventorySummary,
  LOOT_KITCHEN,
  LOOT_CABINET,
  LOOT_SHED,
  removeFromSlot,
  rollLoot,
  totalWeight,
  transferOne,
  transferStack,
  lootFullMessage,
  refillFailMessage,
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

  test("insertStackAt no merge, clamp índice, sin chequeo de peso", () => {
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    insertStackAt(inv, 0, { id: "empty_bottle", qty: 1 });
    expect(inv.slots.map((s) => s.id)).toEqual([
      "empty_bottle",
      "canned_food",
      "flashlight",
    ]);

    insertStackAt(inv, -3, { id: "scrap", qty: 1 });
    expect(inv.slots[0]?.id).toBe("scrap");

    insertStackAt(inv, 99, { id: "wood", qty: 1 });
    expect(inv.slots.at(-1)?.id).toBe("wood");

    insertStackAt(inv, 1, { id: "scrap", qty: 2 });
    expect(inv.slots.filter((s) => s.id === "scrap")).toHaveLength(2);
    expect(inv.slots[1]).toEqual({ id: "scrap", qty: 2 });

    const heavy = createInventory(8, 0.01);
    insertStackAt(heavy, 0, { id: "wood", qty: 4 });
    expect(heavy.slots[0]).toEqual({ id: "wood", qty: 4 });
    expect(totalWeight(heavy)).toBeGreaterThan(heavy.maxWeight);
  });

  test("splitStack parte a la mitad al slot siguiente; no consume", () => {
    const ammo8 = createInventory(8, 20, [{ id: "ammo", qty: 8 }]);
    expect(splitStack(ammo8, 0)).toEqual({ id: "ammo", qty: 4, toIndex: 1 });
    expect(ammo8.slots).toEqual([
      { id: "ammo", qty: 4 },
      { id: "ammo", qty: 4 },
    ]);

    const qty1 = createInventory(8, 20, [{ id: "ammo", qty: 1 }]);
    expect(splitStack(qty1, 0)).toBeNull();
    expect(qty1.slots).toEqual([{ id: "ammo", qty: 1 }]);

    const full = createInventory(1, 20, [{ id: "ammo", qty: 8 }]);
    expect(full.slots).toHaveLength(1);
    expect(full.maxSlots).toBe(1);
    expect(splitStack(full, 0)).toBeNull();
    expect(full.slots).toEqual([{ id: "ammo", qty: 8 }]);

    const qty3 = createInventory(8, 20, [{ id: "ammo", qty: 3 }]);
    expect(splitStack(qty3, 0)).toEqual({ id: "ammo", qty: 1, toIndex: 1 });
    expect(qty3.slots[0]).toEqual({ id: "ammo", qty: 2 });
    expect(qty3.slots[1]).toEqual({ id: "ammo", qty: 1 });
  });

  test("mergeStack junta mismo id; unique qty 1 y flashlight maxStack 1 → null", () => {
    const ammo8 = createInventory(8, 20, [{ id: "ammo", qty: 8 }]);
    expect(splitStack(ammo8, 0)).toEqual({ id: "ammo", qty: 4, toIndex: 1 });
    expect(ammo8.slots).toEqual([
      { id: "ammo", qty: 4 },
      { id: "ammo", qty: 4 },
    ]);
    expect(mergeStack(ammo8, 1)).toEqual({
      id: "ammo",
      qtyMoved: 4,
      intoIndex: 0,
      destQty: 8,
    });
    expect(ammo8.slots).toEqual([{ id: "ammo", qty: 8 }]);

    const partial = createInventory(8, 20);
    partial.slots.push({ id: "ammo", qty: 22 }, { id: "ammo", qty: 5 });
    expect(mergeStack(partial, 1)).toEqual({
      id: "ammo",
      qtyMoved: 2,
      intoIndex: 0,
      destQty: 24,
    });
    expect(partial.slots[0]).toEqual({ id: "ammo", qty: 24 });
    expect(partial.slots[1]).toEqual({ id: "ammo", qty: 3 });

    const unique = createInventory(8, 20, [{ id: "ammo", qty: 1 }]);
    expect(mergeStack(unique, 0)).toBeNull();
    expect(unique.slots).toEqual([{ id: "ammo", qty: 1 }]);

    const torch = createInventory(8, 20);
    torch.slots.push({ id: "flashlight", qty: 1 }, { id: "flashlight", qty: 1 });
    expect(mergeStack(torch, 0)).toBeNull();
    expect(mergeStack(torch, 1)).toBeNull();
    expect(torch.slots).toEqual([
      { id: "flashlight", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
  });

  test("transferOne mueve 1 unidad entre inventarios", () => {
    const from = createInventory(4, 20, [{ id: "water_bottle", qty: 2 }]);
    const to = createInventory(4, 20);
    const moved = transferOne(from, to, 0);
    expect(moved).toEqual({ id: "water_bottle", qty: 1 });
    expect(from.slots[0]?.qty).toBe(1);
    expect(to.slots[0]?.qty).toBe(1);
  });

  test("transferOne dest lleno: null y el item se queda en origen", () => {
    const from = createInventory(4, 20, [{ id: "canned_food", qty: 2 }]);
    const slotsFull = createInventory(1, 20, [{ id: "scrap", qty: 1 }]);
    expect(transferOne(from, slotsFull, 0)).toBeNull();
    expect(from.slots[0]).toEqual({ id: "canned_food", qty: 2 });
    expect(slotsFull.slots).toEqual([{ id: "scrap", qty: 1 }]);

    const weightFull = createInventory(8, 0.5, [{ id: "canned_food", qty: 1 }]);
    expect(transferOne(from, weightFull, 0)).toBeNull();
    expect(from.slots[0]?.qty).toBe(2);
    expect(weightFull.slots[0]?.qty).toBe(1);

    const stackFull = createInventory(1, 20, [{ id: "canned_food", qty: 5 }]);
    expect(transferOne(from, stackFull, 0)).toBeNull();
    expect(from.slots[0]?.qty).toBe(2);
    expect(stackFull.slots[0]?.qty).toBe(5);

    const stackRoom = createInventory(1, 20, [{ id: "canned_food", qty: 2 }]);
    expect(transferOne(from, stackRoom, 0)).toEqual({ id: "canned_food", qty: 1 });
    expect(from.slots[0]?.qty).toBe(1);
    expect(stackRoom.slots[0]?.qty).toBe(3);

    expect(transferStack(from, slotsFull, 0)).toBe(0);
    expect(from.slots[0]?.qty).toBe(1);
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

  test("swapInventoryStacks intercambia canned_food @0 y flashlight @2", () => {
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    expect(swapInventoryStacks(inv, 0, 2)).toBe(true);
    expect(inv.slots[0]).toEqual({ id: "flashlight", qty: 1 });
    expect(inv.slots[1]).toEqual({ id: "water_bottle", qty: 1 });
    expect(inv.slots[2]).toEqual({ id: "canned_food", qty: 1 });

    const same = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    const beforeSame = same.slots.map((s) => ({ ...s }));
    expect(swapInventoryStacks(same, 0, 0)).toBe(false);
    expect(same.slots).toEqual(beforeSame);

    const empty = createInventory();
    expect(swapInventoryStacks(empty, 0, 1)).toBe(false);

    const missing = createInventory(8, 20, [{ id: "canned_food", qty: 1 }]);
    const beforeMissing = missing.slots.map((s) => ({ ...s }));
    expect(swapInventoryStacks(missing, 0, 2)).toBe(false);
    expect(missing.slots).toEqual(beforeMissing);

    const hole = createInventory(8, 20);
    hole.slots.push(
      { id: "canned_food", qty: 1 },
      { id: "scrap", qty: 0 },
      { id: "flashlight", qty: 1 },
    );
    expect(swapInventoryStacks(hole, 0, 1)).toBe(false);
    expect(swapInventoryStacks(hole, 0, -1)).toBe(false);
    expect(swapInventoryStacks(hole, 0, 2)).toBe(true);
    expect(hole.slots[0]?.id).toBe("flashlight");
    expect(hole.slots[2]?.id).toBe("canned_food");
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

  test("lootOne dest lleno: null, item se queda, toast inventario lleno", () => {
    const box = createWorldContainer("c1", 5, 5, "cocina", [
      { id: "canned_food", qty: 2 },
    ]);
    const reg = new ContainerRegistry([box]);
    const dest = createInventory(1, 20, [{ id: "scrap", qty: 1 }]);
    const destBefore = dest.slots.map((s) => ({ ...s }));
    const boxBefore = box.inv.slots.map((s) => ({ ...s }));

    const taken = reg.lootOne(5.5, 5.5, dest);
    expect(taken).toBeNull();
    expect(dest.slots).toEqual(destBefore);
    expect(box.inv.slots).toEqual(boxBefore);
    expect(containerHasLoot(box)).toBe(true);
    expect(lootFullMessage(taken, box)).toBe("inventario lleno");
    expect(lootFullMessage(taken, box)).toBe(refillFailMessage("inv_full"));

    const weightDest = createInventory(8, 0.5, [{ id: "canned_food", qty: 1 }]);
    expect(reg.lootOne(5.5, 5.5, weightDest)).toBeNull();
    expect(box.inv.slots[0]?.qty).toBe(2);
    expect(lootFullMessage(null, box)).toBe("inventario lleno");

    const stackDest = createInventory(1, 20, [{ id: "canned_food", qty: 5 }]);
    expect(reg.lootOne(5.5, 5.5, stackDest)).toBeNull();
    expect(box.inv.slots[0]?.qty).toBe(2);

    const stackRoom = createInventory(1, 20, [{ id: "canned_food", qty: 2 }]);
    expect(reg.lootOne(5.5, 5.5, stackRoom)).toEqual({
      id: "canned_food",
      qty: 1,
    });
    expect(box.inv.slots[0]?.qty).toBe(1);
    expect(stackRoom.slots[0]?.qty).toBe(3);
    expect(lootFullMessage({ id: "canned_food", qty: 1 }, box)).toBeNull();
  });

  test("lootStack dest lleno: null y el stack se queda; parcial deja leftover", () => {
    const box = createWorldContainer("ammo8", 5, 5, "pila", [
      { id: "ammo", qty: 8 },
    ]);
    const reg = new ContainerRegistry([box]);
    const dest = createInventory(1, 20, [{ id: "scrap", qty: 1 }]);
    expect(reg.lootStack(5.5, 5.5, dest)).toBeNull();
    expect(box.inv.slots[0]).toEqual({ id: "ammo", qty: 8 });
    expect(dest.slots).toEqual([{ id: "scrap", qty: 1 }]);
    expect(lootFullMessage(null, box)).toBe("inventario lleno");

    const leftoverBox = createWorldContainer("ammo8b", 5, 5, "pila", [
      { id: "ammo", qty: 8 },
    ]);
    const leftoverReg = new ContainerRegistry([leftoverBox]);
    const stackAlmost = createInventory(1, 20, [{ id: "ammo", qty: 22 }]);
    const taken = leftoverReg.lootStack(5.5, 5.5, stackAlmost);
    expect(taken).toEqual({ id: "ammo", qty: 2 });
    expect(leftoverBox.inv.slots[0]).toEqual({ id: "ammo", qty: 6 });
    expect(stackAlmost.slots[0]?.qty).toBe(24);
    expect(lootFullMessage(taken, leftoverBox)).toBeNull();
  });

  test("lootFullMessage: sin loot cerca o taken → null (G lejos silent)", () => {
    expect(lootFullMessage(null, null)).toBeNull();
    const empty = createWorldContainer("empty", 5, 5, "caja");
    expect(lootFullMessage(null, empty)).toBeNull();
    expect(
      lootFullMessage({ id: "canned_food", qty: 1 }, null),
    ).toBeNull();
  });

  test("lootStack toma el primer stack entero; lootOne sigue 1", () => {
    const stackReg = new ContainerRegistry([
      createWorldContainer("ammo8", 5, 5, "pila", [{ id: "ammo", qty: 8 }]),
    ]);
    const dest = createInventory();
    const taken = stackReg.lootStack(5.5, 5.5, dest);
    expect(taken).toEqual({ id: "ammo", qty: 8 });
    expect(dest.slots[0]).toEqual({ id: "ammo", qty: 8 });
    expect(stackReg.at(5, 5)?.inv.slots).toHaveLength(0);

    const oneReg = new ContainerRegistry([
      createWorldContainer("ammo8b", 5, 5, "pila", [{ id: "ammo", qty: 8 }]),
    ]);
    const destOne = createInventory();
    const one = oneReg.lootOne(5.5, 5.5, destOne);
    expect(one).toEqual({ id: "ammo", qty: 1 });
    expect(destOne.slots[0]?.qty).toBe(1);
    expect(oneReg.at(5, 5)?.inv.slots[0]?.qty).toBe(7);
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

  test("prefer facing tile: wood(25,15)+ammo(24,16) empate distancia", () => {
    const woodAmmo = () =>
      new ContainerRegistry([
        createWorldContainer("wood", 25, 15, "pila de madera", [
          { id: "wood", qty: 6 },
        ]),
        createWorldContainer("ammo", 24, 16, "munición", [
          { id: "ammo", qty: 8 },
        ]),
      ]);
    const wx = 24.5;
    const wy = 15.5;

    expect(
      woodAmmo().nearest(wx, wy, CONTAINER_REACH, { tx: 24, ty: 16 })?.id,
    ).toBe("ammo");

    expect(woodAmmo().nearest(wx, wy, CONTAINER_REACH, null)?.id).toBe("wood");

    const farPrefer = woodAmmo();
    farPrefer.add(
      createWorldContainer("far", 0, 0, "lejos", [{ id: "scrap", qty: 1 }]),
    );
    expect(
      farPrefer.nearest(wx, wy, CONTAINER_REACH, { tx: 0, ty: 0 })?.id,
    ).toBe("wood");

    const destPrefer = createInventory();
    const taken = woodAmmo().lootOne(wx, wy, destPrefer, CONTAINER_REACH, {
      tx: 24,
      ty: 16,
    });
    expect(taken).toEqual({ id: "ammo", qty: 1 });

    const destOmit = createInventory();
    const omitReg = woodAmmo();
    expect(omitReg.nearest(wx, wy, CONTAINER_REACH)?.id).toBe("wood");
    expect(omitReg.lootOne(wx, wy, destOmit)).toEqual({ id: "wood", qty: 1 });
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
    expect(lootFullMessage(null, reg.nearest(1, 1))).toBeNull();
  });

  test("tryLoot / tryLootStack dest lleno: null y el contenedor no pierde el item", () => {
    const box = createWorldContainer("box", 2, 2, "cocina", [
      { id: "canned_food", qty: 2 },
    ]);
    const reg = new ContainerRegistry([box]);
    const player = new PlayerSim(
      { x: 2.4, y: 2.3 },
      undefined,
      createInventory(1, 20, [{ id: "scrap", qty: 1 }]),
    );
    expect(player.tryLoot(reg)).toBeNull();
    expect(box.inv.slots[0]).toEqual({ id: "canned_food", qty: 2 });
    expect(player.inventory.slots).toEqual([{ id: "scrap", qty: 1 }]);
    expect(lootFullMessage(null, reg.nearest(player.x, player.y))).toBe(
      "inventario lleno",
    );

    expect(player.tryLootStack(reg)).toBeNull();
    expect(box.inv.slots[0]).toEqual({ id: "canned_food", qty: 2 });
  });

  test("tryLootStack toma el stack entero; tryLoot sigue 1", () => {
    const stackBox = createWorldContainer("box", 2, 2, "pila", [
      { id: "ammo", qty: 8 },
    ]);
    const stackReg = new ContainerRegistry([stackBox]);
    const stackPlayer = new PlayerSim(
      { x: 2.4, y: 2.3 },
      undefined,
      createInventory(8, 20),
    );
    expect(stackPlayer.tryLootStack(stackReg)).toEqual({ id: "ammo", qty: 8 });
    expect(stackPlayer.inventory.slots[0]).toEqual({ id: "ammo", qty: 8 });
    expect(stackBox.inv.slots).toHaveLength(0);

    const oneBox = createWorldContainer("box2", 2, 2, "pila", [
      { id: "ammo", qty: 8 },
    ]);
    const oneReg = new ContainerRegistry([oneBox]);
    const onePlayer = new PlayerSim(
      { x: 2.4, y: 2.3 },
      undefined,
      createInventory(8, 20),
    );
    expect(onePlayer.tryLoot(oneReg)).toEqual({ id: "ammo", qty: 1 });
    expect(onePlayer.inventory.slots[0]?.qty).toBe(1);
    expect(oneBox.inv.slots[0]?.qty).toBe(7);
  });

  test("tryLoot / tryLootStack prefer facing tile (spawn wood vs drop)", () => {
    const piles = () =>
      new ContainerRegistry([
        createWorldContainer("wood", 25, 15, "pila de madera", [
          { id: "wood", qty: 6 },
        ]),
        createWorldContainer("ammo", 24, 16, "munición", [
          { id: "ammo", qty: 8 },
        ]),
      ]);
    const facingY = new PlayerSim(
      { x: 24.5, y: 15.5 },
      undefined,
      createInventory(8, 20),
    );
    expect(facingY.facingX).toBe(0);
    expect(facingY.facingY).toBe(1);
    expect(facingY.tryLoot(piles())?.id).toBe("ammo");

    const stackPlayer = new PlayerSim(
      { x: 24.5, y: 15.5 },
      undefined,
      createInventory(8, 20),
    );
    expect(stackPlayer.tryLootStack(piles())).toEqual({ id: "ammo", qty: 8 });

    const facingX = new PlayerSim(
      { x: 24.5, y: 15.5 },
      undefined,
      createInventory(8, 20),
    );
    facingX.facingX = 1;
    facingX.facingY = 0;
    expect(facingX.tryLoot(piles())?.id).toBe("wood");
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
    expect(data.slots.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    const food = data.slots.find((s) => s.id === "canned_food")!;
    expect(food.index).toBe(4);
    expect(food.text).toContain("lata de comida ×2");
    expect(food.text).toContain("1.0kg");
    // crowbar dmg > knife → melee auto
    expect(data.equipment[0]).toBe("palanca");
    expect(data.equipmentLine).toContain("pistola + munición×6");
    expect(formatSlotLine("ammo", 3).text).toMatch(/munición ×3/);
  });
});
