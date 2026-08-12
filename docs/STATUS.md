# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — possessed GLB (Soldier + tint)
- **Qué quedó (esta corrida):**
  - `possessedLook.ts`: paleta oscura + acento rojo/violeta emisivo; `applyPossessedLook` clona mats (head/visor).
  - `POSSESSED_SOLDIER_MANIFEST`: mismo `/models/Soldier.glb`, id `possessed-soldier`, scale `1.25`.
  - `worldView`: carga template una vez → `SkeletonUtils.clone` + tint + idle mixer; fallback box × `HOSTILE_VISUAL_SCALE` si pending/fail; mutes siguen boxes.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** mute GLB o Mesh2Motion propio / loco walk poseídos
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
