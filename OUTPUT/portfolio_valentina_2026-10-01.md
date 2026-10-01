# Portfolio Valentina Torres — 2026-10-01

Brief: [INPUT/portfolio/ValentinaTorres.md](../INPUT/portfolio/ValentinaTorres.md) · Código: [INPUT/codigo/portfolio-valentina/](../INPUT/codigo/portfolio-valentina/)

## Qué se construyó
| Pieza | Archivo | Concepto clave |
|---|---|---|
| Preloader con % | `src/modules/preloader.js` | Promesas: cada asset es una promesa, el % = resueltas / total |
| Smooth scroll | `src/modules/scroll.js` | Lenis movido por `gsap.ticker` (un solo loop de frames) |
| Header fijo + panel móvil | `src/modules/nav.js` | Timeline GSAP pausada: `play()` abre, `reverse()` cierra |
| Hero 3D | `src/modules/hero.js` | Three.js: escena, cámara, luces, `setAnimationLoop` |
| Carrusel WebGL (5 proyectos) | `src/modules/carousel.js` | Scroll = única fuente de verdad; drag y clic solo mueven el scroll |
| Info del proyecto activo | `src/modules/projectInfo.js` | `Math.round(current)` → índice activo |

## Decisiones
- 5 proyectos en vez de 19 (el array en `src/data/projects.js` admite más sin tocar código).
- Modelo 3D, imágenes, correo y redes son **placeholders**.
- `prefers-reduced-motion`: sin Lenis ni animaciones. Sin WebGL: fallback con `<img>` y scroll-snap.

## Bug encontrado al probar
- **Síntoma:** clic y drag no movían el carrusel.
- **Causa:** `.work__fallback` tenía `hidden`, pero el CSS `display: flex` lo anulaba → div transparente encima del canvas robando los clics.
- **Lección:** el atributo `hidden` es solo un `display: none` del navegador con baja especificidad; cualquier regla `display` lo pisa. Solución: `[hidden] { display: none !important; }`.
- **Cómo detectarlo:** `document.elementFromPoint(x, y)` dice qué elemento recibe realmente el clic.

## Pendiente
- Reemplazar placeholders (`.glb` con `GLTFLoader`, imágenes reales, bio, contacto).
- Opcional: code-splitting de Three.js (bundle de ~170 kB gzip) y deploy en Vercel/Netlify.

## Cambios posteriores (misma sesión)
- Proyectos movidos a `src/data/projects.json` (array `proyectos`); `projects.js` solo lo importa.
- Todo el texto de la página en `src/data/info.json`, volcado por `src/modules/content.js` con atributos `data-text`. Se eliminó `contact.js`.
- Publicación: repo https://github.com/valentinaTO127/portfoliio con `vite.config.js` (`base: '/portfoliio/'`) y workflow `.github/workflows/deploy.yml`. Build OK; el deploy falla hasta activar Pages con fuente **GitHub Actions**. URL esperada: https://valentinato127.github.io/portfoliio/
