# Extensiones de spec para DecisionesRápidas

Este archivo **NO es la plantilla principal**. La plantilla base es la estándar de Speckit.

Aquí se definen las **secciones adicionales** que todo spec de este repo debe incluir para integrarse con la documentación viva en `docs/`.

---

## Secciones a añadir al spec (después de las secciones estándar de Speckit)

### Contexto compartido (fuente única de verdad)

No repetir información canónica. Referenciar según aplique:

| Documento | Cuándo referenciar |
|-----------|--------------------|
| `docs/system-overview.md` | Siempre (visión general) |
| `docs/invariants.md` | Siempre (reglas que no se rompen) |
| `docs/domain.md` | Si toca entidades/datos |
| `docs/storage.md` | Si toca persistencia |
| `docs/modes.md` | Si toca modos de decisión |
| `docs/flows.md` | Si toca flujos de usuario |
| `docs/state-machine.md` | Si toca estados/transiciones |
| `docs/worker-api.md` | Si toca API del Worker |
| `docs/smoke-tests.md` | Para validación base |
| `docs/adr/` | Para decisiones previas relevantes |

### Impacto en el sistema

Analizar explícitamente:

```markdown
### Impacto en modelo de datos / storage
- Entidades nuevas/modificadas: [sí/no + detalle]
- Cambio en `localStorage`: [sí/no + detalle]
- Migración requerida: [sí/no + plan]

### Impacto en flujos / estados
- Flujos afectados: [lista o "ninguno"]
- Estados nuevos/modificados: [lista o "ninguno"]

### Impacto en API Worker
- Contrato afectado: [sí/no + detalle]
- ADR requerido: [sí/no]
```

### Plan de validación

```markdown
## Plan de validación
- Reusar checklist base: `docs/smoke-tests.md`
- Checks adicionales específicos de este spec:
  1. ...
```

### Definition of Done (DoD)

```markdown
## Definition of Done (DoD)
- [ ] Implementación completa según alcance.
- [ ] Pasa el plan de validación.
- [ ] No rompe invariantes de `docs/invariants.md`.
- [ ] ADRs añadidos/actualizados si aplica.
- [ ] Docs vivos actualizados (ver checklist).
```

### Actualizaciones de documentación viva al cerrar

```markdown
## Actualizaciones de docs al cerrar
Marcar qué debe actualizarse en `docs/` antes de cerrar el spec:
- [ ] `docs/system-overview.md`
- [ ] `docs/invariants.md`
- [ ] `docs/domain.md`
- [ ] `docs/storage.md`
- [ ] `docs/modes.md`
- [ ] `docs/flows.md`
- [ ] `docs/state-machine.md`
- [ ] `docs/worker-api.md`
- [ ] `docs/smoke-tests.md`
```

---

## Prompt sugerido para Speckit

Ver instrucciones en `README.md`.

