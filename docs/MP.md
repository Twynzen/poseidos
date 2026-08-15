# MP — notas prep F7 (stub)

Objetivo: **2–4 jugadores**, host authoritative, cuando A–H estén estables.
Esta corrida solo deja el **contrato headless** (`src/net/session.ts`) sin sockets ni red.
`MemoryLobby` (`src/net/lobby.ts`) gestiona salas 2–4 en memoria, sin sockets.

## Modelo autoritativo

- La verdad del mundo vive en el **server-sim** (mismo código headless que ya corre en tests).
- Cada cliente envía **inputs** (`NetInput`); el host aplica tick y emite **snapshots** (`NetSnapshot`).
- Clientes **predicen** movimiento localmente para sensación, pero **corrigen** al snapshot del host.
- `LocalLoopbackSession` es el stub: un solo jugador en proceso, sin WebSocket — sirve para roundtrip de tipos y tick de inputs.

## Qué se replica (autoritativo)

| Dominio | Sync | Notas |
| --- | --- | --- |
| Player pos / facing | sí | xy (+ facing más adelante) |
| Clock phase | sí | día/noche compartido |
| Hostiles | sí | id, xy, mode (wander/chase/investigate); count derivado |
| Doors | sí (F7) | open/close + barricadas |
| Containers | sí (F7) | contenido / locks al interactuar |
| Possession trust / gates | sí | trust + TTLs + lastApplied / lastRejected / gateLine / moodBias / toneBias / memorySummary (ya validados); clientes no ven intents |

## Qué NO se replica (local)

- Render Three.js, meshes, cámara.
- FOV / LOS visual del cliente (el server puede validar LOS para AI/combat; el cono de dibujo es local).
- HUD, speech bubbles layout, audio spatialización fina.
- Predicción cosméticas (partículas, tracers fade).

## Possession gates en server

Principio Vivant/Dystopia se mantiene en MP:

1. Diálogo / LLM **proponen** intent (cliente o host UI).
2. **Gates de código en el server-sim** aplican o rechazan (trust, distancia, hostilidad, TTL).
3. El snapshot solo refleja el **efecto ya gated** (pacify, chase, noise, etc.).
4. Ningún cliente puede forzar calm/aggro bypassing gates.

Wire `possession: NetPossessionSnap[]` — por poseído: `id`, `trust`, `pacifiedLeft`, `speedBumpLeft`, `speedBumpMul` (1 si inactivo), `pacified` (trust OR TTL), `lastApplied?` / `lastRejected?` (`GateTag[]` ya validados; omitidos si vacíos), `gateLine?` (última línea ya validada `gates.gateLine`; omitida si vacía; cap `GATE_LINE_MAX_LEN`; no se reformatea), `moodBias?` (`PossessionTone` ya validado `speech.getMoodBias`; omitido si vacío / null / desconocido; distinto de `ShortMemory.toneBias`), `toneBias?` (`PossessionTone` ya validado `memory.toneBias`; omitido si vacío / null / desconocido; distinto de speech `moodBias`), `memorySummary?` (resumen compacto ya validado `formatMemorySummary(memory.recent)`; omitido si vacío / null / whitespace; cap `MEMORY_SUMMARY_MAX_LEN`; distinto de `toneBias`). Collector: `collectPossessionFrom(ledger, gates, ids?, moodBiasOf?, toneBiasOf?, memoryOf?)`.

## Inputs ack / client predict (stub)

- Wire: `NetSnapshot.seq` y `NetSnapshot.ack` — en este stub **`ack === seq`** (último input aplicado en host).
- Cliente: `ClientPredictBuffer` (`src/net/predict.ts`):
  1. `pushMove(dx,dy,dt)` → genera `NetInput` (seq monótono), aplica predict local, encola `{seq,dx,dy,dt}`.
  2. Tras snapshot: `reconcile(snap)` drop `pending` con `seq <= ack`, resetea a `playerX/Y`, re-aplica pending restantes con sus `dt`.
- Host stub: `LocalLoopbackSession.lastSeq` → `buildNetSnapshot({ seq })` rellena ambos `seq` y `ack`.

## Stub actual vs F7 real

| Ahora (headless) | F7 |
| --- | --- |
| `NetInput` / `NetSnapshot` + `ack===seq` | mismos tipos |
| `LocalLoopbackSession` + `MemoryLobby` + `ClientPredictBuffer` | host session + sockets |
| `buildNetSnapshot` + doors/barricades/containers + `possession[]` + ack | mismos campos |
| sin red | WebSocket u otro transporte |

Ver checklist corta en `docs/ROADMAP.md` § F7.
