import { describe, expect, test } from "vitest";
import { ITEM_DEFS, type ItemId } from "../src/items/defs";
import { itemIconSvg } from "../src/ui/itemIcons";

const IDS = Object.keys(ITEM_DEFS) as ItemId[];

describe("itemIconSvg", () => {
  test("cada ItemId conocido devuelve markup <svg no vacío", () => {
    expect(IDS.length).toBeGreaterThan(0);
    for (const id of IDS) {
      const markup = itemIconSvg(id);
      expect(markup).toBeTruthy();
      expect(markup.length).toBeGreaterThan(0);
      expect(markup).toContain("<svg");
      expect(markup).toContain("aria-hidden=\"true\"");
    }
  });

  test("id desconocido / vacío → fallback diamante, no vacío", () => {
    const unknown = itemIconSvg("not_an_item");
    const emptyId = itemIconSvg("");
    expect(unknown).toContain("<svg");
    expect(unknown.length).toBeGreaterThan(0);
    expect(emptyId).toBe(unknown);
    expect(itemIconSvg("???")).toBe(unknown);
    expect(unknown).not.toBe(itemIconSvg("knife"));
    expect(unknown).toMatch(/d="M16 /);
  });

  test("botella llena y vacía son distintas; ambos svg", () => {
    const full = itemIconSvg("water_bottle");
    const empty = itemIconSvg("empty_bottle");
    expect(full).toContain("<svg");
    expect(empty).toContain("<svg");
    expect(full).not.toBe(empty);
  });
});
