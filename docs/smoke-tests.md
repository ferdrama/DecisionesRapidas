# Smoke checklist manual

Ejecutar tras cambios relevantes en frontend o Worker.

## 1) Sí/No IA OFF (`binary`)
- Seleccionar modo “Sí / No”.
- Pulsar “Decidir” varias veces.
- Confirmar que **no** hay requests a `/api/weights`.

## 2) Sí/No IA ON (`binaryAI`)
- Seleccionar “Sí / No (IA)”.
- Escribir pregunta.
- Pulsar “Decidir”.
- Ver:
  - POST `/api/weights` 200.
  - Se muestran `scores` y `reason`.
  - Resultado final usa ponderación.
- Simular fallo de Worker (cambiar `DR_API_BASE` a URL inválida):
  - UI muestra error, la app no crashea.
  - Al volver a modo manual, funciona 50/50.

## 3) Dado (`dice`)
- Seleccionar “Dado de seis caras”.
- Pulsar “Decidir” varias veces.
- Resultado entre 1 y 6, sin red.

## 4) Listas
- Crear lista nueva con ≥2 opciones.
- Seleccionarla desde el menú.
- **IA OFF**:
  - “Decidir” → resultado uniforme.
  - Recargar página → lista persiste.
- **IA ON**:
  - Activar “Decidir listas con IA”.
  - “Decidir” → POST `/api/weights` 200.
  - Pesos visibles y resultado ponderado.
- Editar nombre/opciones y verificar persistencia.
- Eliminar lista y confirmar que desaparece.

## 5) Historial
- Abrir Historial.
- Confirmar que aparecen entradas nuevas.
- Borrar una entrada.
- Borrar todo el historial.

## 6) PWA / Offline
- Recargar con red desconectada:
  - La app abre (shell cacheado).
  - Modos manuales funcionan.
  - IA falla con error controlado.

## 7) PWA / Comprobar actualizaciones
- Abrir el menú → pulsar “Comprobar actualizaciones”.
  - Sin cambios recientes: informa “No hay actualizaciones disponibles”.
  - Tras actualizar el SW (p. ej. cambiando `CACHE_NAME`): ofrece “Actualizar ahora”, recarga una sola vez.

