# Poseídos

Juego web de survival (Three.js) donde la amenaza no son solo zombies: son **personas poseídas** que **hablan**, recuerdan y — más adelante — pueden **cambiar de comportamiento por diálogo**.

Producto aparte de Project Zomboid. Inspiración de sistemas (no código) de DystopiaNPC / Vivant: memoria, confianza, gates de acción, LLM para personalidad (no autoridad ciega).

## Visión

- Barrio / slice jugable (no emular Knox County entero).
- Poseídos con voz, intención y estado interno.
- Jugador puede hablarles; el habla afecta relación y acciones (fase 2+).
- Server-authoritative cuando haya MP; por ahora single-player lab sólido.

## Stack

- Three.js + Vite + TypeScript
- Estado de NPCs desacoplado del render (testeable sin GPU)

## Hitos (orden)

1. Bootstrap Vite/Three + loop + cámara iso/ortográfica
2. Mundo mínimo (calles, edificios simple, colisión)
3. Player move + interact
4. Poseído NPC: idle, approach, **speech bubbles** (líneas deterministas)
5. Modelo interno: necesidad / atención / reputación mínima
6. Canal de diálogo jugador ↔ poseído (UI)
7. Gates: diálogo puede pedir acción; código valida
8. Hook LLM opcional (daemon/API) con fallback a banco de líneas
9. Multiplayer light (opcional, después)

## Estado

Ver `docs/STATUS.md` (lo actualiza la rutina de desarrollo).

Owner: Daniel Castiblanco · agente: ModsPz

# Deploy (GitHub Pages)

Build jugable pública (repo **público** llamado `poseidos`):

**URL esperada:** `https://<tu-usuario>.github.io/poseidos/`

## Subir desde tu PC (este entorno no llega a GitHub)

1. Creá un repo vacío **público** en GitHub llamado exactamente `poseidos` (sin README si vas a pushear este árbol).
2. En tu máquina, descomprimí el paquete que te pasé (o cloná/copiá `/workspace/poseidos`).
3. En la carpeta del proyecto:

```bash
git remote add origin https://github.com/<tu-usuario>/poseidos.git
git push -u origin main
```

4. En GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. El workflow `.github/workflows/pages.yml` hace build con Bun y publica `dist`.
6. Esperá el Action verde; abrí `https://<tu-usuario>.github.io/poseidos/`.

### Dev local

```bash
bun install
VITE_BASE=/ bun run dev
```

### Redeploy cada 12 h

Cuando el remoto exista, el agente puede dejar una rutina que haga commit/push desde tu PC o un Action `schedule` — por ahora el push inicial lo hacés vos.

Owner: Daniel Castiblanco · agente: HorrorNpcs
