# Implementation Plan: Comprobación manual de actualizaciones

**Branch**: `001-manual-update-check` | **Date**: 2025-12-12 | **Spec**: `specs/001-manual-update-check/spec.md`
**Input**: Feature specification from `specs/001-manual-update-check/spec.md`

## Summary

Añadir una opción en el menú de hamburguesa para comprobar manualmente si hay una nueva versión de la PWA, informar el resultado y, si existe una versión nueva, ofrecer al usuario aplicar la actualización.

Enfoque técnico (resumen): usar `navigator.serviceWorker` + `registration.update()` para forzar la comprobación y cambiar el flujo del Service Worker a “user-controlled update” (nueva versión en `waiting` hasta confirmación). Decisiones y alternativas en `specs/001-manual-update-check/research.md`.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript (ES2019+), Service Worker API (navegadores modernos)  
**Primary Dependencies**: Ninguna (vanilla JS + APIs del navegador)  
**Storage**: N/A (sin cambios en `localStorage`)  
**Testing**: Checklist reproducible (`docs/smoke-tests.md`) + pruebas manuales guiadas de esta feature (`specs/001-manual-update-check/quickstart.md`)  
**Target Platform**: PWA estática en GitHub Pages + navegadores con Service Worker  
**Project Type**: Web (frontend estático)  
**Performance Goals**: Feedback inmediato al pulsar “Comprobar actualizaciones” y resultado en ≤ 2s cuando hay conectividad normal (alineado con SC-002)  
**Constraints**: Mantener PWA estática; sin bundlers; sin dependencias nuevas; no romper modos/UX existentes; mantener offline básico; no tocar claves/formato de `localStorage`; no cambiar contrato del Worker; evitar bucles de recarga  
**Scale/Scope**: Feature pequeña y local al frontend (menú + SW)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Referencia: `.specify/memory/constitution.md` y `docs/invariants.md`.

- Seguridad/secretos: PASS (no se introduce ni expone ninguna key; no hay cambios en Worker/LLM).
- Arquitectura: PASS (sigue siendo PWA estática, sin tooling pesado).
- Offline básico: PASS (se conserva el enfoque con Service Worker; el cambio solo modifica el momento de activación).
- Modos y UX existentes: PASS (no se alteran comportamientos de decidir/listas/historial).
- Persistencia: PASS (sin cambios en claves ni migraciones).

Re-check post-diseño (Phase 1): PASS (el diseño propuesto no viola principios; ver sección “Phase 1”).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
index.html
styles.css
manifest.webmanifest
sw.js
app.js

src/
  api.js
  app.js
  config.js
  game.js
  storage.js
  ui.js
  utils.js

worker/
  wrangler.toml
  src/
    index.js

docs/
  (documentación canónica)
```

**Structure Decision**: Cambio localizado en frontend estático (menú + flujo de Service Worker). No requiere cambios en Worker.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

No aplica: el plan no introduce complejidad que viole la constitución.

## Phase 0: Outline & Research

**Output**: `specs/001-manual-update-check/research.md`

Resultados relevantes:

- Se elige un modelo de actualización “controlado por el usuario” para cumplir el requerimiento de “ofrecer actualización”.
- Se define la comprobación manual basada en `registration.update()`.
- Se define la activación por mensaje `SKIP_WAITING` al SW en `waiting`.

## Phase 1: Design & Contracts

**Outputs**:

- Data model: `specs/001-manual-update-check/data-model.md` (sin cambios)
- Contracts: `specs/001-manual-update-check/contracts/README.md` (sin cambios)
- Quickstart: `specs/001-manual-update-check/quickstart.md`

### Diseño UX (delta)

- Añadir una acción en el menú de hamburguesa: “Comprobar actualizaciones”.
- Al pulsar:
  - Si el entorno no soporta SW o no hay registro: informar “no disponible”.
  - Si hay conectividad y no hay update: informar “no hay actualización disponible”.
  - Si hay update: informar “hay una nueva versión” y ofrecer “Actualizar ahora” vs “Más tarde”.

Nota: Para minimizar superficie de UI y mantener consistencia, el plan asume que el feedback se puede dar con diálogos nativos (`alert/confirm`) o con un patrón existente equivalente, sin introducir pantallas/modales nuevas.

### Diseño técnico (frontend + SW)

- **Menú**: incorporar un botón con `id` estable para enganchar el listener (en `index.html`).
- **Lógica de comprobación** (en `app.js`):
  1) Obtener `registration` (`navigator.serviceWorker.getRegistration()`).
  2) Ejecutar `await registration.update()`.
  3) Determinar si existe nueva versión observando `registration.waiting` y/o el ciclo `updatefound` → `installing.statechange`.
  4) Si hay `waiting`, pedir confirmación al usuario. Si acepta, enviar `postMessage({ type: 'SKIP_WAITING' })` al `waiting`.
  5) Tras `controllerchange`, dejar que el flujo existente recargue una sola vez.
- **Service Worker** (en `sw.js`):
  - Eliminar `self.skipWaiting()` del evento `install` para que una nueva versión quede en `waiting`.
  - Añadir listener `message` para ejecutar `self.skipWaiting()` solo cuando el cliente lo solicite.
  - Mantener `clients.claim()` y el broadcast existente tras `activate`.

### Re-check de constitución (post-diseño)

- PASS: No se añaden dependencias ni tooling.
- PASS: No se toca Worker ni contratos.
- PASS: No se alteran modos, ni persistencia.
- PASS: Se evita un update “forzoso” sin consentimiento.

## Phase 2: Planning (pasos de implementación)

1. **UI**: añadir “Comprobar actualizaciones” al menú existente en `index.html`.
2. **Lógica**: implementar handler en `app.js` con:
   - Debounce / bloqueo temporal para clicks repetidos.
   - Resultado “sin update” vs “update disponible” vs “no disponible / offline”.
3. **Service Worker**: ajustar `sw.js` a estrategia “waiting + SKIP_WAITING”.
4. **Regresión**: verificar que el flujo actual de toast/recarga tras `controllerchange` sigue siendo “una sola vez”.
5. **Validación**: ejecutar `docs/smoke-tests.md` + los casos de `specs/001-manual-update-check/quickstart.md`.

