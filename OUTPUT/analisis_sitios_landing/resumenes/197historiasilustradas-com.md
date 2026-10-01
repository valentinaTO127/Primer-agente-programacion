# 197 Historias Ilustradas

**URL:** https://www.197historiasilustradas.com/ · **Fecha de análisis:** 2026-10-01

## Contenido
Archivo de memoria con 197 retratos ilustrados de personas detenidas desaparecidas nacidas en Uruguay o bajo responsabilidad del Estado uruguayo (décadas de 1960 a 1980). Cada ficha tiene ilustración, relato breve con audio, datos biográficos y artista. Incluye la sección "Sobre el proyecto" y el directorio de artistas.

## Enfoque
Traducir la memoria colectiva a nuevas generaciones mediante ilustración y relatos que mezclan datos reales con ficción. Cada artista retrata a alguien con quien comparte algo (barrio, pasatiempo, equipo).

## Público objetivo
Jóvenes, educadores, familias y público interesado en memoria y derechos humanos en Uruguay. Sitio bilingüe (ES/EN).

## Estructura
- Home: intro con frase en efecto máquina de escribir y botón [OMITIR], luego una grilla infinita de los 197 retratos.
- Tres vistas del mismo archivo: Grilla, Listado (con 8 categorías de filtro) y Galería (WebGL).
- `/obra/[n]`: ficha con relato, reproductor de audio, datos y navegación numerada 1–197.
- `/sobre-nosotros`: texto del proyecto, buscador de artistas y footer.

## UX
- Header fijo con las tres vistas siempre a mano; en móvil pasa a un menú negro a pantalla completa.
- Filtros y buscador en las vistas de archivo.
- Las páginas cambian sin recarga.
- Se puede omitir la intro.
- 10 enlaces de artistas están mal formados (les falta `https://`) y llevan a páginas del propio sitio.

## UI
- Fondo blanco y tipografía monoespaciada (Simplon Mono) en mayúsculas pequeñas.
- Corchetes como botones: `[ GRILLA ]`, `[ CERRAR ]`.
- La interfaz es casi invisible; el color lo aportan los 197 estilos de ilustración distintos.
