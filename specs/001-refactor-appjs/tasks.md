# Tareas: Refactorizar app.js a ES Modules

## Fase 1: Configuración e Infraestructura
- [x] T001 Crear estructura de directorios `src/`
- [x] T002 Extraer configuración a `src/config.js` (API_BASE, MODES)
- [x] T003 Extraer utilidades puras a `src/utils.js` (formatters, random logic)
- [x] T004 Extraer lógica de almacenamiento a `src/storage.js` (Lists, History)

## Fase 2: API y Lógica de Negocio
- [x] T005 [US2] Extraer cliente API a `src/api.js` (fetchWeights)
- [x] T006 [US1] Crear `src/game.js` con gestión de estado, lógica compartida de giro y lógica de modo binario
- [x] T007 [US2] Actualizar `src/game.js` con lógica de modo IA
- [x] T008 [US3, US4] Actualizar `src/game.js` con lógica de modo Lista (incluyendo Lista con IA)
- [x] T008b [US5] Actualizar `src/game.js` con lógica de modo Dado

## Fase 3: UI y Renderizado
- [x] T009 [US1, US5] Crear `src/ui.js` con caché DOM, ayudantes básicos de renderizado y soporte UI de Dado
- [x] T010 [US3] Implementar renderizado de Listas y lógica de Modales en `src/ui.js`
- [x] T011 [US2] Implementar renderizado de Gráfico de Pesos y Meta de Decisión en `src/ui.js`
- [x] T012 [US1] Implementar renderizado de Historial en `src/ui.js`

## Fase 4: Ensamblaje y Cambio
- [x] T013 Crear punto de entrada `src/app.js` y conectar Event Listeners
- [x] T014 Actualizar `index.html` para usar `type="module"` y apuntar a `src/app.js`
- [x] T015 Verificar manualmente que todos los modos funcionen (Binario, IA, Listas, Lista IA, Dado, Historial)
- [x] T016 Eliminar `app.js` original

## Dependencias
- La Fase 1 bloquea la Fase 2
- La Fase 2 bloquea la Fase 3 (La lógica de juego necesita existir para conectarse a la UI, o viceversa, pero usualmente la lógica primero)
- La Fase 3 bloquea la Fase 4

## Estrategia de Implementación
- Construiremos la nueva estructura en `src/` mientras el antiguo `app.js` mantiene el sitio funcionando.
- `src/app.js` será la pieza final que conecta todo.
- El cambio ocurre en T014.
