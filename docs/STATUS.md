# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — possessed loco Idle/Walk/Run
- **Qué quedó (esta corrida):**
  - `hostileLoco.ts`: `hostileLocoFromDelta(dx,dz,dt)` → idle (≤0.02) / run (≥3.5 u/s) / walk; dt≤0 → idle.
  - `syncHostiles(dt)`: last mapa (x,y) por poseído; dx/dz (y→z); `setLocomotion` + animator + mixer Idle/Walk/Run (`POSSESSED_SOLDIER_MANIFEST`); 1er frame idle; limpia maps al remover; mutes boxes.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** mute GLB o Mesh2Motion propio
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
