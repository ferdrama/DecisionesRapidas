# ADR 0002: Proxy de IA vía Cloudflare Worker

**Estado**: Aceptado  
**Fecha**: 2025-12-12  

## Contexto
La app requiere ponderaciones de IA. Exponer la API key en frontend es inaceptable. El Worker actual (`worker/src/index.js`) habla con OpenRouter y expone `/api/weights`.

## Decisión
Usar un **Cloudflare Worker** como backend mínimo que:
- Guarda la API key como secret.
- Aplica CORS allowlist.
- Expone un contrato estable para ponderaciones.

El frontend **solo** llama al Worker.

## Consecuencias
- Seguridad: no hay secretos en GitHub Pages.
- Separación clara de responsabilidades.
- Hay que mantener contrato estable Worker↔Frontend.

## Alternativas consideradas
- Llamar OpenRouter desde el navegador.  
  Rechazado por riesgo de filtración de API key.
- Backend tradicional (server propio).  
  Rechazado por coste y complejidad de despliegue.

