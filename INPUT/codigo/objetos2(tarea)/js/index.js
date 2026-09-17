// --- Datos ---
// Array de objetos: cada objeto es una patinadora/patinador con la info que se muestra en su tarjeta.
// Campos:
//   nombre              -> texto que se muestra como título de la tarjeta (h2)
//   activo              -> boolean: true = "🟢 Activo", false = "🔴 Retirado" (badge de la tarjeta)
//   colorDegradado      -> opcional: "amarillo" | "morado" | "azul", define el color del degradado
//                          superior de la tarjeta (ver diccionario coloresDegradado más abajo).
//                          Si no está presente, la tarjeta usa el rojo por defecto definido en el CSS.
//   descripcion         -> texto libre, se muestra debajo del título/logro
//   edad                -> número, se combina con nacionalidad en la línea "meta"
//   tituloMasImportante -> el logro más destacado (medalla/campeonato)
//   elementosInsignia   -> array de strings con los saltos/elementos característicos, se pintan
//                          como una lista de "chips"
//   nacionalidad        -> texto, se combina con edad en la línea "meta"
//   imagen              -> URL de la foto (se usa como object-fit: contain dentro de la tarjeta)
//   videoId             -> opcional: ID del video de YouTube que se abre en el modal al hacer
//                          click en la tarjeta; si no está, la tarjeta no abre modal
const patinadores = [
    {
        nombre: "Alexandra Ignatova (Trusova)",
        activo: true,
        descripcion: "Reconocida por ser la primera mujer en ejecutar varios saltos cuádruples y aterrizar hasta cinco saltos cuádruples en un mismo programa",
        edad: 22,
        tituloMasImportante: " 🥈 Winter Olympics 2022",
        elementosInsignia: ["4Lz", "Cantilever", "4Lz+Eu+3S+2A"],
        nacionalidad: "Rusa",
        imagen: "https://i.postimg.cc/j2D5dcZ7/Alexandra-Trusova.png",
        videoId: "rr9kWE73XU8"
    },
    {
        nombre: "Alena Kostornaia",
        activo: false,
        colorDegradado: "azul",
        descripcion: "Conocida por su elegancia y líneas depuradas sobre el hielo, además de sus intentos de triple axel en competencia",
        edad: 22,
        tituloMasImportante: " 🥇 European Championships 2020",
        elementosInsignia: ["Ina Bauer", "Spread Eagle", "3A"],
        nacionalidad: "Rusa",
        imagen: "https://i.postimg.cc/1X8t5BJ6/Alionakostornaia.png",
        videoId: "sZcqWUK2RBg"
    },
    {
        nombre: "Ami Nakai",
        activo: true,
        descripcion: "Patinadora joven destacada por su consistencia técnica y por incorporar saltos cuádruples desde temprana edad",
        edad: 19,
        tituloMasImportante: " 🥉 Winter Olympics 2026",
        elementosInsignia: ["4Lo", "3A", "3Lz+3Lo"],
        nacionalidad: "Japonesa",
        imagen: "https://i.postimg.cc/Gt42hKqD/Ami-Nakai.png",
        videoId: "ISIOdd72j8w"
    },
    {
        nombre: "Anna Shcherbakova",
        activo: false,
        colorDegradado: "morado",
        descripcion: "Campeona olímpica reconocida por su combinación de dificultad técnica (varios cuádruples) con un programa muy pulido",
        edad: 21,
        tituloMasImportante: " 🥇 Winter Olympics 2022",
        elementosInsignia: ["4Lz", "4F", "3A"],
        nacionalidad: "Rusa",
        imagen: "https://i.postimg.cc/8c75P4tM/Anna-Shcherbakova.png",
        videoId: "pF68GHNB4Is"
    },
    {
        nombre: "Evgenia Medvedeva",
        activo: false,
        descripcion: "Referente de la interpretación artística en el patinaje, con programas muy expresivos y técnicamente sólidos",
        edad: 26,
        tituloMasImportante: " 🥈 Winter Olympics 2018",
        elementosInsignia: ["3Lz+3Lo", "Ina Bauer", "Layback spin"],
        nacionalidad: "Rusa",
        imagen: "https://i.postimg.cc/x8XCT5tL/Evgenia-Medvedeva.png",
        videoId: "eCf8MQ90478"
    },
    {
        nombre: "Ilia Malinin",
        activo: true,
        colorDegradado: "amarillo",
        descripcion: "Apodado 'Quad God' por ser el primero en aterrizar un axel cuádruple en competencia oficial",
        edad: 21,
        tituloMasImportante: " 🥇 World Championships 2026",
        elementosInsignia: ["4A", "4Lz+3T", "Backflip"],
        nacionalidad: "Estadounidense",
        imagen: "https://i.postimg.cc/PJCxry2m/Ilia-Malinin.png",
        videoId: "nWYOQZIDmxQ"
    },
    {
        nombre: "Kaori Sakamoto",
        activo: true,
        colorDegradado: "morado",
        descripcion: "Reconocida por su consistencia competitiva y su presencia escénica constante en programas cortos y largos",
        edad: 26,
        tituloMasImportante: " 🥈 Winter Olympics 2026",
        elementosInsignia: ["3A", "3F+3T", "Artistry"],
        nacionalidad: "Japonesa",
        imagen: "https://i.postimg.cc/1X8t5BJG/Kaori-Sakamoto.png",
        videoId: "_aIeUqiqGHA"
    },
    {
        nombre: "Nathan Chen",
        activo: false,
        colorDegradado: "amarillo",
        descripcion: "Apodado 'el rey de los cuádruples', reconocido por aterrizar hasta cinco saltos cuádruples en un mismo programa",
        edad: 26,
        tituloMasImportante: " 🥇 Winter Olympics 2022",
        elementosInsignia: ["4F", "4Lz",],
        nacionalidad: "Estadounidense",
        imagen: "https://i.postimg.cc/Gt42hKqP/Natan-Chen.png",
        videoId: "x6bL09DxciQ"
    },
    {
        nombre: "Yuna Kim",
        activo: false,
        colorDegradado: "amarillo",
        descripcion: "Conocida como 'la Reina Yuna', referente histórico del patinaje surcoreano por su técnica y expresividad",
        edad: 35,
        tituloMasImportante: " 🥇 Winter Olympics 2010",
        elementosInsignia: ["3Lz+3T", "Layback spin", "Spiral sequence"],
        nacionalidad: "Surcoreana",
        imagen: "https://i.postimg.cc/L5JX6DNB/Yuna-Kim.png",
        videoId: "lmnaBOTRNuE"
    },
    {
        nombre: "Yuzuru Hanyu",
        activo: false,
        colorDegradado: "azul",
        descripcion: "Bicampeón olímpico consecutivo, considerado uno de los patinadores más influyentes de la historia del deporte",
        edad: 31,
        tituloMasImportante: " 🥇 Winter Olympics 2014 y 2018",
        elementosInsignia: ["4Lo", "4S", "Ina Bauer", "Hydroblade"],
        nacionalidad: "Japonesa",
        imagen: "https://i.postimg.cc/T1KwY0Ct/Yuzuru-Hanyu.png",
        videoId: "iDsKdf4UjGg"
    }
]

// --- Construcción de tarjetas ---

// Diccionario que traduce el nombre corto de color (guardado en cada objeto de arriba)
// al valor rgba real que se le pasa a la variable CSS --card-accent (ver style.css).
// Así los datos quedan legibles ("azul") y el color exacto vive en un solo lugar.
const coloresDegradado = {
    amarillo: "rgba(234, 179, 8, 0.25)",
    morado: "rgba(147, 51, 234, 0.25)",
    azul: "rgba(37, 99, 235, 0.25)"
};

// Construye el HTML de una tarjeta a partir de un objeto patinadora.
// Patrón: se crea cada elemento con createElement, se le pone su className/contenido,
// y al final se van agregando (append) al padre correspondiente.
function crearTarjeta(patinadora) {
    const card = document.createElement("div");
    card.className = "tarjeta";
    // Si esta patinadora tiene un color de degradado propio, se lo pasamos a la tarjeta
    // como variable CSS (--card-accent). Si no tiene, el CSS usa su valor por defecto (rojo).
    if (patinadora.colorDegradado) {
        card.style.setProperty("--card-accent", coloresDegradado[patinadora.colorDegradado]);
    }

    const imagen = document.createElement("img");
    imagen.className = "tarjeta-imagen";
    imagen.src = patinadora.imagen;
    imagen.alt = patinadora.nombre; // alt por accesibilidad, no se ve en pantalla

    const info = document.createElement("div");
    info.className = "tarjeta-info";

    // El estado se ubica sobre la esquina superior derecha de la carta (ver CSS), no junto al nombre.
    // classList.add recibe el nombre de la clase según el boolean: "activo" o "retirado".
    const estado = document.createElement("span");
    estado.className = "tarjeta-estado";
    estado.classList.add(patinadora.activo ? "activo" : "retirado");
    estado.textContent = patinadora.activo ? "🟢 Activo" : "🔴 Retirado";

    const encabezado = document.createElement("div");
    encabezado.className = "tarjeta-encabezado";

    const nombre = document.createElement("h2");
    nombre.className = "tarjeta-nombre";
    nombre.textContent = patinadora.nombre;

    encabezado.append(nombre);

    // Línea combinada nacionalidad + edad, usando template string
    const meta = document.createElement("p");
    meta.className = "tarjeta-meta";
    meta.textContent = `${patinadora.nacionalidad} · ${patinadora.edad} años`;

    const titulo = document.createElement("p");
    titulo.className = "tarjeta-titulo";
    titulo.textContent = patinadora.tituloMasImportante;

    const descripcion = document.createElement("p");
    descripcion.className = "tarjeta-descripcion";
    descripcion.textContent = patinadora.descripcion;

    // Un <li> por cada elemento del array elementosInsignia (saltos/movimientos característicos)
    const insignias = document.createElement("ul");
    insignias.className = "tarjeta-insignias";
    patinadora.elementosInsignia.forEach(elemento => {
        const li = document.createElement("li");
        li.textContent = elemento;
        insignias.appendChild(li);
    });

    // Orden dentro de la tarjeta: nombre -> insignias -> nacionalidad/edad -> título -> descripción
    info.append(encabezado, insignias, meta, titulo, descripcion);

    // Div vacío que solo sirve de capa visual: el brillo que sigue al cursor (ver .card-shine en CSS)
    const brillo = document.createElement("div");
    brillo.className = "card-shine";

    card.append(imagen, estado, info, brillo);

    // Activa el efecto de inclinación 3D al pasar el mouse (función definida más abajo)
    activarTiltCard(card);

    // Al hacer click se abre el modal con el video de esta patinadora (si tiene videoId asignado)
    if (patinadora.videoId) {
        card.addEventListener("click", () => abrirModalVideo(patinadora.videoId));
    }

    return card;
}

// --- Efecto tilt 3D + brillo (como las cartas de Pokémon TCG) ---
// La idea: mientras el mouse se mueve sobre la tarjeta, se calcula qué tan lejos está el
// cursor del centro (en X y en Y) y esa distancia se convierte en grados de rotación.
const maxTilt = 4; // grados máximos de inclinación permitidos en cualquier eje

function activarTiltCard(card) {
    // Al entrar el cursor, activa la transición de sombra y el brillo
    card.addEventListener("mouseenter", () => {
        card.style.transition = "box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease";
        card.classList.add("is-hovering");
    });

    // En cada movimiento, calcula qué tanto inclinar la carta según la posición del cursor
    card.addEventListener("mousemove", (evento) => {
        // getBoundingClientRect da la posición/tamaño real de la tarjeta en la ventana
        const rect = card.getBoundingClientRect();
        // Posición del cursor relativa a la esquina superior izquierda de la tarjeta
        const x = evento.clientX - rect.left;
        const y = evento.clientY - rect.top;

        // Distancia del cursor al centro de la carta (normalizada de -1 a 1), convertida a grados.
        // Si el cursor está justo en el centro, rotateX/rotateY quedan en 0 (sin inclinación).
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
        const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * maxTilt;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        // --mx/--my mueven el centro del brillo radial (.card-shine) hacia donde está el cursor,
        // como porcentaje del ancho/alto de la tarjeta
        card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    });

    // Al salir el cursor, la carta vuelve a su posición neutral con una transición suave
    card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.5s ease, box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease";
        card.style.transform = "perspective(100px) rotateX(0deg) rotateY(0deg) scale(1)";
        card.classList.remove("is-hovering");
    });
}

// Recorre el array de datos y arma+agrega una tarjeta por cada patinadora, dentro de #galeria
const galeria = document.getElementById("galeria");
patinadores.forEach(patinadora => {
    const card = crearTarjeta(patinadora);
    galeria.appendChild(card);
});

// --- Modo claro / oscuro ---

const themeToggle = document.getElementById("theme-toggle");

// Cambia el ícono del botón según el tema actual (clase "light" en el body o no)
function actualizarTextoBoton() {
    themeToggle.textContent = document.body.classList.contains("light")
        ? "🌙" // si ya está en claro, el botón ofrece pasar a oscuro
        : "☀️"; // si está en oscuro, el botón ofrece pasar a claro
}

// Recupera la preferencia guardada del navegador (localStorage) al cargar la página,
// así el tema elegido se mantiene aunque se recargue o se cierre y abra de nuevo la pestaña
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}
actualizarTextoBoton();

// Cada clic alterna la clase "light" en el body (el CSS hace el resto) y guarda la preferencia
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    actualizarTextoBoton();
});

// --- Nieve cayendo (solo se ve en modo oscuro, controlado desde style.css) ---
// No se usa ninguna imagen: cada copo es un <span> con el carácter ❄ animado por CSS.

const CANTIDAD_COPOS = 40;

// Contenedor fijo que cubre toda la pantalla; los copos se agregan dentro de él.
// pointer-events:none (en el CSS) hace que no bloquee clicks sobre lo que hay debajo.
const contenedorNieve = document.createElement("div");
contenedorNieve.className = "nieve-cayendo";
document.body.appendChild(contenedorNieve);

for (let i = 0; i < CANTIDAD_COPOS; i++) {
    const copo = document.createElement("span");
    copo.className = "copo";
    copo.textContent = "❄";

    // Posición horizontal, tamaño, opacidad y deriva lateral al azar para que no se vean idénticos
    copo.style.left = `${Math.random() * 100}%`;
    copo.style.fontSize = `${8 + Math.random() * 14}px`;
    copo.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
    // --drift es la variable que usa la animación @keyframes caer (en CSS) como desplazamiento lateral final
    copo.style.setProperty("--drift", `${(Math.random() * 80 - 40).toFixed(0)}px`);

    // Duración al azar y delay negativo: un delay negativo hace que la animación arranque
    // como si ya llevara ese tiempo corriendo, así no todos los copos aparecen juntos arriba
    const duracion = 8 + Math.random() * 10;
    copo.style.animationDuration = `${duracion}s`;
    copo.style.animationDelay = `-${(Math.random() * duracion).toFixed(2)}s`;

    contenedorNieve.appendChild(copo);
}

// --- Modal con video de YouTube en bucle (tipo GIF) ---
// En vez de crear un modal nuevo por cada tarjeta, se arma UNA sola vez (al cargar la página)
// y se reutiliza: cada click solo cambia el "src" del iframe y muestra/oculta el overlay.

const modalOverlay = document.createElement("div");
modalOverlay.className = "modal-overlay";

const modalContenido = document.createElement("div");
modalContenido.className = "modal-contenido";

const modalCerrar = document.createElement("button");
modalCerrar.className = "modal-cerrar";
modalCerrar.textContent = "✕";
modalCerrar.setAttribute("aria-label", "Cerrar video"); // para lectores de pantalla, ya que el botón no tiene texto visible descriptivo

const modalIframe = document.createElement("iframe");
modalIframe.className = "modal-video";
modalIframe.allow = "autoplay; encrypted-media";
modalIframe.allowFullscreen = true;

modalContenido.append(modalCerrar, modalIframe);
modalOverlay.append(modalContenido);
document.body.appendChild(modalOverlay);

// Arma la URL del embed de YouTube y la asigna al iframe para que empiece a reproducirse
function abrirModalVideo(videoId) {
    // autoplay=1 + mute=1: los navegadores solo permiten reproducir automático si está muteado
    // loop=1 + playlist=ID: truco para que YouTube repita el mismo video en bucle (loop=1 solo no alcanza)
    // controls=0: sin controles, para que se vea y se sienta como un GIF, no como un reproductor
    modalIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
    modalOverlay.classList.add("visible");
}

function cerrarModalVideo() {
    modalOverlay.classList.remove("visible");
    modalIframe.src = ""; // vaciar el src detiene la reproducción (si solo se ocultara, seguiría sonando/gastando datos)
}

modalCerrar.addEventListener("click", cerrarModalVideo);

// Cerrar al hacer click fuera del video (sobre el fondo oscuro), pero no si el click fue dentro
// del video: por eso se compara evento.target (lo que se clickeó) contra modalOverlay (el fondo)
modalOverlay.addEventListener("click", (evento) => {
    if (evento.target === modalOverlay) {
        cerrarModalVideo();
    }
});

// Cerrar con la tecla Escape, sin importar en qué parte de la página esté el foco
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        cerrarModalVideo();
    }
});
