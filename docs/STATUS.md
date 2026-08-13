# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — ambient WebAudio
- **Qué quedó (esta corrida):**
  - `ambientPlayer.ts`: capas looping desde niveles de `ambientStub` — rain noise bandpass ~2800Hz, night sine 62Hz, indoor triangle lowpass 190Hz, threat saw lowpass 48Hz.
  - Headless: `computeLayerGain` / `shouldBeSilent`; mute → gains 0. AudioContext lazy (primer sync audible).
  - Cableado en `game.syncAmbient` tras `tickAmbient`; export barrel audio.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion Survivor.glb / real samples
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
