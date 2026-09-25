// Datos de usuarios y partidas en localStorage. Lo usan game.html y gestion.html.
//
// Dos listas separadas, conectadas por id (como dos tablas de una base de datos):
//   "usuarios": [{ id, nombre, alias, email, passwordHash }]
//   "partidas": [{ id, usuarioId, fecha, intentos, segundos, pares }]
// usuarioId dice de quién es cada partida. El mejor puntaje no se guarda: se calcula desde "partidas".

const CLAVE_USUARIOS = "usuarios";
const CLAVE_PARTIDAS = "partidas";

// localStorage solo guarda strings: cada lista se guarda como texto JSON y se convierte de vuelta al leerla
function leerLista(clave) {
    try {
        // Si la clave no existe, getItem devuelve null y se usa "[]" (array vacío)
        return JSON.parse(localStorage.getItem(clave) || "[]");
    } catch {
        // Si alguien dejó un texto que no es JSON válido (ej. editándolo en DevTools), se empieza de cero
        return [];
    }
}

function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
}

function leerUsuarios() {
    return leerLista(CLAVE_USUARIOS);
}

function guardarUsuarios(usuarios) {
    guardarLista(CLAVE_USUARIOS, usuarios);
}

function leerPartidas() {
    return leerLista(CLAVE_PARTIDAS);
}

function guardarPartidas(partidas) {
    guardarLista(CLAVE_PARTIDAS, partidas);
}

// El siguiente id libre es el id más alto de la lista + 1 (mismo método que los patinadores en gestion.js):
// no se repite aunque se recargue la página, porque siempre se calcula desde lo guardado
function calcularSiguienteId(lista) {
    return lista.reduce((idMaximo, elemento) => Math.max(idMaximo, elemento.id || 0), 0) + 1;
}

// --- Puntajes ---
// Gana el de menos intentos; si empatan, el de menos tiempo
function esMejorPuntaje(puntaje, record) {
    if (!record) {
        return true;
    }
    if (puntaje.intentos !== record.intentos) {
        return puntaje.intentos < record.intentos;
    }
    return puntaje.segundos < record.segundos;
}

// Recorre las partidas del usuario y se queda con la mejor (null si nunca ha terminado una)
function mejorPartidaDe(usuarioId, partidas = leerPartidas()) {
    return partidas
        .filter((partida) => partida.usuarioId === usuarioId)
        .reduce((mejor, partida) => (esMejorPuntaje(partida, mejor) ? partida : mejor), null);
}

// Guarda una partida terminada con su propio id y la fecha actual (formato ISO, ej. "2026-09-25T15:30:00.000Z")
function registrarPartida(usuarioId, puntaje) {
    const partidas = leerPartidas();
    const partida = {
        id: calcularSiguienteId(partidas),
        usuarioId,
        fecha: new Date().toISOString(),
        intentos: puntaje.intentos,
        segundos: puntaje.segundos,
        pares: puntaje.pares
    };
    partidas.push(partida);
    guardarPartidas(partidas);
    return partida;
}

// --- Formatos para mostrar ---
function formatearTiempo(segundos) {
    const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
    const ss = String(segundos % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

// La fecha se guarda en ISO (universal) y se muestra en el formato local del navegador
function formatearFecha(fechaIso) {
    if (!fechaIso) {
        return "Sin fecha";
    }
    return new Date(fechaIso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

// --- Datos guardados antes de que existieran los ids y las partidas ---
// 1) Usuarios sin id: se les asigna uno.
// 2) El mejorPuntaje que se guardaba dentro del usuario se convierte en una partida "sin fecha"
//    (así no se pierde el récord) y se borra del usuario.
// Solo escribe en localStorage si cambió algo.
function actualizarDatosAntiguos() {
    const usuarios = leerUsuarios();
    const partidas = leerPartidas();
    let huboCambios = false;

    usuarios.forEach((usuario) => {
        if (usuario.id === undefined) {
            usuario.id = calcularSiguienteId(usuarios);
            huboCambios = true;
        }
    });

    usuarios.forEach((usuario) => {
        if (usuario.mejorPuntaje) {
            partidas.push({
                id: calcularSiguienteId(partidas),
                usuarioId: usuario.id,
                fecha: null,
                intentos: usuario.mejorPuntaje.intentos,
                segundos: usuario.mejorPuntaje.segundos,
                pares: null
            });
            delete usuario.mejorPuntaje;
            huboCambios = true;
        }
    });

    if (huboCambios) {
        guardarUsuarios(usuarios);
        guardarPartidas(partidas);
    }
}

actualizarDatosAntiguos();
