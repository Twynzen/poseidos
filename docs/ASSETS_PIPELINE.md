# Pipeline de assets — Poseídos

## Principio

**La simulación es la autoridad.** Mesh, skinning y clips de animación son **vista**.

| Capa | Responsabilidad |
| --- | --- |
| Sim (`PlayerSim`, combat, AI, FOV) | Posición, HP, estado, hitboxes, daño, LOS |
| Vista (`worldView`, loco bob, GLB) | Silueta / mesh, bob procedural, `AnimationMixer` |
| Colliders gameplay | Cajas / tiles de sim — **no** derivados del skeleton skinned |

No inferir combate, colisión ni “estoy atacando” desde un clip. El rol de animación sigue a la sim (o a un stub de estado de vista), nunca al revés.

---

## Pipeline Mesh2Motion (personajes)

Orden práctico que Daniel priorizó (2026-08-12):

1. **Modelar u obtener** un mesh humanoid (GLB/GLTF estático o low-poly propio).
2. **[Mesh2Motion](https://mesh2motion.org/)** — app [app.mesh2motion.org](https://app.mesh2motion.org/), repo [Mesh2Motion/mesh2motion-app](https://github.com/Mesh2Motion/mesh2motion-app) (MIT; assets CC0):
   - Importar mesh → asignar skeleton humanoid → ajustar huesos.
   - Elegir clips: idle / walk / run / attack / hit / death (y los que haga falta).
   - Exportar **un GLB** con mesh + skeleton + clips.
3. **Poseídos runtime:** `GLTFLoader` (`three/addons`) + `AnimationMixer` sobre el root del personaje en `worldView`.
4. **Contrato de roles** alineado a Skills `build-rigged-game-assets` (character sheet: roles semánticos, no nombres de clip crudos en gameplay).

> No se clona ni se embebe Mesh2Motion en el runtime. Es herramienta **externa** de autoría.

---

## Roles mínimos (character)

| Rol (`CharacterClipRole`) | Uso |
| --- | --- |
| `idle` | Quieto / respiración |
| `walk` | Locomoción normal |
| `run` | Sprint |
| `primary-attack` | Melee / ataque principal |
| `hit` | Reacción a daño |
| `death` | Muerte (no-loop; sticky hasta respawn/clear) |

El manifest mapea `rol → nombreDeClip` dentro del GLB (los nombres de Mesh2Motion pueden diferir; el mapa es el adaptador).

---

## Cómo añadir un asset

1. Exportar desde Mesh2Motion → copiar a `public/models/<id>.glb`.
2. Registrar en un `CharacterAssetManifest` (ver `src/render/characterManifest.ts`):
   - `id`, `url` (p.ej. `/models/<id>.glb`), `roles`, `scale`, `yOffset`.
3. Pasar el manifest a la vista. Player: `playerManifestCandidates()` en `worldView` prueba Survivor y cae a Soldier.
4. Si `url` está vacía o el load falla → siguiente candidate; si ninguno carga → silueta box + `locoBob`.

```ts
import { PLAYER_SURVIVOR_MANIFEST } from "../src/render/characterManifest";

PLAYER_SURVIVOR_MANIFEST.id; // "survivor"
PLAYER_SURVIVOR_MANIFEST.url; // resolveAssetUrl("models/Survivor.glb")
PLAYER_SURVIVOR_MANIFEST.roles; // Idle / Walk / Run / Attack / Hit / Death
PLAYER_SURVIVOR_MANIFEST.scale; // 1.25
PLAYER_SURVIVOR_MANIFEST.yOffset; // 0
```

---

## Estado actual (código)

| Pieza | Estado |
| --- | --- |
| Silueta body+head | Fallback (player / mute / poseído si GLB pending/fail) |
| `locoBob.ts` | Procedural idle/walk/sprint — solo si no hay GLB |
| `meleeSwing.ts` | Fallback procedural 0.25s si `!hasRole("primary-attack")` (Soldier / silueta); Survivor con Attack no lo usa |
| `characterManifest.ts` | Contrato + **`PLAYER_SURVIVOR_MANIFEST`** + Soldier/poseído/mute + `preferSurvivorManifest` / `playerManifestCandidates` |
| `characterAnimator.ts` | Estado de roles mixer-agnóstico (headless) |
| `characterGltf.ts` | `loadCharacterGltf` / `maybeAttachCharacterGltf` (browser) |
| `characterMixer.ts` | `bindMixer` + crossfade idle↔walk↔run; `buildRoleClipMap` headless; `hasRole(role)` si el clip existe |
| `possessedLook.ts` | Tint oscuro + acento rojo/violeta emisivo (clone mats) |
| `muteLook.ts` | Tint gris-verde enfermo (clone mats; sin rojo/violeta) |
| `hostileLoco.ts` | Delta mapa → idle/walk/run (mute + poseídos; mismos clips Soldier) |
| GLB en `public/models/` | **`Survivor.glb`** drop-in (opcional) + **`Soldier.glb`** (MIT) fallback player + poseídos + mutes |
| Autogenerar en Mesh2Motion | **Fuera de slice** — herramienta externa, no CI |

Player prueba `playerManifestCandidates()` = `[PLAYER_SURVIVOR_MANIFEST, PLAYER_SOLDIER_MANIFEST]`. Si `Survivor.glb` carga → **sin** `applySurvivorLook`. Si falta o falla → Soldier + tinte tierra/gris + acento visor. Ambos fail → silueta + loco bob.
Melee: si el mixer **no** mapea `primary-attack` (Soldier / silueta), `worldView` dispara `meleeSwing` (pitch/yawBias en `locoRoot.rotation.x/z`). Si Survivor trae `Attack`, solo el one-shot del GLB.
Poseídos reusan el mismo Soldier via `SkeletonUtils.clone` + `applyPossessedLook`; loco Idle/Walk/Run por delta en `syncHostiles`.
Mutes reusan el mismo load (`SkeletonUtils.clone` + `applyMuteLook` + mixer + `hostileLocoFromDelta`). Un solo `loadCharacterGltf` compartido mute+poseído. Boxes × `HOSTILE_VISUAL_SCALE` (1.5) solo si GLB pending/fail.
Yaw GLB: `playerGltfYawFromMove` / `hostileYaw` con ejes vivos (no facing cardinal).
Siguiente: export Mesh2Motion real a `public/models/Survivor.glb`.

## Survivor drop-in

| Campo | Valor |
| --- | --- |
| Archivo | `public/models/Survivor.glb` (opcional hasta el export) |
| Manifest | `PLAYER_SURVIVOR_MANIFEST` — id `survivor`, scale `1.25`, yOffset `0` |
| Clips | `Idle`, `Walk`, `Run`, `Attack`, `Hit`, `Death` |
| Orden | `playerManifestCandidates()` → Survivor, luego Soldier |
| Tint | Skip `applySurvivorLook` si este candidate gana |

## Soldier de prueba

| Campo | Valor |
| --- | --- |
| Archivo | `public/models/Soldier.glb` |
| Origen | https://threejs.org/examples/models/gltf/Soldier.glb (MIT) |
| Clips | `Idle`, `Walk`, `Run` (+ `TPose` no mapeado) |
| Manifest player | `PLAYER_SOLDIER_MANIFEST` — scale `1.25`, yOffset `0` |
| Manifest poseído | `POSSESSED_SOLDIER_MANIFEST` — mismo url, id `possessed-soldier`, scale `1.25` |
| Manifest mute | `MUTE_SOLDIER_MANIFEST` — mismo url, id `mute-soldier`, scale `1.25` |
| Facing | Soldier walk −Z local; yaw = atan2 + PLAYER_GLTF_YAW_OFFSET (π). S/+Z → π, no moonwalk. Visual usa ejes vivos, no snap cardinal. |
