# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — survivor Mesh2Motion drop-in
- **Qué quedó (esta corrida):**
  - `PLAYER_SURVIVOR_MANIFEST` id `survivor`, url `/models/Survivor.glb` (`resolveAssetUrl`), roles Idle/Walk/Run/Attack/Hit/Death, scale 1.25, yOffset 0.
  - `preferSurvivorManifest(hasSurvivor)` y `playerManifestCandidates()` → `[Survivor, Soldier]`.
  - `worldView` prueba candidates en orden: Survivor OK → skip `applySurvivorLook`; Soldier fallback → tinte tierra/visor.
  - Drop-in: copiar export Mesh2Motion a `public/models/Survivor.glb` (ver `public/models/README.md`).
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** hit flash / attack clip / export Mesh2Motion real a `Survivor.glb`
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
