# ITom — Creative 3D Portfolio

**URL:** https://itomdev.com · **Fecha de análisis:** 2026-10-01

## Contenido
Portfolio de Tomasz Szmajda ("ITom"), desarrollador creativo freelance de Polonia especializado en sitios interactivos con animaciones "hand-drawn". El sitio es en sí mismo la pieza de demostración: una experiencia narrativa gamificada (fachada con puertas, corredor, vuelo por la historia, sala de proyectos giratoria) hecha con React/Next.js, GSAP y CSS/SVG 3D, sin modelos 3D reales. Documenta premios (Awwwards, FWA, CSSDA, Orpetron, CSS Winner) y proyectos (Adam & Ewa, 67 Game, Young Multi, ITom Sketchbook).

## Enfoque
Convertir el propio portfolio en una pieza jugable que demuestra, en vivo, su especialidad en animación e interacción creativa.

## Público objetivo
Estudios y marcas que buscan un desarrollador freelance de alto nivel en front-end creativo/animación; también la comunidad de diseño web (jueces de premios, medios como Codrops) como vitrina de prestigio.

## Estructura
Sin menú tradicional: la navegación ocurre mediante "logros" gamificados (Explorer, Wanderer, Sky Walker, Director, Art Critic, Sociable). Debajo existe una versión accesible en HTML semántico con About, Projects, Content/Press, Awards y FAQ.

## UX
- Navegación por interacción (clic en puertas, drag, scroll narrativo) en vez de menú convencional — sacrifica previsibilidad, mitigado con una capa de accesibilidad HTML paralela con navegación estándar de respaldo.
- *Nota:* el `nav@tipo` del XML se marcó como `fija` por aproximación, ya que ninguno de los 4 valores del esquema describe bien una navegación gamificada.
- Transiciones fluidas, pensadas "mechanics first" incluso en móvil.

## UI
Estilo cuaderno/boceto a lápiz (CabinSketch, RubikScribble), sonido ambiental y efectos de puertas/papel.
