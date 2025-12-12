# Modos de la aplicación

## Modos integrados

### `binary` — Sí / No
- Selección uniforme 50/50.
- **Sin llamadas de red**.
- Resultados: `"sí"` / `"no"`.

### `binaryAI` — Sí / No (IA)
- Requiere pregunta del usuario.
- Llama al Worker con choices `YES`/`NO`.
- Resultado ponderado según `scores`.
- Registra `question` en historial.

### `dice` — Dado de seis caras
- Selección uniforme entre 1 y 6.
- **Sin llamadas de red**.

## Modos por lista personalizada

### `<listId>` — Lista personalizada
El modo activo es el `id` de una `CustomList`.

Sub-modos:
- **IA OFF (por defecto)**: decisión uniforme entre `items`.
- **IA ON**: al activar “Decidir listas con IA”, se llama al Worker usando:
  - `question = list.name`
  - `choices = [{id:"ITEM_0",label:item0}, ...]`
  - Resultado ponderado.

## Etiquetas en historial
`HistoryEntry.type` se deriva de `Game.getModeLabel()`:
- `"Sí / No"`
- `"Sí / No con IA"`
- `"Dado de seis caras"`
- `CustomList.name` (para listas)

