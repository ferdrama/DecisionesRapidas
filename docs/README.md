# Documentación viva (`docs/`)

Este directorio contiene la **documentación canónica** del sistema (la “fuente única de verdad” a nivel funcional/técnico). Está pensada para que:

- Un desarrollador (o un agente) pueda **entender el sistema en minutos** sin inspeccionar todo el código.
- Cualquier cambio futuro se diseñe e implemente como un **delta** respecto a esta base (ver `specs/`).
- Las decisiones importantes queden registradas (ver `docs/adr/`).

> Nota: esta documentación está escrita para ser útil tanto al **arrancar un proyecto desde 0** como al **actualizar la documentación** de un proyecto ya en marcha.

---

## Principios (cómo se usa `docs/`)

1) **Canónico primero**: si algo está descrito en `docs/`, se asume que es “lo cierto” del sistema actual. Si el código difiere, el cambio está incompleto.
2) **Evitar duplicidad**: `docs/` explica lo estable/importante. El detalle cambiante va al spec del cambio (`specs/`).
3) **Docs-driven para cambios**: cada cambio se define como delta respecto a `docs/` y, al cerrar, se actualiza `docs/` para reflejar el nuevo estado.
4) **Invariantes como guardarraíles**: antes de proponer cambios, leer [`docs/invariants.md`](./invariants.md). Si necesitas romper una invariante, requiere ADR.
5) **Documentación en español**: documentación en español; el código puede mantenerse en inglés (consistente con [`/.specify/memory/constitution.md`](../.specify/memory/constitution.md)).

---

## Mapa del directorio (qué documentación recogemos)

Orden recomendado de lectura (onboarding rápido):

1) [`docs/system-overview.md`](./system-overview.md) — visión general, arquitectura, entornos y estructura del repo.
2) [`docs/invariants.md`](./invariants.md) — reglas no negociables (seguridad, despliegue, persistencia, contratos).
3) [`docs/flows.md`](./flows.md) — flujos de usuario y comportamiento observable.
4) [`docs/modes.md`](./modes.md) — catálogo de modos y sus reglas.
5) [`docs/domain.md`](./domain.md) — entidades, tipos, relaciones y qué se persiste.
6) [`docs/storage.md`](./storage.md) — claves de `localStorage`, formato y política de compatibilidad.
7) [`docs/worker-api.md`](./worker-api.md) — contrato del Worker (endpoints, errores, CORS).
8) [`docs/state-machine.md`](./state-machine.md) — estados/transiciones principales y estados auxiliares (modales).
9) [`docs/smoke-tests.md`](./smoke-tests.md) — checklist manual reproducible para validar cambios.
10) [`docs/adr/`](./adr/) — decisiones arquitectónicas (ADR numerados).

---

## Qué es cada documento y cuándo actualizarlo

### `docs/system-overview.md` (visión general del sistema)

**Propósito**
- Explicar qué es el sistema, sus componentes, cómo se despliega y cómo encajan.
- Servir como “entrada” para entender el repo sin leer todo el código.

**Actualizar cuando**
- Cambia la arquitectura (p.ej., se añade/quita backend, se introduce bundler, se separa un módulo).
- Cambian rutas relevantes, estructura del repo, entornos, o el flujo general de despliegue.
- Aparecen deudas/notas que afecten a mantenimiento (sección “Deuda / notas actuales”).

---

### `docs/invariants.md` (invariantes globales)

**Propósito**
- Definir reglas base que los cambios no deben romper.
- Reducir regresiones y debates recurrentes: aquí quedan los “no negociables”.

**Actualizar cuando**
- Se aprueba (vía ADR) romper o modificar una regla.
- Cambia el contrato Worker ↔ Frontend o la estrategia de despliegue que afecte a invariantes.

**Regla práctica**
- Si un cambio toca seguridad, persistencia o contrato de API, revisar siempre este archivo antes y después.

---

### `docs/flows.md` (flujos de usuario)

**Propósito**
- Describir el comportamiento desde el punto de vista del usuario: qué hace y qué ve.
- Ser la base para QA manual y para diseñar UX en specs.

**Actualizar cuando**
- Cambia el menú, navegación, textos/estados relevantes o el orden de pasos.
- Se añade un modo nuevo o se altera el flujo de decisión (manual/IA).
- Cambia el flujo de actualizaciones PWA / Service Worker.

---

### `docs/modes.md` (modos de la aplicación)

**Propósito**
- Definir los modos disponibles, su comportamiento y sus implicaciones (red vs offline, IA vs manual).
- Estabilizar etiquetas usadas en historial y UI.

**Actualizar cuando**
- Se añade/elimina un modo integrado.
- Cambian sub-modos (p.ej. lista IA on/off) o condiciones/inputs requeridos.
- Se modifica el etiquetado del historial (por `Game.getModeLabel()` o equivalente).

---

### `docs/domain.md` (modelo de dominio / datos)

**Propósito**
- Documentar las entidades, tipos y relaciones que estructuran el sistema.
- Alinear persistencia (`localStorage`), UI, y contratos de API.

**Actualizar cuando**
- Cambia el shape de `CustomList`, `HistoryEntry`, o cualquier dato mostrado/persistido.
- Cambia `WeightsRequest`/`WeightsResponse` (contrato del Worker).
- Se añade estado efímero relevante que condiciona la UX o el funcionamiento.

---

### `docs/storage.md` (persistencia en `localStorage`)

**Propósito**
- Definir claves, formatos, y política de compatibilidad de datos.
- Evitar cambios accidentales que rompan datos existentes del usuario.

**Actualizar cuando**
- Se añaden nuevas claves.
- Cambia el formato de `customLists` o `decisionHistory` (requiere spec + ADR; sin migraciones silenciosas).
- Se define una estrategia explícita de migración/compatibilidad.

**Checklist mínimo al tocar storage**
- ¿Se mantienen claves y tipos? (si no, ADR + plan de migración)
- ¿Se degrada sin crash si `localStorage` falla?
- ¿Se actualiza `docs/domain.md` si cambia el shape?

---

### `docs/worker-api.md` (API del Worker)

**Propósito**
- Ser el contrato estable entre frontend y backend (Worker).
- Documentar endpoints, validaciones, errores estándar, y CORS.

**Actualizar cuando**
- Cambian endpoints, body schema, o la semántica de `scores`/`reason`.
- Cambian códigos de error o reglas de CORS.
- Se añade metadata o se cambia el proveedor/modelo.

**Regla práctica**
- Si el frontend depende de un campo (por ejemplo `reason`), debe estar documentado aquí y protegido por invariantes (`docs/invariants.md`).

---

### `docs/state-machine.md` (máquina de estados)

**Propósito**
- Explicar estados/transiciones principales sin entrar en detalles de implementación.
- Evitar estados imposibles o transiciones no contempladas.

**Actualizar cuando**
- Cambia la lógica de “spinning”, loading, deshabilitado de botones, manejo de errores o reintentos.
- Se introducen estados nuevos (p.ej. “UpdateAvailable”, “Updating”, etc.).
- Se añaden modales o cambios relevantes en su apertura/cierre.

---

### `docs/smoke-tests.md` (smoke checklist manual)

**Propósito**
- Definir una validación mínima, reproducible y rápida para detectar regresiones.
- Dar soporte a cambios sin necesidad de test suite automatizada completa.

**Actualizar cuando**
- Se añade una feature con UX nueva (añadir un check).
- Cambian flows críticos (IA on/off, listas, historial, offline, updates PWA).
- Cambian mensajes o condiciones que afecten a la validación manual.

---

### `docs/adr/` (Architecture Decision Records)

**Propósito**
- Registrar decisiones importantes: contexto, decisión, consecuencias, alternativas.
- Evitar re-discutir lo mismo, y hacer auditable el porqué del sistema.

**Convención**
- Formato: `docs/adr/000X-titulo-en-kebab-case.md`
- Secciones mínimas: `Contexto`, `Decisión`, `Consecuencias`, `Alternativas consideradas`.

**Crear/actualizar ADR cuando**
- Se rompe/modifica una invariante.
- Se cambia arquitectura (bundler, framework, despliegue, separación FE/BE).
- Se cambia contrato del Worker o estrategia de persistencia.
- Se cambia estrategia de cache/updates del Service Worker.

---

## Cómo se “genera” esta documentación (proceso real)

No existe un generador automático: `docs/` se mantiene **a mano** en Markdown, versionado en git.

Lo que sí está automatizado/estructurado es el flujo de cambios:

### 1) `docs/` = estado actual (canónico)
- Describe cómo funciona el sistema **hoy**.
- Es la base para onboarding, diseño, revisión y QA.

### 2) `specs/` = cambios (deltas) sobre `docs/`
- Cada cambio se especifica en `specs/<id-feature>/` como un delta respecto a `docs/`.
- En este repo se usa Speckit:
  - `/speckit.specify` para el spec (qué/por qué).
  - `/speckit.plan` para el plan (cómo).
  - `/speckit.tasks` para tareas atómicas.
- Extensiones específicas del repo: [`specs/_template.md`](../specs/_template.md) (secciones extra, checklist de impacto y actualización de docs).

### 3) Cierre del cambio = actualizar `docs/`
Al terminar un cambio, `docs/` debe quedar actualizado para reflejar el nuevo estado del sistema. La regla práctica:

- Si el spec introduce un comportamiento nuevo o cambia uno existente, `docs/` debe contarlo como si siempre hubiese estado así.
- `specs/` queda como historial del delta; `docs/` queda como verdad actual.

---

## Guía para arrancar un proyecto desde cero (bootstrap de `docs/`)

Si estás creando un proyecto nuevo y quieres adoptar esta estructura desde el día 1:

1) Crear `docs/system-overview.md`
   - Qué es el producto, componentes, arquitectura, entornos, estructura del repo.
   - Añadir un diagrama (Mermaid) de alto nivel si aporta claridad.

2) Crear `docs/invariants.md`
   - Seguridad: secretos, CORS, límites de logging, etc.
   - Arquitectura: restricciones (p.ej. “sitio estático”, “sin bundler”).
   - Persistencia: políticas (sin migraciones silenciosas).
   - Contratos: reglas estrictas entre componentes.

3) Crear `docs/domain.md`
   - Entidades principales y tipos (aunque sea pseudo-TS).
   - Qué se persiste vs qué vive en memoria.

4) Crear `docs/storage.md` (si hay persistencia local)
   - Claves, formato JSON, compatibilidad, migraciones.

5) Crear `docs/flows.md`
   - Flujos críticos (happy path y errores importantes).
   - Incluir sequence diagrams si hay FE ↔ BE.

6) Crear `docs/modes.md` (si hay modos/variantes de UX)
   - Lista de modos, requisitos (inputs), y si requieren red.

7) Crear `docs/state-machine.md`
   - Estados/transiciones del flujo principal.
   - Estados auxiliares (modales/pantallas) si existen.

8) Crear `docs/worker-api.md` (si hay API)
   - Endpoints, body schema, respuestas, errores, CORS, seguridad.

9) Crear `docs/smoke-tests.md`
   - Checklist manual mínimo para validar lo crítico con cada cambio.

10) Crear `docs/adr/0001-...md` y siguientes
   - Documentar 3–5 decisiones iniciales (hosting, persistencia, contrato, etc.).

Recomendación: en el primer día, tener **versiones mínimas** de estos documentos (aunque sean simples) es mejor que no tener nada. Luego se refinan con cada spec/cambio.

---

## Relación con `README.md` (raíz del repo)

- [`README.md`](../README.md) documenta **operación** y **setup** (desarrollo local, deploy, secrets, URLs, checklist rápido).
- `docs/` documenta **diseño/contratos** y el **estado actual** del sistema, pensado para onboarding y para guiar cambios.

Regla práctica: si el contenido es “cómo ejecutar/desplegar”, va al `README.md`. Si es “cómo funciona” y debe mantenerse estable, va a `docs/`.

---

## Checklist rápido para actualizar `docs/` (cuando cambias el sistema)

Antes de dar por “cerrado” un cambio:

- `docs/invariants.md`: ¿se rompe alguna regla? Si sí, ADR + actualización explícita.
- `docs/flows.md`: ¿cambió el comportamiento observable/UX? Actualizar.
- `docs/modes.md`: ¿cambió el catálogo de modos, inputs o etiquetas de historial? Actualizar.
- `docs/domain.md`: ¿cambió el shape de datos, request/response o entidades? Actualizar.
- `docs/storage.md`: ¿cambió `localStorage` (claves/formato)? Actualizar + ADR + plan migración.
- `docs/worker-api.md`: ¿cambió el contrato, errores o CORS? Actualizar.
- `docs/state-machine.md`: ¿cambiaron estados/transiciones? Actualizar.
- `docs/smoke-tests.md`: ¿hay un caso nuevo que validar? Añadir check.
- `docs/system-overview.md`: ¿cambió arquitectura/entornos/estructura? Actualizar.
- `docs/adr/`: ¿hubo decisión relevante? Añadir/actualizar ADR.

---

## Convenciones de escritura (para mantener calidad)

- Mantener documentos **cortos y de alta señal** (preferir enlaces antes que repetir).
- Documentar lo que es **estable** y lo que sirve para alinear decisiones futuras.
- Usar bloques `ts`/`json` cuando describas formas de datos.
- Usar Mermaid (`mermaid`) para diagramas cuando mejore claridad (arquitectura, secuencias, estados).
- Evitar “copiar el código” en docs: describir contratos, invariantes y comportamientos.
