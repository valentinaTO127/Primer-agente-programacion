# Justine Soulié — Portfolio

**URL:** https://justinesoulie.fr/ · **Fecha de análisis:** 2026-10-01

## Contenido
Portafolio de Justine Soulié, directora de arte e ilustradora freelance en París. El home muestra 8 proyectos (Hermès, House of Frog, Pop Art Car, Ponpon Mania, M - Lettre Infinie, typography, extra, miscellaneous). Cada proyecto tiene una página con ficha técnica (rol, cliente, créditos), videos y texto descriptivo.

## Enfoque
El trabajo es el protagonista: casi no hay texto, y la ilustración se presenta como objeto físico (pósters de papel arrugado en WebGL).

## Público objetivo
Agencias, marcas y estudios de animación que buscan directora de arte o ilustradora freelance.

## Estructura
- Home: un solo bloque, un carrusel WebGL de pósters con el nombre y la categoría del proyecto activo.
- `/work/[proyecto]`: título, ficha, videos y enlace "next" al siguiente proyecto.
- `/about`: escena ilustrada día/noche con personaje, datos (París desde 2016, freelance desde 2023), redes y crédito al desarrollador (Patrick Heng).

## UX
- Navegación mínima: solo el nombre (vuelve al home) y "ABOUT".
- El carrusel se recorre arrastrando o haciendo clic en los pósters.
- Las páginas cambian sin recarga (SPA) y hay un preloader con una línea SVG.
- Los proyectos están en un listado de enlaces oculto, accesible para lectores de pantalla y buscadores.
- En móvil el carrusel se mantiene con un póster centrado.

## UI
- Fondo crema (#F4F0ED) y textos en gris/negro.
- Tipografía Inter en mayúsculas pequeñas para la UI; Modak (display) cargada para títulos ilustrados.
- El color lo ponen las piezas; la interfaz es neutra y deja que las ilustraciones resalten.
