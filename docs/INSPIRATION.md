# Inspiración visual / UX — Poseídos

Documento de **técnicas** (no copiar código a ciegas). Referencias clonadas shallow en `/workspace/refs/` (MIT las tres). Landscape generator solo vía web.

Principio del proyecto: **sim primero, render es vista**. Mejoras visuales deben ser baratas, legibles a cámara iso y no acoplar lógica de juego a shaders.

---

## Fuentes

### 1. `three-stylized` (Steve245270533) — MIT · `/workspace/refs/three-stylized`

**Qué aporta:** pradera estilizada Three.js: terreno procedural, césped instanciado, viento en vertex shader, wildflowers deterministas, iluminación con backlight/transmission en punta de hoja.

**Técnicas concretas:**

- Viento coherente en mundo: `sin(dot(pos.xz, windDir) * freq + time * speed)` + onda secundaria perpendicular; máscara `tip²` para flexionar solo la punta.
- Mismo deform en depth/shadow material (evita sombra en pose en reposo).
- Gradiente bottom→top en fragment + diffuse aplanado al up-vector (menos shimmer en ribbons).
- Backscatter estilizado: `view·(-light)` × edge-on × tip mask.
- API de opciones inmutables + `dispose()` explícito de recursos GPU.
- Seeds deterministas para vegetación (alineable con barrio seeded de Poseídos).

**Licencia:** MIT — se puede reutilizar ideas; no pegar el módulo Grass entero sin necesidad (es pesado para un barrio tileado).

### 2. `toys` (mrdoob) — MIT · `/workspace/refs/toys`

**Qué aporta:** demo “toy maker” con **WebGPURenderer + TSL**, material madera procedural, **GTAO** (`three/addons/tsl/display/GTAONode.js`), fog de escena, post (FXAA / AO ligado a ambient vía `builtinAOContext`).

**Técnicas concretas:**

- Pipeline post moderno (TSL) en lugar de EffectComposer clásico.
- GTAO como AO de pantalla; útil cuando haya geometría más densa que cajas.
- Fog de color cálido/terroso + distancias cortas para “estudio” íntimo.
- UX de construcción vs play (modo edición / modo sim) — paralelo futuro a debug vs juego.

**Nota stack:** Poseídos hoy usa WebGL + OrthographicCamera + MeshStandard. Migrar a WebGPU/TSL es P2 (riesgo alto, beneficio cosmético).

### 3. `Skills` (Meng To) — MIT · `/workspace/refs/Skills`

**Qué aporta (priorizado character / UI / game):**

| Skill | Aporte a Poseídos |
| --- | --- |
| `ui/design-first-ui-prompting` | Spec tipográfico: jerarquía, tracking en labels, un acento, iterar 1 variable |
| `web-design/glass-dark-ui` | Tokens dark + panel frosted (`backdrop-filter`), borde sutil, contraste legible |
| `web-design/technical-wireframe-info-layout` | HUD diagnóstico: mono compacto, labels sparse, monochrome + un acento |
| `game-development/build-isometric-arpg` | Vertical slices, sim serializable, no inferir combate desde visual |
| `game-development/build-rigged-game-assets` | Contrato character sheet: body base vs gear, sockets, roles idle/walk/attack/death |
| `game-development/create-game-vfx` | Silueta a distancia de cámara, telegraph vs contact, caps y reduced-motion |
| `game-development/build-game-inventory` | UI de slots/tooltips (ya tenemos inv; patterns de feedback) |
| `codex/implement-fog-of-war` | FOV/fog: no filtrar hostiles no revelados a HUD/target (ya alineado con FOV) |

**Patrones UI a internalizar:** un acento (azul jugador / púrpura poseído), tipografía técnica compacta, paneles glass oscuros sin “neon HUD”, jerarquía needs > controles.

### 4. little-landscapes.vercel.app (web)

**Qué aporta:** landscape generator con toggles de look cinematográfico.

**Técnicas (documentadas desde la UI, sin código fuente local):**

- **Heightmap AO** bakeado (barato offline) vs **GTAO** runtime.
- **2-tone shading** (lectura estilizada, menos PBR).
- Day/night con fog de altura + fog de distancia (noche más cerca/opaca).
- Godrays / sun glow / vignette / stars (capa post).
- Soft shadows + skirt/ground contact.

Para Poseídos: el fog distancia día/noche y la legibilidad 2-tone son lo transferible; GTAO/godrays esperan postpipeline.

---

## Qué aplicar YA vs después

### Aplicar YA (esta corrida / P0)

1. **HUD tipográfico limpio** (Skills: glass-dark + technical labels) — CSS only, cero impacto en sim.
2. **Fog / día-noche más cinemático** — ~~daylight near/far~~ **hecho + dawn/dusk por `phase`** (`fogAtmosphere.ts`).
3. **Silueta player / poseído más legible** — body+head simple + emissive poseído (idea create-game-vfx / character silhouette), sin shaders custom.

### Dejar para después

| Técnica | Por qué esperar |
| --- | --- |
| Césped wind denso / shader tip (three-stylized full) | Ya hay blades instanced acotados; shader tip / wildflowers después |
| GTAO / TSL post (toys) | Requiere WebGPU o EffectComposer; no bloquea F3/F4 |
| Godrays / vignette / stars | Post stack; solo si el look lo pide tras F4 speech |
| Heightmap AO bake | Necesita heightfield real; mundo actual es grid de cajas |
| Character sheets GLB rigged | Fase assets; ahora placeholders box bastan |
| 2-tone toon materials globales | Cambio amplio de materiales; calibrar tras siluetas |
| Inventario glass panels drag/drop | UI inv ya funcional; pulir en slice UX dedicado |

---

## Prioridad ordenada

### P0 — barato, legibilidad, alineado a survival iso

1. HUD glass-dark + mono / tracking (Skills).
2. Fog distancia ↔ día/noche (little-landscapes).
3. Silueta player vs mute vs poseído (VFX/character readability).

### P1 — cuando F3 esté estable / entrando a F4

1. Speech bubbles con tokens glass + acento por tone (ya hay tones; pulir tipografía).
2. Moodles / needs como pills técnicas (no barras arcade ruidosas).
3. Hemispheric / rim light suave noche (lectura de muros sin subir ambient a “lavado”).
4. Outline o edge boost solo en interactuable cercano (puerta/loot).

### P2 — look “producto” / outdoor / post

1. Vegetación wind (técnicas three-stylized, implementación propia acotada).
2. GTAO o SSAO ligero (toys / N8AO) detrás de flag calidad.
3. Godrays / vignette opcionales.
4. Assets rigged + sockets (Skills character sheets).
5. WebGPU/TSL solo si el baseline WebGL está sólido.

---

## Política de código

- Referencias en `/workspace/refs/` son para **estudio**; no importar esas carpetas desde `poseidos`.
- Si se porta un fragmento MIT, citar origen en comentario corto y preferir reescritura mínima al estilo del repo.
- Tests headless (`bun test`) no deben depender de WebGL ni de CSS.

---

## Aplicado en esta corrida

Ver `STATUS.md`. Resumen: HUD tipográfico glass-dark; **fog cinemático dawn/dusk** (`phase`+`daylight`, little-landscapes); silueta player/poseído (body+head); panel diálogo T glass-dark + acento púrpura (trust); **badge + ground ring** por rol (FOV); memoria corta poseído; **moodles pills** needs/HP (ok/warn/critical); **luces cálidas indoor de noche** vs ambient frío outdoor; **floor outdoor tint seeded + fake AO** + **wind grass instanced** cerca del player; **loading diegético** skippable (**GTAO sigue pendiente**).

## Web demos (inspección visual 2026-08-12)

### little-landscapes.vercel.app
- Un scalar **time-of-day** mueve cielo, fog tint/density, ángulo sol/luna y temperatura de luz.
- Noche: ambiente frío + luces cálidas (ventanas/hogueras) = contraste barato y fuerte.
- Fog de distancia teñido al cielo = profundidad en low-poly.
- Ladder de shading: vertical gradient → heightmap AO → GTAO (calidad).
- Mundo en “slab” con borde visible, no void infinito.
- UI: paneles dark wood/leather, labels small-caps gold, ON/OFF coloreado, debug apartado.

### medieval-3d-chess.rork.app (King's Gambit)
- Triple encoding de unidades: **silueta + anillo de suelo + badge flotante con icono**.
- Selección: brilla el elegido, dim al resto; destinos con rings.
- Lighting: pool cálido en el board vs ambiente frío (mismo truco que landscapes).
- HUD 4 esquinas, centro limpio; icon buttons top-right; paneles apilados a la derecha.
- Loading diegético (“Carving 3 of 6 figures…”) + cinematic skippable.
- Lenguaje visual: gold small-caps, dark translucent + borde warm, gold=activo, red=peligro.

### Aplicación a Poseídos (actualizado)
| Prioridad | Idea | Estado |
| --- | --- | --- |
| P0 | Fog día/noche + HUD glass | Hecho (+ dawn/dusk phase) |
| P0 | Silueta torso/cabeza | Hecho |
| P1 | Badge + ground ring por tipo (mudo / poseído / player) | Hecho |
| P1 | Trust/diálogo panel (character sheet flavor) | Hecho (T + trust) |
| P1 | Luces cálidas indoor de noche | Hecho |
| P1 | Moodles / needs pills técnicas | Hecho |
| P2 | Heightmap AO / GTAO / césped wind / loading diegético | Tint+fake AO + wind grass + loading diegético hechos; **GTAO sigue pendiente** |

---

## Generadores 3D / animación (research Daniel 2026-08-12)

Tabla de herramientas útiles para assets de vista. **Ninguna se clona al runtime de Poseídos** salvo consumo de GLB exportado / ideas MIT.

| Herramienta | Qué es | Encaje Poseídos | Prioridad Daniel |
| --- | --- | --- | --- |
| **[Mesh2Motion](https://mesh2motion.org/)** ([app](https://app.mesh2motion.org/), [repo](https://github.com/Mesh2Motion/mesh2motion-app) MIT; assets CC0) | Auto-rig + clips, export GLB | **Personajes** idle/walk/run/attack/hit/death via GLTFLoader + mixer | **P0 — primero** |
| img2threejs (img2threejs.org) | Imagen a Three procedural o mesh GLB | Props / hard-surface | P2 props |
| SeedThree (github.com/SkyeShark/SeedThree) | Arboles/plantas WebGPU + glTF | Vegetacion outdoor | P2 vegetacion |
| EZ-Tree (github.com/dgreenheck/ez-tree, eztree.dev) | Arboles Three.js, GLB/PNG | Complemento wind grass / props | P2 vegetacion |
| Meow-Generator (github.com/ringhyacinth/Meow-Generator) | Gatitos SDF; motion con clips Mesh2Motion CC0 | Demo pipeline; no gameplay | Research / fun |
| Generadores three.js (arboles, L-systems) | Varios OSS | Ideas LOD/instancing | P2+ |
| Skills build-rigged-game-assets | Contrato roles/sockets/colliders | Manifest Poseidos (ASSETS_PIPELINE.md) | Contrato permanente |

### Pipeline práctico (personajes primero)

1. Mesh humanoid (propio o libreria CC0) -> Mesh2Motion (skeleton + clips) -> GLB en public/models/<id>.glb.
2. Manifest CharacterAssetManifest + stub characterGltf / characterAnimator.
3. Vista: si hay URL y load OK -> mostrar GLB; si no -> silueta + locoBob (sim intacta).
4. Props / arboles (img2threejs, SeedThree, EZ-Tree) despues de tener al menos un personaje GLB jugable.

### Decisión

**Daniel priorizó Mesh2Motion para personajes** antes que generadores de props o árboles. Ver `docs/ASSETS_PIPELINE.md`.
