# ADR 0004: Persistencia en `localStorage` para listas e historial

**Estado**: Aceptado  
**Fecha**: 2025-12-12  

## Contexto
La app necesita recordar listas personalizadas y decisiones previas sin backend adicional. El código actual usa `customLists` y `decisionHistory` en `localStorage`.

## Decisión
Persistir:
- `CustomList[]` en `localStorage["customLists"]`.
- `HistoryEntry[]` en `localStorage["decisionHistory"]`.

Sin migraciones automáticas: cambios de esquema requieren spec + ADR.

## Consecuencias
- Persistencia simple offline-first.
- Los datos viven por navegador/dispositivo.
- Riesgo: `localStorage` puede estar bloqueado; la app debe degradar sin crash.

## Alternativas consideradas
- IndexedDB.  
  Rechazado por complejidad innecesaria.
- Backend para sincronización multi-dispositivo.  
  Fuera de alcance por ahora.

