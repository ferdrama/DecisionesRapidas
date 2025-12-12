# ADR 0003: Contrato estricto para `/api/weights`

**Estado**: Aceptado  
**Fecha**: 2025-12-12  

## Contexto
La UI necesita pesos para decidir. El Worker valida que el modelo devuelve JSON plano con:
- `scores` para **todas** las opciones.
- `score` entero 0..100.
- `reason` string.

El frontend valida forma mínima y muestra errores controlados.

## Decisión
Definir y hacer cumplir un contrato estricto:
- Request con `question` y `choices` (ids únicos).
- Response con `scores` del mismo tamaño e ids que `choices`, más `reason`.

Errores de forma del modelo se reportan como `MODEL_BAD_JSON`.

## Consecuencias
- Menos regresiones al cambiar modelos/prompts.
- Facilita testing y refactors del frontend.
- Requiere actualizar `docs/worker-api.md` si se evoluciona el contrato.

## Alternativas consideradas
- Aceptar respuestas “flexibles” del modelo.  
  Rechazado porque aumenta crashes/regresiones en UI.

