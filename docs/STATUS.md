# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — low-HP heartbeat WebAudio SFX
- **Qué quedó (esta corrida):**
  - `heartbeat.ts`: `HEARTBEAT_HP_RATIO=0.35`; `heartbeatIntervalSec` null si hp≤0 o ratio≥0.35; si no lerp 1.2s→0.45s. `tickHeartbeat` → `{beat}`.
  - `heartbeatPlayer.ts`: ~55Hz sine 80ms, gain 0.08. Headless: `shouldPlayHeartbeatSfx` / `heartbeatBeepSpec`; mute → no-op. AudioContext lazy (primer play audible).
  - Cableado: `syncHeartbeat` cada frame con HP del player + `ambient.muted`. Export barrel audio.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion Survivor.glb / real samples
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
