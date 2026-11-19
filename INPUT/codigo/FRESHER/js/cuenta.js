// Mi cuenta (cuenta.html): registro, inicio de sesión y perfil del cliente.
// Sale de supabase1/js/cliente.js (ahí están los comentarios largos de cada
// paso de Supabase Auth). Usa clientes_practica, la misma tabla.
// Va después de tienda.js: usa mostrarNotificacion, pintarMenuUsuario y el carrito.

const estado = document.getElementById('estado-sesion');
let usuarioActual = null;
let perfilActual = null; // último perfil LEÍDO o GUARDADO en Supabase


// --- Registro ---
// Dos pasos: crear el usuario en Auth y después su fila en clientes_practica,
// con el MISMO id (relación 1:1 con auth.users)
async function registrarCliente(nombre, correo, contrasena) {
  const { data, error } = await db.auth.signUp({ email: correo, password: contrasena });

  if (error) {
    console.log('Error al registrar:', error);
    return { error: error.message.includes('already registered')
      ? 'Ese correo ya tiene una cuenta. Inicia sesión.'
      : 'No se pudo crear la cuenta. Revisa los datos.' };
  }

  // Si Supabase pide confirmar el correo, signUp no deja sesión: auth.uid()
  // sería null en la base y la policy de RLS rechazaría el insert
  if (!data.session) {
    return { error: 'Te enviamos un correo para confirmar la cuenta. Confírmala y luego inicia sesión.' };
  }

  const { error: errorCliente } = await db
    .from('clientes_practica')
    .insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }]);

  if (errorCliente) {
    console.log('Error al crear el perfil:', errorCliente);
    return { error: 'La cuenta se creó, pero no se pudo guardar tu perfil.' };
  }
  return { error: null };
}

document.getElementById('form-registro').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const boton = form.querySelector('button[type="submit"]');

  boton.disabled = true; // evita crear la cuenta dos veces
  const { error } = await registrarCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value
  );
  boton.disabled = false;

  if (error) {
    estado.textContent = error;
    return;
  }
  form.reset();
  // signUp dejó la sesión iniciada: directo a la tienda
  window.location.href = 'index.html';
});


// --- Inicio de sesión ---
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault();
  const { error } = await db.auth.signInWithPassword({
    email: document.getElementById('login-correo').value.trim(),
    password: document.getElementById('login-password').value,
  });

  if (error) {
    console.log('Error al iniciar sesión:', error);
    estado.textContent = 'Correo o contraseña incorrectos.';
    return;
  }
  // La sesión queda en el navegador: index.html la encuentra con getUser()
  window.location.href = 'index.html';
});

// Un solo form a la vez: 'login' o 'registro'
function mostrarFormulario(cual) {
  document.getElementById('form-login').hidden = cual !== 'login';
  document.getElementById('form-registro').hidden = cual !== 'registro';
  estado.textContent = '';
  document.querySelector(`#form-${cual} input`).focus();
}

document.querySelectorAll('.enlace[data-mostrar]').forEach(boton => {
  boton.addEventListener('click', () => mostrarFormulario(boton.dataset.mostrar));
});


// --- Qué se ve: con o sin sesión ---
async function mostrarEstadoSesion() {
  const { data } = await db.auth.getUser();
  usuarioActual = data.user;
  const conSesion = Boolean(usuarioActual);

  document.getElementById('zona-cliente').hidden = !conSesion;
  document.getElementById('panel-acceso').hidden = conSesion;
  estado.textContent = '';

  if (conSesion) {
    mostrarVista(vistaInicial());
    cargarPerfil(usuarioActual.id);
    cargarCarritoDesdeBD(); // con sesión, el carrito es el de la base
  } else {
    mostrarFormulario('login');
    // Solo si el carrito era el de una sesión (tiene pedidoId), es decir, recién
    // se cerró la sesión. El carrito de un visitante NO se borra: si no, lo
    // perdería justo al venir aquí a iniciar sesión (ver cargarCarritoDesdeBD)
    if (pedidoId) vaciarCarritoLocal();
    else cargarProductosDelCarrito(); // nombre y precio del carrito del visitante, para el panel
  }
}


// --- Mis datos: leer (select) y actualizar (update) ---
function pintarFicha(perfil) {
  const texto = valor => valor || 'Sin registrar';
  document.getElementById('ficha-nombre').textContent = texto(perfil.nombre);
  document.getElementById('ficha-correo').textContent = texto(perfil.correo);
  document.getElementById('ficha-telefono').textContent = texto(perfil.telefono);
  document.getElementById('ficha-direccion').textContent = texto(perfil.direccion);
}

function llenarPerfil(perfil) {
  document.getElementById('perfil-nombre').value = perfil.nombre ?? '';
  document.getElementById('perfil-correo').value = perfil.correo ?? '';
  document.getElementById('perfil-telefono').value = perfil.telefono ?? '';
  document.getElementById('perfil-direccion').value = perfil.direccion ?? '';
}

async function cargarPerfil(id) {
  const mensaje = document.getElementById('mensaje-ficha');
  const botonEditar = document.getElementById('btn-menu-editar');

  const { data: perfil, error } = await db
    .from('clientes_practica')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.log('Error al leer el perfil:', error);
    mensaje.textContent = 'No se pudieron leer tus datos.';
    botonEditar.disabled = true;
    return;
  }
  // RLS filtra, no avisa: sin permiso o sin fila, los dos dan null
  // (es el caso de una cuenta de admin, que no tiene fila de cliente)
  if (!perfil) {
    mensaje.textContent = 'Esta cuenta no tiene perfil de cliente.';
    botonEditar.disabled = true;
    return;
  }

  perfilActual = perfil;
  pintarFicha(perfil);
  mensaje.textContent = '';
  botonEditar.disabled = false;
}

// ?vista=ver o ?vista=pedidos (el menú del header los usa). "editar" no se
// acepta al cargar: el perfil todavía no llegó para llenar el form
function vistaInicial() {
  const pedida = new URLSearchParams(window.location.search).get('vista');
  return ['ver', 'pedidos'].includes(pedida) ? pedida : 'ver';
}

function mostrarVista(vista) {
  document.getElementById('ficha-perfil').hidden = vista !== 'ver';
  document.getElementById('form-perfil').hidden = vista !== 'editar';
  document.getElementById('vista-pedidos').hidden = vista !== 'pedidos';

  document.querySelectorAll('.menu-cliente button').forEach(boton => {
    boton.setAttribute('aria-current', boton.dataset.vista === vista);
  });
  document.getElementById('mensaje-ficha').textContent = '';
  document.getElementById('mensaje-perfil').textContent = '';

  if (vista === 'editar' && perfilActual) {
    llenarPerfil(perfilActual); // siempre desde lo GUARDADO
    document.getElementById('perfil-nombre').focus();
  }
}

document.querySelectorAll('.menu-cliente button').forEach(boton => {
  boton.addEventListener('click', () => mostrarVista(boton.dataset.vista));
});

document.getElementById('form-perfil').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!usuarioActual) return;

  const mensaje = document.getElementById('mensaje-perfil');
  const botonGuardar = document.getElementById('btn-guardar-perfil');

  // Solo las columnas que el grant de clientes_practica deja actualizar
  // (nombre, telefono, direccion). Ni correo ni rol
  const cambios = {
    nombre: document.getElementById('perfil-nombre').value.trim(),
    telefono: document.getElementById('perfil-telefono').value.trim() || null,
    direccion: document.getElementById('perfil-direccion').value.trim() || null,
  };

  botonGuardar.disabled = true;
  mensaje.textContent = 'Guardando…';
  const { data, error } = await db
    .from('clientes_practica')
    .update(cambios)
    .eq('id', usuarioActual.id)
    .select();
  botonGuardar.disabled = false;

  // Sin error pero con data = [] → RLS no dejó actualizar: también es fallo
  if (error || data.length === 0) {
    console.log('Error al actualizar el perfil:', error);
    mensaje.textContent = 'No se pudieron guardar los cambios.';
    return;
  }

  perfilActual = data[0];
  pintarFicha(perfilActual);
  mostrarVista('ver');
  document.getElementById('mensaje-ficha').textContent = '✔ Datos guardados';
  pintarMenuUsuario(); // el header muestra el nombre nuevo
});


// --- Cerrar sesión ---
document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  // El carrito de este cliente lo vacía mostrarEstadoSesion() (rama sin sesión)
  // Ocultar no borra: se vacían ficha y form para el siguiente que entre
  perfilActual = null;
  document.getElementById('form-perfil').reset();
  document.querySelectorAll('.ficha dd').forEach(dd => { dd.textContent = ''; });
  pintarMenuUsuario();
  mostrarEstadoSesion();
});


// Esta página no carga productos: la promesa ya está resuelta.
// cargarCarritoDesdeBD (la llama mostrarEstadoSesion) la espera
const productosListos = Promise.resolve();
mostrarEstadoSesion();
