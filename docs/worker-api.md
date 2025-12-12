# API del Worker

Base URL: `window.DR_API_BASE` (ver `docs/system-overview.md`).

## Endpoints

### `GET /health`
Respuesta:
```json
{ "ok": true }
```

Errores:
- 403 `{ "error": "ORIGIN_FORBIDDEN" }` si el Origin no está permitido.

### `POST /api/weights`
Obtiene ponderaciones para una pregunta y opciones.

Request body:
```json
{
  "question": "string (1-1000)",
  "choices": [
    { "id": "string (1-50)", "label": "string (1-50)" }
  ]
}
```

Restricciones:
- `choices.length` entre 2 y 12.
- `id` únicos.

Respuesta 200:
```json
{
  "scores": [
    { "id": "YES", "score": 70 },
    { "id": "NO", "score": 30 }
  ],
  "reason": "frase corta positiva con pareado",
  "meta": { "provider": "openrouter", "model": "openai/gpt-4o-mini" }
}
```

Contrato requerido por el frontend:
- `scores` incluye **exactamente** una entrada por `choices[i].id`.
- `score` entero 0..100.
- `reason` string (1..300).

## CORS
- Allowlist por `ALLOWED_ORIGINS` (vars en `wrangler.toml`).
- Preflight `OPTIONS` responde 204 si permitido, 403 si no.
- En requests con Origin no permitido → 403 `ORIGIN_FORBIDDEN`.

## Errores estándar
- 400 `{ "error": "<mensaje de validación>" }` cuando el body no cumple esquema.
- 403 `{ "error": "ORIGIN_FORBIDDEN" }`.
- 500 `{ "error": "CONFIG_OPENROUTER_API_KEY_MISSING" }`.
- 502 `{ "error": "MODEL_BAD_JSON" | "MODEL_ERROR" | "MODEL_API_ERROR" }`.
- 504 `{ "error": "MODEL_TIMEOUT" }`.

El frontend mapea algunos códigos en `src/api.js`.

## Seguridad
- API key en secret `OPENROUTER_API_KEY` en Cloudflare.
- Frontend nunca incluye credenciales.

