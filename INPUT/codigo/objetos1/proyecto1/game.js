// --- Validación de la contraseña con expresión regular ---
// Cada (?=...) es un lookahead: revisa una condición desde el inicio SIN consumir caracteres,
// así las 4 reglas se evalúan sobre toda la contraseña, sin importar el orden de los caracteres.
//   (?=(?:.*[A-Za-z]){4})  al menos 4 letras (en cualquier posición)
//   (?=(?:.*\d){4})        al menos 4 números (en cualquier posición)
//   (?=.*[A-Z])            al menos 1 mayúscula
//   (?=.*[^A-Za-z0-9\s])   al menos 1 carácter especial (ni letra, ni número, ni espacio)
const regexPassword = /^(?=(?:.*[A-Za-z]){4})(?=(?:.*\d){4})(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).*$/;

// Las mismas reglas por separado, solo para decirle al usuario cuál le falta
const reglasPassword = [
    { regex: /(?:.*[A-Za-z]){4}/, mensaje: "al menos 4 letras" },
    { regex: /(?:.*\d){4}/, mensaje: "al menos 4 números" },
    { regex: /[A-Z]/, mensaje: "al menos 1 mayúscula" },
    { regex: /[^A-Za-z0-9\s]/, mensaje: "al menos 1 carácter especial" }
];

// --- Validación del email con expresión regular ---
//   ^[^\s@]+     1 o más caracteres antes de la @ (cualquiera menos espacios y @)
//   @            exactamente una @
//   [^\s@]+      el dominio (ej. "gmail")
//   \.           un punto literal (sin la \ el punto significa "cualquier carácter")
//   [^\s@.]{2,}$ la terminación, mínimo 2 caracteres y sin puntos (ej. "com", "co")
// Es una validación práctica: revisa la forma usuario@dominio.ext, no que el correo exista.
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

const formularioLogin = document.getElementById("formulario-login");
const mensajeError = document.getElementById("login-error");
const seccionLogin = document.getElementById("login");
const seccionBienvenida = document.getElementById("bienvenida");
const mensajeBienvenida = document.getElementById("mensaje-bienvenida");

// --- Requisitos de la contraseña en tiempo real ---
const inputPassword = formularioLogin.elements.password;
const listaReglas = document.getElementById("reglas-password");

// Un <li> por regla, creado desde reglasPassword: si se agrega una regla, aparece sola en la lista
const itemsReglas = reglasPassword.map((regla) => {
    const item = document.createElement("li");
    item.textContent = regla.mensaje;
    listaReglas.appendChild(item);
    return item;
});

// Marca cada <li> como cumplido o no; itemsReglas[i] corresponde a reglasPassword[i]
function actualizarReglas() {
    const password = inputPassword.value;
    reglasPassword.forEach((regla, i) => {
        itemsReglas[i].classList.toggle("cumple", regla.regex.test(password));
    });
}

// "input" se dispara con cada tecla (y al pegar o borrar), no solo al salir del campo
inputPassword.addEventListener("input", actualizarReglas);

function mostrarError(texto) {
    mensajeError.textContent = texto;
    mensajeError.hidden = false;
}

// Recibe el usuario completo (no solo el alias): el juego necesita su id para buscar y guardar sus partidas
function entrar(usuario) {
    mensajeError.hidden = true;
    seccionLogin.hidden = true;
    mensajeBienvenida.textContent = `Bienvenido/a, ${usuario.alias}`;
    seccionBienvenida.hidden = false;

    // Arranca el juego (memory.js) recién ahora: el cronómetro no corre detrás del login.
    // leerUsuarios, mejorPartidaDe, registrarPartida... vienen de usuarios.js
    iniciarMemoria({
        mejorPuntaje: mejorPartidaDe(usuario.id),
        // Cada partida terminada se guarda, sea récord o no
        guardarPartida: (puntaje) => registrarPartida(usuario.id, puntaje)
    });
}

// Convierte un texto en su hash SHA-256 en hexadecimal (mismo método que login.js).
// Es async porque crypto.subtle.digest devuelve una Promise.
async function calcularHash(texto) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

// async: dentro se usa await para esperar el hash antes de comparar o guardar
formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = new FormData(formularioLogin);
    // trim() quita espacios al inicio y al final: "   " no cuenta como nombre
    const nombre = datos.get("nombre").trim();
    const alias = datos.get("alias").trim();
    // En minúsculas: "Ana@Gmail.com" y "ana@gmail.com" son el mismo usuario
    const email = datos.get("email").trim().toLowerCase();
    const password = datos.get("password");

    if (!regexEmail.test(email)) {
        mostrarError("Escribe un email válido, ej. nombre@correo.com");
        return;
    }

    // Lo que falta ya se ve en la lista de requisitos: aquí solo se avisa que no se puede entrar
    if (!regexPassword.test(password)) {
        mostrarError("La contraseña todavía no cumple todos los requisitos.");
        return;
    }

    // crypto.subtle solo existe en contextos seguros (https, localhost, 127.0.0.1)
    if (!crypto.subtle) {
        mostrarError("Este navegador no puede calcular el hash. Abre la página con Live Server.");
        return;
    }

    const usuarios = leerUsuarios();
    const usuario = usuarios.find((u) => u.email === email);
    const passwordHash = await calcularHash(password);

    // 1) El email ya está registrado: se compara el hash de lo que escribió con el guardado
    if (usuario) {
        if (usuario.passwordHash === passwordHash) {
            entrar(usuario);
        } else {
            mostrarError("Contraseña incorrecta.");
        }
        return;
    }

    // 2) El email no existe: nombre y alias solo son obligatorios para registrarse.
    // Se revisan ANTES del confirm para no preguntar "¿Deseas registrarte?" y luego fallar
    if (nombre === "" || alias === "") {
        mostrarError(`No hay una cuenta con ${email}. Para registrarte escribe tu nombre y tu alias.`);
        return;
    }

    // confirm() detiene la página hasta que el usuario responde: true (Aceptar) o false (Cancelar)
    if (!confirm(`No hay una cuenta con ${email}. ¿Deseas registrarte?`)) {
        return;
    }

    // El id se calcula con la lista recién leída: el más alto + 1
    const nuevoUsuario = { id: calcularSiguienteId(usuarios), nombre, alias, email, passwordHash };
    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);
    entrar(nuevoUsuario);
});

// --- Modo claro / oscuro (mismo comportamiento que index.js y gestion.js) ---
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
