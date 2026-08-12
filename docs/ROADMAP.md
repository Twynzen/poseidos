# Roadmap operativo — Poseídos

Orden estricto (Daniel: primero complejidad tipo PZ, luego poseídos).

1. **F0 Tooling** — Vite/TS/Three + vitest + STATUS
2. **F1 World** — chunks, tiles, colisión, puertas, cámara iso, day/night
3. **F2 Survival** — needs, inventario, loot, eat/drink/sleep
4. **F3 Threat (muda)** — pathfinding, percepción, combat + noise
5. **F4 Poseídos** — hablan, estados de posesión, memoria/trust
6. **F5 Diálogo→acción** — UI + gates
7. **F6 LLM** — opcional con fallback
8. **F7 MP** — después (ver checklist abajo)

Cada corrida de rutina: una subtarea medible dentro de la fase activa.

---

## F7 — MP light (prep → host)

Notas de diseño: `docs/MP.md`. Stub headless actual: `src/net/session.ts` + `src/net/lobby.ts` + `src/net/predict.ts`.

Checklist corta (orden):

- [x] **Contrato stub** — `NetInput` / `NetSnapshot` + `LocalLoopbackSession` (sin red)
- [x] **Lobby stub** — crear/unir sala en memoria (2–4 slots), sin sockets aún
- [x] **Snapshot wire** — doors/containers [x]; possession gated state [x]
- [x] **Inputs ack** — seq/ack, reconcile client predict vs host snapshot
- [ ] **Transporte** — WebSocket (o equivalente) host authoritative
- [ ] **Playtest 2P** — move + doors + un hostile sync

No empezar transporte real hasta survival + gates estables en 1P.
