import type { TileMap } from "../world/tilemap";
import {
  createNeeds,
  drink,
  eat,
  rest,
  tickNeeds,
  type NeedsRateMult,
  type NeedsState,
} from "./needs";
import {
  applyDamage,
  createBody,
  heal,
  isAlive,
  type BodyState,
} from "./body";
import {
  CONTAINER_REACH,
  ContainerRegistry,
  addItem,
  createStarterInventory,
  dropTargetTile,
  findConsumableSlot,
  getItemDef,
  insertStackAt,
  inventorySummary,
  removeFromSlot,
  totalWeight,
  attemptBuildBarricade,
  tryCraftBandage as craftBandageRecipe,
  attemptCook,
  type BarricadeAttempt,
  type BarricadeFail,
  type CookAttempt,
  type CookFail,
  type CraftBandageResult,
  type Inventory,
  type ItemStack,
} from "../items";
import {
  pickMeleeTarget,
  resolveMeleeWeapon,
  checkRangedReady,
  consumeAmmo,
  pickRangedTarget,
  aimAlongFacing,
  MELEE_WHIFF_COOLDOWN,
  type MeleeWeaponChoice,
} from "../combat";
import type { HostileSim, HostileDamageResult } from "../ai";

/** Resultado de golpe melee (incluye arma usada). */
export interface MeleeAttackResult extends HostileDamageResult {
  weapon: MeleeWeaponChoice;
}

/** Resultado de intento de disparo (HUD + tests + tracer visual). */
export type RangedAttackResult =
  | { kind: "fail"; message: string }
  | {
      kind: "shot";
      hit: false;
      message: string;
      /** Origen del tracer (player). */
      fromX: number;
      fromY: number;
      /** Fin del tracer (aim × range si miss). */
      toX: number;
      toY: number;
    }
  | {
      kind: "shot";
      hit: true;
      message: string;
      hostileId: string;
      damage: number;
      health: number;
      killed: boolean;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    };

const SPEED = 5.5;
const SPRINT_MULT = 1.55;
/** Radio de colisión del jugador en tiles. */
export const PLAYER_RADIUS = 0.32;
const DOOR_REACH = 1.6;

export interface PlayerState {
  x: number;
  y: number;
}

/** Sim del jugador: posición + colisión + needs + body + inventario + build + melee + ranged. */
export class PlayerSim {
  x: number;
  y: number;
  readonly needs: NeedsState;
  readonly body: BodyState;
  readonly inventory: Inventory;
  /** Última dirección cardinal (tile step) para puertas / barricadas. */
  facingX = 0;
  facingY = 1;
  /** Aim continuo (ejes raw) para melee / disparo. No snap cardinal. */
  aimX = 0;
  aimY = 1;
  /** Cooldown restante de ataque melee. */
  attackCd = 0;

  constructor(
    spawn: { x: number; y: number },
    needs?: Partial<NeedsState>,
    inventory?: Inventory,
    body?: Partial<BodyState>,
  ) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.needs = createNeeds(needs);
    this.body = createBody(body);
    this.inventory = inventory ?? createStarterInventory();
  }

  get health(): number {
    return this.body.health;
  }

  get alive(): boolean {
    return isAlive(this.body);
  }

  /** Aplica daño a salud. */
  takeDamage(amount: number): number {
    return applyDamage(this.body, amount);
  }

  /** Baja cooldown de ataque. */
  tickCombat(dt: number): void {
    if (this.attackCd > 0) this.attackCd = Math.max(0, this.attackCd - dt);
  }

  /**
   * Melee (Espacio/V): golpea hostil adyacente / aim continuo.
   * Auto-usa la mejor arma melee del inventario (o puños).
   * Devuelve resultado del daño o null si no hay target / en cooldown / muerto.
   * Miss (sin target) arranca MELEE_WHIFF_COOLDOWN para no apilar swings.
   */
  tryMelee(hostiles: HostileSim): MeleeAttackResult | null {
    if (!this.alive) return null;
    if (this.attackCd > 0) return null;
    const weapon = resolveMeleeWeapon(this.inventory);
    const pick = pickMeleeTarget(
      this.x,
      this.y,
      this.aimX,
      this.aimY,
      hostiles.hostiles,
      weapon.reach,
    );
    if (!pick) {
      this.attackCd = MELEE_WHIFF_COOLDOWN;
      return null;
    }
    this.attackCd = weapon.cooldown;
    const hit = hostiles.damage(pick.id, weapon.damage);
    if (!hit) return null;
    return { ...hit, weapon };
  }

  /**
   * Disparo (X): requiere pistola + ammo. Gasta 1 bala.
   * Hit si hostil en aim continuo + rango + LOS. Ruido lo emite Game.
   */
  tryShoot(hostiles: HostileSim, map: TileMap): RangedAttackResult {
    if (!this.alive) return { kind: "fail", message: "estás muerto" };
    if (this.attackCd > 0) return { kind: "fail", message: "enfriamiento" };
    const ready = checkRangedReady(this.inventory);
    if (!ready.ok) return { kind: "fail", message: ready.message };
    if (!consumeAmmo(this.inventory)) {
      return { kind: "fail", message: "sin munición" };
    }
    this.attackCd = ready.cooldown;
    const fromX = this.x;
    const fromY = this.y;
    const missTo = aimAlongFacing(
      fromX,
      fromY,
      this.aimX,
      this.aimY,
      ready.range,
    );
    const pick = pickRangedTarget(
      this.x,
      this.y,
      this.aimX,
      this.aimY,
      hostiles.hostiles,
      map,
      ready.range,
    );
    if (!pick) {
      return {
        kind: "shot",
        hit: false,
        message: "disparo fallido",
        fromX,
        fromY,
        toX: missTo.x,
        toY: missTo.y,
      };
    }
    const target = hostiles.hostiles.find((h) => h.id === pick.id);
    const toX = target?.x ?? missTo.x;
    const toY = target?.y ?? missTo.y;
    const hit = hostiles.damage(pick.id, ready.damage);
    if (!hit) {
      return {
        kind: "shot",
        hit: false,
        message: "disparo fallido",
        fromX,
        fromY,
        toX,
        toY,
      };
    }
    return {
      kind: "shot",
      hit: true,
      message: hit.killed
        ? `disparo: mataste ${hit.hostileId}`
        : `disparo: ${hit.hostileId} -${hit.damage}`,
      hostileId: hit.hostileId,
      damage: hit.damage,
      health: hit.health,
      killed: hit.killed,
      fromX,
      fromY,
      toX,
      toY,
    };
  }

  /**
   * Mueve con ejes normalizados. Intenta eje completo, luego slide en X/Y.
   * `sprint` (Shift) aumenta velocidad. Devuelve distancia recorrida este frame.
   * No mueve si está muerto.
   */
  move(
    dt: number,
    axes: { x: number; z: number },
    map: TileMap,
    sprint = false,
  ): number {
    if (!this.alive) return 0;
    if (axes.x === 0 && axes.z === 0) return 0;
    // Aim continuo: ejes raw (no snap)
    this.aimX = axes.x;
    this.aimY = axes.z;
    // Facing cardinal: eje dominante del input (puertas / barricadas)
    if (Math.abs(axes.x) >= Math.abs(axes.z)) {
      this.facingX = axes.x > 0 ? 1 : -1;
      this.facingY = 0;
    } else {
      this.facingX = 0;
      this.facingY = axes.z > 0 ? 1 : -1;
    }
    const speed = SPEED * (sprint ? SPRINT_MULT : 1);
    const dx = axes.x * speed * dt;
    const dy = axes.z * speed * dt; // z del input = y del mapa
    const ox = this.x;
    const oy = this.y;
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (map.canOccupy(nx, ny, PLAYER_RADIUS)) {
      this.x = nx;
      this.y = ny;
    } else if (map.canOccupy(nx, this.y, PLAYER_RADIUS)) {
      this.x = nx;
    } else if (map.canOccupy(this.x, ny, PLAYER_RADIUS)) {
      this.y = ny;
    }
    return Math.hypot(this.x - ox, this.y - oy);
  }

  /** Avanza hambre/sed/cansancio con el tiempo de juego. */
  tickNeeds(dt: number, mult?: NeedsRateMult): void {
    if (!this.alive) return;
    tickNeeds(this.needs, dt, mult);
  }

  /** Descanso (tecla R): baja cansancio. */
  rest(): void {
    if (!this.alive) return;
    rest(this.needs);
  }

  /**
   * Loot: toma 1 item del contenedor cercano → inventario.
   * Tecla G (o E contextual si no hay puerta).
   */
  tryLoot(containers: ContainerRegistry): ItemStack | null {
    if (!this.alive) return null;
    const prefer = dropTargetTile(this.x, this.y, this.facingX, this.facingY);
    return containers.lootOne(
      this.x,
      this.y,
      this.inventory,
      CONTAINER_REACH,
      prefer,
    );
  }

  /**
   * Loot: toma el primer stack entero del contenedor cercano → inventario.
   * Tecla Shift+G.
   */
  tryLootStack(containers: ContainerRegistry): ItemStack | null {
    if (!this.alive) return null;
    const prefer = dropTargetTile(this.x, this.y, this.facingX, this.facingY);
    return containers.lootStack(
      this.x,
      this.y,
      this.inventory,
      CONTAINER_REACH,
      prefer,
    );
  }

  /**
   * Consume primer food/drink/heal del inventario y aplica eat/drink/heal.
   * Tecla Q (game) usa tryConsumeAt(hotbarSelected); `prefer` fuerza tipo.
   * water_bottle: última unidad → empty_bottle en el mismo índice;
   * leftover → addItem (si no cabe, se pierde el vacío).
   */
  tryConsume(prefer?: "food" | "drink" | "heal"): "food" | "drink" | "heal" | null {
    if (!this.alive) return null;
    const slot = findConsumableSlot(this.inventory, prefer);
    if (slot < 0) return null;
    return this.tryConsumeAt(slot);
  }

  /**
   * Consume 1 unidad de `inventory.slots[slotIndex]` si es food/drink/heal.
   * Fuera de rango / ausente / use none → null. Sin fallback a otro slot.
   * water_bottle última unidad → empty_bottle en el mismo índice (sticky);
   * leftover qty → addItem (si no cabe, se pierde el vacío).
   */
  tryConsumeAt(slotIndex: number): "food" | "drink" | "heal" | null {
    if (!this.alive) return null;
    const stack = this.inventory.slots[slotIndex];
    if (!stack || stack.qty <= 0) return null;
    const consumedId = stack.id;
    const lastOfStack = stack.qty <= 1;
    const def = getItemDef(consumedId);
    if (def.use !== "food" && def.use !== "drink" && def.use !== "heal") {
      return null;
    }
    removeFromSlot(this.inventory, slotIndex, 1);
    if (def.use === "food") {
      eat(this.needs, def.relief);
      if (def.fatigueRelief && def.fatigueRelief > 0) {
        rest(this.needs, def.fatigueRelief);
      }
      return "food";
    }
    if (def.use === "drink") {
      drink(this.needs, def.relief);
      // Solo water_bottle deja vacío; otros drinks futuros: mismo patrón si aplica.
      if (consumedId === "water_bottle") {
        if (lastOfStack) {
          insertStackAt(this.inventory, slotIndex, {
            id: "empty_bottle",
            qty: 1,
          });
        } else {
          addItem(this.inventory, "empty_bottle", 1);
        }
      }
      return "drink";
    }
    heal(this.body, def.relief);
    return "heal";
  }

  /**
   * Coloca barricada en tile adyacente según facing (tecla B).
   * Receta: 1 madera → 1 barricada. Devuelve intento con mensaje HUD.
   */
  tryPlaceBarricade(map: TileMap): BarricadeAttempt | BarricadeFail | null {
    if (!this.alive) return null;
    const tx = Math.floor(this.x) + this.facingX;
    const ty = Math.floor(this.y) + this.facingY;
    return attemptBuildBarricade(map, this.inventory, tx, ty);
  }

  /**
   * Craft vendaje (tecla C): 1 tela + 1 chatarra → 1 vendaje.
   * Dest lleno: added 0, mats intactas.
   */
  tryCraftBandage(): CraftBandageResult {
    if (!this.alive) return { added: 0 };
    return craftBandageRecipe(this.inventory);
  }

  /**
   * Cocinar (tecla H): 1 canned_food → 1 hot_meal.
   * Requiere indoor o cerca de furniture.
   */
  tryCook(map: TileMap): CookAttempt | CookFail | null {
    if (!this.alive) return null;
    return attemptCook(map, this.inventory, this.x, this.y);
  }

  /** Resumen inventario para HUD. */
  invSummary(): string {
    return inventorySummary(this.inventory);
  }

  invWeight(): number {
    return totalWeight(this.inventory);
  }

  /** Intenta toggle de puerta cercana. Devuelve coords si cambió. */
  tryToggleDoor(map: TileMap): { x: number; y: number; open: boolean } | null {
    if (!this.alive) return null;
    const near = map.nearestDoor(this.x, this.y, DOOR_REACH);
    if (!near) return null;
    const open = map.toggleDoor(near.x, near.y);
    if (open === null) return null;
    return { x: near.x, y: near.y, open };
  }
}
