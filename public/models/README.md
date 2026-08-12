# Modelos de personaje (GLB)

Colocar aqui exports de Mesh2Motion (https://mesh2motion.org/) u otros GLB rigged:

    public/models/<id>.glb

Registrar en un CharacterAssetManifest (`src/render/characterManifest.ts`).
Sin archivos GLB, Poseidos usa silueta box + loco bob. Ver `docs/ASSETS_PIPELINE.md`.

## Survivor.glb (drop-in Mesh2Motion)

El player intenta **Survivor** primero y cae a Soldier si el archivo no existe o el load falla.

| Campo | Valor |
| --- | --- |
| Archivo | `public/models/Survivor.glb` (nombre exacto, S mayúscula) |
| Manifest | `PLAYER_SURVIVOR_MANIFEST` — id `survivor`, scale `1.25`, yOffset `0` |
| Clips | `Idle`, `Walk`, `Run`, `Attack`, `Hit`, `Death` |
| Tint | **No** aplicar `applySurvivorLook` si este GLB carga |

### Pasos drop-in

1. En [Mesh2Motion](https://app.mesh2motion.org/) importar el mesh humanoid, asignar skeleton, exportar **un GLB** con clips `Idle` / `Walk` / `Run` / `Attack` / `Hit` / `Death`.
2. Copiar el export a `public/models/Survivor.glb` (reemplazar si ya hay uno).
3. No hace falta tocar código: `playerManifestCandidates()` ya es `[Survivor, Soldier]`.
4. `bun run dev` (o rebuild Pages). Si el GLB carga, el player usa Survivor **sin** tinte tierra/visor.
5. Si el archivo falta, 404, o no hay clips mapeados → Soldier + `applySurvivorLook` como antes.

## Soldier.glb (placeholder de prueba)

| Campo | Valor |
| --- | --- |
| Origen | [Three.js examples](https://threejs.org/examples/models/gltf/Soldier.glb) (`mrdoob/three.js`) |
| Licencia | MIT (Three.js examples) |
| Uso | Fallback del player + poseídos + mutes — **no** look final survival (placeholder militar) |
| Clips | `Idle`, `Walk`, `Run` (+ `TPose` no mapeado) |
| Manifest | `PLAYER_SOLDIER_MANIFEST` → `/models/Soldier.glb` |
| Calibracion iso | `scale: 1.25`, `yOffset: 0` (pies en y≈0) |

Siguiente: hit flash / attack clip en vista + export Mesh2Motion real en este path.
