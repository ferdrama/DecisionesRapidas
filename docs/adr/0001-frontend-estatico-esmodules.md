# ADR 0001: Frontend estático con ES modules (sin bundler)

**Estado**: Aceptado  
**Fecha**: 2025-12-12  

## Contexto
La app se despliega en GitHub Pages como PWA estática. En `index.html` se carga `src/app.js` con `type="module"` y no existe tooling de build en producción.

## Decisión
Mantener el frontend como **sitio estático** usando **JavaScript puro** y **ES modules**, sin frameworks SPA ni bundlers como requisito base.

## Consecuencias
- Deploy simple (copiar archivos estáticos).
- Menor complejidad operativa y de mantenimiento.
- Limitación: no hay optimizaciones automáticas de bundling/treeshaking; cualquier tooling futuro requerirá ADR.

## Alternativas consideradas
- Introducir bundler (Vite/Webpack) para empaquetar módulos.  
  Rechazado por aumentar complejidad para una app pequeña.

