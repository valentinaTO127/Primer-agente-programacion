// Todo el archivo vive dentro de una función que se ejecuta sola (IIFE): así nada de lo que se
// declara aquí (patinadores, guardarPatinadores, siguienteId, la sesión...) es global, y desde la
// consola no se puede leer ni llamar.
// verificarLogin (de login.js) se recibe como parámetro: gestion.js se queda con la función
// original, aunque después alguien intente reemplazarla desde la consola.
((patinadoresDeDataJs, verificarLogin) => {
    // Copia privada del array de data.js: si alguien hace patinadores.push(...) en la consola,
    // modifica el array global, no esta copia
    let patinadores = JSON.parse(JSON.stringify(patinadoresDeDataJs));

    // Copia intacta de data.js para "Restaurar datos originales" (nunca se modifica ni se guarda)
    const patinadoresOriginales = JSON.parse(JSON.stringify(patinadoresDeDataJs));

    // Si hay patinadores guardados de una sesión anterior, se usan en vez de los de data.js
    const patinadoresGuardados = localStorage.getItem("patinadores");
    if (patinadoresGuardados) {
        patinadores = JSON.parse(patinadoresGuardados);
    }

    // Estado de la sesión: variables privadas (antes estaban en sessionStorage y se podían escribir a mano)
    let sesionIniciada = false;
    let ultimaActividad = 0;
    const tiempoMaximoInactivo = 5 * 60 * 1000; // 5 minutos en milisegundos

    // Solo guarda si hay sesión: sin login no se escribe nada en localStorage
    function guardarPatinadores() {
        if (!sesionIniciada) {
            return;
        }
        localStorage.setItem("patinadores", JSON.stringify(patinadores));
    }

    // El siguiente id libre es el id más alto del array + 1 (así no se repiten aunque se recargue o se elimine)
    function calcularSiguienteId() {
        return patinadores.reduce((idMaximo, patinador) => Math.max(idMaximo, patinador.id || 0), 0) + 1;
    }

    let siguienteId = calcularSiguienteId();

    // Los patinadores guardados antes de que existieran los ids no tienen uno: se les asigna aquí
    // (se guardan en localStorage con la primera operación CRUD después del login)
    patinadores.forEach((patinador) => {
        if (patinador.id === undefined) {
            patinador.id = siguienteId;
            siguienteId++;
        }
    });

    // --- CRUD: solo se arma (tabla, selects, eventos de los formularios) después de un login correcto ---
    function iniciarGestion() {
        const cuerpoTabla = document.querySelector("#tabla-patinadores tbody");

        // Limpia la tabla y la vuelve a armar a partir del array "patinadores"
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
        // Solo los botones dentro de .sidebar: los botones de los formularios también usan la clase
        // .sidebar-link (por estilo) y no deben cambiar de sección
        const botonesSidebar = document.querySelectorAll(".sidebar .sidebar-link");
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
            // Cada operación vuelve a revisar la sesión (ej. si alguien dispara el submit desde la consola)
            if (!sesionIniciada) {
                return;
            }

            const datos = new FormData(formularioCrear);

            const nuevoPatinador = {
                id: siguienteId,
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
            siguienteId++;

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
            if (!sesionIniciada) {
                return;
            }

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
            if (!sesionIniciada) {
                return;
            }

            const datos = new FormData(formularioActualizar);
            const indice = Number(datos.get("indice"));

            if (Number.isNaN(indice) || !patinadores[indice]) {
                return;
            }

            patinadores[indice] = {
                id: patinadores[indice].id, // se conserva el id: actualizar no crea un patinador nuevo
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

        // --- Formulario: restaurar los datos originales de data.js ---
        const formularioRestaurar = document.getElementById("formulario-restaurar");

        formularioRestaurar.addEventListener("submit", (evento) => {
            evento.preventDefault();
            if (!sesionIniciada) {
                return;
            }

            if (!confirm("¿Seguro? Se perderán los patinadores creados, editados o eliminados desde el CRUD.")) {
                return;
            }

            // Se copia de nuevo: si se asignara patinadoresOriginales directamente, el CRUD lo modificaría
            patinadores = JSON.parse(JSON.stringify(patinadoresOriginales));
            siguienteId = calcularSiguienteId();

            guardarPatinadores();
            renderizarTabla();
            renderizarSelectEliminar();
            renderizarSelectActualizar();
            cargarPatinadorEnFormulario();

            mostrarSeccion("mostrar");
        });
    }

    // --- Login y sesión ---
    const seccionLogin = document.getElementById("login");
    const layoutGestion = document.querySelector(".layout");
    const formularioLogin = document.getElementById("formulario-login");
    const mensajeErrorLogin = document.getElementById("login-error");

    function sesionVencida() {
        return Date.now() - ultimaActividad >= tiempoMaximoInactivo;
    }

    // sessionStorage solo guarda el aviso de "sesión cerrada" para mostrarlo tras recargar,
    // no la sesión en sí (escribirlo a mano no da acceso a nada)
    function cerrarSesion() {
        sesionIniciada = false;
        sessionStorage.setItem("sesionExpirada", "true");
        location.reload(); // recargar deja la página como al inicio: CRUD oculto y sin eventos
    }

    // Cada interacción reinicia el conteo de inactividad (si la sesión ya venció, se cierra en vez de revivirla)
    function registrarActividad() {
        if (sesionVencida()) {
            cerrarSesion();
            return;
        }
        ultimaActividad = Date.now();
    }

    function vigilarInactividad() {
        ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((tipoEvento) => {
            document.addEventListener(tipoEvento, registrarActividad, { passive: true });
        });

        // Revisa cada 15 segundos aunque nadie toque la página
        setInterval(() => {
            if (sesionVencida()) {
                cerrarSesion();
            }
        }, 15000);

        // Al volver a la pestaña, revisa de inmediato (los navegadores frenan los timers en pestañas de fondo)
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible" && sesionVencida()) {
                cerrarSesion();
            }
        });
    }

    function mostrarGestion() {
        seccionLogin.hidden = true;
        layoutGestion.hidden = false;
        iniciarGestion();
        vigilarInactividad();
    }

    function mostrarErrorLogin(mensaje) {
        mensajeErrorLogin.textContent = mensaje;
        mensajeErrorLogin.hidden = false;
    }

    formularioLogin.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const datos = new FormData(formularioLogin);

        let loginCorrecto;
        try {
            loginCorrecto = await verificarLogin(datos.get("usuario"), datos.get("password"));
        } catch (error) {
            mostrarErrorLogin("Este navegador no permite validar la contraseña aquí. Abre la página con Live Server.");
            return;
        }

        if (loginCorrecto) {
            sesionIniciada = true;
            ultimaActividad = Date.now();
            mostrarGestion();
        } else {
            mostrarErrorLogin("Usuario o contraseña incorrectos.");
            formularioLogin.password.value = "";
            formularioLogin.password.focus();
        }
    });

    if (sessionStorage.getItem("sesionExpirada")) {
        mostrarErrorLogin("La sesión se cerró por 5 minutos de inactividad.");
        sessionStorage.removeItem("sesionExpirada");
    }

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
})(patinadores, verificarLogin);
