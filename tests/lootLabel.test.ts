import { describe, expect, test } from "vitest";
import {
  ContainerRegistry,
  createInventory,
  createWorldContainer,
  dropOnTile,
  lootPileLabel,
} from "../src/items";

describe("lootPileLabel", () => {
  test("un stack qty>1 → nombre del item ×qty (ignora fallback)", () => {
    expect(
      lootPileLabel(
        { slots: [{ id: "wood", qty: 6 }] },
        "pila de madera",
      ),
    ).toBe("madera ×6");
    expect(
      lootPileLabel({ slots: [{ id: "ammo", qty: 8 }] }, "pila"),
    ).toBe("munición ×8");
  });

  test("un stack qty 1 → solo el nombre", () => {
    expect(
      lootPileLabel(
        { slots: [{ id: "water_bottle", qty: 1 }] },
        "botella",
      ),
    ).toBe("botella de agua");
  });

  test("vacío → fallback", () => {
    expect(lootPileLabel({ slots: [] }, "pila de madera")).toBe(
      "pila de madera",
    );
    expect(
      lootPileLabel({ slots: [{ id: "wood", qty: 0 }] }, "caja"),
    ).toBe("caja");
  });

  test("2+ stacks → fallback ×total", () => {
    expect(
      lootPileLabel(
        {
          slots: [
            { id: "wood", qty: 2 },
            { id: "scrap", qty: 3 },
          ],
        },
        "caja",
      ),
    ).toBe("caja ×5");
  });

  test("madera-spawn (wood×6+cloth×3+scrap×3) → pila de madera ×12", () => {
    expect(
      lootPileLabel(
        {
          slots: [
            { id: "wood", qty: 6 },
            { id: "cloth", qty: 3 },
            { id: "scrap", qty: 3 },
          ],
        },
        "pila de madera",
      ),
    ).toBe("pila de madera ×12");
  });

  test("fallback no-string → \"\"", () => {
    expect(lootPileLabel({ slots: [] }, undefined as unknown as string)).toBe(
      "",
    );
  });

  test("ignora qty<=0 al contar stacks", () => {
    expect(
      lootPileLabel(
        {
          slots: [
            { id: "wood", qty: 0 },
            { id: "ammo", qty: 8 },
          ],
        },
        "caja",
      ),
    ).toBe("munición ×8");
  });
});

describe("dropOnTile name", () => {
  test("ammo×8 → container.name munición ×8", () => {
    const reg = new ContainerRegistry();
    const { container: c, added } = dropOnTile(
      reg,
      24,
      15,
      { id: "ammo", qty: 8 },
      "drop-24-15-ammo",
    );
    expect(added).toBe(8);
    expect(c?.name).toBe("munición ×8");
    expect(c?.inv.slots[0]).toEqual({ id: "ammo", qty: 8 });
  });

  test("merge two drops → munición ×2", () => {
    const reg = new ContainerRegistry();
    dropOnTile(reg, 24, 15, { id: "ammo", qty: 1 }, "drop-24-15-ammo");
    const { container: again, added } = dropOnTile(
      reg,
      24,
      15,
      { id: "ammo", qty: 1 },
      "drop-24-15-ammo",
    );
    expect(added).toBe(1);
    expect(reg.list).toHaveLength(1);
    expect(again?.name).toBe("munición ×2");
    expect(again?.inv.slots[0]).toEqual({ id: "ammo", qty: 2 });
  });
});

describe("lootOne / lootStack name", () => {
  test("lootOne en pila mixta baja el total y conserva fallback", () => {
    const reg = new ContainerRegistry([
      createWorldContainer("madera-spawn", 25, 15, "pila de madera", [
        { id: "wood", qty: 6 },
        { id: "cloth", qty: 3 },
        { id: "scrap", qty: 3 },
      ]),
    ]);
    const dest = createInventory();
    const taken = reg.lootOne(25.5, 15.5, dest);
    expect(taken).toEqual({ id: "wood", qty: 1 });
    expect(reg.at(25, 15)?.name).toBe("pila de madera ×11");
  });

  test("lootOne deja 1 stack → nombre del item (ignora fallback sucio)", () => {
    const reg = new ContainerRegistry([
      createWorldContainer("pila", 5, 5, "munición ×8", [
        { id: "ammo", qty: 8 },
      ]),
    ]);
    const dest = createInventory();
    const taken = reg.lootOne(5.5, 5.5, dest);
    expect(taken).toEqual({ id: "ammo", qty: 1 });
    expect(reg.at(5, 5)?.name).toBe("munición ×7");
  });

  test("lootStack deja el resto con qty", () => {
    const reg = new ContainerRegistry([
      createWorldContainer("madera-spawn", 25, 15, "pila de madera", [
        { id: "wood", qty: 6 },
        { id: "cloth", qty: 3 },
        { id: "scrap", qty: 3 },
      ]),
    ]);
    const dest = createInventory();
    const taken = reg.lootStack(25.5, 15.5, dest);
    expect(taken).toEqual({ id: "wood", qty: 6 });
    expect(reg.at(25, 15)?.name).toBe("pila de madera ×6");
  });
});
