# DecisionesRapidas

PWA estática para decidir rápido (sí/no o dado) y, opcionalmente, ponderar un sí/no con IA vía un worker en Cloudflare.

## Requisitos

- Node.js instalado.
- Wrangler instalado globalmente: `npm i -g wrangler`.
- Cuenta de Cloudflare para ejecutar el worker.

## Backend ligero (Cloudflare Worker)

Ruta del worker: `./worker`. Endpoint: `POST /api/weights`.

### Configurar secretos

En `./worker`:

- `wrangler secret put OPENROUTER_API_KEY`
- `wrangler secret put OPENROUTER_MODEL` (opcional, por defecto `openai/gpt-4o-mini`)
- `wrangler secret put OPENROUTER_HTTP_REFERER` (opcional, cabecera HTTP-Referer)
- `wrangler secret put OPENROUTER_X_TITLE` (opcional, cabecera X-Title)

### Desarrollo local

1. `cd worker`
2. `wrangler login` (requiere cuenta Cloudflare)
3. `wrangler dev` (expone el worker en `http://127.0.0.1:8787`)
4. Desde la raíz del repo, sirve la PWA de forma estática (por ejemplo `python -m http.server 8080`).
5. Si el worker no está en el mismo origen, ajusta la base del API. Puedes definir `window.DR_API_BASE = "http://127.0.0.1:8787";` antes de cargar `app.js` o cambiar `API_BASE` en `app.js`.

### Deploy

1. `cd worker`
2. `wrangler deploy`

## Uso rápido en la PWA

1. Escribe una pregunta en el bloque **Decisión Sí / No**.
2. Marca o desmarca **Usar IA para ponderar (si no, 50/50)**.
3. Pulsa **Calcular pesos**. Si desmarcas IA, no se hacen llamadas de red (50/50). Si la marcas, se llama al worker y muestra los pesos devueltos por el modelo.
4. (Opcional) Pulsa **Elegir ahora** para hacer el sorteo con esos pesos.
5. El menú original de Sí/No o dado sigue disponible con el botón **Decidir**.
