// Si hay patinadores guardados por gestion.html (crear/editar), se usan en vez de los de data.js
const patinadoresGuardados = localStorage.getItem("patinadores");
if (patinadoresGuardados) {
    patinadores = JSON.parse(patinadoresGuardados);
}

const galeria = document.getElementById("galeria");

// Colores de fondo por patinador según su campo "colorDegradado" (mismo truco que --card-color en las ponies)
const coloresDegradado = {
    azul: "rgba(59, 130, 246, 0.35)",
    morado: "rgba(168, 85, 247, 0.35)",
    amarillo: "rgba(234, 179, 8, 0.35)"
};

// Construye el HTML de una tarjeta a partir de un objeto patinador
function crearTarjetaPatinador(patinador) {
    const card = document.createElement("div");
    card.className = "pony-card";
    if (patinador.colorDegradado && coloresDegradado[patinador.colorDegradado]) {
        card.style.setProperty("--card-color", coloresDegradado[patinador.colorDegradado]);
    }

    const imagen = document.createElement("img");
    imagen.className = "pony-image";
    imagen.src = patinador.imagen;
    imagen.alt = patinador.nombre;

    const info = document.createElement("div");
    info.className = "pony-info";

    const nombre = document.createElement("h2");
    nombre.className = "pony-name";
    nombre.textContent = patinador.nombre;

    const datos = document.createElement("p");
    datos.className = "pony-type";
    datos.textContent = `${patinador.nacionalidad} · ${patinador.edad} años · ${patinador.activo ? "Activo" : "Retirado"}`;

    const titulo = document.createElement("p");
    titulo.className = "pony-type";
    titulo.textContent = patinador.tituloMasImportante;

    const descripcion = document.createElement("p");
    descripcion.className = "pony-description";
    descripcion.textContent = patinador.descripcion;

    const elementos = document.createElement("ul");
    elementos.className = "pony-powers";
    patinador.elementosInsignia.forEach(elemento => {
        const li = document.createElement("li");
        li.textContent = elemento;
        elementos.appendChild(li);
    });

    info.append(nombre, datos, titulo, descripcion, elementos);

    const brillo = document.createElement("div");
    brillo.className = "card-shine";

    card.append(imagen, info, brillo);

    activarTiltCard(card);

    return card;
}

// --- Efecto tilt 3D + brillo (como las cartas de Pokémon TCG) ---
const maxTilt = 12; // grados máximos de inclinación

function activarTiltCard(card) {
    card.addEventListener("mouseenter", () => {
        card.style.transition = "box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease";
        card.classList.add("is-hovering");
    });

    card.addEventListener("mousemove", (evento) => {
        const rect = card.getBoundingClientRect();
        const x = evento.clientX - rect.left;
        const y = evento.clientY - rect.top;

        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
        const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * maxTilt;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    });

    card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.5s ease, box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease";
        card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
        card.classList.remove("is-hovering");
    });
}

// Recorre el array, arma una tarjeta por cada patinador y la agrega a la galería.
// Al hacer click en una tarjeta, se abre en YouTube el video asociado (videoId).
patinadores.forEach((patinador) => {
    const card = crearTarjetaPatinador(patinador);
    card.addEventListener("click", () => {
        window.open(`https://www.youtube.com/watch?v=${patinador.videoId}`, "_blank");
    });
    galeria.appendChild(card);
});

// --- Modo claro / oscuro ---
const themeToggle = document.getElementById("theme-toggle");

function actualizarTextoBoton() {
    themeToggle.textContent = document.body.classList.contains("light")
        ? "🌙"
        : "☀️";
}

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}
actualizarTextoBoton();

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    actualizarTextoBoton();
});
