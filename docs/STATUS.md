# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — chevron de facing visible (fuera del anillo)
- **Qué quedó (esta corrida):**
  - `facingChevron.ts`: `FACING_CHEVRON_DIST=1.05` (antes 0.55 = sobre el anillo 0.58, se veía como mota) / `FACING_CHEVRON_YAW_OFFSET=0`; `facingChevronOffset(yaw)` = (sin, cos) XZ, yaw 0 → +Z (igual muzzle). No re-aplica `PLAYER_GLTF_YAW_OFFSET`.
  - `worldView.ts`: triángulo plano unlit `MeshBasicMaterial` 0x9ef0ff, DoubleSide, depthWrite false, renderOrder 8; y=0.12; len 0.70 / half-width 0.28. `placeFacingChevron`: rotation.y luego rotation.x = -0.35 (tilt iso). En `tickPlayerLoco` + `syncPlayer`. Siempre on si hay mesh. Sin luz extra.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion / real samples
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
