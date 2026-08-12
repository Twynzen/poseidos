# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — contact polish (kiteable adjacent combat)
- **Qué quedó (esta corrida):**
  - Low-trust: `damageMul` 1.0, `attackCdMul` 0.9 (fear = `speedMul`, no burst DPS); pacified `damageMul` 0 intacto.
  - HostileSim DEFAULTS: `attackCooldown` 1.15, `touchRange` 0.58; `SPAWN_GRACE_SECONDS` 6; `TOUCH_DAMAGE` 12.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion / survival GLB
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
