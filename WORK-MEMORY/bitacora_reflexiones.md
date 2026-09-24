# Bitácora de reflexiones — Agente de Talleres

Una entrada breve por sesión de clase: qué se aprendió o qué costó más, escrita al cierre de cada
sesión. **No es la bitácora del curso** (esa la lleva el profesor, en `bitacora_sesiones_curso.csv`,
fuera de esta carpeta) — esta es la reflexión personal del estudiante sobre su propio proceso.

## 2026-08-20

Hoy entendí la diferencia entre declarar una variable con `let` y usarla sin declararla — el
`ReferenceError` dejó de sentirse aleatorio en cuanto vi que siempre es la misma causa: un nombre
que nunca definí.

## 2026-08-22

Me costó organizar las referencias visuales por tema en vez de por sitio de origen. Al principio
quería agruparlas por dónde las encontré, pero agruparlas por lo que inspiran (color, tipografía,
layout) tiene más sentido para el proyecto.

## 2026-09-03

Hoy aprendí a usar toggle.

## 2026-09-04

Hoy aprendí a cambiar elementos HTML cuando se redimensiona el width de la pantalla, pero
usando JavaScript en vez de CSS: con `window.matchMedia('(min-width: 700px)')` obtengo un
objeto que se puede evaluar (`.matches`) y también escuchar (`addEventListener('change', ...)`)
para reaccionar cada vez que la pantalla cruza ese punto de quiebre.

## 2026-09-10

Lo que más me costó fue el cambio de contenido con JavaScript según el tamaño de pantalla.

## 2026-09-11

Hoy aprendí a usar objetos en JavaScript y a renderizarlos en HTML.

## 2026-09-16

Registro de los cambios de estilo que le pedí a la IA sobre la tarjeta de patinadores, en orden,
desde el primer resultado de estilo (cuando pedí que la carta fuera más vertical). La idea de este
registro es poder identificar qué probé aunque al final no se haya quedado en el código:

- "Haz que la carta sea más vertical y la imagen destaque mucho más" → la imagen pasó a
  `aspect-ratio: 3/4` a pantalla completa (sin padding alrededor) y se quitó el layout de imagen-a-
  un-lado que tenía antes en pantallas anchas.
- "Haz que el fondo pareciera ser hielo o nieve y que la carta tenga transparencia como si fuera
  vidrio" → primera versión: fondo con degradado azul + puntos simulando copos estáticos, tarjeta
  con efecto vidrio (blur + fondo translúcido).
- Pedí una foto real de pista de hielo para el fondo en modo claro, y gris casi negro + nieve
  cayendo animada en modo oscuro → esto reemplazó el degradado azul y los puntos estáticos del
  paso anterior, que quedaron sin uso.
- "Haz que la imagen de fondo conserve su tamaño y se repita" → cambié `background-size` de
  `cover` a `auto` + `repeat` (modo claro).
- "Haz que la carta sea un poco más horizontal 3:4" → aclaramos que la imagen ya estaba en 3:4
  (vertical), así que terminó en `1:1` (cuadrada), no en 3:4 literal ni en 4:3 horizontal.
- "Haz que el estado aparezca al costado superior derecho de la carta" → el badge Activo/Retirado
  dejó de estar junto al nombre y pasó a flotar sobre la imagen, en la esquina.
- "Haz que los elementos insignia aparezcan debajo del nombre" → cambié el orden de los bloques
  dentro de la tarjeta (antes iban después de la descripción).
- Pedí tipografía artística + blanco + sombreado de luz para "el título" → aclaramos que era el
  `h1` de la página, no el título dentro de la tarjeta; quedó con la fuente Cinzel Decorative +
  `text-shadow` en varias capas.
- Pedí más transparencia en la carta (modo claro) + más color/contraste en las insignias → bajé
  la opacidad de `--card-bg` y cambié las insignias de un fondo casi invisible a un degradado
  azul sólido con sombra de color.
- "Añádele un degradado sutil arriba de rojo" al fondo de la carta → se agregó esa capa; más
  adelante se volvió configurable por patinador/a en vez de ser siempre roja.
- "Agrégale el efecto maxtilt" → traje completo el efecto de inclinación 3D + brillo que sigue al
  cursor, del proyecto de ponies (`objetos1`).
- "Quítale el sombreado a las tags de insignia" → lo quité, pero en una edición posterior directa
  en el archivo (fuera de este chat) volvió a aparecer.
- "Haz que la luz del cursor en modo oscuro sea más suave" → agregué la variable `--shine-color`,
  más tenue en oscuro que en claro.
- Pedí colores de degradado distintos por patinador/a (amarillo/morado/azul) → el rojo dejó de
  ser el único color posible: ahora es el valor por defecto, y algunas tarjetas lo sobreescriben.
- Pedí un modal de video de YouTube en bucle al hacer click en la tarjeta → lo agregué; después,
  por el error 153, entendí que necesita servirse desde un servidor local, no abrirse como
  archivo suelto (`file://`).
- Pedí que el video quedara centrado en pantalla sin importar el scroll → encontré que
  `perspective` en el `body` rompía el `position: fixed` del modal (y de la nieve y el botón de
  tema); se resolvió moviendo `perspective` de `body` a `.galeria`.

Lo que más me queda de este repaso: varias decisiones de una iteración (el degradado azul del
fondo, los puntos estáticos, el layout imagen-a-un-lado, el aspect-ratio 3:4 de la imagen) se
probaron y después las reemplazó la siguiente instrucción, aunque no quedaron en la versión final
del código.

## 2026-09-18

Hoy aprendí a hacer CRUD con JavaScript y a usar `localStorage`.

## 2026-09-24

Hoy aprendí a hacer un **login en el front end** para proteger el CRUD de patinadores y, sobre
todo, a entender por qué no es seguridad real:

- **Login en front end:** formulario que valida usuario y contraseña contra `credenciales.js`,
  sesión que se cierra tras 5 minutos de inactividad, y la verificación separada en `login.js`
  con la función `verificarLogin()`.
- **Inyecciones de datos por consola:** vi las credenciales abriendo `credenciales.js` en el
  navegador, creé 10 patinadores con un ciclo `for` + `push` desde la consola sin hacer login,
  y entré al CRUD escribiendo a mano la sesión en `sessionStorage`. También aprendí por qué el
  navegador pide escribir `allow pasting` (protección contra self-XSS).
- **Endurecer el front end:** meter el código en una IIFE para que nada sea global (closure),
  guardar solo el hash SHA-256 de la contraseña, y revisar la sesión en cada operación. Aun así,
  `localStorage.setItem(...)` desde la consola sigue pudiendo cambiar los datos: la seguridad
  real solo existe con un backend que valide y guarde los datos.

Además: `id` propio para cada patinador con `siguienteId`, la función `renderizarObjetos()`
en la galería, filtros por país y estado, y un botón para restaurar los datos originales.
