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
3. Pasar el manifest a la vista (player: `PLAYER_SOLDIER_MANIFEST` en `worldView`).
4. Si `url` está vacía o el load falla → silueta box + `locoBob` (sin romper el juego).

```ts
import type { CharacterAssetManifest } from "../src/render/characterManifest";

const survivor: CharacterAssetManifest = {
  id: "survivor",
  url: "/models/survivor.glb",
  roles: {
    idle: "Idle",
    walk: "Walk",
    run: "Run",
    "primary-attack": "Attack",
    hit: "Hit",
    death: "Death",
  },
  scale: 1,
  yOffset: 0,
};
```

---

## Estado actual (código)

| Pieza | Estado |
| --- | --- |
| Silueta body+head | Fallback (player si GLB falla; mute siempre; poseído si GLB pending/fail) |
| `locoBob.ts` | Procedural idle/walk/sprint — solo si no hay GLB |
| `characterManifest.ts` | Contrato + placeholder + **`PLAYER_SOLDIER_MANIFEST`** + **`POSSESSED_SOLDIER_MANIFEST`** |
| `characterAnimator.ts` | Estado de roles mixer-agnóstico (headless) |
| `characterGltf.ts` | `loadCharacterGltf` / `maybeAttachCharacterGltf` (browser) |
| `characterMixer.ts` | `bindMixer` + crossfade idle↔walk↔run; `buildRoleClipMap` headless |
| `possessedLook.ts` | Tint oscuro + acento rojo/violeta emisivo (clone mats) |
| `hostileLoco.ts` | Delta mapa → idle/walk/run (poseídos; mismos clips Soldier) |
| GLB en `public/models/` | **`Soldier.glb`** (Three.js examples, MIT) — player + poseídos |
| Autogenerar en Mesh2Motion | **Fuera de slice** — herramienta externa, no CI |

Player usa Soldier de prueba (placeholder militar). `applySurvivorLook` tinte tierra/gris + acento visor (clone mats) hasta GLB propio. Load fail → silueta + loco bob.
Poseídos reusan el mismo Soldier via `SkeletonUtils.clone` + `applyPossessedLook`; loco Idle/Walk/Run por delta en `syncHostiles`. Mutes siguen boxes × `HOSTILE_VISUAL_SCALE`.
Yaw GLB: `playerGltfYawFromMove` / `hostileYaw` con ejes vivos (no facing cardinal).
Siguiente: mute GLB o Mesh2Motion propio.

## Soldier de prueba

| Campo | Valor |
| --- | --- |
| Archivo | `public/models/Soldier.glb` |
| Origen | https://threejs.org/examples/models/gltf/Soldier.glb (MIT) |
| Clips | `Idle`, `Walk`, `Run` (+ `TPose` no mapeado) |
| Manifest player | `PLAYER_SOLDIER_MANIFEST` — scale `1.25`, yOffset `0` |
| Manifest poseído | `POSSESSED_SOLDIER_MANIFEST` — mismo url, id `possessed-soldier`, scale `1.25` |
| Facing | Soldier +Z; yaw = `atan2(faceX, faceZ)` (W → −Z → π) |
