# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — muzzle flash al disparar (X) + pistola en kit inicial
- **Qué quedó (esta corrida):**
  - `muzzleFlash.ts`: `MUZZLE_FLASH_DURATION=0.12`; pico 1; envelope ease-out sine `cos(u · π/2)`. `createMuzzleFlash` / `triggerMuzzleFlash` (re-triggerable) / `tickMuzzleFlash` → `{intensity, active}`.
  - `worldView.ts`: esfera aditiva unlit ~0.22 dia `0xfff2c0` + PointLight `0xffe8a0` pico 2.2 distancia 2.6. Altura `TRACER_HEIGHT` 1.05. Offset 0.48 en yaw GLB (sin/cos). Hide si inactivo. `triggerMuzzleFlash()` público.
  - `game.ts`: `view.triggerMuzzleFlash()` en X ok (`shot.kind !== "fail"`). Hit y miss flashean; fail (sin pistola/ammo) no.
  - Kit inicial: pistola×1 + munición×8 (además de agua/lata/linterna) para que X dispare al spawn.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion Survivor.glb / real samples o click dry-fire
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
