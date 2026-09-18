// Si hay patinadores guardados de una sesión anterior, se usan en vez de los de data.js
const patinadoresGuardados = localStorage.getItem("patinadores");
if (patinadoresGuardados) {
    patinadores = JSON.parse(patinadoresGuardados);
}

function guardarPatinadores() {
    localStorage.setItem("patinadores", JSON.stringify(patinadores));
}

const cuerpoTabla = document.querySelector("#tabla-patinadores tbody");

// Limpia la tabla y la vuelve a armar a partir del array "patinadores" (de data.js)
function renderizarTabla() {
    cuerpoTabla.innerHTML = "";

    patinadores.forEach((patinador) => {
        const fila = document.createElement("tr");

        const nombre = document.createElement("td");
        nombre.textContent = patinador.nombre;

        const nacionalidad = document.createElement("td");
        nacionalidad.textContent = patinador.nacionalidad;

        const edad = document.createElement("td");
        edad.textContent = patinador.edad;

        const estado = document.createElement("td");
        estado.textContent = patinador.activo ? "Activo" : "Retirado";

        fila.append(nombre, nacionalidad, edad, estado);
        cuerpoTabla.appendChild(fila);
    });
}

// Llena el <select> de la sección "Eliminar" con el nombre de cada patinador
const selectEliminar = document.getElementById("select-eliminar");

function renderizarSelectEliminar() {
    selectEliminar.innerHTML = "";

    patinadores.forEach((patinador, indice) => {
        const opcion = document.createElement("option");
        opcion.value = indice;
        opcion.textContent = patinador.nombre;
        selectEliminar.appendChild(opcion);
    });
}

// Llena el <select> de la sección "Actualizar" con el nombre de cada patinador
const selectActualizar = document.getElementById("select-actualizar");

function renderizarSelectActualizar() {
    selectActualizar.innerHTML = "";

    patinadores.forEach((patinador, indice) => {
        const opcion = document.createElement("option");
        opcion.value = indice;
        opcion.textContent = patinador.nombre;
        selectActualizar.appendChild(opcion);
    });
}

renderizarTabla();
renderizarSelectEliminar();
renderizarSelectActualizar();

// --- Sidebar: cambia de sección (Mostrar todos / Crear / Actualizar / Eliminar) ---
const botonesSidebar = document.querySelectorAll(".sidebar-link");
const secciones = document.querySelectorAll(".gestion[data-seccion]");

function mostrarSeccion(nombreSeccion) {
    botonesSidebar.forEach((boton) => {
        boton.classList.toggle("is-active", boton.dataset.seccion === nombreSeccion);
    });

    secciones.forEach((seccion) => {
        seccion.hidden = seccion.dataset.seccion !== nombreSeccion;
    });
}

botonesSidebar.forEach((boton) => {
    boton.addEventListener("click", () => mostrarSeccion(boton.dataset.seccion));
});

// --- Formulario: crear un nuevo patinador y agregarlo al array ---
const formularioCrear = document.getElementById("formulario-crear");

formularioCrear.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = new FormData(formularioCrear);

    const nuevoPatinador = {
        nombre: datos.get("nombre").trim(),
        nacionalidad: datos.get("nacionalidad").trim(),
        edad: Number(datos.get("edad")),
        activo: datos.get("activo") === "true",
        tituloMasImportante: datos.get("tituloMasImportante").trim(),
        elementosInsignia: datos.get("elementosInsignia")
            .split(",")
            .map((elemento) => elemento.trim())
            .filter((elemento) => elemento !== ""),
        descripcion: datos.get("descripcion").trim(),
        imagen: datos.get("imagen").trim(),
        videoId: datos.get("videoId").trim()
    };

    if (datos.get("colorDegradado")) {
        nuevoPatinador.colorDegradado = datos.get("colorDegradado");
    }

    if (datos.get("posicion") === "inicio") {
        patinadores.unshift(nuevoPatinador);
    } else {
        patinadores.push(nuevoPatinador);
    }
    guardarPatinadores();
    renderizarTabla();
    renderizarSelectEliminar();
    renderizarSelectActualizar();
    cargarPatinadorEnFormulario();

    formularioCrear.reset();
    mostrarSeccion("mostrar");
});

// --- Formulario: eliminar el patinador seleccionado ---
const formularioEliminar = document.getElementById("formulario-eliminar");

formularioEliminar.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = new FormData(formularioEliminar);
    const indice = Number(datos.get("indice"));

    if (Number.isNaN(indice) || !patinadores[indice]) {
        return;
    }

    patinadores.splice(indice, 1);
    guardarPatinadores();
    renderizarTabla();
    renderizarSelectEliminar();
    renderizarSelectActualizar();
    cargarPatinadorEnFormulario();

    mostrarSeccion("mostrar");
});

// --- Formulario: actualizar el patinador seleccionado ---
const formularioActualizar = document.getElementById("formulario-actualizar");

// Copia los datos del patinador seleccionado a los campos del formulario
function cargarPatinadorEnFormulario() {
    const patinador = patinadores[Number(selectActualizar.value)];
    if (!patinador) {
        return;
    }

    formularioActualizar.nombre.value = patinador.nombre;
    formularioActualizar.nacionalidad.value = patinador.nacionalidad;
    formularioActualizar.edad.value = patinador.edad;
    formularioActualizar.activo.value = String(patinador.activo);
    formularioActualizar.tituloMasImportante.value = patinador.tituloMasImportante || "";
    formularioActualizar.elementosInsignia.value = (patinador.elementosInsignia || []).join(", ");
    formularioActualizar.descripcion.value = patinador.descripcion || "";
    formularioActualizar.imagen.value = patinador.imagen || "";
    formularioActualizar.videoId.value = patinador.videoId || "";
    formularioActualizar.colorDegradado.value = patinador.colorDegradado || "";
}

selectActualizar.addEventListener("change", cargarPatinadorEnFormulario);
cargarPatinadorEnFormulario();

formularioActualizar.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = new FormData(formularioActualizar);
    const indice = Number(datos.get("indice"));

    if (Number.isNaN(indice) || !patinadores[indice]) {
        return;
    }

    patinadores[indice] = {
        nombre: datos.get("nombre").trim(),
        nacionalidad: datos.get("nacionalidad").trim(),
        edad: Number(datos.get("edad")),
        activo: datos.get("activo") === "true",
        tituloMasImportante: datos.get("tituloMasImportante").trim(),
        elementosInsignia: datos.get("elementosInsignia")
            .split(",")
            .map((elemento) => elemento.trim())
            .filter((elemento) => elemento !== ""),
        descripcion: datos.get("descripcion").trim(),
        imagen: datos.get("imagen").trim(),
        videoId: datos.get("videoId").trim()
    };

    if (datos.get("colorDegradado")) {
        patinadores[indice].colorDegradado = datos.get("colorDegradado");
    }

    guardarPatinadores();
    renderizarTabla();
    renderizarSelectEliminar();
    renderizarSelectActualizar();

    mostrarSeccion("mostrar");
});

// --- Modo claro / oscuro (mismo comportamiento que index.js) ---
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
