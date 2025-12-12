# Refactor: modularizar `app.js` sin cambios funcionales (DecisionesRápidas)

## Resumen
Este trabajo es un **refactor** (no una feature): reorganizar y modularizar el código actualmente concentrado en `app.js` para reducir acoplamiento y facilitar evolución, **manteniendo el comportamiento actual intacto** en todos los modos y flujos existentes.

## Contexto
- PWA estática (HTML/CSS/JS puro) desplegada en GitHub Pages.
- Backend mínimo: Cloudflare Worker que expone `POST /api/weights` y actúa como proxy seguro hacia OpenRouter.
- La PWA **no** debe llamar a OpenRouter directamente bajo ningún concepto.
- Existen varios modos de decisión (p. ej. Sí/No con IA on/off, listas, dado, historial).

## Problema actual
- `app.js` concentra demasiadas responsabilidades (UI, estado, storage, lógica de decisión, IA, renderizado de pesos, modales, listeners), lo que:
  - aumenta el riesgo de regresiones,
  - dificulta añadir nuevos modos o refinar la UX,
  - hace más difícil testear o razonar sobre cambios.

## Objetivos (GOALS)
- Separar responsabilidades del código en módulos o secciones claramente delimitadas (UI, storage, IA, lógica de sorteo, utilidades), reduciendo el “todo-en-uno”.
- Mantener **100%** de compatibilidad funcional: mismos modos, mismos flujos, mismos textos y misma persistencia.
- Mantener el despliegue simple (PWA estática + Worker), sin introducir tooling pesado como primer paso.
- Facilitar futuras mejoras (nuevos tipos de decisión, mejoras UI) dejando una base más mantenible.

## No-objetivos (NON-GOALS)
- No se cambian diseños, estilos ni copy/textos visibles.
- No se introducen nuevas features ni nuevos modos.
- No se modifica el contrato público del Worker ni sus rutas.
- No se cambia el formato o claves de `localStorage` (sin migraciones).
- No se añade un bundler/SPA framework “grande” (webpack/vite/react/etc.) en este hito.

## Alcance
### En alcance (IN SCOPE)
- Reorganización del código de frontend (principalmente `app.js`) para:
  - extraer funciones puras/utilidades,
  - encapsular acceso a `localStorage`,
  - aislar la integración IA (fetch a `/api/weights`),
  - aislar la lógica de sorteo ponderado,
  - aislar render/UI (incluyendo estado/visualización de pesos y modales).
- Ajustes mínimos en `index.html` necesarios para soportar la nueva estructura (p. ej. `type="module"`), **solo si** no rompe GitHub Pages ni el comportamiento.

### Fuera de alcance (OUT OF SCOPE)
- Rediseño de UI, cambios de estilo, accesibilidad avanzada, i18n, etc.
- Cambios en Cloudflare Worker más allá de lo estrictamente necesario para mantener compatibilidad (si ya funciona, debe seguir igual).
- Optimización avanzada de rendimiento o analítica.

---

## Invariantes funcionales (lo que NO puede cambiar)

### Modos y flujos
- Todos los modos existentes deben seguir disponibles y funcionando igual:
  - **Sí/No sin IA**: selección 50/50 y **sin llamadas de red**.
  - **Sí/No con IA**: obtiene pesos desde el Worker y permite sorteo ponderado.
  - **Listas**: crear/editar/eliminar listas, seleccionar lista, decidir.
  - **Listas con IA** (si existe en la UI actual): al activar el toggle correspondiente, los pesos se obtienen del Worker y el sorteo usa esos pesos.
  - **Dado** (si existe): sigue funcionando igual.
  - **Historial**: se registra y se puede limpiar/gestionar como hasta ahora.

### Persistencia (localStorage)
- Se deben conservar **las mismas claves** y **el mismo formato** que usa la app actualmente (ej.: `customLists`, `decisionHistory`).
- No debe existir migración silenciosa ni pérdida de datos.
- Si `localStorage` no está disponible (modo privado extremo / bloqueo), el comportamiento debe degradar sin crash (como mínimo: no romper la app).

### Configuración de API base
- Debe mantenerse el mecanismo actual para configurar el destino del Worker (por ejemplo `window.DR_API_BASE` o equivalente), y su comportamiento:
  - En producción apunta al Worker de producción.
  - En desarrollo puede sobreescribirse para apuntar al Worker local.

### Contrato del Worker (frontend ↔ worker)
- Ruta: `POST /api/weights`
- Request:
  - Incluye `question` y `choices` con IDs estables.
- Response mínima requerida (para no romper el frontend actual):
  - `scores`: array de `{ id, score }` con `score` entero 0..100, y **todas** las opciones exactamente una vez.
  - `reason`: string (texto breve explicando el sesgo), si el frontend actual lo espera.
  - Campos extra (p. ej. `meta`) pueden existir, pero no son requeridos por el frontend.

### Seguridad
- MUST NOT: ninguna API key/token en frontend, repo, ni GitHub Pages.
- El Worker es la única pieza que habla con OpenRouter.

---

## Historias de usuario (User Stories)

### US-01: Decisión Sí/No (IA OFF)
Como usuario, quiero introducir una pregunta de Sí/No y obtener una decisión aleatoria 50/50, sin depender de red.
- Resultado visible inmediato.
- No se realiza ninguna llamada a `/api/weights`.

### US-02: Decisión Sí/No (IA ON)
Como usuario, quiero que la app use IA para ponderar “Sí” y “No” según la pregunta, y luego decida al azar con esos pesos.
- Se muestra el JSON de pesos devuelto por el Worker.
- Se muestra el estado de la IA (cargando / ok / error).
- Si falla el Worker o el modelo, la app no crashea; el usuario puede desactivar IA y seguir con 50/50.

### US-03: Decisión por lista (IA OFF)
Como usuario, quiero elegir una lista (predefinida o creada por mí) y que la app decida al azar entre sus opciones.
- Soporta añadir/eliminar/editar listas sin perder datos.
- Selección al azar uniforme si no hay IA.

### US-04: Decisión por lista (IA ON, si está soportado actualmente)
Como usuario, en modo lista, quiero activar un toggle “usar IA” para que la app pondere opciones antes de decidir.
- Debe respetar el toggle de IA propio del modo lista (si existe).
- Si la IA falla, no debe bloquear la app.

### US-05: Dado (si existe)
Como usuario, quiero lanzar un dado (u otra variante existente) y ver el resultado como hasta ahora.

### US-06: Historial
Como usuario, quiero que mis decisiones queden registradas y pueda consultarlas y limpiarlas.
- Se conserva el formato actual del historial en `localStorage`.
- Los controles de “borrar uno / borrar todo” (si existen) funcionan igual.

---

## Requisitos no funcionales (constraints)
- **Sin tooling pesado**: evitar introducir bundlers/frameworks como requisito para el refactor.
- **Compatibilidad GitHub Pages**: el resultado debe seguir desplegando y funcionando como sitio estático.
- **Tamaño y rendimiento**: no debe aumentar de forma visible la latencia de interacción. No añadir llamadas de red nuevas.
- **Mantenibilidad**:
  - Favorecer funciones puras donde aplique.
  - Reducir dependencias globales y side-effects.
  - “Un módulo = una responsabilidad principal” (sin ser dogmático).

---

## Criterios de aceptación (auditables)

### Comportamiento
1. Con IA desactivada (Sí/No), **no** hay requests al Worker (Network tab vacío respecto a `/api/weights`).
2. Con IA activada (Sí/No), se realiza `POST /api/weights` y se muestran `scores` válidos.
3. Listas e historial siguen funcionando con los mismos datos existentes en `localStorage` (sin pérdida ni migración).
4. No cambia la URL/ruta del Worker ni el contrato requerido por el frontend.
5. No hay errores en consola en los flujos normales.

### Seguridad
6. No hay secrets en el repo: búsquedas por patrones de keys/tokens no deben arrojar resultados.
7. No existe fetch directo a `openrouter.ai` en el frontend.

---

## Plan de validación (smoke checklist manual)
Ejecutar tras el refactor, en **producción** y en **local**:

1) **Sí/No IA OFF**
- Desactivar IA → “Elegir ahora” varias veces → resultado ok.
- Ver Network: 0 llamadas a `/api/weights`.

2) **Sí/No IA ON**
- Activar IA → “Calcular pesos” → aparecen `scores` + `reason` (si aplica).
- “Elegir ahora” → decide usando pesos.

3) **Listas**
- Crear lista nueva, añadir opciones, guardar.
- Seleccionar lista, decidir varias veces.
- Cerrar/abrir página → lista sigue.
- Editar y eliminar lista.

4) **Historial**
- Tras varias decisiones, el historial refleja entradas nuevas.
- Borrar una (si existe) y/o borrar todo.

5) **Dado** (si existe)
- Probar el modo y verificar resultado.

6) **Degradación**
- Simular Worker no disponible (cambiar `DR_API_BASE` a una URL inválida) con IA ON:
  - La UI muestra error, la app no crashea.
  - Al desactivar IA, vuelve a 50/50.

---

## Riesgos y mitigaciones
- **Riesgo: romper IDs/clases del DOM** (listeners no enganchan).
  - Mitigación: no tocar markup salvo mínimo imprescindible; smoke checklist.
- **Riesgo: romper orden de inicialización** (estado/DOM no listo).
  - Mitigación: entrypoint claro (init) y pruebas en carga fresca.
- **Riesgo: cambiar por accidente el formato de `localStorage`**.
  - Mitigación: encapsular storage sin transformar estructuras; pruebas con datos existentes.
- **Riesgo: cambios accidentales en el contrato del Worker** (p. ej. quitar `reason`).
  - Mitigación: fijar invariantes del contrato en este spec y mantener validación estricta.

---

## Definition of Done (DoD)
- `app.js` (o su equivalente modular) queda reorganizado con separación clara de responsabilidades.
- Pasa el smoke checklist completo (local + producción).
- No hay secretos en frontend/repo.
- No hay cambios de comportamiento observables para el usuario final.
- El refactor queda documentado de forma mínima (README/checklist actualizado si hace falta).
