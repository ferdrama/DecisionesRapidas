# Quickstart: Comprobación manual de actualizaciones

## Objetivo

Probar que desde el menú de hamburguesa se puede:
1) comprobar si hay actualización,
2) obtener un resultado claro,
3) si hay actualización, aceptar y aplicar la nueva versión.

## Requisitos

- Navegador con soporte de Service Worker.
- Servir la PWA desde HTTP (no `file://`).

## Ejecución local

1. En la raíz del repo, servir estático:
   - `python -m http.server 8083`
2. Abrir: `http://localhost:8083/`
3. Verificar que el Service Worker está registrado (DevTools → Application → Service Workers).

## Caso A: No hay actualización

1. Abrir el menú de hamburguesa.
2. Pulsar “Comprobar actualizaciones”.
3. Confirmar que aparece un mensaje indicando que no hay actualización disponible.

## Caso B: Hay actualización disponible (simulación)

Una forma simple de simular una nueva versión es cambiar el contenido del SW (por ejemplo, incrementando `CACHE_NAME` en `sw.js`) y volver a servir el sitio.

1. Con la app abierta, realizar un cambio de versión del SW.
2. Volver a la app (sin cerrar pestaña) y abrir el menú.
3. Pulsar “Comprobar actualizaciones”.
4. Confirmar que la app informa de que hay una nueva versión y ofrece “Actualizar”.
5. Aceptar la actualización.
6. Confirmar que la app recarga una sola vez y queda en la versión nueva.

## Caso C: Sin conexión

1. Abrir la app.
2. Poner el navegador en modo offline (DevTools → Network → Offline).
3. Abrir el menú y pulsar “Comprobar actualizaciones”.
4. Confirmar que la app muestra un mensaje de imposibilidad de comprobación sin romper la experiencia.

## Checklist base

Reusar: `docs/smoke-tests.md`
