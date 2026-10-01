---
name: analizar-sitio-web
description: Analiza un sitio web de referencia y produce siempre tres entregables juntos — resumen .md (<300 palabras), estructura semántica en .xml y una fila para la matriz comparativa CSV. Use when the user gives a website URL (or has one open in the browser panel) and asks to analyze, review, or document it as a reference.
---

Cuando se active esta skill:

## 0. Obtener el sitio

1. Usa la URL que te dé el estudiante. Si no da URL, usa la pestaña abierta en el browser panel (`tabs_context`).
   Si no hay ni URL ni pestaña, pide la URL y no sigas.
2. Abre el sitio en el browser panel y revisa: el home completo (haz scroll hasta el footer), el menú de
   navegación (ábrelo si es hamburguesa u overlay), al menos una página interna (para ver la transición
   entre páginas) y la vista móvil (`resize_window` preset `mobile`; luego vuelve a `desktop`).
3. Para detectar tecnologías, inspecciona con `javascript_tool` y `read_network_requests`:
   - CMS / builder: `meta[name=generator]`, rutas `wp-content`, `cdn.shopify`, `webflow`, `framerusercontent`, `wixstatic`, `squarespace`, etc.
   - Librería de animación: `window.gsap`, `ScrollTrigger`, `Lenis`, `locomotive-scroll`, `lottie`, `three`, `framer-motion`, AOS, etc.
   - Librería frontend: `__NEXT_DATA__`, `__NUXT__`, `data-reactroot`, `ng-version`, `data-v-*`, `astro-island`, `_svelte`, jQuery, etc.
   - Tipografía principal: `getComputedStyle(document.body).fontFamily` y la de los `h1`.
4. **No inventes datos.** Si algo no se puede verificar, escribe `no_detectado` (o `ninguna` si se verificó que no hay).

## 1. Nombre de los archivos

- `slug` = dominio sin `https://`, sin `www.` y con los puntos cambiados por guiones (ej. `www.studio-x.com` → `studio-x-com`).
- Resumen: `OUTPUT/analisis_sitios_landing/resumenes/<slug>.md`
- Estructura: `OUTPUT/analisis_sitios_landing/xml/<slug>.xml`
- Crea las carpetas si no existen. Si el archivo ya existe, pregunta antes de sobrescribirlo.

## 2. Entregable 1 — Resumen (.md)

Menos de 300 palabras en total (cuéntalas antes de guardar). Estructura:

```markdown
# <Nombre del sitio>

**URL:** <url> · **Fecha de análisis:** AAAA-MM-DD

## Contenido
## Enfoque
## Público objetivo
## Estructura
## UX
## UI
```

Describe; no opines sobre la calidad artística (eso es del estudiante y su profesor).

## 3. Entregable 2 — Estructura semántica (.xml)

Usa **exactamente** este esquema. Solo estas etiquetas: `sitio`, `header`, `logo`, `nav`, `enlace`, `main`,
`section`, `footer`, `redes`, `contacto`. No inventes etiquetas nuevas.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitio nombre="..." url="...">
  <header>
    <logo>...</logo>
    <nav tipo="fija | hamburguesa | mega-menu | overlay-fullscreen">
      <enlace>...</enlace>
    </nav>
  </header>
  <main>
    <section tipo="hero">...</section>
    <section tipo="...">...</section>
  </main>
  <footer>
    <redes>...</redes>
    <contacto>...</contacto>
  </footer>
</sitio>
```

Reglas:
- `nav@tipo` toma **un solo** valor de: `fija`, `hamburguesa`, `mega-menu`, `overlay-fullscreen`.
- Un `<enlace>` por cada ítem del menú, con su texto visible.
- Un `<section>` por cada sección del home, en orden. La primera es `tipo="hero"`; las demás con un tipo
  descriptivo en minúscula (ej. `proyectos`, `servicios`, `testimonios`, `cta`). El contenido es una
  descripción corta de la sección.
- `<redes>`: redes sociales enlazadas (separadas por coma). `<contacto>`: correo, teléfono o formulario visible.
- Escapa `&`, `<`, `>` y comillas. Verifica que el XML esté bien formado antes de guardar.

## 4. Entregable 3 — Fila de la matriz comparativa

Exactamente 14 campos, en este orden, separados por ` ; ` (espacio, punto y coma, espacio):

```
url ; tipo_de_sitio ; cms_o_builder ; libreria_animacion ; libreria_frontend ; patron_navegacion ; num_secciones_home ; transicion_entre_paginas ; tipografia_principal ; estilo_visual ; fortaleza_ux ; oportunidad_mejora ; nombre_archivo_md ; nombre_archivo_xml
```

- `patron_navegacion` = el mismo valor que `nav@tipo` del XML.
- `num_secciones_home` = número de `<section>` del XML (incluye el hero).
- `nombre_archivo_md` / `nombre_archivo_xml` = solo el nombre (`<slug>.md`, `<slug>.xml`), sin ruta.
- Ningún valor puede contener `;` ni saltos de línea (cámbialos por `,`). Campos cortos: máximo una frase.
- Cuenta los campos antes de guardar: deben ser 14.

Archivo: `OUTPUT/analisis_sitios_landing/matriz_comparativa.csv` (UTF-8).
- Si no existe, créalo con la línea de encabezado de arriba como primera línea.
- Si existe, **anexa** la fila al final. Nunca borres ni reescribas filas anteriores.
- Si la URL ya está en la matriz, avisa y pregunta si agregar otra fila o no.

## 5. Respuesta en el chat

Muestra siempre los tres entregables juntos, claramente marcados:

```
### Entregable 1 — Resumen (<slug>.md)
<contenido del resumen>

### Entregable 2 — Estructura semántica (<slug>.xml)
<contenido del XML>

### Entregable 3 — Fila de la matriz comparativa
<la fila>
```

Al final, lista las rutas de los tres archivos guardados/actualizados y los campos que quedaron como `no_detectado`.
