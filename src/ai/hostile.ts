import type { TileMap } from "../world/tilemap";
import { findPath, type GridPos } from "../world/pathfinding";
import { hasLineOfSight } from "../world/los";
import { HOSTILE_MAX_HEALTH, TOUCH_DAMAGE } from "../actors/body";
import type { NoiseBus, NoiseEvent } from "../world/noise";

export type HostileMode = "wander" | "chase" | "investigate";

/** mute = amenaza muda (F3); possessed = humano poseído parlante (F4). */
export type ThreatKind = "mute" | "possessed";

export interface Hostile {
  id: string;
  x: number;
  y: number;
  /** Ancla de wander: coords de spawn (no driftea con la posición actual). */
  homeX: number;
  homeY: number;
  /** mute | possessed — conviven en el mismo sim. */
  kind: ThreatKind;
  /** Salud; 0 = muerto (se remueve del sim). */
  health: number;
  mode: HostileMode;
  /** Camino actual (tiles); index apunta al waypoint activo. */
  path: GridPos[];
  pathIndex: number;
  /** Segundos hasta re-planificar wander / investigate / chase. */
  replanAt: number;
  /** Cooldown de ataque (toque). */
  attackCd: number;
  /** Destino de investigación (ruido oído / última vista). */
  investigateX: number;
  investigateY: number;
  /** Segundos restantes de memoria de búsqueda (investigate). */
  investigateTtl: number;
  /** Tras terminar search: no re-enganchar el mismo ruido de inmediato. */
  searchCd: number;
}

export interface HostileSimOptions {
  visionRange?: number;
  /**
   * @deprecated Preferir NoiseBus. Si > 0, oír al player por proximidad
   * (fallback tests viejos / demo sin bus).
   */
  hearRange?: number;
  speed?: number;
  touchRange?: number;
  touchDamage?: number;
  attackCooldown?: number;
  wanderRadius?: number;
  /** HP inicial de nuevos hostiles. */
  maxHealth?: number;
  /** Cuánto tiempo sigue investigando tras oír / perder LOS. */
  investigateTimeout?: number;
  /** Si el ruido está más lejos que esto, se ignora. */
  maxInvestigateRange?: number;
  /** Cooldown tras llegar / olvidar antes de re-investigar. */
  searchCooldown?: number;
}


/** Modificadores opcionales por entidad (trust/diálogo → AI). */
export interface HostileAttitudeMod {
  /** Sin chase ni toque; ignora visión/ruido hostil. */
  pacified?: boolean;
  speedMul?: number;
  attackCdMul?: number;
  damageMul?: number;
}

export interface HostileHitEvent {
  hostileId: string;
  damage: number;
}

export interface HostileDamageResult {
  hostileId: string;
  damage: number;
  health: number;
  killed: boolean;
}

const DEFAULTS = {
  visionRange: 8,
  hearRange: 0,
  speed: 2.4,
  touchRange: 0.7,
  touchDamage: TOUCH_DAMAGE,
  attackCooldown: 0.85,
  wanderRadius: 4,
  maxHealth: HOSTILE_MAX_HEALTH,
  investigateTimeout: 4.0,
  maxInvestigateRange: 12,
  searchCooldown: 1.2,
} as const;

/**
 * Amenazas mudas (F3): wander / chase (visión) / investigate (ruido + última vista).
 * Chase pierde LOS → search al último punto; search acaba (llegada o TTL) → wander.
 * Headless — sin Three.
 */
export class HostileSim {
  readonly hostiles: Hostile[] = [];
  readonly visionRange: number;
  readonly hearRange: number;
  readonly speed: number;
  readonly touchRange: number;
  readonly touchDamage: number;
  readonly attackCooldown: number;
  readonly wanderRadius: number;
  readonly maxHealth: number;
  readonly investigateTimeout: number;
  readonly maxInvestigateRange: number;
  readonly searchCooldown: number;
  private readonly rng: () => number;

  constructor(opts: HostileSimOptions = {}, rng: () => number = Math.random) {
    this.visionRange = opts.visionRange ?? DEFAULTS.visionRange;
    this.hearRange = opts.hearRange ?? DEFAULTS.hearRange;
    this.speed = opts.speed ?? DEFAULTS.speed;
    this.touchRange = opts.touchRange ?? DEFAULTS.touchRange;
    this.touchDamage = opts.touchDamage ?? DEFAULTS.touchDamage;
    this.attackCooldown = opts.attackCooldown ?? DEFAULTS.attackCooldown;
    this.wanderRadius = opts.wanderRadius ?? DEFAULTS.wanderRadius;
    this.maxHealth = opts.maxHealth ?? DEFAULTS.maxHealth;
    this.investigateTimeout = opts.investigateTimeout ?? DEFAULTS.investigateTimeout;
    this.maxInvestigateRange = opts.maxInvestigateRange ?? DEFAULTS.maxInvestigateRange;
    this.searchCooldown = opts.searchCooldown ?? DEFAULTS.searchCooldown;
    this.rng = rng;
  }

  add(
    id: string,
    x: number,
    y: number,
    health?: number,
    kind: ThreatKind = "mute",
  ): Hostile {
    const h: Hostile = {
      id,
      x,
      y,
      homeX: x,
      homeY: y,
      kind,
      health: health ?? this.maxHealth,
      mode: "wander",
      path: [],
      pathIndex: 0,
      replanAt: 0,
      attackCd: 0,
      investigateX: x,
      investigateY: y,
      investigateTtl: 0,
      searchCd: 0,
    };
    this.hostiles.push(h);
    return h;
  }

  get(id: string): Hostile | undefined {
    return this.hostiles.find((h) => h.id === id);
  }

  /** Aplica daño; remueve del mundo si HP ≤ 0. */
  damage(id: string, amount: number): HostileDamageResult | null {
    const idx = this.hostiles.findIndex((h) => h.id === id);
    if (idx < 0) return null;
    const h = this.hostiles[idx]!;
    if (amount > 0) h.health = Math.max(0, h.health - amount);
    const killed = h.health <= 0;
    if (killed) this.hostiles.splice(idx, 1);
    return { hostileId: id, damage: amount, health: h.health, killed };
  }

  remove(id: string): boolean {
    const idx = this.hostiles.findIndex((h) => h.id === id);
    if (idx < 0) return false;
    this.hostiles.splice(idx, 1);
    return true;
  }

  clear(): void {
    this.hostiles.length = 0;
  }

  /**
   * Tick de AI. Devuelve hits al player este frame.
   * `noise` opcional: si oyen un evento, investigan hacia ese punto.
   * Hostiles con health ≤ 0 no actúan (y se purgan).
   */
  tick(
    dt: number,
    map: TileMap,
    playerX: number,
    playerY: number,
    noise?: NoiseBus | null,
    attitudes?: ReadonlyMap<string, HostileAttitudeMod> | null,
  ): HostileHitEvent[] {
    const hits: HostileHitEvent[] = [];
    if (dt <= 0) return hits;

    // Purga muertos residuales
    for (let i = this.hostiles.length - 1; i >= 0; i--) {
      if (this.hostiles[i]!.health <= 0) this.hostiles.splice(i, 1);
    }

    const ptx = Math.floor(playerX);
    const pty = Math.floor(playerY);

    for (const h of this.hostiles) {
      if (h.attackCd > 0) h.attackCd = Math.max(0, h.attackCd - dt);
      h.replanAt = Math.max(0, h.replanAt - dt);
      if (h.searchCd > 0) h.searchCd = Math.max(0, h.searchCd - dt);
      if (h.mode === "investigate" && h.investigateTtl > 0) {
        h.investigateTtl = Math.max(0, h.investigateTtl - dt);
      }

      const mod = attitudes?.get(h.id);
      const pacified = !!mod?.pacified;
      const speedMul = mod?.speedMul ?? 1;
      const attackCdMul = mod?.attackCdMul ?? 1;
      const damageMul = mod?.damageMul ?? 1;

      // Gate pacify / trust alto: soltar chase/investigate → wander
      if (pacified && (h.mode === "chase" || h.mode === "investigate")) {
        h.mode = "wander";
        h.path = [];
        h.pathIndex = 0;
        h.investigateTtl = 0;
        h.replanAt = 0;
      }

      const sees = !pacified && this.seesPlayer(map, h, ptx, pty);
      const heard: NoiseEvent | null =
        !pacified && h.searchCd <= 0 && noise
          ? noise.heardFrom(h.x, h.y)
          : null;
      const hearsPlayerFallback =
        !pacified &&
        h.searchCd <= 0 &&
        !heard &&
        this.hearRange > 0 &&
        Math.hypot(h.x - playerX, h.y - playerY) <= this.hearRange;

      if (sees) {
        if (h.mode !== "chase") {
          h.mode = "chase";
          h.path = [];
          h.pathIndex = 0;
          h.investigateTtl = 0;
        }
        // Re-path periódico mientras el target se mueve
        if (h.path.length === 0 || h.pathIndex >= h.path.length || h.replanAt <= 0) {
          this.setPath(h, map, ptx, pty);
          h.replanAt = 0.45;
        }
        // Memoria de última vista (por si pierde LOS el próximo tick)
        h.investigateX = playerX;
        h.investigateY = playerY;
      } else {
        // ¿Nuevo estímulo de ruido (o fallback hearRange)?
        if (heard || hearsPlayerFallback) {
          const tx = heard ? heard.x : playerX;
          const ty = heard ? heard.y : playerY;
          const distNoise = Math.hypot(h.x - tx, h.y - ty);
          if (distNoise <= this.maxInvestigateRange) {
            const retarget =
              h.mode !== "investigate" ||
              Math.hypot(h.investigateX - tx, h.investigateY - ty) > 0.6;
            if (retarget) {
              this.beginInvestigate(h, tx, ty);
            } else if (h.mode === "investigate") {
              // Mismo punto: refrescar TTL mientras el ruido siga vivo
              h.investigateTtl = this.investigateTimeout;
            }
          }
        } else if (h.mode === "chase") {
          // Perdió LOS: buscar última posición vista (no freeze ni abandonar al instante)
          this.beginInvestigate(h, h.investigateX, h.investigateY);
        }

        if (h.mode === "investigate") {
          const arrived =
            Math.hypot(h.x - h.investigateX, h.y - h.investigateY) < 0.55;
          if (arrived || h.investigateTtl <= 0) {
            // Llegó / olvidó → wander (con cooldown anti-loop del mismo ruido)
            this.finishInvestigate(h);
          } else {
            const gx = Math.floor(h.investigateX);
            const gy = Math.floor(h.investigateY);
            if (
              h.path.length === 0 ||
              h.pathIndex >= h.path.length ||
              h.replanAt <= 0
            ) {
              this.setPath(h, map, gx, gy);
              h.replanAt = 0.5;
            }
          }
        } else {
          // wander
          if (h.path.length === 0 || h.pathIndex >= h.path.length || h.replanAt <= 0) {
            this.planWander(h, map);
            h.replanAt = 1.2 + this.rng() * 1.5;
          }
        }
      }

      this.followPath(h, map, dt, this.speed * speedMul);

      const dist = Math.hypot(h.x - playerX, h.y - playerY);
      if (
        !pacified &&
        damageMul > 0 &&
        dist <= this.touchRange &&
        h.attackCd <= 0
      ) {
        h.attackCd = this.attackCooldown * attackCdMul;
        hits.push({
          hostileId: h.id,
          damage: Math.max(1, Math.round(this.touchDamage * damageMul)),
        });
      }
    }

    return hits;
  }

  /** Arranca / retarget investigate hacia (tx,ty) con TTL fresco. */
  private beginInvestigate(h: Hostile, tx: number, ty: number): void {
    h.mode = "investigate";
    h.investigateX = tx;
    h.investigateY = ty;
    h.investigateTtl = this.investigateTimeout;
    h.path = [];
    h.pathIndex = 0;
    h.replanAt = 0;
  }

  /** Termina search → wander + cooldown para no re-enganchar el mismo ruido. */
  private finishInvestigate(h: Hostile): void {
    h.mode = "wander";
    h.investigateTtl = 0;
    h.path = [];
    h.pathIndex = 0;
    h.replanAt = 0.3;
    h.searchCd = this.searchCooldown;
  }

  /** ¿Ve al player (LOS + rango)? */
  seesPlayer(
    map: TileMap,
    h: Hostile,
    ptx: number,
    pty: number,
  ): boolean {
    const htx = Math.floor(h.x);
    const hty = Math.floor(h.y);
    const tileDist = Math.hypot(htx - ptx, hty - pty);
    return (
      tileDist <= this.visionRange &&
      hasLineOfSight(map, htx, hty, ptx, pty)
    );
  }

  /**
   * @deprecated Usar seesPlayer + NoiseBus.heardFrom.
   * Conservado para tests que llaman sensesPlayer.
   */
  sensesPlayer(
    map: TileMap,
    h: Hostile,
    playerX: number,
    playerY: number,
    ptx: number,
    pty: number,
    noise?: NoiseBus | null,
  ): boolean {
    if (this.seesPlayer(map, h, ptx, pty)) return true;
    if (noise && noise.heardFrom(h.x, h.y)) return true;
    if (this.hearRange > 0) {
      return Math.hypot(h.x - playerX, h.y - playerY) <= this.hearRange;
    }
    return false;
  }

  private setPath(h: Hostile, map: TileMap, gx: number, gy: number): void {
    const path = findPath(
      map,
      { x: Math.floor(h.x), y: Math.floor(h.y) },
      { x: gx, y: gy },
    );
    if (path.length > 1) {
      h.path = path.slice(1);
    } else {
      h.path =
        path.length === 1 &&
        (path[0]!.x !== Math.floor(h.x) || path[0]!.y !== Math.floor(h.y))
          ? path
          : [];
    }
    h.pathIndex = 0;
  }

  private planWander(h: Hostile, map: TileMap): void {
    // Ancla al home (spawn), no a la posición actual — evita drift hacia el player.
    const htx = Math.floor(h.homeX);
    const hty = Math.floor(h.homeY);
    const candidates: GridPos[] = [];
    const r = this.wanderRadius;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tx = htx + dx;
        const ty = hty + dy;
        if (map.walkable(tx, ty)) candidates.push({ x: tx, y: ty });
      }
    }
    if (candidates.length === 0) {
      h.path = [];
      h.pathIndex = 0;
      return;
    }
    const pick = candidates[Math.floor(this.rng() * candidates.length)]!;
    this.setPath(h, map, pick.x, pick.y);
  }

  private followPath(
    h: Hostile,
    map: TileMap,
    dt: number,
    speed: number = this.speed,
  ): void {
    if (h.pathIndex >= h.path.length) return;
    const wp = h.path[h.pathIndex]!;
    const tx = wp.x + 0.5;
    const ty = wp.y + 0.5;
    const dx = tx - h.x;
    const dy = ty - h.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.08) {
      h.x = tx;
      h.y = ty;
      h.pathIndex++;
      return;
    }
    const step = speed * dt;
    const nx = h.x + (dx / dist) * Math.min(step, dist);
    const ny = h.y + (dy / dist) * Math.min(step, dist);
    if (map.canOccupy(nx, ny, 0.28)) {
      h.x = nx;
      h.y = ny;
    } else if (map.canOccupy(nx, h.y, 0.28)) {
      h.x = nx;
    } else if (map.canOccupy(h.x, ny, 0.28)) {
      h.y = ny;
    } else {
      h.path = [];
      h.pathIndex = 0;
      h.replanAt = 0;
    }
  }
}

/**
 * Spawns por defecto lejos del spawn del barrio (24.5, 15.5):
 * ≥12 tiles euclídeos, fuera del corredor y=15.5, calles/abierto N/E/S/W (+ SW).
 */
export function defaultHostileSpawns(): Array<{ id: string; x: number; y: number }> {
  return [
    { id: "mute-a", x: 24.5, y: 3.5 }, // N
    { id: "mute-b", x: 38.5, y: 8.5 }, // E (fuera de y=15.5)
    { id: "mute-c", x: 24.5, y: 32.5 }, // S
  ];
}

/** Poseídos parlantes (F4) — conviven con mudos; no reemplazan todos. */
export function defaultPossessedSpawns(): Array<{
  id: string;
  x: number;
  y: number;
}> {
  return [
    { id: "poss-a", x: 8.5, y: 10.5 }, // W
    { id: "poss-b", x: 8.5, y: 32.5 }, // SW
  ];
}

/** Segundos sin daño touch tras spawnThreats / reinicio. */
export const SPAWN_GRACE_SECONDS = 5;

/** Baja la gracia de spawn con dt (nunca negativa). */
export function tickSpawnGrace(spawnGrace: number, dt: number): number {
  if (spawnGrace <= 0) return 0;
  return Math.max(0, spawnGrace - Math.max(0, dt));
}

/** Durante gracia, el player ignora hits de hostiles. */
export function hostileDamageAllowed(spawnGrace: number): boolean {
  return spawnGrace <= 0;
}
