# Research: Comprobación manual de actualizaciones

## Contexto (referencias canónicas)

- Arquitectura y SW: `docs/system-overview.md`
- Flujo actual de updates: `docs/flows.md` (sección “Actualizaciones PWA”)
- Invariantes: `docs/invariants.md`

## Decisiones

### Decisión 1: La actualización debe ser *controlada por el usuario*

- **Decision**: Cambiar el comportamiento para que, cuando exista una nueva versión del Service Worker, ésta quede en estado **waiting** y no se active hasta que el usuario acepte actualizar.
- **Rationale**: El requerimiento pide “ofrecer al usuario la actualización”. Si el SW activa inmediatamente (`skipWaiting()` en `install`), no hay una oportunidad fiable para pedir confirmación antes de que la app recargue.
- **Alternatives considered**:
  - Mantener `skipWaiting()` + auto-reload y solo “avisar”: no cumple el “ofrecer” de forma controlada.
  - Forzar `window.location.reload(true)` o cache-busting manual: es frágil, rompe offline y no garantiza actualización de assets.

### Decisión 2: La comprobación manual se implementa con `registration.update()`

- **Decision**: La opción de menú “Comprobar actualizaciones” invoca `navigator.serviceWorker.getRegistration()` y ejecuta `registration.update()`.
- **Rationale**: Es la vía estándar para pedir al navegador que re-valide el script del SW y detecte si existe una nueva versión.
- **Alternatives considered**:
  - Hacer fetch manual de `sw.js`: duplica lógica del navegador y no garantiza instalación.

### Decisión 3: La detección “hay update” se basa en estados `installing/waiting`

- **Decision**: Considerar “hay nueva versión disponible” cuando `registration.waiting` exista (o cuando tras `updatefound` el `installing` llegue a `installed` y no haya tomado control).
- **Rationale**: En un flujo controlado por el usuario, `waiting` es el indicador explícito de que existe una versión lista para activarse.
- **Alternatives considered**:
  - Comparar versiones por string: no hay un versionado explícito consistente en el frontend; el SW usa `CACHE_NAME` internamente.

### Decisión 4: Activar la nueva versión mediante mensaje `SKIP_WAITING`

- **Decision**: Cuando el usuario elija “Actualizar ahora”, el cliente envía un mensaje al SW en `waiting` para ejecutar `skipWaiting()`.
- **Rationale**: Permite aplicar el update de forma inmediata tras el consentimiento del usuario.
- **Alternatives considered**:
  - Esperar al cierre de pestañas: no satisface “actualizar ahora”.

## Riesgos y mitigaciones

- **Multi-tab**: Varias pestañas pueden competir por el refresh.
  - Mitigación: mantener un flag de “refresh en curso” por pestaña y evitar bucles; usar `controllerchange` para hacer un reload único.
- **Offline**: `registration.update()` puede fallar o no encontrar update.
  - Mitigación: mostrar mensaje claro y no bloquear la UI.
- **Entornos sin SW**: navegadores/escenarios sin soporte.
  - Mitigación: deshabilitar la opción o mostrar “no disponible”.
