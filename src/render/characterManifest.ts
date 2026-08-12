/**
 * Contrato de assets de personaje (vista).
 * Sim es autoridad; el manifest solo describe mesh/clips opcionales.
 * url vacia => silueta placeholder (sin fetch de GLB).
 */

export type CharacterClipRole =
  | "idle"
  | "walk"
  | "run"
  | "primary-attack"
  | "hit"
  | "death";

/** Roles minimos exigidos por el pipeline / Skills build-rigged-game-assets. */
export const CHARACTER_CLIP_ROLES: readonly CharacterClipRole[] = [
  "idle",
  "walk",
  "run",
  "primary-attack",
  "hit",
  "death",
] as const;

export interface CharacterAssetManifest {
  id: string;
  /**
   * Ruta publica al GLB (p.ej. `/models/survivor.glb`).
   * String vacio o solo whitespace => usar silueta + loco bob.
   */
  url: string;
  /** Mapa rol semantico -> nombre de clip dentro del GLB. */
  roles: Partial<Record<CharacterClipRole, string>>;
  /** Escala uniforme del root GLB. */
  scale: number;
  /** Offset Y local (pies al suelo). */
  yOffset: number;
}

/** Placeholder por defecto: sin URL, juego 100% silueta. */
export const DEFAULT_PLACEHOLDER_MANIFEST: CharacterAssetManifest = {
  id: "placeholder",
  url: "",
  roles: {
    idle: "idle",
    walk: "walk",
    run: "run",
    "primary-attack": "primary-attack",
    hit: "hit",
    death: "death",
  },
  scale: 1,
  yOffset: 0,
};

/**
 * Three.js examples Soldier.glb (MIT) — placeholder militar de prueba.
 * Clips reales del GLB: Idle / Walk / Run (+ TPose no mapeado).
 * Escala 1.25, yOffset 0: presencia vs tiles/hostiles; pies en y≈0.
 * No es el look final survival.
 */
export const PLAYER_SOLDIER_MANIFEST: CharacterAssetManifest = {
  id: "soldier-threejs",
  url: "/models/Soldier.glb",
  roles: {
    idle: "Idle",
    walk: "Walk",
    run: "Run",
  },
  scale: 1.25,
  yOffset: 0,
};

/** true si no hay URL usable (no intentar GLTFLoader). */
export function usesPlaceholderMesh(manifest: CharacterAssetManifest): boolean {
  return !manifest.url || manifest.url.trim().length === 0;
}

/** Nombre de clip para un rol, o undefined si no esta mapeado. */
export function clipNameForRole(
  manifest: CharacterAssetManifest,
  role: CharacterClipRole,
): string | undefined {
  const name = manifest.roles[role];
  if (name == null || name.trim().length === 0) return undefined;
  return name;
}

/** Valida campos basicos del manifest (id + scale finito). */
export function isValidManifest(manifest: CharacterAssetManifest): boolean {
  if (!manifest.id || manifest.id.trim().length === 0) return false;
  if (!Number.isFinite(manifest.scale) || manifest.scale <= 0) return false;
  if (!Number.isFinite(manifest.yOffset)) return false;
  if (typeof manifest.url !== "string") return false;
  return true;
}
