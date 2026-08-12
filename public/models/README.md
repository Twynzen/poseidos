# Modelos de personaje (GLB)

Colocar aqui exports de Mesh2Motion (https://mesh2motion.org/) u otros GLB rigged:

    public/models/<id>.glb

Registrar en un CharacterAssetManifest (`src/render/characterManifest.ts`).
Sin archivos GLB, Poseidos usa silueta box + loco bob. Ver `docs/ASSETS_PIPELINE.md`.

## Soldier.glb (placeholder de prueba)

| Campo | Valor |
| --- | --- |
| Origen | [Three.js examples](https://threejs.org/examples/models/gltf/Soldier.glb) (`mrdoob/three.js`) |
| Licencia | MIT (Three.js examples) |
| Uso | Player animado de prueba — **no** look final survival (placeholder militar) |
| Clips | `Idle`, `Walk`, `Run` (+ `TPose` no mapeado) |
| Manifest | `PLAYER_SOLDIER_MANIFEST` → `/models/Soldier.glb` |
| Calibracion iso | `scale: 1`, `yOffset: 0` (bbox ~1.83m, pies en y≈0) |

Siguiente: export propio Mesh2Motion / poseídos GLB + footsteps.
