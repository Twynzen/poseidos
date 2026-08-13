# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — HUD pill BAL (munición)
- **Qué quedó (esta corrida):**
  - `moodles.ts`: `MoodleId` +`"ammo"`; `AMMO_WARN=2` / `AMMO_CRITICAL=0`; `moodleLevelForAmmo` / `ammoMoodle(hasPistol, ammoQty)` null sin pistola; `buildHudMoodles` concatena BAL (label **BAL**, glifo ◉). `buildMoodles` sigue en 4 pills.
  - `ui/moodles.ts`: `sync()` quita pills cuyo `id` no viene en el array.
  - `game.ts`: ambos `moodlesHud.sync` usan `buildPlayerHudMoodles` (`findSlot` pistola qty>0 + ammo qty).
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion / real samples
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
