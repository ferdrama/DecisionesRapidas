# ADR 0005: Estrategia de cache en Service Worker

**Estado**: Aceptado  
**Fecha**: 2025-12-12  

## Contexto
Como PWA, se quiere:
- Carga rápida.
- Funcionamiento offline básico.
- Actualizaciones visibles al usuario.

`sw.js` precachea el shell y usa:
- Network-first para navegación.
- Cache-first para assets.
- Notificación `SW_ACTIVATED` para recarga.

## Decisión
Mantener la estrategia actual de cache:
- Precache de shell en `install`.
- Limpieza de caches antiguos en `activate`.
- Network-first en documentos para detectar nuevas versiones.
- Cache-first en estáticos para rapidez/offline.

## Consecuencias
- UX buena offline/online.
- Actualizaciones requieren bump de `CACHE_NAME`.
- La lista de assets debe mantenerse consistente con el árbol real.

## Alternativas consideradas
- Cache-first también para navegación.  
  Rechazado porque dificulta detectar updates de HTML.

