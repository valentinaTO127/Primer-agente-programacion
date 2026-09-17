# Explicación de error — 2026-09-16

## Error 153 (YouTube embed)

**Tipo de error:** de entorno/configuración — no es un error de sintaxis ni de lógica en tu JS,
lo lanza el servicio externo (YouTube) porque la página no cumple una condición que él exige
para dejarte embeber un video.

**Qué significa en general:** el error 153 de la API de embeds de YouTube aparece cuando el
iframe se carga sin un "origin" (dominio) válido — YouTube necesita saber desde qué sitio real
(http/https) se está pidiendo el video para decidir si el embed está permitido.

**Dónde está en tu código:** `js/index.js`, función `abrirModalVideo`, donde se arma
`modalIframe.src` con la URL de `youtube.com/embed/...`. El código en sí está bien escrito — el
problema es cómo se está *sirviendo* `index.html`.

**Causa más probable:** estás abriendo el archivo con doble clic (la barra del navegador dice
`file:///C:/...`), y `file://` no es un origin http/https válido para YouTube.

**Corrección (concepto, no solo el paso):** servir la carpeta con un servidor local, para que la
página se cargue como `http://localhost:...` en vez de `file://`. Opciones:
- Extensión "Live Server" en VSCode (clic derecho sobre `index.html` → "Open with Live Server").
- Terminal: `npx serve .` o `python -m http.server` dentro de la carpeta del proyecto.

La idea general para recordar: cualquier API externa embebida (YouTube, mapas, pagos, etc.)
casi siempre necesita que tu página corra sobre un servidor real, no que la abras como archivo
suelto — es una medida de seguridad para que solo dominios autorizados puedan usar el embed.
