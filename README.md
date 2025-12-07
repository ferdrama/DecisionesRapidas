# Decisiones Rápidas

PWA estática (GitHub Pages) para decidir rápido (sí/no o dado) y, opcionalmente, ponderar un sí/no con IA a través de un Cloudflare Worker.

## Producción
- PWA: https://ferdrama.github.io/DecisionesRapidas/
- Worker: https://decisiones-rapidas-worker.nomedesenlacabeza-905.workers.dev
- CORS en producción: solo permite el origen `https://ferdrama.github.io` (sin el path `/DecisionesRapidas`).

### Deploy del worker
1) `cd worker`
2) Variables (no secretas) ya definidas en `wrangler.toml` (`ALLOWED_ORIGINS`, `OPENROUTER_MODEL`, cabeceras opcionales comentadas).
3) Secretos: `npx wrangler secret put OPENROUTER_API_KEY`
4) Desplegar: `npx wrangler deploy`
5) Ver secretos: `npx wrangler secret list`

## Desarrollo local
1) Crear `worker/.dev.vars` (no se commitea) con, por ejemplo:
```
OPENROUTER_API_KEY=tu_api_key
ALLOWED_ORIGINS=http://localhost:8083
OPENROUTER_MODEL=openai/gpt-4o-mini
# OPENROUTER_HTTP_REFERER=http://localhost:8083
# OPENROUTER_X_TITLE=DecisionesRapidas (opcional)
```
2) Lanzar el worker: `cd worker` y `npx wrangler dev` (expone `http://127.0.0.1:8787`).
3) Servir la PWA desde la raíz: `python -m http.server 8083`.
4) La PWA detecta `localhost/127.0.0.1` y fija `window.DR_API_BASE = "http://127.0.0.1:8787"` antes de cargar `app.js`. Si quieres forzar otra base, defínelo manualmente antes del script de la app.

## API del worker
- `POST /api/weights`
	- Body: `{ question: string (1-1000), choices: [{id:"YES",label:"Sí"},{id:"NO",label:"No"}] }`
	- Respuesta: `{ scores:[{id:"YES",score:int 0-100},{id:"NO",score:int 0-100}], reason:string, meta:{provider,model} }`
	- CORS: allowlist (`ALLOWED_ORIGINS`). Si el `Origin` no está permitido: 403 `{ "error": "ORIGIN_FORBIDDEN" }`.
- `GET /health` -> `{ ok: true }` (misma CORS allowlist).

## PWA / Frontend
- `window.DR_API_BASE` se define en `index.html` antes de `app.js` (prod: worker; local: 127.0.0.1:8787) y se normaliza internamente sin dobles `/`.
- Sin IA (`Sí / No`): sorteo 50/50 sin llamadas de red.
- Con IA (`Sí / No (IA)`): llama al worker y usa los pesos devueltos.
- No se expone ninguna API key en el frontend ni en el repo.

## Checklist rápido
1) Abrir la PWA en GitHub Pages y activar “Usar IA”.
2) Ver que `/api/weights` responde 200 y no hay errores de CORS.
3) Probar con un origen no permitido y comprobar que devuelve 403.
4) (Opcional) Consultar `/health` para diagnóstico rápido.

## Cambios realizados (resumen)
- API base definida antes de cargar la app; prod apunta al worker y local autodetecta 127.0.0.1:8787.
- CORS del worker ahora usa allowlist (`ferdrama.github.io`, `localhost:8083`) con preflight y 403 si el origen no está permitido.
- Endpoints: `POST /api/weights` validado y `GET /health` para diagnóstico.
- Config `wrangler.toml` con vars y documentación de secrets/vars en README.
