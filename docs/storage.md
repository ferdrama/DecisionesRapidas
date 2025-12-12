# Persistencia (`localStorage`)

La app usa `localStorage` como único almacenamiento local. No hay migraciones automáticas. Si se cambia el esquema, debe hacerse vía spec + ADR.

## Claves

### `customLists`
Array de listas personalizadas.

```json
[
  {
    "id": "1734048800000",
    "name": "Restaurantes",
    "items": ["Sushi", "Tacos", "Pizza"]
  }
]
```

- `id` es string y se genera al crear la lista.
- `items` son strings no vacíos, sin trimming extra en persistencia (se limpia al leer del formulario).

### `decisionHistory`
Array de decisiones, en orden descendente (más reciente primero).

```json
[
  {
    "id": "1734049000000-a1b2c3",
    "type": "Sí / No con IA",
    "result": "sí",
    "timestamp": "2025-12-12T10:15:30.000Z",
    "question": "¿Debería cambiar de trabajo?"
  }
]
```

- `question` solo aparece en decisiones con IA (sí/no IA o lista IA).

## Política de compatibilidad
- No borrar ni renombrar claves sin migración explícita.
- No reordenar campos ni cambiar tipos.
- Si `localStorage` no está disponible, la app debe degradar sin crash (idealmente con try/catch en accesos futuros).

