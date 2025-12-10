<!--
Sync Impact Report:
- Version change: 0.0.0 -> 1.0.0 (Initial creation)
- List of modified principles:
  - Added: Separación Spec Kit
  - Added: Seguridad y privacidad (NON-NEGOTIABLE)
  - Added: Contratos y robustez del Worker
  - Added: CORS y aislamiento por origen
  - Added: Integración LLM
  - Added: Calidad del código
  - Added: Testing mínimo exigido
  - Added: Documentación operativa
  - Added: Language
- Added sections: Non-goals, Decision records, Compliance table
- Templates requiring updates: None (checked and compatible)
-->
# DecisionesRápidas Constitution

## Core Principles

### I. Separación Spec Kit
**Specs describen QUÉ y POR QUÉ, Plans describen CÓMO, Tasks son unidades de trabajo.**
- **Specs**: Deben contener user stories, criterios de aceptación, UX y métricas. No deben contener detalles técnicos de implementación.
- **Plans**: Deben describir la arquitectura, decisiones técnicas, contratos de API, estrategias de despliegue y riesgos.
- **Tasks**: Deben ser unidades atómicas, implementables y testeables.

### II. Seguridad y privacidad (NON-NEGOTIABLE)
**Protección absoluta de secretos y privacidad del usuario.**
- **MUST NOT** exponer claves (OpenRouter/OpenAI/Anthropic) en frontend, repositorio, ni GitHub Pages.
- **MUST** almacenar secrets en Cloudflare Worker secrets para producción. En local, usar `worker/.dev.vars` y **MUST** estar ignorado por git.
- **MUST** minimizar logs: nunca registrar el texto completo del usuario (question/context) en producción; solo hashes, longitudes o errores.
- **MUST** validar input y output del modelo como si fueran datos no confiables.

### III. Contratos y robustez del Worker
**El Worker es la única puerta de enlace al LLM y debe ser robusto.**
- El Worker es la única pieza autorizada para llamar a OpenRouter.
- **MUST** mantener un API contract estable:
  - Endpoint: `POST /api/weights`
  - Entrada: `pregunta` + `choices` (ids estables)
  - Salida: JSON estricto con scores enteros 0..100 para todas las ids exactamente una vez.
- **MUST** implementar timeout (AbortController) y devolver errores claros (400 input inválido, 403 origin no permitido, 502 fallo modelo/proveedor).

### IV. CORS y aislamiento por origen
**Control estricto de quién puede consumir la API.**
- **MUST** usar allowlist de orígenes en producción (NO “*”).
- **MUST** permitir exactamente:
  - `https://ferdrama.github.io` (producción)
  - `http://localhost:8080` (desarrollo)
- **MUST** responder a `OPTIONS` (preflight) correctamente y añadir `Vary: Origin`.

### V. Integración LLM
**Uso eficiente, determinista y controlado de la IA.**
- Por defecto: `temperature: 0` y `max_tokens` bajo.
- **MUST** exigir salida JSON (sin texto extra) y validar el esquema de respuesta.
- **SHOULD** permitir configurar modelo por variable de entorno (`OPENROUTER_MODEL`) y headers opcionales (`HTTP-Referer`, `X-Title`).
- Si el modelo falla o devuelve JSON inválido, la UX **MUST** degradar de forma segura (ej. mostrar error y/o fallback a 50/50).

### VI. Calidad del código
**Simplicidad y rendimiento.**
- Preferir JS/TS simple, sin dependencias pesadas; añadir librerías solo si aportan valor claro.
- Estructura clara: `/` (PWA) y `/worker` (backend edge).
- Mantener la app rápida (pocas llamadas de red, payloads pequeños).

### VII. Testing mínimo exigido
**Verificación automatizada de puntos críticos.**
- **MUST** incluir tests (aunque sean básicos) para:
  - Validación de input del Worker.
  - Validación/parseo del JSON del modelo.
  - Reglas de CORS (origen permitido vs no permitido).
- Para frontend, al menos pruebas manuales guiadas o checklist reproducible.

### VIII. Documentación operativa
**Instrucciones claras para desarrollo y despliegue.**
- El `README.md` **MUST** contener:
  - Instrucciones de dev local (`wrangler dev` + servidor estático).
  - Configuración de `window.DR_API_BASE` en dev/prod.
  - Cómo configurar secrets/vars y desplegar el worker.
  - Checklist de verificación en producción (CORS ok, IA on funciona, IA off no hace red).

### IX. Language
**Documentación en español, código en inglés.**
- **MUST**: Toda la documentación generada por Spec Kit (specs, plans, tasks, ADRs, README, comentarios de arquitectura) debe estar en **español**.
- **SHOULD**: El código, nombres de ficheros, variables, funciones y mensajes de error técnicos pueden permanecer en **inglés** (por convención).
- **MUST**: Evitar mezclar idiomas dentro del mismo documento.
- **MAY**: Se permite incluir términos técnicos en inglés cuando sean estándar (p.ej. “CORS”, “Worker”, “rate limit”), pero el texto explicativo debe estar en español.

## Non-goals
**Lo que NO es este proyecto.**
- No es un chat generalista con IA.
- No almacena historial de decisiones del usuario en servidor.
- No requiere autenticación de usuarios finales.

## Decision records
**Registro de decisiones técnicas.**
- Las decisiones arquitectónicas o de diseño importantes deben documentarse brevemente (ADR ligeros o notas en `docs/decisions/`).
- Formato mínimo: Título, Fecha, Contexto, Decisión, Consecuencias.

## Compliance table (audit-friendly)

| Regla (MUST / MUST NOT / SHOULD) | Cómo comprobarla (audit) | Dónde aplica |
|---|---|---|
| MUST NOT exponer claves o tokens en el frontend (repo / GitHub Pages). | `git grep -nE "(OPENROUTER|OPENAI|ANTHROPIC)_API_KEY|Bearer\s+[A-Za-z0-9_\-]{10,}" .` debe devolver 0 resultados. Revisar también `index.html`, `app.js`, `README.md`. | PWA |
| Secrets MUST vivir en Cloudflare Worker secrets (prod). | En Cloudflare Dashboard o CLI: `wrangler secret list` incluye `OPENROUTER_API_KEY`. El repo NO contiene `.dev.vars`. | Worker |
| En local, secrets en `worker/.dev.vars` y MUST estar ignorado por git. | `cat .gitignore` contiene `.dev.vars*` y `git status` no muestra ese archivo. | Worker |
| MUST usar allowlist de CORS en producción (NO "*"). | En prod: llamada desde un origin no permitido debe responder `403`. Respuesta normal debe incluir `Access-Control-Allow-Origin: https://ferdrama.github.io` (no `*`). | Worker |
| MUST permitir orígenes exactos: `https://ferdrama.github.io` y `http://localhost:8080`. | Ejecutar 2 pruebas: 1) desde GitHub Pages funciona, 2) desde dev local funciona. Cualquier otro origin → 403. | Worker |
| MUST manejar `OPTIONS` preflight correctamente. | `curl -i -X OPTIONS https://<worker>/api/weights -H "Origin:https://ferdrama.github.io" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"` devuelve `204` (o 200) + headers CORS. | Worker |
| MUST incluir `Vary: Origin` en respuestas con CORS. | `curl -i` a `POST /api/weights` y verificar header `Vary: Origin`. | Worker |
| MUST validar input (question y choices) y devolver 400 en inválidos. | `curl -i -X POST ... -d '{}'` → `400`. Probar choices != YES/NO → `400`. | Worker |
| El Worker MUST ser la única pieza que llama al LLM. | En PWA no existe código que haga `fetch("https://openrouter.ai/…")`. `git grep -n "openrouter.ai" .` solo aparece en `/worker`. | Ambos |
| MUST tener timeout de red al llamar a OpenRouter (~10s). | Inspeccionar `worker/src/index.*` para `AbortController` + timeout. (Opcional: test simulando latencia). | Worker |
| LLM MUST devolver SOLO JSON con scores; salida MUST validarse. | Forzar respuesta inválida (cambiando temporalmente prompt en dev) debe producir `502 MODEL_BAD_JSON` y no romper el frontend. | Worker |
| Scores MUST ser enteros 0..100 e incluir todas las ids exactamente una vez. | Probar con request válido y verificar que el JSON cumple: `YES` y `NO` presentes una sola vez y rangos correctos. | Worker |
| Por defecto temperature MUST ser 0 y max_tokens bajo. | Revisar request a OpenRouter en código: `temperature: 0` y `max_tokens` razonable (<= 300). | Worker |
| IA OFF MUST ser 50/50 y sin red. | Con IA off, DevTools → Network: 0 requests al worker; resultado usa 50/50. | PWA |
| La PWA en producción MUST apuntar al worker de producción por defecto. | Abrir GitHub Pages y verificar que `window.DR_API_BASE` (o config equivalente) apunta a `https://decisiones-rapidas-worker...workers.dev`. | PWA |
| README MUST documentar dev local, secrets y deploy. | Revisar README: contiene pasos `wrangler dev`, `.dev.vars`, `wrangler secret put`, y checklist de verificación. | Ambos |

## Governance

**Constitution supersedes all other practices.**
- Amendments require documentation, approval, and a migration plan.
- All PRs/reviews must verify compliance with this constitution.
- Complexity must be justified.

**Version**: 1.0.0 | **Ratified**: 2025-12-10 | **Last Amended**: 2025-12-10
