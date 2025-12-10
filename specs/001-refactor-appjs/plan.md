# Plan de Refactorización: Modularización de `app.js`

Este documento describe el plan de ejecución para refactorizar el frontend de DecisionesRápidas, migrando de un archivo monolítico `app.js` a una arquitectura basada en ES Modules estándar, sin introducir bundlers ni herramientas de compilación complejas.

## A) Estado Actual ("As-Is")

Actualmente, toda la lógica del frontend reside en un único archivo `app.js` (~600 líneas) que mezcla múltiples responsabilidades:

1.  **Configuración Global**: Definición de `API_BASE` y variables de estado global (`currentMode`, `spinning`, `lastScores`).
2.  **Acceso al DOM**: Referencias directas a ~30 elementos del DOM al inicio del archivo.
3.  **Gestión de Estado (Storage)**: Objetos `StorageManager` y `HistoryManager` definidos inline para interactuar con `localStorage`.
4.  **Lógica de Negocio**:
    *   Definición de modos (`modes`).
    *   Lógica de sorteo (`pickWithWeights`, `chooseFinalOption`).
    *   Lógica de "giro" visual (`startSpin`, `intervalId`).
5.  **Integración con API**: Función `fetchWeights` que llama al Worker.
6.  **Lógica de UI/Renderizado**:
    *   Manipulación de clases en `body` y elementos (`setState`).
    *   Renderizado de listas (`renderLists`), historial (`renderHistory`) y gráficos de pesos (`renderWeightsChart`).
    *   Gestión de Modales (abrir/cerrar/guardar).
7.  **Event Listeners**: Asignación de eventos al final del archivo.

**Puntos Sensibles e Invariantes:**
*   **DOM**: El HTML depende de IDs específicos (`decision`, `decideButton`, `weightsChart`, etc.) que el JS espera encontrar.
*   **LocalStorage**: Se usan las claves `customLists` y `decisionHistory`. El formato de los objetos JSON almacenados debe preservarse intacto.
*   **Worker Contract**: Se espera una respuesta con `{ scores: [{id, score, label?}], reason: string }`. El campo `reason` se usa en la UI (`renderDecisionMeta`).
*   **Configuración**: `window.DR_API_BASE` se usa para inyectar la URL del backend en entornos no productivos.

## B) Arquitectura Objetivo ("To-Be")

Se adoptará una arquitectura de **ES Modules nativos**. El navegador cargará un punto de entrada `module` que importará las dependencias. No se usará build step (Webpack/Vite).

### Estructura de Archivos Propuesta

```text
/
├── index.html          (Actualizado a type="module")
├── styles.css          (Sin cambios)
├── src/
│   ├── config.js       (Constantes, API_BASE)
│   ├── storage.js      (Wrappers de localStorage: Lists y History)
│   ├── api.js          (Cliente API para el Worker)
│   ├── utils.js        (Funciones puras: random, formatters)
│   ├── ui.js           (Gestión del DOM, renderizado, modales)
│   ├── game.js         (Lógica de decisión, orquestación de "spin")
│   └── app.js          (Entrypoint: inicialización y event listeners)
```

### Responsabilidades de los Módulos

1.  **`src/config.js`**:
    *   Exporta `API_BASE`.
    *   Exporta constantes de modos (`MODES`).

2.  **`src/storage.js`**:
    *   Exporta `ListStorage` (get, save, delete).
    *   Exporta `HistoryStorage` (get, add, clear).
    *   Mantiene las claves `customLists` y `decisionHistory`.

3.  **`src/api.js`**:
    *   Exporta `fetchWeights(question, choices)`.
    *   Maneja errores de red y validación básica de respuesta (scores, reason).

4.  **`src/utils.js`**:
    *   Exporta `formatDateTime`, `formatScore`.
    *   Exporta `weightedRandom` (lógica pura de selección).

5.  **`src/ui.js`**:
    *   Mantiene referencias cacheadas a elementos del DOM (o los busca bajo demanda de forma eficiente).
    *   Exporta funciones de alto nivel: `renderLists`, `renderHistory`, `updateWeightsUI`, `setVisualMode`, `toggleModal`.
    *   No mantiene estado de negocio, solo refleja estado en UI.

6.  **`src/game.js`**:
    *   Mantiene el estado de la sesión actual (`currentMode`, `lastScores`).
    *   Orquesta el flujo: "Usuario hace click" -> "UI muestra loading" -> "API responde" -> "UI muestra resultado".
    *   Importa `api`, `storage`, `ui`, `utils`.

7.  **`src/app.js`**:
    *   Importa `game` y `ui`.
    *   Registra los `addEventListener` del DOM que llaman a métodos de `game` o `ui`.
    *   Inicializa la aplicación al cargar.

### Cambios en `index.html`
Se sustituirá:
```html
<script src="app.js"></script>
```
por:
```html
<script type="module" src="src/app.js"></script>
```
Esto asegura que el código se ejecute en modo estricto y con alcance de módulo (no global), y de forma diferida (`defer` implícito).

## C) Estrategia de Migración Incremental

La migración se realizará en fases para asegurar que la aplicación nunca deje de funcionar.

**Fase 1: Infraestructura y Utilidades Puras**
1.  Crear estructura de carpetas `src/`.
2.  Extraer `src/config.js` y `src/utils.js` (formatters, random).
3.  Extraer `src/storage.js` (copiar lógica de `StorageManager` y `HistoryManager`).
4.  *Verificación*: Crear un script temporal de prueba o importar estos módulos en el `app.js` actual (si se convirtiera a module) para verificar que leen los datos existentes correctamente.

**Fase 2: Extracción de API y Lógica de Negocio**
1.  Extraer `src/api.js` (lógica `fetchWeights`).
2.  Crear `src/game.js` preliminar con la lógica de estado (`currentMode`).
3.  *Verificación*: Comprobar que `fetchWeights` sigue comunicándose con el Worker correctamente.

**Fase 3: Extracción de UI y Renderizado**
1.  Crear `src/ui.js`. Mover toda la lógica de manipulación del DOM (`getElementById`, `classList`, `innerHTML`).
2.  Refactorizar funciones para que reciban datos como argumentos en lugar de leer variables globales.

**Fase 4: Ensamblaje y Switch**
1.  Crear `src/app.js` (nuevo entrypoint).
2.  Conectar los eventos del DOM a las funciones de `game.js` y `ui.js`.
3.  Cambiar `index.html` para apuntar a `src/app.js`.
4.  Eliminar el antiguo `app.js`.

## D) Testing y Validación

Para cada fase, se ejecutará el siguiente plan de pruebas manual ("Smoke Test"):

1.  **Carga Inicial**: La app carga sin errores en consola. Se ven las listas guardadas anteriormente.
2.  **Modo Binario (Sin IA)**: Click en "Decidir" -> Gira -> Muestra Sí/No. El fondo cambia de color.
3.  **Modo Binario (Con IA)**:
    *   Escribir pregunta -> Click "Decidir".
    *   Verificar estado "Pensando...".
    *   Verificar que aparecen los pesos y el gráfico.
    *   Verificar que aparece la "Razón" (`reason`) devuelta por el Worker.
4.  **Gestión de Listas**:
    *   Crear nueva lista.
    *   Editar lista existente.
    *   Seleccionar lista y decidir (verificar animación).
    *   Borrar lista.
5.  **Historial**:
    *   Verificar que las decisiones se guardan.
    *   Abrir modal de historial.
    *   Borrar una entrada.
    *   Borrar todo.

## E) Riesgos y Mitigaciones

| Riesgo | Mitigación |
| :--- | :--- |
| **Pérdida de contexto `this` o variables globales** | Al pasar a módulos, las variables ya no son globales (`window`). Se debe asegurar que todas las dependencias se importan explícitamente. |
| **Orden de carga del DOM** | `type="module"` es `defer` por defecto. El script se ejecutará después de parsear el HTML, por lo que `getElementById` funcionará correctamente. |
| **CORS / API Base** | Asegurar que `src/config.js` lee `window.DR_API_BASE` correctamente para entornos de desarrollo. |
| **Compatibilidad de Navegadores** | ES Modules tiene soporte universal en navegadores modernos (target de esta PWA). No se requiere polyfill para el alcance actual. |
| **Rutas relativas** | Al mover archivos a `src/`, verificar que cualquier referencia a assets (imágenes, iconos) siga siendo válida (aunque `app.js` actual no parece referenciar imágenes directamente). |

## F) Entregables

1.  `specs/001-refactor-appjs/plan.md` (Este documento).
2.  Código refactorizado en carpeta `src/`.
3.  `index.html` actualizado.
4.  Eliminación de `app.js` en la raíz.

**Notas de Despliegue:**
*   No se requieren cambios en el Worker.
*   En desarrollo local, asegurar que el servidor sirva los archivos con los tipos MIME correctos (`application/javascript` para `.js`). Herramientas como `http-server` o la extensión Live Server de VS Code lo hacen automáticamente.
