/**
 * Contrato de assets de personaje (vista).
 * Sim es autoridad; el manifest solo describe mesh/clips opcionales.
 * url vacia => silueta placeholder (sin fetch de GLB).
 */

/** Une base (p.ej. Vite BASE_URL) con un path de asset. */
export function joinBaseUrl(base: string, path: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

/** Resuelve path de asset contra import.meta.env.BASE_URL (Pages: /poseidos/). */
export function resolveAssetUrl(path: string): string {
  return joinBaseUrl(import.meta.env.BASE_URL, path);
}

export type CharacterClipRole =
  | "idle"
  | "walk"
  | "run"
  | "primary-attack"
  | "hit"
  | "death";

/** One-shots de vista del player (no loco). Incluye death. */
export const PLAYER_ONESHOT_ROLES = [
  "primary-attack",
  "hit",
  "death",
] as const satisfies readonly CharacterClipRole[];

export type PlayerOneShotRole = (typeof PLAYER_ONESHOT_ROLES)[number];

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
 * Escala world del GLB del player (Soldier / Survivor).
 * 1.5 = 1.2× el 1.25 anterior; se lee como persona vs tiles.
 * Hostiles (POSSESSED / MUTE) usan la misma escala 1.5; looks siguen distintos.
 * maybeAttach aplica manifest.scale.
 */
export const PLAYER_GLTF_SCALE = 1.5;

/**
 * Mesh2Motion drop-in: `public/models/Survivor.glb`.
 * Roles Idle/Walk/Run/Attack/Hit/Death; scale PLAYER_GLTF_SCALE, pies en y≈0.
 * Segundo candidate: boot pide Soldier primero (GLB presente).
 * Gate HTML (#34) sigue si alguien pide este URL ausente.
 */
export const PLAYER_SURVIVOR_MANIFEST: CharacterAssetManifest = {
  id: "survivor",
  url: resolveAssetUrl("models/Survivor.glb"),
  roles: {
    idle: "Idle",
    walk: "Walk",
    run: "Run",
    "primary-attack": "Attack",
    hit: "Hit",
    death: "Death",
  },
  scale: PLAYER_GLTF_SCALE,
  yOffset: 0,
};

/**
 * Three.js examples Soldier.glb (MIT) — placeholder militar de prueba.
 * Clips reales del GLB: Idle / Walk / Run (+ TPose no mapeado).
 * Escala PLAYER_GLTF_SCALE (1.5), yOffset 0: se lee como persona; pies en y≈0.
 * Primer candidate del player (GLB presente). No es el look final survival.
 */
export const PLAYER_SOLDIER_MANIFEST: CharacterAssetManifest = {
  id: "soldier-threejs",
  url: resolveAssetUrl("models/Soldier.glb"),
  roles: {
    idle: "Idle",
    walk: "Walk",
    run: "Run",
  },
  scale: PLAYER_GLTF_SCALE,
  yOffset: 0,
};

/** Survivor drop-in si `hasSurvivor`; si no, Soldier placeholder. */
export function preferSurvivorManifest(
  hasSurvivor: boolean,
): CharacterAssetManifest {
  return hasSurvivor ? PLAYER_SURVIVOR_MANIFEST : PLAYER_SOLDIER_MANIFEST;
}

/** Orden de attach del player: Soldier primero (presente), Survivor si existe. */
export function playerManifestCandidates(): readonly CharacterAssetManifest[] {
  return [PLAYER_SOLDIER_MANIFEST, PLAYER_SURVIVOR_MANIFEST];
}

/** Tint tierra/visor solo en placeholder militar; Survivor GLB ya es el look. */
export function shouldApplySurvivorLook(
  manifest: CharacterAssetManifest,
): boolean {
  return manifest.id !== PLAYER_SURVIVOR_MANIFEST.id;
}

/**
 * Poseídos reusan Soldier.glb con tint distinto (`applyPossessedLook`).
 * Escala 1.5 (misma que el player); look violeta/rojo sigue distinto.
 */
export const POSSESSED_SOLDIER_MANIFEST: CharacterAssetManifest = {
  id: "possessed-soldier",
  url: resolveAssetUrl("models/Soldier.glb"),
  roles: {
    idle: "Idle",
    walk: "Walk",
    run: "Run",
  },
  scale: 1.5,
  yOffset: 0,
};

/**
 * Mutes reusan el mismo Soldier.glb con tint gris-verde (`applyMuteLook`).
 * Misma escala 1.5; boxes × HOSTILE_VISUAL_SCALE solo si GLB pending/fail.
 */
export const MUTE_SOLDIER_MANIFEST: CharacterAssetManifest = {
  id: "mute-soldier",
  url: resolveAssetUrl("models/Soldier.glb"),
  roles: {
    idle: "Idle",
    walk: "Walk",
    run: "Run",
  },
  scale: 1.5,
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
