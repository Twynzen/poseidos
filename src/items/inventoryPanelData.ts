/**
 * Datos/formatos del panel de inventario — headless (sin DOM).
 * La UI en src/ui/inventory.ts solo renderiza este view-model.
 */

import {
  getItemDef,
  isMeleeWeapon,
  type ItemId,
} from "./defs";
import {
  findSlot,
  totalWeight,
  type Inventory,
} from "./inventory";

export const INVENTORY_EMPTY_MSG = "inventario vacío";

export interface InventorySlotLine {
  id: ItemId;
  /** Nombre ES del catálogo. */
  name: string;
  qty: number;
  /** Peso del stack (unidad × qty). */
  weight: number;
  /** Línea lista para UI: "cuchillo ×1 (0.4kg)". */
  text: string;
  /** Índice 0-based original en inventory.slots (no compactado). */
  index: number;
}

export interface InventoryPanelData {
  empty: boolean;
  slots: InventorySlotLine[];
  /** Capacidad de celdas del panel I (incluye vacías). */
  maxSlots: number;
  /** Peso total / máx. */
  weight: number;
  maxWeight: number;
  /** Badges de equipo (melee auto + pistola/ammo si hay). */
  equipment: string[];
  /** "equipo: cuchillo · pistola + munición×6" */
  equipmentLine: string;
  weightLine: string;
}

/** Una línea de slot: nombre ES + qty + peso del stack. */
export function formatSlotLine(
  id: ItemId,
  qty: number,
): Omit<InventorySlotLine, "index"> {
  const def = getItemDef(id);
  const weight = def.weight * qty;
  const w =
    weight < 0.1 && weight > 0
      ? weight.toFixed(2)
      : weight.toFixed(1);
  return {
    id,
    name: def.name,
    qty,
    weight,
    text: `${def.name} ×${qty} (${w}kg)`,
  };
}

/**
 * Melee auto-elegida (mayor daño) o "puños"; pistola + ammo si hay.
 */
export function formatEquipment(inv: Inventory): string[] {
  const parts: string[] = [];
  let bestName = "puños";
  let bestDmg = 0;
  for (const slot of inv.slots) {
    if (slot.qty <= 0) continue;
    const def = getItemDef(slot.id);
    if (!isMeleeWeapon(def)) continue;
    const dmg = def.meleeDamage ?? 0;
    if (dmg > bestDmg) {
      bestDmg = dmg;
      bestName = def.name;
    }
  }
  parts.push(bestName);

  const gun = findSlot(inv, "pistol");
  if (gun >= 0 && (inv.slots[gun]?.qty ?? 0) > 0) {
    const ammoIdx = findSlot(inv, "ammo");
    const ammoQty = ammoIdx >= 0 ? inv.slots[ammoIdx]!.qty : 0;
    if (ammoQty > 0) {
      parts.push(`pistola + munición×${ammoQty}`);
    } else {
      parts.push("pistola (sin munición)");
    }
  }
  return parts;
}

export function formatEquipmentLine(inv: Inventory): string {
  return `equipo: ${formatEquipment(inv).join(" · ")}`;
}

/** View-model completo para el panel (I). */
export function buildInventoryPanelData(inv: Inventory): InventoryPanelData {
  const slots = inv.slots
    .map((s, i) => ({ ...formatSlotLine(s.id, s.qty), index: i }))
    .filter((s) => s.qty > 0);
  const weight = totalWeight(inv);
  const equipment = formatEquipment(inv);
  return {
    empty: slots.length === 0,
    slots,
    maxSlots: inv.maxSlots,
    weight,
    maxWeight: inv.maxWeight,
    equipment,
    equipmentLine: `equipo: ${equipment.join(" · ")}`,
    weightLine: `${weight.toFixed(1)}/${inv.maxWeight.toFixed(0)}kg`,
  };
}
