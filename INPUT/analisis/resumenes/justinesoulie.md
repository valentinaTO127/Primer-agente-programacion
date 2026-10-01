# Análisis: justinesoulie.fr

**URL:** https://justinesoulie.fr

## Contenido y enfoque
Portfolio profesional de Justine Soulié, directora de arte e ilustradora freelance
con base en París. El sitio funciona como escaparate de proyectos (Hermès,
ilustraciones, tipografía, misceláneos, "M - Lettre Infinie") dirigidos a
clientes/marcas y estudios creativos que buscan contratar servicios de
dirección de arte e ilustración. No hay blog ni contenido informativo: todo
gira en torno a mostrar trabajo terminado con máximo impacto visual.

## Público objetivo
Agencias creativas, marcas (moda/lujo, editorial) y reclutadores del sector
diseño/ilustración que evalúan estilo y calidad de producción antes de
contactar.

## Estructura
Home: cabecera fija minimalista (logo + "About") sobre un carrusel/galería
horizontal de proyectos renderizada en WebGL, cada tarjeta enlaza a un caso
de estudio (`/work/...`). La página About presenta una escena ilustrada
animada (día/noche, parallax) con bio corta, CTA "Contact me" y enlaces a
Mail, Twitter e Instagram a modo de pie de página.

## UX/UI
Diseño muy visual y experiencial: predominan animaciones 3D/WebGL (texturas
KTX comprimidas, escenas con parallax), cursor personalizado y transiciones
suaves entre vistas (SPA sin recargas, propio de Nuxt.js). La navegación es
deliberadamente escasa (solo Home/About) para no distraer del contenido
gráfico. Tipografía sans-serif (Inter) para UI y tipografías ilustradas/
hechas a mano para los títulos de marca. Paleta cálida y neutra de fondo
(beige) que deja resaltar las ilustraciones a color. El riesgo UX principal
es el tiempo de carga (texturas y bundle JS pesados) y la ausencia de
indicadores de navegación tradicionales (breadcrumbs, menú visible de
proyectos) en pantallas pequeñas.
