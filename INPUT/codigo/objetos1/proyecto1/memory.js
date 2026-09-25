// Juego de memoria (flip cards) con los patinadores de data.js / localStorage.
// Adaptado de "cardGame" — Copyright (c) 2026 Julian Bejarano, licencia MIT
// (https://codepen.io/julianbejarano/pen/myrzjBG). Ver cardgame/LICENSE.txt.
//
// Todo vive dentro de una IIFE: las variables del juego (carta1, intentos, el timer...) no son
// globales y no chocan con las de game.js. Hacia afuera solo sale la función iniciarMemoria().
const iniciarMemoria = (() => {
    const PARES_MAXIMOS = 8;
    const PARES_MINIMOS = 2;

    // --- Elementos del HTML ---
    const tablero = document.getElementById("tablero");
    const mensajeJuego = document.getElementById("juego-mensaje");
    const hudTimer = document.getElementById("hud-timer");
    const hudIntentos = document.getElementById("hud-intentos");
    const hudPares = document.getElementById("hud-pares");
    const hudRecord = document.getElementById("hud-record");
    const overlayVictoria = document.getElementById("overlay-victoria");

    // --- Estado del juego ---
    let carta1 = null;
    let carta2 = null;
    let esperando = false; // bloquea clics mientras se comparan dos cartas
    let paresEncontrados = 0;
    let paresTotales = 0;
    let intentos = 0;
    let segundosJuego = 0;
    let timerInterval = null;

    // Se reciben desde game.js al llamar iniciarMemoria()
    let mejorPuntaje = null;
    let guardarPartida = () => {};

    // --- Datos: mismos patinadores que la galería (localStorage si el CRUD guardó algo, si no data.js) ---
    function obtenerPatinadores() {
        try {
            const guardados = localStorage.getItem("patinadores");
            if (guardados) {
                return JSON.parse(guardados);
            }
        } catch {
            // Si el JSON está dañado se usan los de data.js
        }
        return patinadores;
    }

    // Fisher-Yates: desordena una COPIA del array (el original no se toca)
    function shuffle(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]]; // intercambio con desestructuración
        }
        return copia;
    }

    // --- Cronómetro (formatearTiempo viene de usuarios.js) ---
    function iniciarTimer() {
        clearInterval(timerInterval); // evita que corran dos timers a la vez al reiniciar
        segundosJuego = 0;
        timerInterval = setInterval(() => {
            segundosJuego++;
            hudTimer.textContent = formatearTiempo(segundosJuego);
            hudTimer.classList.toggle("danger", segundosJuego >= 120);
        }, 1000);
    }

    function detenerTimer() {
        clearInterval(timerInterval);
    }

    // --- Puntaje (esMejorPuntaje viene de usuarios.js) ---
    function textoPuntaje(puntaje) {
        return puntaje ? `${puntaje.intentos} int. · ${formatearTiempo(puntaje.segundos)}` : "—";
    }

    // --- Cartas ---
    // Se arma con createElement + textContent (no con innerHTML): si un nombre del CRUD trae
    // etiquetas HTML, se muestran como texto y no se ejecutan
    function crearCarta(patinador) {
        const carta = document.createElement("div");
        carta.className = "flip-card";
        carta.dataset.id = patinador.id;

        const interior = document.createElement("div");
        interior.className = "flip-card-inner";

        // Reverso: solo CSS + un emoji, sin depender de una imagen externa
        const frente = document.createElement("div");
        frente.className = "flip-card-front";
        frente.textContent = "⛸️";

        const dorso = document.createElement("div");
        dorso.className = "flip-card-back";

        const imagen = document.createElement("img");
        imagen.src = patinador.imagen;
        imagen.alt = patinador.nombre;

        const info = document.createElement("div");
        info.className = "info-carta";

        const nombre = document.createElement("p");
        nombre.className = "nombre-carta";
        nombre.textContent = patinador.nombre;

        // Si no tiene título (es opcional en el CRUD) se muestra la nacionalidad
        const titulo = document.createElement("p");
        titulo.className = "titulo-carta";
        titulo.textContent = (patinador.tituloMasImportante || "").trim() || patinador.nacionalidad || "";

        info.append(nombre, titulo);
        dorso.append(imagen, info);
        interior.append(frente, dorso);
        carta.appendChild(interior);

        carta.addEventListener("click", () => manejarClic(carta));
        return carta;
    }

    function renderizarTablero() {
        tablero.innerHTML = "";

        // Solo patinadores con imagen: una carta sin imagen no se puede reconocer
        const disponibles = obtenerPatinadores().filter((patinador) => patinador.imagen);

        if (disponibles.length < PARES_MINIMOS) {
            mensajeJuego.textContent = "No hay suficientes patinadores con imagen para jugar. Agrega más desde Gestión.";
            mensajeJuego.hidden = false;
            return;
        }
        mensajeJuego.hidden = true;

        // 8 al azar (o los que haya si son menos), duplicados para formar los pares, y mezclados otra vez
        const seleccion = shuffle(disponibles).slice(0, PARES_MAXIMOS);
        const mazo = shuffle(seleccion.concat(seleccion));
        paresTotales = seleccion.length;
        hudPares.textContent = `0/${paresTotales}`;

        mazo.forEach((patinador) => tablero.appendChild(crearCarta(patinador)));

        iniciarTimer();
    }

    // --- Lógica de un turno ---
    function manejarClic(carta) {
        if (esperando) return;
        if (carta.classList.contains("volteada")) return;
        if (carta.classList.contains("encontrada")) return;

        carta.classList.add("volteada");

        // Primera carta del turno: se guarda y se espera la segunda
        if (!carta1) {
            carta1 = carta;
            return;
        }

        // Segunda carta: cuenta como intento y se compara por id
        carta2 = carta;
        intentos++;
        hudIntentos.textContent = intentos;
        esperando = true;

        if (carta1.dataset.id === carta2.dataset.id) {
            procesarParEncontrado();
        } else {
            setTimeout(voltearDeNuevo, 900);
        }
    }

    function procesarParEncontrado() {
        carta1.classList.replace("volteada", "encontrada");
        carta2.classList.replace("volteada", "encontrada");

        paresEncontrados++;
        hudPares.textContent = `${paresEncontrados}/${paresTotales}`;
        limpiarSeleccion();

        if (paresEncontrados === paresTotales) {
            detenerTimer();
            setTimeout(mostrarVictoria, 500);
        }
    }

    function voltearDeNuevo() {
        carta1.classList.remove("volteada");
        carta2.classList.remove("volteada");
        limpiarSeleccion();
    }

    function limpiarSeleccion() {
        carta1 = null;
        carta2 = null;
        esperando = false;
    }

    // --- Victoria y récord ---
    function mostrarVictoria() {
        const puntaje = { intentos, segundos: segundosJuego, pares: paresTotales };
        const esRecord = esMejorPuntaje(puntaje, mejorPuntaje);

        // Toda partida terminada se guarda; el récord solo se actualiza en pantalla si es mejor
        guardarPartida(puntaje);

        if (esRecord) {
            mejorPuntaje = puntaje;
            hudRecord.textContent = textoPuntaje(mejorPuntaje);
        }

        document.getElementById("victoria-record").textContent = esRecord
            ? "🏅 ¡Nuevo récord!"
            : `Tu récord: ${textoPuntaje(mejorPuntaje)}`;
        document.getElementById("stat-tiempo").textContent = formatearTiempo(segundosJuego);
        document.getElementById("stat-intentos").textContent = intentos;
        document.getElementById("stat-pares").textContent = `${paresTotales}/${paresTotales}`;

        overlayVictoria.hidden = false;
    }

    // --- Reiniciar: estado en cero y tablero nuevo (otros 8 al azar) ---
    function reiniciarJuego() {
        overlayVictoria.hidden = true;
        limpiarSeleccion();
        paresEncontrados = 0;
        intentos = 0;
        hudIntentos.textContent = "0";
        hudTimer.textContent = "00:00";
        hudTimer.classList.remove("danger");
        renderizarTablero();
    }

    document.getElementById("btn-reiniciar").addEventListener("click", reiniciarJuego);
    document.getElementById("btn-jugar-de-nuevo").addEventListener("click", reiniciarJuego);

    // Se llama desde game.js después del login.
    // opciones.mejorPuntaje: mejor partida del usuario (o null si nunca ha terminado una)
    // opciones.guardarPartida: función que guarda cada partida terminada en localStorage
    return function iniciarMemoria(opciones) {
        mejorPuntaje = opciones.mejorPuntaje || null;
        guardarPartida = opciones.guardarPartida;
        hudRecord.textContent = textoPuntaje(mejorPuntaje);
        reiniciarJuego();
    };
})();
