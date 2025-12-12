# Invariantes globales

Estas reglas son la base de todos los specs. Si un spec necesita romper una invariante, debe:
1) Declararlo explícitamente.
2) Añadir un ADR que justifique el cambio.
3) Actualizar la documentación canónica afectada.

## Seguridad
- **Nunca** debe existir una API key/token en frontend ni en el repo.
- El frontend **no** debe llamar a OpenRouter directamente.
- El **Worker es la única** pieza que habla con OpenRouter.
- Si CORS bloquea un origen no permitido, el Worker responde 403 con `ORIGIN_FORBIDDEN`.

## Arquitectura / despliegue
- La PWA debe seguir siendo **estática** (GitHub Pages).
- Evitar introducir tooling pesado/bundlers salvo ADR explícito.
- Mantener compatibilidad con ES modules en navegadores modernos.
- Mantener funcionamiento offline básico vía Service Worker.

## Modos y UX
- Los modos existentes deben seguir disponibles y con el mismo comportamiento:
  - Sí/No (uniforme, sin red).
  - Sí/No (IA).
  - Dado.
  - Listas personalizadas con opción IA.
- El botón principal “Decidir” debe funcionar en todos los modos.
- En flujos normales no debe haber errores en consola.

## Persistencia
- `localStorage` mantiene **las mismas claves y formatos**:
  - `customLists`
  - `decisionHistory`
- No se realizan migraciones silenciosas ni se pierde información.

Detalles en `docs/storage.md`.

## Contrato Worker ↔ Frontend
- Endpoint: `POST /api/weights`.
- Request/Response deben cumplir el contrato documentado en `docs/worker-api.md`.
- `reason` es **siempre string**.
- Cada opción enviada debe aparecer exactamente una vez en `scores`.

## Compatibilidad de API base
- El mecanismo de `window.DR_API_BASE` se conserva:
  - Prod apunta a Worker prod.
  - Dev puede sobreescribirse a Worker local.

