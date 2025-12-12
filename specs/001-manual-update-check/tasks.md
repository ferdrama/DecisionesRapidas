# Tasks: Comprobación manual de actualizaciones

**Input**: Design documents from `specs/001-manual-update-check/`

- Required: `specs/001-manual-update-check/spec.md`, `specs/001-manual-update-check/plan.md`
- Available: `specs/001-manual-update-check/research.md`, `specs/001-manual-update-check/quickstart.md`, `specs/001-manual-update-check/contracts/README.md`, `specs/001-manual-update-check/data-model.md`

**Notes**:
- No se han solicitado tests automatizados; se usan checklists/manuales (`docs/smoke-tests.md` + `specs/001-manual-update-check/quickstart.md`).
- Tareas organizadas por historias de usuario (US1–US3) según `specs/001-manual-update-check/spec.md`.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Revisar contexto canónico de updates PWA y restricciones en docs/flows.md y docs/invariants.md
- [ ] T002 Revisar ADR vigente del Service Worker y su estrategia de caché en docs/adr/0005-service-worker-cache.md
- [ ] T003 Confirmar puntos de integración actuales (menú + SW + toast) en index.html, src/app.js y sw.js

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 [P] Cambiar estrategia de activación del Service Worker (quitar auto-activación y soportar mensaje) en sw.js
- [ ] T005 [P] Añadir opción “Comprobar actualizaciones” al menú hamburguesa en index.html
- [ ] T006 Verificar/ajustar que el flujo de recarga “una sola vez” sigue siendo correcto tras controllerchange en index.html

**Checkpoint**: Foundation lista; ya se puede implementar la UX de comprobación.

---

## Phase 3: User Story 1 - Comprobar si hay actualizaciones (Priority: P1) 🎯 MVP

**Goal**: Permitir comprobar manualmente si hay una nueva versión y comunicar el resultado.

**Independent Test**: Ejecutar “Caso A: No hay actualización” del quickstart en specs/001-manual-update-check/quickstart.md

- [ ] T007 [US1] Conectar el botón del menú a un handler (click) y cerrar el menú tras la acción en src/app.js
- [ ] T008 [US1] Implementar función de “comprobación manual” usando `navigator.serviceWorker.getRegistration()` + `registration.update()` en src/app.js
- [ ] T009 [US1] Mostrar feedback explícito al usuario para el caso “no hay actualización disponible” en src/app.js
- [ ] T010 [US1] Detectar “hay actualización disponible” cuando exista `registration.waiting` (o tras updatefound→installed) y comunicarlo al usuario en src/app.js

**Checkpoint**: US1 completa: el usuario puede comprobar y recibir un resultado claro.

---

## Phase 4: User Story 2 - Actualizar cuando hay nueva versión (Priority: P2)

**Goal**: Ofrecer al usuario aplicar la actualización y completar el update sin bucles.

**Independent Test**: Ejecutar “Caso B: Hay actualización disponible (simulación)” en specs/001-manual-update-check/quickstart.md

- [ ] T011 [US2] Ofrecer confirmación “Actualizar ahora” cuando haya `registration.waiting` y respetar cancelación en src/app.js
- [ ] T012 [US2] Si el usuario acepta, enviar `postMessage({type:'SKIP_WAITING'})` al SW en `registration.waiting` en src/app.js
- [ ] T013 [US2] Validar que el update aplica y recarga una sola vez (sin bucles) usando el flujo de toast/controllerchange en index.html

**Checkpoint**: US2 completa: hay update → usuario acepta → app actualizada.

---

## Phase 5: User Story 3 - Manejo de fallos/limitaciones (Priority: P3)

**Goal**: Informar errores/limitaciones (offline, no SW) sin romper flujos.

**Independent Test**: Ejecutar “Caso C: Sin conexión” en specs/001-manual-update-check/quickstart.md

- [ ] T014 [US3] Manejar el caso “no hay soporte de Service Worker” y “no hay registration” con mensaje claro en src/app.js
- [ ] T015 [US3] Manejar fallo/timeout de `registration.update()` (p. ej., offline) con mensaje controlado en src/app.js
- [ ] T016 [US3] Evitar clicks repetidos (debounce/lock) durante la comprobación para no duplicar prompts ni estados en src/app.js

**Checkpoint**: US3 completa: el flujo es robusto ante fallos comunes.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Actualizar documentación de flujo de updates PWA (incluyendo trigger manual) en docs/flows.md
- [ ] T018 [P] Ampliar checklist de smoke tests con el caso “Comprobar actualizaciones” en docs/smoke-tests.md
- [ ] T019 Ejecutar validación completa: docs/smoke-tests.md + specs/001-manual-update-check/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) → Polish (Phase 6)

### User Story Dependencies

- US1: requiere Foundation (T004–T006) para que el “ofrecer actualización” sea coherente.
- US2: depende de US1 (detección) y de `SKIP_WAITING` en SW (T004).
- US3: depende de la existencia del handler de US1 (T007–T010) para añadir robustez.

### Dependency Graph (User Stories)

```text
Phase 1 (Setup) -> Phase 2 (Foundational) -> US1 (P1) -> US2 (P2) -> US3 (P3) -> Phase 6 (Polish)
```

---

## Parallel Execution Examples

### Foundational

- T004 (sw.js) y T005 (index.html) pueden ejecutarse en paralelo.

### Polish

- T017 (docs/flows.md) y T018 (docs/smoke-tests.md) pueden ejecutarse en paralelo.

### User Story 1 (US1)

No hay paralelismo real dentro de US1 porque las tareas están concentradas en `src/app.js` (mismo archivo). La opción segura es ejecución secuencial T007 → T008 → T009 → T010.

### User Story 2 (US2)

No hay paralelismo real dentro de US2 porque T011 y T012 viven en `src/app.js` (mismo archivo) y T013 es validación del flujo. Ejecución recomendada: T011 → T012 → T013.

### User Story 3 (US3)

No hay paralelismo real dentro de US3 porque T014–T016 viven en `src/app.js` (mismo archivo) y se apoyan en la función de US1. Ejecución recomendada: T014 → T015 → T016.

---

## Implementation Strategy

### MVP (solo US1)

1. Completar Phase 1 + Phase 2
2. Completar Phase 3 (US1)
3. Validar con specs/001-manual-update-check/quickstart.md (Caso A)

### Entrega incremental

1. US1 → “comprobar e informar”
2. US2 → “ofrecer y aplicar actualización”
3. US3 → “robustez: offline/no SW/clicks repetidos”
4. Polish → docs + checklists
