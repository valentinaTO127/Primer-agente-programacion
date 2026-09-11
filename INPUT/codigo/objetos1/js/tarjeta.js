// Construye el HTML de una tarjeta a partir de un objeto pony (patrón: crear elementos + asignarles clase/contenido)
function crearTarjetaPony(pony) {
    const card = document.createElement("div");
    card.className = "pony-card";
    if (pony.color) {
        card.style.setProperty("--card-color", pony.color);
    }

    const imagen = document.createElement("img");
    imagen.className = "pony-image";
    imagen.src = pony.imagen;
    imagen.alt = pony.nombre;

    const info = document.createElement("div");
    info.className = "pony-info";

    const nombre = document.createElement("h2");
    nombre.className = "pony-name";
    nombre.textContent = pony.nombre;

    const tipo = document.createElement("p");
    tipo.className = "pony-type";
    tipo.textContent = `${pony.tipo} · ${pony.edad} años`;

    const descripcion = document.createElement("p");
    descripcion.className = "pony-description";
    descripcion.textContent = pony.descripcion;

    const poderes = document.createElement("ul");
    poderes.className = "pony-powers";
    pony.poderes.forEach(poder => {
        const li = document.createElement("li");
        li.textContent = poder;
        poderes.appendChild(li);
    });

    info.append(nombre, tipo, descripcion, poderes);

    const brillo = document.createElement("div");
    brillo.className = "card-shine";

    card.append(imagen, info, brillo);

    activarTiltCard(card);

    return card;
}

// --- Efecto tilt 3D + brillo (como las cartas de Pokémon TCG) ---
const maxTilt = 12; // grados máximos de inclinación

function activarTiltCard(card) {
    // Al entrar el cursor, activa la transición de sombra y el brillo
    card.addEventListener("mouseenter", () => {
        card.style.transition = "box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease";
        card.classList.add("is-hovering");
    });

    // En cada movimiento, calcula qué tanto inclinar la carta según la posición del cursor
    card.addEventListener("mousemove", (evento) => {
        const rect = card.getBoundingClientRect();
        const x = evento.clientX - rect.left;
        const y = evento.clientY - rect.top;

        // Distancia del cursor al centro de la carta, convertida a grados de rotación
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
        const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * maxTilt;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        // --mx/--my mueven el brillo (.card-shine) hacia donde está el cursor
        card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    });

    // Al salir el cursor, la carta vuelve a su posición neutral con una transición suave
    card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.5s ease, box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease";
        card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
        card.classList.remove("is-hovering");
    });
}
