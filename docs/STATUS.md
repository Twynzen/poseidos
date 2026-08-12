# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — zoom iso (ISO_FRUSTUM 10) + scale Soldier 1.25
- **Qué quedó (esta corrida):**
  - `src/render/cameraConfig.ts`: `ISO_FRUSTUM = 10` compartido (antes 16).
  - `worldView` creación cámara + `game.resize()` usan la constante.
  - `PLAYER_SOLDIER_MANIFEST.scale` 1 → 1.25; `yOffset` 0 (pies al suelo).
  - Tests headless frustum 8–12 + scale > 1; ground ring sin cambio (sigue ok bajo pies).
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; WebAudio player real; footsteps SFX; look survival propio
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** footsteps SFX stub o Mesh2Motion survival GLB (reemplazar Soldier)
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
