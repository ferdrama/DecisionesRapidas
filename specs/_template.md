# [NNN] - [Título breve del cambio]

**Estado**: Draft  
**Creado**: YYYY-MM-DD  
**Feature branch**: `NNN-titulo-breve`  

## Resumen
[1–2 párrafos describiendo el cambio como delta. Indica si es refactor/feature/fix.]

## Contexto compartido (fuente única de verdad)
No repetir aquí lo canónico. Referenciar:
- Visión general: `docs/system-overview.md`
- Invariantes: `docs/invariants.md`
- Modelo de dominio/datos: `docs/domain.md`
- Persistencia/localStorage: `docs/storage.md`
- Modos actuales: `docs/modes.md`
- Flujos: `docs/flows.md`
- Máquina de estados: `docs/state-machine.md`
- API Worker: `docs/worker-api.md`
- Smoke checklist base: `docs/smoke-tests.md`
- ADRs existentes: `docs/adr/`

## Problema / motivación
[Qué problema se resuelve y por qué ahora.]

## Objetivos (GOALS)
- [G1]
- [G2]

## No-objetivos (NON-GOALS)
- [NG1]
- [NG2]

## Alcance
### En alcance (IN SCOPE)
- [Qué se toca.]

### Fuera de alcance (OUT OF SCOPE)
- [Qué explícitamente no se toca.]

## Cambios propuestos
[Descripción concreta del cambio: archivos, componentes, comportamiento.]

### Impacto en modelo de datos / storage
- Entidades nuevas/modificadas: [sí/no + detalle]
- Cambio en `localStorage`: [sí/no + detalle]
- Migración requerida: [sí/no + plan]

### Impacto en flujos / estados
- Flujos afectados: [lista]
- Estados nuevos/modificados: [lista]

### Impacto en API Worker
- Contrato afectado: [sí/no + detalle]
- ADR requerido: [sí/no + link]

## Historias de usuario (priorizadas)
### US-01 (P1): ...
Como usuario...
- Criterios / escenarios:
  1. Given ...
  2. Given ...

### US-02 (P2): ...

## Requisitos no funcionales / constraints
- [CN1]
- [CN2]

## Criterios de aceptación (auditables)
1. ...
2. ...

## Plan de validación
- Reusar checklist base: `docs/smoke-tests.md`
- Checks adicionales específicos de este spec:
  1. ...
  2. ...

## Riesgos y mitigaciones
- Riesgo: ...
  - Mitigación: ...

## Definition of Done (DoD)
- [ ] Implementación completa según alcance.
- [ ] Pasa el plan de validación.
- [ ] No rompe invariantes globales.
- [ ] ADRs añadidos/actualizados si aplica.
- [ ] Docs vivos actualizados (ver siguiente sección).

## Actualizaciones de documentación viva al cerrar
Checklist de qué debe quedar actualizado en `docs/`:
- [ ] `docs/system-overview.md` (si cambia arquitectura/estructura)
- [ ] `docs/invariants.md` (si se añaden/modifican reglas globales)
- [ ] `docs/domain.md` (si cambian entidades/relaciones)
- [ ] `docs/storage.md` (si cambia persistencia)
- [ ] `docs/modes.md` (si cambia catálogo/comportamiento de modos)
- [ ] `docs/flows.md` (si cambian flujos)
- [ ] `docs/state-machine.md` (si cambian estados/transiciones)
- [ ] `docs/worker-api.md` (si cambia contrato backend)
- [ ] `docs/smoke-tests.md` (si añade checks base)

