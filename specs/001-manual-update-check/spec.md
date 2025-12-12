# Feature Specification: Comprobación manual de actualizaciones

**Feature Branch**: `001-manual-update-check`  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User description: "Añadir al menú de hamburguesa una opción para comprobar actualizaciones de la aplicación. El botón debe hacer la comprobación, informar de si existe una nueva versión y ofrecer al usuario la actualización en caso de existir."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprobar si hay actualizaciones (Priority: P1)

Como usuario, quiero poder forzar una comprobación de actualizaciones desde el menú de hamburguesa para saber si la app está al día, sin esperar a que ocurra automáticamente.

**Why this priority**: Reduce incertidumbre y da control al usuario (especialmente tras un deploy reciente o cuando la app está abierta mucho tiempo).

**Independent Test**: Puede probarse abriendo el menú y ejecutando la opción, verificando que la app muestra un resultado claro en un único flujo.

**Acceptance Scenarios**:

1. **Given** la app está abierta y el usuario abre el menú de hamburguesa, **When** pulsa "Comprobar actualizaciones", **Then** la app realiza una comprobación y muestra un mensaje de resultado: "No hay actualizaciones" (o equivalente) cuando no hay una versión más reciente disponible.
2. **Given** la app está abierta y hay una versión más reciente disponible, **When** el usuario pulsa "Comprobar actualizaciones", **Then** la app informa de que hay una actualización disponible y ofrece una acción explícita para actualizar.

---

### User Story 2 - Actualizar cuando hay nueva versión (Priority: P2)

Como usuario, cuando hay una nueva versión disponible quiero poder actualizarla en el momento, de forma controlada y sin perder el estado visible más allá de lo esperable en una recarga.

**Why this priority**: Completa el valor de la comprobación manual y evita “sé que hay update pero no sé cómo aplicarlo”.

**Independent Test**: Puede probarse simulando que existe una nueva versión, ejecutando la comprobación y aceptando la actualización.

**Acceptance Scenarios**:

1. **Given** la app informa de “actualización disponible”, **When** el usuario elige “Actualizar ahora” (o equivalente), **Then** la app se actualiza a la nueva versión y el usuario vuelve a la app actualizada.
2. **Given** la app informa de “actualización disponible”, **When** el usuario cancela/rechaza actualizar, **Then** la app permanece operativa sin interrumpir los flujos normales y el usuario puede volver a comprobar más tarde.

---

### User Story 3 - Manejo de fallos/limitaciones (Priority: P3)

Como usuario, si no es posible comprobar actualizaciones (por ejemplo por falta de conectividad o limitación del entorno), quiero un mensaje claro que no rompa la experiencia.

**Why this priority**: Evita confusión y mantiene la UX robusta.

**Independent Test**: Puede probarse desconectando la red o usando un entorno que no soporte actualizaciones y verificando que se informa al usuario.

**Acceptance Scenarios**:

1. **Given** el dispositivo está sin conexión, **When** el usuario pulsa "Comprobar actualizaciones", **Then** la app muestra un mensaje indicando que no puede comprobarse en ese momento y no muestra errores en consola en el flujo normal.

---

### Edge Cases

- El usuario pulsa "Comprobar actualizaciones" repetidas veces seguidas.
- La comprobación tarda más de lo habitual: el usuario debe recibir un resultado final o un fallo controlado.
- El usuario tiene varias pestañas abiertas de la app: la acción de actualizar debe comportarse de forma predecible (no en bucle) y sin romper navegación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app MUST añadir una opción en el menú de hamburguesa para iniciar manualmente la comprobación de actualizaciones.
- **FR-002**: Al ejecutar la opción, la app MUST completar la comprobación y comunicar el resultado al usuario en lenguaje claro (al menos “no hay actualización” vs “hay actualización disponible”).
- **FR-003**: Si existe una nueva versión disponible, la app MUST ofrecer al usuario una acción explícita para actualizar (p. ej., botón/confirmación).
- **FR-004**: Si el usuario acepta actualizar, la app MUST finalizar en la versión actualizada (resultado observable por el usuario) sin entrar en bucles de recarga.
- **FR-005**: Si el usuario rechaza actualizar, la app MUST continuar funcionando con normalidad y permitir reintentar más tarde.
- **FR-006**: Si la comprobación no puede realizarse (p. ej., sin conexión o limitación del entorno), la app MUST mostrar un mensaje de fallo comprensible y no degradar los flujos principales.
- **FR-007**: La opción de comprobación manual MUST no afectar a los modos existentes ni cambiar su comportamiento.

### Key Entities *(include if feature involves data)*

No aplica: esta funcionalidad no introduce nuevas entidades de dominio ni nuevos datos persistentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de las ejecuciones de “Comprobar actualizaciones” terminan con un estado claramente comunicado (sin dejar al usuario sin feedback).
- **SC-002**: Cuando no hay actualización, el usuario recibe respuesta en ≤ 2 segundos en condiciones normales de conectividad.
- **SC-003**: Cuando hay actualización, el usuario puede completar la actualización en ≤ 2 acciones desde el menú (iniciar comprobación + confirmar actualizar).
- **SC-004**: La funcionalidad no introduce regresiones visibles en los flujos principales (decidir, listas, historial) y no rompe invariantes.

---

## Contexto compartido (fuente única de verdad)

Este spec describe un delta. Para contexto canónico, referenciar:

- `docs/system-overview.md` (visión general)
- `docs/invariants.md` (reglas que no se rompen)
- `docs/flows.md` (flujo actual de actualizaciones PWA y menú)
- `docs/smoke-tests.md` (checklist base de validación)

## Impacto en el sistema

### Impacto en modelo de datos / storage

- Entidades nuevas/modificadas: no
- Cambio en `localStorage`: no
- Migración requerida: no

### Impacto en flujos / estados

- Flujos afectados: menú de hamburguesa; flujo de “Actualizaciones PWA” (se añade entrada manual que dispara la comprobación)
- Estados nuevos/modificados: ninguno (solo se añade un disparador manual y feedback asociado)

### Impacto en API Worker

- Contrato afectado: no
- ADR requerido: no

## Plan de validación

- Reusar checklist base: `docs/smoke-tests.md`
- Checks adicionales específicos de este spec:
  1. Verificar que aparece la opción "Comprobar actualizaciones" en el menú de hamburguesa.
  2. Con la app al día, ejecutar la opción y validar que el resultado es “no hay actualización” y la app sigue operativa.
  3. Publicar o simular una nueva versión de la app y validar que la opción detecta “hay actualización” y ofrece actualizar.
  4. Aceptar la actualización y confirmar que el usuario vuelve a la app ya actualizada, sin bucles.
  5. Rechazar la actualización y confirmar que no hay interrupción del uso normal.
  6. Ejecutar la opción sin conexión y validar que se muestra un mensaje de imposibilidad de comprobación sin errores en consola en el flujo normal.

## Definition of Done (DoD)

- [ ] Implementación completa según alcance.
- [ ] Pasa el plan de validación.
- [ ] No rompe invariantes de `docs/invariants.md`.
- [ ] ADRs añadidos/actualizados si aplica.
- [ ] Docs vivos actualizados (ver checklist).

## Actualizaciones de docs al cerrar

Marcar qué debe actualizarse en `docs/` antes de cerrar el spec:

- [ ] `docs/system-overview.md`
- [ ] `docs/invariants.md`
- [ ] `docs/domain.md`
- [ ] `docs/storage.md`
- [ ] `docs/modes.md`
- [x] `docs/flows.md`
- [ ] `docs/state-machine.md`
- [ ] `docs/worker-api.md`
- [x] `docs/smoke-tests.md`
