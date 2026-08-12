# Arquitectura — Poseídos (sandbox tipo PZ → twist poseídos)

Escala real. No es un jam de un fin de semana. Primero se construye un **motor/sandbox inspirado en Project Zomboid** (isométrico/2.5D survival sim). Después se diferencia: la amenaza principal son **personas poseídas que hablan**, y el diálogo puede alterar comportamiento.

Principio: **simulación primero, horror con voz después**. El render (Three.js) es la vista; la verdad vive en sistemas de juego testeables.

---

## Capas (de abajo hacia arriba)

| Capa | Responsabilidad | Analogía PZ |
| --- | --- | --- |
| **A. Kernel** | Loop, tiempo (tick/día/noche), RNG seeded, save/load slots, config | engine + sandbox options |
| **B. World** | Grid/chunks, tiles (suelo, pared, puerta, ventana, mueble), colisión, FOV/line-of-sight, indoor/outdoor | map + IsoGrid |
| **C. Items / Inventario** | Items con peso/condición, contenedores, loot tables, transfer | inventory |
| **D. Body / Needs** | Salud, hambre, sed, cansancio, heridas, temperatura (v1 simple) | Moodles / body |
| **E. Craft / Build** | Recetas, barricadas, desmontar muebles (v1 reducido) | crafting / carpentry |
| **F. AI entities** | Pathfinding (A*), estados (idle/wander/chase/search), percepción | zombies + animals |
| **G. Combat** | Hits, ruido, armas cuerpo/rango básico | combat |
| **H. Meta** | UI (inv, crafting, map), audio hooks, debug overlays | UI |
| **I. Possession (diferenciador)** | Poseídos parlantes, memoria, trust, banco de líneas, gates de acción, LLM opcional | *(no existe en PZ — esto es nuestro)* |
| **J. Net (después)** | Server-authoritative, sync de chunks/entidades | MP |

**Regla dura:** las capas A–H deben poder correr *headless* (sin Three) para tests. Three solo presenta.

---

## Fases de producto (roadmap largo)

### Fase 0 — Tooling
Vite + TS + Three, CI local (`build`), `docs/STATUS.md`, harness de test unitario (vitest) para sim.

### Fase 1 — World kernel
- Chunked tilemap (ej. 32×32 chunks), tipos de tile mínimos
- Cámara iso/ortográfica siguiendo al player
- Colisión AABB/tile, puertas open/close
- Día/noche que afecta visión/spawn más adelante

### Fase 2 — Survival loop
- Player needs (hambre/sed/cansancio)
- Inventario + loot en contenedores
- Comer/beber/dormir (sleep skip time)
- Un “día” jugable sin combat aún

### Fase 3 — Amenaza muda (baseline tipo zombie)
- Entidades hostiles mudas con pathfinding + percepción por ruido/visión
- Combat básico + ruido que atrae
- Esto **calibra** el sandbox estilo PZ antes del twist

### Fase 4 — Poseídos (el juego de verdad)
- Reemplazar/extender hostiles: **humanos poseídos**
- Voice lines (banco determinista), speech bubbles / subtítulos
- Estados: lucidez / lucha interna / pleno demonio
- Memoria corta + reputación con el jugador

### Fase 5 — Diálogo → comportamiento
- UI de conversación
- Intents del jugador → propuesta de acción del poseído
- **Gates de código** (trust, distancia, hostilidad) aplican o rechazan
- Principio Vivant/Dystopia: diálogo propone; código decide

### Fase 6 — LLM opcional
- Mismo contrato tipo `ai-req` / `ai-resp` o API
- Fallback siempre al banco de líneas
- Nunca autoridad ciega sobre combate/trust crítico

### Fase 7 — MP light
- Host authoritative, 2–4 jugadores
- Solo cuando A–E estén estables
- Prep: `docs/MP.md` + stub headless `src/net/session.ts` (sin sockets)

---

## Estructura de carpetas (objetivo)

```text
poseidos/
  src/
    core/       # clock, rng, events, save
    world/      # tiles, chunks, los, pathfinding
    items/
    actors/     # player, body, needs
    ai/         # path, senses, fsm (mudos + poseídos)
    combat/
    possession/ # speech, memory, dialogue gates, llm bridge
    render/     # three scene, sprites/meshes, camera
    ui/
    net/        # MP stub (session) → F7 sockets later
  tests/        # vitest — sim sin WebGL
  docs/
    ARCHITECTURE.md
    VISION.md
    STATUS.md
    ROADMAP.md
```

---

## Qué NO hacemos (aún / nunca)

- No clonar assets/código de Project Zomboid (legal + inútil).
- No emular Knox County entero: **un pueblo/barrio procedural o hand-authored chico**.
- No Bandits2/Lua/Kahlua: sistema propio en TS.
- No LLM sin fallback.
- No MP antes de survival loop sólido.

---

## Definition of Done por fase

Cada fase termina con: build verde + demo jugable del slice + notas en STATUS + tests de la capa de sim tocada.

La rutina de build continuo avanza **una subtarea de la fase actual** por corrida, no salta a Poseídos (Fase 4) hasta que Fase 1–2 estén mínimamente firmes (mundo + survival loop). Combat muda (Fase 3) puede solaparse ligero con el final de Fase 2.
