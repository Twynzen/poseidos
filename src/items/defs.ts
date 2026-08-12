/**
 * Catálogo mínimo de items (F2 inventario/loot + craft + melee + ranged stub).
 * Sim headless: id, nombre, peso, stack, uso (food/drink/heal/none).
 * Armas melee: meleeDamage (+ reach/cooldown opcionales).
 * Armas a distancia: rangedDamage (+ range/cooldown).
 */

export type ItemId =
  | "canned_food"
  | "water_bottle"
  | "empty_bottle"
  | "scrap"
  | "wood"
  | "cloth"
  | "bandage"
  | "knife"
  | "crowbar"
  | "pistol"
  | "ammo"
  | "hot_meal"
  | "flashlight";

export type ItemUse = "food" | "drink" | "heal" | "none";

export interface ItemDef {
  id: ItemId;
  name: string;
  /** Peso por unidad. */
  weight: number;
  stackable: boolean;
  maxStack: number;
  use: ItemUse;
  /** Alivio de needs (food/drink) o HP (heal) al consumir. */
  relief: number;
  /** Alivio opcional de fatigue al consumir (p.ej. hot_meal). */
  fatigueRelief?: number;
  /** Daño melee si es arma cuerpo a cuerpo. */
  meleeDamage?: number;
  /** Alcance melee opcional (tiles). */
  meleeReach?: number;
  /** Cooldown melee opcional (s). */
  meleeCooldown?: number;
  /** Daño a distancia si es arma ranged. */
  rangedDamage?: number;
  /** Alcance ranged opcional (tiles). */
  rangedRange?: number;
  /** Cooldown ranged opcional (s). */
  rangedCooldown?: number;
}

export const ITEM_DEFS: Record<ItemId, ItemDef> = {
  canned_food: {
    id: "canned_food",
    name: "lata de comida",
    weight: 0.5,
    stackable: true,
    maxStack: 5,
    use: "food",
    relief: 35,
  },
  hot_meal: {
    id: "hot_meal",
    name: "plato caliente",
    weight: 0.6,
    stackable: true,
    maxStack: 5,
    use: "food",
    relief: 55,
    fatigueRelief: 12,
  },
  water_bottle: {
    id: "water_bottle",
    name: "botella de agua",
    weight: 0.4,
    stackable: true,
    maxStack: 5,
    use: "drink",
    relief: 40,
  },
  empty_bottle: {
    id: "empty_bottle",
    name: "botella vacía",
    weight: 0.2,
    stackable: true,
    maxStack: 5,
    use: "none",
    relief: 0,
  },
  scrap: {
    id: "scrap",
    name: "chatarra",
    weight: 1.0,
    stackable: true,
    maxStack: 10,
    use: "none",
    relief: 0,
  },
  wood: {
    id: "wood",
    name: "madera",
    weight: 0.8,
    stackable: true,
    maxStack: 10,
    use: "none",
    relief: 0,
  },
  cloth: {
    id: "cloth",
    name: "tela",
    weight: 0.3,
    stackable: true,
    maxStack: 10,
    use: "none",
    relief: 0,
  },
  bandage: {
    id: "bandage",
    name: "vendaje",
    weight: 0.2,
    stackable: true,
    maxStack: 5,
    use: "heal",
    relief: 25,
  },
  knife: {
    id: "knife",
    name: "cuchillo",
    weight: 0.4,
    stackable: false,
    maxStack: 1,
    use: "none",
    relief: 0,
    meleeDamage: 25,
    meleeReach: 1.15,
    meleeCooldown: 0.45,
  },
  crowbar: {
    id: "crowbar",
    name: "palanca",
    weight: 1.2,
    stackable: false,
    maxStack: 1,
    use: "none",
    relief: 0,
    meleeDamage: 35,
    meleeReach: 1.35,
    meleeCooldown: 0.65,
  },
  pistol: {
    id: "pistol",
    name: "pistola",
    weight: 1.1,
    stackable: false,
    maxStack: 1,
    use: "none",
    relief: 0,
    rangedDamage: 45,
    rangedRange: 7,
    rangedCooldown: 0.85,
  },
  ammo: {
    id: "ammo",
    name: "munición",
    weight: 0.05,
    stackable: true,
    maxStack: 24,
    use: "none",
    relief: 0,
  },
  flashlight: {
    id: "flashlight",
    name: "linterna",
    weight: 0.5,
    stackable: false,
    maxStack: 1,
    use: "none",
    relief: 0,
  },
};

export function getItemDef(id: ItemId): ItemDef {
  return ITEM_DEFS[id];
}

/** True si el def es arma melee (tiene daño). */
export function isMeleeWeapon(def: ItemDef): boolean {
  return typeof def.meleeDamage === "number" && def.meleeDamage > 0;
}

/** True si el def es arma a distancia. */
export function isRangedWeapon(def: ItemDef): boolean {
  return typeof def.rangedDamage === "number" && def.rangedDamage > 0;
}
