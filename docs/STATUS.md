# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — mute GLB Soldier + muteLook + loco
- **Qué quedó (esta corrida):**
  - `muteLook.ts`: paleta gris-verde enfermo (body ~0x4a5648, acento ~0x6b7a68, emisivo ~0x1a2218; clone mats; sin rojo/violeta).
  - `MUTE_SOLDIER_MANIFEST` id `mute-soldier`, mismo `/models/Soldier.glb`, scale 1.25.
  - `worldView`: un load Soldier compartido (mismo url que poseídos); mute = SkeletonUtils.clone + `applyMuteLook` + mixer + `hostileLocoFromDelta`; poseído = `applyPossessedLook` (sin cambio de tint); al completar load invalida boxes de ambos; fallback box si pending/fail; `HOSTILE_VISUAL_SCALE` 1.5 solo boxes.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion / survival GLB / contact polish
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
