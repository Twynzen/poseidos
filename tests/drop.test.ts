import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  applyDropInput,
  ContainerRegistry,
  createInventory,
  createStarterInventory,
  createWorldContainer,
  dropFromSlot,
  dropFullMessage,
  dropInputApplies,
  dropOnTile,
  dropQty,
  dropSourceIndex,
  dropTargetTile,
  dropToastLabel,
  refillFailMessage,
  takeFromSlot,
} from "../src/items";

describe("dropTargetTile", () => {
  test("spawn facing +Y → 24,16", () => {
    expect(dropTargetTile(24.5, 15.5, 0, 1)).toEqual({ tx: 24, ty: 16 });
  });

  test("facing 0,0 → 24,15", () => {
    expect(dropTargetTile(24.5, 15.5, 0, 0)).toEqual({ tx: 24, ty: 15 });
  });

  test("facing +X → 25,15", () => {
    expect(dropTargetTile(24.5, 15.5, 1, 0)).toEqual({ tx: 25, ty: 15 });
  });

  test("blocked walkable → fallback feet", () => {
    const walkable = (x: number, y: number) => !(x === 24 && y === 16);
    expect(dropTargetTile(24.5, 15.5, 0, 1, walkable)).toEqual({
      tx: 24,
      ty: 15,
    });
  });

  test("non-finite pos → 0,0", () => {
    expect(
      dropTargetTile(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN, Number.NaN),
    ).toEqual({ tx: 0, ty: 0 });
  });
});

describe("dropSourceIndex", () => {
  const slots = [
    { id: "canned_food", qty: 1 },
    { id: "flashlight", qty: 1 },
    { id: "ammo", qty: 8 },
  ];

  test("panel closed → hotbarSelected", () => {
    expect(dropSourceIndex(false, 2, 0, slots)).toBe(0);
    expect(dropSourceIndex(false, null, 4, slots)).toBe(4);
  });

  test("panel open + occupied lastInvIndex → that index", () => {
    expect(dropSourceIndex(true, 2, 0, slots)).toBe(2);
    expect(dropSourceIndex(true, 0, 4, slots)).toBe(0);
  });

  test("panel open + empty / null / missing → hotbarSelected", () => {
    expect(dropSourceIndex(true, null, 1, slots)).toBe(1);
    expect(dropSourceIndex(true, 1, 0, [{ id: "a", qty: 1 }, { id: "b", qty: 0 }])).toBe(
      0,
    );
    expect(dropSourceIndex(true, 9, 3, slots)).toBe(3);
  });
});

describe("dropQty", () => {
  test("without wholeStack always 1", () => {
    expect(dropQty(8, false)).toBe(1);
  });

  test("wholeStack with finite qty>=1 → trunc(qty)", () => {
    expect(dropQty(8, true)).toBe(8);
  });

  test("wholeStack with undefined qty → 1", () => {
    expect(dropQty(undefined, true)).toBe(1);
  });
});

describe("dropToastLabel", () => {
  test("qty>1 includes ×qty", () => {
    expect(dropToastLabel("munición", 8)).toBe("tiraste munición ×8");
  });

  test("qty 1 has no multiplier", () => {
    expect(dropToastLabel("botella de agua", 1)).toBe("tiraste botella de agua");
  });
});

describe("takeFromSlot", () => {
  test("starter slot 0 → water×1, remaining kit shifts", () => {
    const inv = createStarterInventory();
    expect(inv.slots[0]?.id).toBe("water_bottle");
    const taken = takeFromSlot(inv, 0);
    expect(taken).toEqual({ id: "water_bottle", qty: 1 });
    expect(inv.slots.map((s) => s.id)).toEqual([
      "canned_food",
      "flashlight",
      "pistol",
      "ammo",
    ]);
    expect(inv.slots.find((s) => s.id === "ammo")?.qty).toBe(8);
  });

  test("invalid slot → null", () => {
    const inv = createStarterInventory();
    expect(takeFromSlot(inv, 99)).toBeNull();
    expect(takeFromSlot(inv, -1)).toBeNull();
    expect(inv.slots[0]?.id).toBe("water_bottle");
  });

  test("starter ammo index 4 qty 8 → ammo×8, no ammo left", () => {
    const inv = createStarterInventory();
    expect(inv.slots[4]?.id).toBe("ammo");
    expect(inv.slots[4]?.qty).toBe(8);
    const taken = takeFromSlot(inv, 4, dropQty(inv.slots[4]?.qty, true));
    expect(taken).toEqual({ id: "ammo", qty: 8 });
    expect(inv.slots.find((s) => s.id === "ammo")).toBeUndefined();
  });
});

describe("dropOnTile", () => {
  test('empty registry → container named "botella de agua" at (24,15)', () => {
    const reg = new ContainerRegistry();
    const { container: c, added } = dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    expect(added).toBe(1);
    expect(c?.name).toBe("botella de agua");
    expect(c?.x).toBe(24);
    expect(c?.y).toBe(15);
    expect(c?.id).toBe("drop-24-15-water_bottle");
    expect(reg.list).toHaveLength(1);
    expect(c?.inv.slots[0]).toEqual({ id: "water_bottle", qty: 1 });
  });

  test("drop same tile again → merge, list.length 1", () => {
    const reg = new ContainerRegistry();
    const first = dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    const again = dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    expect(reg.list).toHaveLength(1);
    expect(again.container).toBe(first.container);
    expect(again.added).toBe(1);
    expect(again.container?.inv.slots).toHaveLength(1);
    expect(again.container?.inv.slots[0]).toEqual({ id: "water_bottle", qty: 2 });
    expect(again.container?.name).toBe("botella de agua ×2");
  });

  test("drop other tile → second container", () => {
    const reg = new ContainerRegistry();
    dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    const { container: other, added } = dropOnTile(
      reg,
      10,
      10,
      { id: "canned_food", qty: 1 },
      "drop-10-10-canned_food",
    );
    expect(added).toBe(1);
    expect(reg.list).toHaveLength(2);
    expect(other?.name).toBe("lata de comida");
    expect(other?.x).toBe(10);
    expect(other?.y).toBe(10);
  });

  test("lootOne can pick 1 from the dropped pile", () => {
    const reg = new ContainerRegistry();
    dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    const dest = createInventory();
    const taken = reg.lootOne(24.5, 15.5, dest);
    expect(taken).toEqual({ id: "water_bottle", qty: 1 });
    expect(dest.slots[0]).toEqual({ id: "water_bottle", qty: 1 });
    expect(reg.at(24, 15)?.inv.slots).toHaveLength(0);
  });

  test("dest slots llenos: added 0, pila y nombre iguales", () => {
    const pile = createWorldContainer(
      "full",
      24,
      16,
      "pila",
      [
        { id: "scrap", qty: 1 },
        { id: "wood", qty: 1 },
        { id: "cloth", qty: 1 },
        { id: "bandage", qty: 1 },
        { id: "knife", qty: 1 },
        { id: "flashlight", qty: 1 },
      ],
    );
    const nameBefore = pile.name;
    const slotsBefore = pile.inv.slots.map((s) => ({ ...s }));
    const reg = new ContainerRegistry([pile]);
    const { container, added } = dropOnTile(
      reg,
      24,
      16,
      { id: "water_bottle", qty: 1 },
      "drop-24-16-water_bottle",
    );
    expect(added).toBe(0);
    expect(container).toBe(pile);
    expect(pile.inv.slots).toEqual(slotsBefore);
    expect(pile.name).toBe(nameBefore);
    expect(dropFullMessage(added)).toBe("inventario lleno");
    expect(dropFullMessage(added)).toBe(refillFailMessage("inv_full"));
  });

  test("dest peso lleno: added 0", () => {
    const pile = createWorldContainer(
      "heavy",
      24,
      16,
      "pila",
      [{ id: "canned_food", qty: 1 }],
      6,
      0.5,
    );
    const reg = new ContainerRegistry([pile]);
    const { added } = dropOnTile(
      reg,
      24,
      16,
      { id: "canned_food", qty: 1 },
      "drop-24-16-canned_food",
    );
    expect(added).toBe(0);
    expect(pile.inv.slots[0]).toEqual({ id: "canned_food", qty: 1 });
    expect(dropFullMessage(added)).toBe("inventario lleno");
  });

  test("dest max stack: added 0; hueco en stack entra", () => {
    const pile = createWorldContainer(
      "ammo24",
      24,
      16,
      "pila",
      [{ id: "ammo", qty: 24 }],
      1,
      40,
    );
    const reg = new ContainerRegistry([pile]);
    const { added } = dropOnTile(
      reg,
      24,
      16,
      { id: "ammo", qty: 1 },
      "drop-24-16-ammo",
    );
    expect(added).toBe(0);
    expect(pile.inv.slots[0]).toEqual({ id: "ammo", qty: 24 });

    const room = createWorldContainer(
      "ammo22",
      10,
      10,
      "pila",
      [{ id: "ammo", qty: 22 }],
      1,
      40,
    );
    const roomReg = new ContainerRegistry([room]);
    const roomDrop = dropOnTile(
      roomReg,
      10,
      10,
      { id: "ammo", qty: 8 },
      "drop-10-10-ammo",
    );
    expect(roomDrop.added).toBe(2);
    expect(room.inv.slots[0]).toEqual({ id: "ammo", qty: 24 });
    expect(dropFullMessage(roomDrop.added)).toBeNull();
  });
});

describe("dropFromSlot", () => {
  test("dest lleno: slot intacto, toast inventario lleno", () => {
    const pile = createWorldContainer(
      "full",
      24,
      16,
      "pila",
      [
        { id: "scrap", qty: 1 },
        { id: "wood", qty: 1 },
        { id: "cloth", qty: 1 },
        { id: "bandage", qty: 1 },
        { id: "knife", qty: 1 },
        { id: "flashlight", qty: 1 },
      ],
    );
    const reg = new ContainerRegistry([pile]);
    const inv = createInventory(8, 20, [{ id: "water_bottle", qty: 1 }]);
    const invBefore = inv.slots.map((s) => ({ ...s }));
    const pileBefore = pile.inv.slots.map((s) => ({ ...s }));

    const { added } = dropFromSlot(
      inv,
      0,
      1,
      reg,
      24,
      16,
      "drop-24-16-water_bottle",
    );
    expect(added).toBe(0);
    expect(inv.slots).toEqual(invBefore);
    expect(pile.inv.slots).toEqual(pileBefore);
    expect(dropFullMessage(added)).toBe("inventario lleno");
  });

  test("Shift+U leftover parcial: entra lo que cabe, resto en inv", () => {
    const pile = createWorldContainer(
      "ammo22",
      24,
      16,
      "pila",
      [{ id: "ammo", qty: 22 }],
      1,
      40,
    );
    const reg = new ContainerRegistry([pile]);
    const inv = createInventory(8, 20, [{ id: "ammo", qty: 8 }]);
    const { added } = dropFromSlot(
      inv,
      0,
      dropQty(inv.slots[0]?.qty, true),
      reg,
      24,
      16,
      "drop-24-16-ammo",
    );
    expect(added).toBe(2);
    expect(pile.inv.slots[0]).toEqual({ id: "ammo", qty: 24 });
    expect(inv.slots[0]).toEqual({ id: "ammo", qty: 6 });
    expect(dropFullMessage(added)).toBeNull();
  });

  test("tile vacío: quita del inv y crea pila", () => {
    const reg = new ContainerRegistry();
    const inv = createStarterInventory();
    expect(inv.slots[0]?.id).toBe("water_bottle");
    const { container: c, added } = dropFromSlot(
      inv,
      0,
      1,
      reg,
      24,
      15,
      "drop-24-15-water_bottle",
    );
    expect(added).toBe(1);
    expect(c?.name).toBe("botella de agua");
    expect(inv.slots[0]?.id).toBe("canned_food");
    expect(reg.list).toHaveLength(1);
  });

  test("slot vacío / qty 0 → added 0, inv intacto", () => {
    const reg = new ContainerRegistry();
    const inv = createStarterInventory();
    const before = inv.slots.map((s) => ({ ...s }));
    expect(dropFromSlot(inv, 99, 1, reg, 24, 15, "x").added).toBe(0);
    expect(dropFromSlot(inv, 0, 0, reg, 24, 15, "x").added).toBe(0);
    expect(inv.slots).toEqual(before);
    expect(reg.list).toHaveLength(0);
  });
});

describe("dropFullMessage", () => {
  test("added 0 → inventario lleno (mismo copy refill)", () => {
    expect(dropFullMessage(0)).toBe("inventario lleno");
    expect(dropFullMessage(0)).toBe(refillFailMessage("inv_full"));
  });

  test("added > 0 → null (éxito / leftover no toastea)", () => {
    expect(dropFullMessage(1)).toBeNull();
    expect(dropFullMessage(8)).toBeNull();
  });
});

describe("dropInputApplies / applyDropInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: U no aplica; vivo / load-vivo sí", () => {
    expect(dropInputApplies(true)).toBe(false);
    expect(dropInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(dropInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(dropInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsDrop no muta inventario ni spawnea pila; vivo U / Shift+U sí", () => {
    const deadInv = createInventory(8, 20, [{ id: "ammo", qty: 8 }]);
    const deadReg = new ContainerRegistry();
    const beforeInv = deadInv.slots.map((s) => ({ ...s }));

    expect(
      applyDropInput(true, true, () => {
        const r = dropFromSlot(
          deadInv,
          0,
          dropQty(deadInv.slots[0]?.qty, false),
          deadReg,
          24,
          16,
          "drop-24-16-ammo",
        );
        return r.added > 0 ? r : null;
      }),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeInv);
    expect(deadReg.list).toHaveLength(0);

    const deadRt = loadAliveRuntime(false);
    expect(
      applyDropInput(deadRt.gameOver, true, () => {
        const r = dropFromSlot(
          deadInv,
          0,
          dropQty(deadInv.slots[0]?.qty, true),
          deadReg,
          24,
          16,
          "drop-24-16-ammo",
        );
        return r.added > 0 ? r : null;
      }),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeInv);
    expect(deadReg.list).toHaveLength(0);

    const liveInv = createInventory(8, 20, [{ id: "ammo", qty: 8 }]);
    const liveReg = new ContainerRegistry();
    const one = applyDropInput(false, true, () => {
      const r = dropFromSlot(
        liveInv,
        0,
        dropQty(liveInv.slots[0]?.qty, false),
        liveReg,
        24,
        16,
        "drop-24-16-ammo",
      );
      return r.added > 0 ? r : null;
    });
    expect(one?.added).toBe(1);
    expect(liveInv.slots[0]).toEqual({ id: "ammo", qty: 7 });
    expect(liveReg.list).toHaveLength(1);
    expect(liveReg.at(24, 16)?.inv.slots[0]).toEqual({ id: "ammo", qty: 1 });
    expect(
      applyDropInput(false, false, () => {
        const r = dropFromSlot(
          liveInv,
          0,
          1,
          liveReg,
          24,
          16,
          "drop-24-16-ammo",
        );
        return r.added > 0 ? r : null;
      }),
    ).toBeNull();
    expect(liveInv.slots[0]?.qty).toBe(7);

    const stackInv = createInventory(8, 20, [{ id: "ammo", qty: 8 }]);
    const stackReg = new ContainerRegistry();
    const liveRt = loadAliveRuntime(true);
    const stack = applyDropInput(liveRt.gameOver, true, () => {
      const r = dropFromSlot(
        stackInv,
        0,
        dropQty(stackInv.slots[0]?.qty, true),
        stackReg,
        10,
        10,
        "drop-10-10-ammo",
      );
      return r.added > 0 ? r : null;
    });
    expect(stack?.added).toBe(8);
    expect(stackInv.slots).toHaveLength(0);
    expect(stackReg.list).toHaveLength(1);
    expect(stackReg.at(10, 10)?.inv.slots[0]).toEqual({ id: "ammo", qty: 8 });
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan U sin drop; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("dropInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeDrop\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1800}consumeDrop\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,1400}if \(loaded\.gameOver\) this\.input\.consumeDrop\(\)/,
    );
    expect(gameSrc).toMatch(
      /dropInputApplies\(\s*this\.gameOver[\s\S]{0,80}drop[\s\S]{0,700}dropFromSlot/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}dropFromSlot/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}dropFromSlot/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeRestOrRestart\(\)/,
    );
  });
});
