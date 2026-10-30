async function registrarCliente(nombre, correo, contrasena) {

  // db.auth.signUp() NO toca ninguna tabla tuya todavía — habla directo con
  // el sistema de autenticación interno de Supabase (algo así como una
  // tabla especial, auth.users, que tú no administras a mano). Le mandas
  // correo y contraseña, y Supabase por detrás: valida el formato del
  // correo, guarda la contraseña de forma segura (nunca en texto plano),
  // y crea un identificador único nuevo (un uuid) para esta persona.
  //
  // El resultado llega en dos partes, igual que en todas las llamadas a
  // Supabase que ya conoces (data / error):
  //   - data.user   → los datos del usuario recién creado. data.user.id
  //                   es el uuid real — EL MISMO que vamos a usar como id
  //                   en clientes_practica, dos líneas más abajo.
  //   - data.session → si tu proyecto exige confirmar el correo antes de
  //                   dejar entrar (ver guía, sección 7), esto llega en
  //                   null: el usuario ya existe, pero todavía no hay
  //                   sesión iniciada hasta que confirme.
  const { data, error } = await db.auth.signUp({
    email: correo,
    password: contrasena,
  });

  // Mismo patrón de "revisar error antes de seguir" que ya usaste en el
  // CRUD de productos — si signUp() falló (correo repetido, contraseña
  // muy corta, etc.), ni siquiera intentamos el segundo paso.
  if (error) {
    console.log('Error al registrar:', error);
    return null;
  }

  // Ahora sí tocamos una tabla tuya: clientes_practica. Este insert() es
  // igual al que ya usaste en agregarProducto() — la única diferencia es
  // que aquí SÍ mandamos el id a mano (data.user.id), en vez de dejar que
  // Supabase lo autogenere, porque este id tiene que coincidir exactamente
  // con el que Auth le acaba de asignar al usuario.
  const { data: cliente, error: errorCliente } = await db
    .from('clientes_practica')
    .insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }])
    .select();

  if (errorCliente) {
    console.log('Error al crear el perfil:', errorCliente);
    return null;
  }

  return cliente[0];
}

// 'submit' es el evento que dispara un <form> cuando alguien hace clic en
// su botón de tipo submit (o presiona Enter dentro de un campo). Por
// defecto, ese evento hace que el navegador RECARGUE la página entera —
// comportamiento heredado de cuando los formularios mandaban sus datos a
// otra página de servidor, décadas atrás. Como aquí todo lo manejamos con
// JavaScript (sin recargar nada), hay que apagar ese comportamiento a
// propósito.
document.getElementById('form-registro').addEventListener('submit', async (event) => {

  // event.preventDefault() le dice al navegador "no hagas lo que harías
  // normalmente con este evento" — en este caso, no recargues la página.
  // Sin esta línea, la página se refrescaría apenas se hiciera clic en
  // "Crear cuenta", y perderías cualquier mensaje que fueras a mostrar.
  event.preventDefault();

  // event.target es el elemento que disparó el evento — en un 'submit',
  // siempre es el propio <form>. Lo guardamos en una variable para poder
  // usarlo más abajo (form.reset()) sin tener que volver a buscarlo.
  const form = event.target;

  const cliente = await registrarCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value
  );

  if (cliente) {
    document.getElementById('estado-sesion').textContent =
      'Cuenta creada. Ahora inicia sesión con ese correo y contraseña.';
    form.reset(); // vacía los 3 campos del formulario, para la próxima persona
    mostrarFormulario('login'); // el mensaje dice "inicia sesión" → le mostramos ese form
  } else {
    document.getElementById('estado-sesion').textContent =
      'No se pudo crear la cuenta. Revisa la consola.';
  }
});

async function iniciarSesion(correo, contrasena) {

  // db.auth.signInWithPassword() es para alguien que YA se registró antes
  // (sección 4.1) — no crea ningún usuario nuevo, solo verifica que el
  // correo y la contraseña coincidan con uno que ya existe en Auth.
  //
  // Lo importante pasa "por detrás", sin que se vea en este código: si la
  // verificación sale bien, el cliente de Supabase (la variable db, la
  // misma de siempre) GUARDA la sesión internamente — normalmente en el
  // almacenamiento del navegador — y, desde este momento, la adjunta sola
  // a cada petición futura que hagas con db, sea a productos_practica, a
  // clientes_practica o a cualquier otra tabla. No hay que "pasarle" el
  // usuario a mano a ninguna otra función.
  const { data, error } = await db.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    console.log('Error al iniciar sesión:', error);
    return null;
  }

  // Aquí data.user también trae el id real del usuario — el mismo valor
  // que auth.uid() va a devolver dentro de cualquier política de RLS
  // mientras esta sesión siga activa.
  return data.user;
}

// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.target; // el propio <form>, guardado para usar después

  const usuario = await iniciarSesion(
    document.getElementById('login-correo').value.trim(),
    document.getElementById('login-password').value
  );

  if (usuario) {
    form.reset();
    mostrarEstadoSesion(); // definida en la sección 5
  } else {
    document.getElementById('estado-sesion').textContent =
      'Correo o contraseña incorrectos.';
  }
});

// Usuario con sesión activa (o null). Lo guardamos aquí para que el submit
// de "Mis datos" sepa QUÉ fila actualizar sin volver a preguntarle a Auth
let usuarioActual = null;

async function mostrarEstadoSesion() {
  const { data } = await db.auth.getUser();
  const estado = document.getElementById('estado-sesion');
  usuarioActual = data.user;
  const conSesion = Boolean(data.user); // objeto → true, null → false

  // Con sesión: solo la zona del cliente (aside + ficha) + Cerrar sesión.
  // Sin sesión: solo Iniciar sesión (Registrarse se abre con su enlace)
  document.getElementById('zona-cliente').hidden = !conSesion;
  document.getElementById('btn-logout').hidden = !conSesion;
  document.getElementById('form-login').hidden = conSesion;
  document.getElementById('form-registro').hidden = true;

  // Con sesión el aviso se esconde: "Mis datos" ya muestra el correo.
  // Sin sesión se sigue viendo, porque ahí también salen "Cuenta creada…"
  // y "Correo o contraseña incorrectos."
  estado.hidden = conSesion;

  if (conSesion) {
    mostrarVista('ver');        // al entrar, el cliente VE sus datos (no los edita)
    cargarPerfil(data.user.id); // PRIMERO leer, para llenar la ficha y el form
  } else {
    estado.textContent = 'No has iniciado sesión.';
  }
}

// --- Mis datos: leer (select) y actualizar (update) ---

// Lee la fila del cliente. El id de clientes_practica ES el uuid de Auth
// (relación 1:1), así que basta con buscar por el id del usuario
async function leerPerfil(id) {
  const { data, error } = await db
    .from('clientes_practica')
    .select('*')
    .eq('id', id)
    .maybeSingle(); // sin fila → data = null SIN error (igual que en prueba2.js)

  if (error) console.log('Error al leer el perfil:', error);
  return { perfil: data, error };
}

// Objeto de Supabase → campos del form. null → '' para que el input
// no muestre el texto "null"
function llenarPerfil(perfil) {
  document.getElementById('perfil-nombre').value = perfil.nombre ?? '';
  document.getElementById('perfil-correo').value = perfil.correo ?? '';
  document.getElementById('perfil-telefono').value = perfil.telefono ?? '';
  document.getElementById('perfil-direccion').value = perfil.direccion ?? '';
}

// Objeto de Supabase → textos de la ficha. textContent (no innerHTML): los
// datos los escribió el cliente, se tratan como texto y nunca como HTML
function pintarFicha(perfil) {
  // Dato vacío → 'Sin registrar' (la ficha no debe mostrar un hueco)
  const texto = valor => valor || 'Sin registrar';
  document.getElementById('ficha-nombre').textContent = texto(perfil.nombre);
  document.getElementById('ficha-correo').textContent = texto(perfil.correo);
  document.getElementById('ficha-telefono').textContent = texto(perfil.telefono);
  document.getElementById('ficha-direccion').textContent = texto(perfil.direccion);
}

// Último perfil LEÍDO o GUARDADO en Supabase. Al abrir "Actualizar datos"
// el form se llena desde aquí: si editaste algo, no guardaste y volviste a
// "Mis datos", esos cambios a medias no reaparecen la próxima vez
let perfilActual = null;

async function cargarPerfil(id) {
  const mensaje = document.getElementById('mensaje-ficha');
  const botonEditar = document.getElementById('btn-menu-editar');
  const { perfil, error } = await leerPerfil(id);

  // Dos fallos distintos, dos mensajes distintos (mismo patrón que buscar por id).
  // En los dos, "Actualizar datos" se desactiva: no hay nada que editar
  if (error) {
    mensaje.textContent = 'No se pudieron leer tus datos (revisa la consola).';
    botonEditar.disabled = true;
    return;
  }
  // Existe en Auth pero no en clientes_practica (ej. el registro en el que
  // signUp funcionó y el insert falló) o RLS no deja leer la fila
  if (!perfil) {
    mensaje.textContent = 'No encontramos tu perfil en clientes_practica.';
    botonEditar.disabled = true;
    return;
  }

  perfilActual = perfil;
  pintarFicha(perfil);
  mensaje.textContent = '';
  botonEditar.disabled = false;
}

// --- Aside: una vista a la vez ('ver' = ficha, 'editar' = form) ---
// Mismo patrón que mostrarFormulario() del login/registro
function mostrarVista(vista) {
  document.getElementById('ficha-perfil').hidden = vista !== 'ver';
  document.getElementById('form-perfil').hidden = vista !== 'editar';

  // Marca en el aside la opción activa (el CSS la pinta con --primario)
  document.querySelectorAll('#menu-cliente button').forEach(boton => {
    boton.setAttribute('aria-current', boton.dataset.vista === vista);
  });

  // Al cambiar de vista se borran los mensajes viejos
  document.getElementById('mensaje-ficha').textContent = '';
  document.getElementById('mensaje-perfil').textContent = '';

  if (vista === 'editar' && perfilActual) {
    llenarPerfil(perfilActual); // siempre desde lo GUARDADO, no lo que quedó escrito
    document.getElementById('perfil-nombre').focus();
  }
}

document.querySelectorAll('#menu-cliente button').forEach(boton => {
  boton.addEventListener('click', () => mostrarVista(boton.dataset.vista));
});

async function actualizarPerfil(id, cambios) {
  const { data, error } = await db
    .from('clientes_practica')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) {
    console.log('Error al actualizar el perfil:', error);
    return null;
  }
  // Igual que modificarProducto: si RLS no deja actualizar, NO hay error,
  // solo data = [] → lo tratamos como fallo
  return data[0] ?? null;
}

document.getElementById('form-perfil').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!usuarioActual) return; // la sesión se cerró mientras tanto

  const mensaje = document.getElementById('mensaje-perfil');
  const botonGuardar = document.getElementById('btn-guardar-perfil');

  // Solo los campos editables. NO van correo (readonly) ni rol: si se
  // mandaran, alguien podría cambiarlos desde la consola. (Ojo: esto solo
  // es el front end; la protección real está en la base de datos)
  const cambios = {
    nombre: document.getElementById('perfil-nombre').value.trim(),
    telefono: document.getElementById('perfil-telefono').value.trim() || null,
    direccion: document.getElementById('perfil-direccion').value.trim() || null,
  };

  // Mientras espera a Supabase, el botón se desactiva: evita guardar dos veces
  botonGuardar.disabled = true;
  mensaje.textContent = 'Guardando…';
  const actualizado = await actualizarPerfil(usuarioActual.id, cambios);
  botonGuardar.disabled = false;

  if (actualizado) {
    // La ficha muestra lo que DE VERDAD quedó guardado (lo que devolvió
    // .select()), y se vuelve a la vista "ver" con el aviso
    perfilActual = actualizado;
    pintarFicha(actualizado);
    mostrarVista('ver');
    document.getElementById('mensaje-ficha').textContent = '✔ Datos guardados';
  } else {
    mensaje.textContent = 'No se pudieron guardar los cambios (revisa la consola).';
  }
});

// Al cargar la página, revisa si ya había una sesión activa
mostrarEstadoSesion();

// --- Un solo formulario a la vez ---
// Recibe 'login' o 'registro' y esconde el otro. Mismo patrón que
// classList.toggle(clase, condición): hidden = true/false según la condición
function mostrarFormulario(cual) {
  document.getElementById('form-login').hidden = cual !== 'login';
  document.getElementById('form-registro').hidden = cual !== 'registro';
  // Pone el cursor en el primer campo del form que se acaba de mostrar
  document.querySelector(`#form-${cual} input`).focus();
}

// Cada texto clickeable dice en data-mostrar qué form abre
// (data-mostrar="registro" → dataset.mostrar === 'registro')
document.querySelectorAll('.enlace').forEach(boton => {
  boton.addEventListener('click', () => mostrarFormulario(boton.dataset.mostrar));
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  // Vaciamos ficha y form: si no, los datos del cliente anterior quedarían
  // en la página (escondidos) hasta que entre otra persona
  perfilActual = null;
  document.getElementById('form-perfil').reset();
  document.querySelectorAll('#ficha-perfil dd').forEach(dd => { dd.textContent = ''; });
  document.getElementById('mensaje-perfil').textContent = '';
  mostrarEstadoSesion();
});

// --- Modo claro / oscuro (copiado de prueba2.js) ---
// El tema INICIAL ya lo eligió el <script> del <head> (para que no parpadee).
// Aquí solo manejamos el botón y los cambios del sistema.
const botonTema = document.getElementById('btn-tema');

// Pone data-tema="oscuro" o "claro" en <html>; el CSS hace el resto con
// :root[data-tema="oscuro"]. El botón muestra el modo AL QUE vas a cambiar.
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const oscuro = tema === 'oscuro';
  botonTema.textContent = oscuro ? '☀️' : '🌙';
  botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

aplicarTema(document.documentElement.dataset.tema); // sincroniza el ícono al cargar

botonTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
  aplicarTema(nuevo);
  // Misma clave 'tema' que prueba2.js → la elección vale para las dos páginas
  try { localStorage.setItem('tema', nuevo); } catch (e) {}
});

// Si el usuario NUNCA usó el botón, seguimos al sistema en vivo
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  let guardado = null;
  try { guardado = localStorage.getItem('tema'); } catch (e) {}
  if (!guardado) aplicarTema(event.matches ? 'oscuro' : 'claro');
});