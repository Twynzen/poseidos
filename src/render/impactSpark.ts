/**
 * Spark de impacto al extremo del tracer — headless.
 * Envelope ease-out sine: cos(u · π / 2) = 1→0 en IMPACT_SPARK_DURATION
 * (el complemento del ease-out sine sin(t · π / 2) de meleeSwing).
 * worldView aplica intensidad a esfera aditiva + PointLight en (x, y).
 */

import { TRACER_HEIGHT } from "./tracers";

/** Duración del spark (s). 0.22 × 1.15 para leer de noche. */
export const IMPACT_SPARK_DURATION = 0.253;
/** Intensidad pico (u=0). 1 × 1.15 para leer de noche. Opacity del mesh = intensity. */
export const IMPACT_SPARK_PEAK = 1.15;
/** Radio de la esfera aditiva (tiles). 0.1125 × 1.15 para leer de noche. */
export const IMPACT_SPARK_RADIUS = 0.129375;
/** Pico de PointLight en worldView. 1.75 × 1.15 para leer de noche. */
export const IMPACT_SPARK_LIGHT_PEAK = 2.0125;

export interface ImpactSparkState {
  /** Segundos transcurridos del spark actual. */
  age: number;
  /** True mientras el spark no ha terminado. */
  active: boolean;
  /** Posición mundo X (plano mapa). */
  x: number;
  /** Posición mundo Y (plano mapa → Three z). */
  y: number;
}

export interface ImpactSparkOutput {
  /** Pico IMPACT_SPARK_PEAK al trigger; ease-out sine hasta 0. */
  intensity: number;
  active: boolean;
  x: number;
  y: number;
}

export function createImpactSpark(): ImpactSparkState {
  return { age: 0, active: false, x: 0, y: 0 };
}

/** Idle spark world X. createImpactSpark x=0. Three default origin leftover. */
export const IMPACT_SPARK_POS_X_SPAWN = 0;
/** Idle spark Three Y = TRACER_HEIGHT. Three default 0 = leftover. */
export const IMPACT_SPARK_POS_Y_SPAWN = TRACER_HEIGHT;
/** Idle spark world Y → Three Z. createImpactSpark y=0. Three default origin leftover. */
export const IMPACT_SPARK_POS_Z_SPAWN = 0;

/**
 * Intensity/opacity que lee applyImpactSparkVisual (look fresco o vivo).
 * leftover ctor Three opacity 1 / mid-spark ≠ fresco (inactive 0).
 */
export function impactSparkIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * Active/visible que lee applyImpactSparkVisual (look fresco o vivo).
 * leftover mid-spark active ≠ fresco (inactive).
 */
export function impactSparkActiveFromLook(active: boolean): boolean {
  return active;
}

/**
 * Pos X mundo que lee applyImpactSparkVisual (ox fresco o vivo).
 * leftover ctor origin 0 / far ≠ pos fresco (idle 0).
 */
export function impactSparkPosXFromLook(ox: number): number {
  return ox;
}

/**
 * Pos Y Three que lee applyImpactSparkVisual (TRACER_HEIGHT fresco o vivo).
 * leftover ctor origin 0 ≠ pos fresco (TRACER_HEIGHT).
 */
export function impactSparkPosYFromLook(oy: number): number {
  return oy;
}

/**
 * Pos Z Three (mapa y) que lee applyImpactSparkVisual (oz fresco o vivo).
 * leftover ctor origin 0 / far ≠ pos fresco (idle 0).
 */
export function impactSparkPosZFromLook(oz: number): number {
  return oz;
}

/**
 * R / softReset: intensity fresco (inactive 0).
 * WorldView nace opacity/apply AfterRestart; leftover ctor Three 1 no filtra.
 * apply/tick lee impactSparkIntensityFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkIntensityAfterRestart(): number {
  return impactSparkIntensityFromLook(0);
}

/**
 * R / softReset: active fresco (false).
 * WorldView nace visible/apply AfterRestart; leftover mid-spark no filtra.
 */
export function impactSparkActiveAfterRestart(): boolean {
  return impactSparkActiveFromLook(false);
}

/**
 * R / softReset: pos X fresco (idle 0).
 * WorldView nace `impactMesh.position.set(impactSparkPosXAfterRestart(), …)`;
 * leftover ctor origin 0,0 no filtra.
 * apply lee impactSparkPosXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkPosXAfterRestart(
  ox = IMPACT_SPARK_POS_X_SPAWN,
): number {
  return impactSparkPosXFromLook(ox);
}

/**
 * R / softReset: pos Y fresco (TRACER_HEIGHT).
 * WorldView nace `impactMesh.position.set(…, impactSparkPosYAfterRestart(), …)`;
 * leftover ctor origin 0 no filtra.
 */
export function impactSparkPosYAfterRestart(
  oy = IMPACT_SPARK_POS_Y_SPAWN,
): number {
  return impactSparkPosYFromLook(oy);
}

/**
 * R / softReset: pos Z fresco (idle 0).
 * WorldView nace `impactMesh.position.set(…, impactSparkPosZAfterRestart())`;
 * leftover ctor origin 0 no filtra.
 */
export function impactSparkPosZAfterRestart(
  oz = IMPACT_SPARK_POS_Z_SPAWN,
): number {
  return impactSparkPosZFromLook(oz);
}

/** Idle impact decay. Ctor impactLight.decay IMPACT_SPARK_LIGHT_DECAY 1.74 = fresco. Mid-life leftover ≠ fresco. */
export const IMPACT_SPARK_LIGHT_DECAY_SPAWN = 1.74;

/**
 * Decay que leería applyImpactSparkVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle IMPACT_SPARK_LIGHT_DECAY).
 * apply/tick no escribe decay (ctor constant).
 */
export function impactSparkLightDecayFromLook(decay: number): number {
  return decay;
}

/**
 * R / softReset: decay fresco (idle IMPACT_SPARK_LIGHT_DECAY).
 * WorldView nace impactLight.decay AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe decay (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkLightDecayAfterRestart(): number {
  return impactSparkLightDecayFromLook(IMPACT_SPARK_LIGHT_DECAY_SPAWN);
}

/** Idle impact color. Ctor impactLight.color IMPACT_SPARK_LIGHT_COLOR 0xffef93 = fresco. Mid-life leftover ≠ fresco. */
export const IMPACT_SPARK_LIGHT_COLOR_SPAWN = 0xffef93;

/**
 * Color que leería applyImpactSparkVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle IMPACT_SPARK_LIGHT_COLOR 0xffef93).
 * apply/tick no escribe color (ctor constant).
 */
export function impactSparkLightColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle IMPACT_SPARK_LIGHT_COLOR 0xffef93).
 * WorldView nace impactLight.color AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkLightColorAfterRestart(): number {
  return impactSparkLightColorFromLook(IMPACT_SPARK_LIGHT_COLOR_SPAWN);
}

/** Idle impact distance. Ctor impactLight.distance IMPACT_SPARK_LIGHT_DISTANCE 1.8 = fresco. Mid-life leftover ≠ fresco. */
export const IMPACT_SPARK_LIGHT_DISTANCE_SPAWN = 1.8;

/**
 * Distance que leería applyImpactSparkVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle IMPACT_SPARK_LIGHT_DISTANCE 1.8).
 * apply/tick no escribe distance (ctor constant).
 */
export function impactSparkLightDistanceFromLook(distance: number): number {
  return distance;
}

/**
 * R / softReset: distance fresco (idle IMPACT_SPARK_LIGHT_DISTANCE 1.8).
 * WorldView nace impactLight.distance AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe distance (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkLightDistanceAfterRestart(): number {
  return impactSparkLightDistanceFromLook(IMPACT_SPARK_LIGHT_DISTANCE_SPAWN);
}

/** Idle impact mesh color. Ctor impactMat.color IMPACT_SPARK_COLOR 0xffef93 = fresco. Mid-life leftover ≠ fresco. */
export const IMPACT_SPARK_COLOR_SPAWN = 0xffef93;

/**
 * Color que leería applyImpactSparkVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle IMPACT_SPARK_COLOR 0xffef93).
 * apply/tick no escribe color (ctor constant).
 */
export function impactSparkColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle IMPACT_SPARK_COLOR 0xffef93).
 * WorldView nace impactMat.color AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkColorAfterRestart(): number {
  return impactSparkColorFromLook(IMPACT_SPARK_COLOR_SPAWN);
}

/** DepthWrite del impact spark mesh. Ctor impactMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const IMPACT_SPARK_DEPTH_WRITE = false;

/** Idle impact spark mesh depthWrite. Ctor impactMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const IMPACT_SPARK_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería applyImpactSparkVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * apply/tick no escribe depthWrite (ctor constant).
 */
export function impactSparkDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace impactMat.depthWrite AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function impactSparkDepthWriteAfterRestart(): boolean {
  return impactSparkDepthWriteFromLook(IMPACT_SPARK_DEPTH_WRITE_SPAWN);
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar el spark ni pintarlo.
 * Vivo (incl. F9 load-vivo): tick/intensity de hoy.
 * Ya oculto = no-op; gameOver no inventa spark.
 */
export function impactSparkApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** Reinicia el spark desde t=0 en (x, y) (re-trigger a mitad = nuevo impacto). */
export function triggerImpactSpark(
  state: ImpactSparkState,
  x: number,
  y: number,
): void {
  state.age = 0;
  state.active = true;
  state.x = x;
  state.y = y;
}

/**
 * Ease-out sine 1→0: cos(u · π / 2).
 * u=0 → 1 (pico); u=1 → 0.
 */
function easeOutSine(u: number): number {
  const x = Number.isFinite(u) ? Math.max(0, Math.min(1, u)) : 0;
  return Math.cos((x * Math.PI) / 2);
}

/**
 * Avanza el spark y devuelve intensidad + posición (determinista para tests).
 * Mutates `state`. dt≤0 no avanza age.
 * gameOver → skip tick / hide (intensity 0); no inventa spark.
 */
export function tickImpactSpark(
  state: ImpactSparkState,
  dt: number,
  gameOver = false,
): ImpactSparkOutput {
  if (!impactSparkApplies(gameOver)) {
    return {
      intensity: 0,
      active: false,
      x: state.x,
      y: state.y,
    };
  }
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (state.active) {
    state.age += safeDt;
    if (state.age >= IMPACT_SPARK_DURATION) {
      state.age = IMPACT_SPARK_DURATION;
      state.active = false;
      return {
        intensity: 0,
        active: false,
        x: state.x,
        y: state.y,
      };
    }
  }
  if (!state.active) {
    return {
      intensity: 0,
      active: false,
      x: state.x,
      y: state.y,
    };
  }

  const u = state.age / IMPACT_SPARK_DURATION;
  return {
    intensity: easeOutSine(u) * IMPACT_SPARK_PEAK,
    active: true,
    x: state.x,
    y: state.y,
  };
}
