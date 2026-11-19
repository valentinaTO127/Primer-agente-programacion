// Mi cuenta (cuenta.html): registro, inicio de sesión y perfil del cliente.
// Sale de supabase1/js/cliente.js (ahí están los comentarios largos de cada
// paso de Supabase Auth). Usa clientes_practica, la misma tabla.
// Va después de tienda.js: usa mostrarNotificacion, pintarMenuUsuario y el carrito.

const estado = document.getElementById('estado-sesion');
let usuarioActual = null;
let perfilActual = null; // último perfil LEÍDO o GUARDADO en Supabase
let esAdmin = false;      // lo decide cargarPerfil (fila en admins_practica)


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
  // Oculto hasta que cargarPerfil confirme en admins_practica que es admin.
  // Así, al cerrar sesión o cambiar de cuenta, no queda visible
  document.getElementById('enlace-admin').hidden = true;
  document.getElementById('btn-menu-clientes').hidden = true;
  esAdmin = false;
  estado.textContent = '';

  if (conSesion) {
    cargarCarritoDesdeBD(); // con sesión, el carrito es el de la base
    // PRIMERO saber si es admin y DESPUÉS pintar la vista: con ?vista=pedidos,
    // la consulta de pedidos depende de eso (los suyos o los de todos)
    await cargarPerfil(usuarioActual.id);
    mostrarVista(vistaInicial());
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

  // Las dos consultas a la vez (Promise.all): no dependen una de la otra.
  // RLS filtra, no avisa: sin fila (o sin permiso) cada una da null, sin error
  const [respuestaCliente, respuestaAdmin] = await Promise.all([
    db.from('clientes_practica').select('*').eq('id', id).maybeSingle(),
    db.from('admins_practica').select('*').eq('id', id).maybeSingle(),
  ]);
  const { data: perfil, error } = respuestaCliente;
  const { data: admin, error: errorAdmin } = respuestaAdmin;

  if (errorAdmin) console.log('Error al revisar si es administrador:', errorAdmin);
  // Las opciones de admin dependen SOLO de ser admin (aunque también sea cliente)
  esAdmin = Boolean(admin);
  document.getElementById('enlace-admin').hidden = !esAdmin;
  document.getElementById('btn-menu-clientes').hidden = !esAdmin;

  if (error) {
    console.log('Error al leer el perfil:', error);
    mensaje.textContent = 'No se pudieron leer tus datos.';
    botonEditar.disabled = true;
    return;
  }

  if (perfil) {
    perfilActual = perfil;
    mostrarDatosDeEnvio(true);
    pintarFicha(perfil);
    mensaje.textContent = '';
    botonEditar.disabled = false;
    return;
  }

  if (admin) {
    // Teléfono y dirección de envío son datos de cliente: al admin se le ocultan
    // (mostrar "Sin registrar" daría a entender que le faltan)
    mostrarDatosDeEnvio(false);
    pintarFicha(admin);
    mensaje.textContent = 'Cuenta de administrador.';
    // "Actualizar datos" escribe en clientes_practica: al admin no le sirve
    botonEditar.disabled = true;
    return;
  }

  mensaje.textContent = 'Esta cuenta no tiene perfil de cliente.';
  botonEditar.disabled = true;
}

// Muestra u oculta las filas de teléfono y dirección de la ficha.
// closest('div') = el <div> que agrupa ese <dt> + <dd>
function mostrarDatosDeEnvio(visible) {
  ['ficha-telefono', 'ficha-direccion'].forEach(id => {
    document.getElementById(id).closest('div').hidden = !visible;
  });
}

// ?vista=ver, ?vista=pedidos o (solo admin) ?vista=clientes. "editar" no se
// acepta al cargar: el perfil todavía no llegó para llenar el form
function vistaInicial() {
  const pedida = new URLSearchParams(window.location.search).get('vista');
  const permitidas = esAdmin ? ['ver', 'pedidos', 'clientes'] : ['ver', 'pedidos'];
  return permitidas.includes(pedida) ? pedida : 'ver';
}

function mostrarVista(vista) {
  document.getElementById('ficha-perfil').hidden = vista !== 'ver';
  document.getElementById('form-perfil').hidden = vista !== 'editar';
  document.getElementById('vista-pedidos').hidden = vista !== 'pedidos';
  document.getElementById('vista-clientes').hidden = vista !== 'clientes';

  document.querySelectorAll('.menu-cliente button').forEach(boton => {
    boton.setAttribute('aria-current', boton.dataset.vista === vista);
  });
  document.getElementById('mensaje-ficha').textContent = '';
  document.getElementById('mensaje-perfil').textContent = '';

  if (vista === 'editar' && perfilActual) {
    llenarPerfil(perfilActual); // siempre desde lo GUARDADO
    document.getElementById('perfil-nombre').focus();
  }
  // Se consulta CADA vez que se abre: si confirmó un pedido desde el panel del
  // carrito en esta misma página, aparece sin recargar
  if (vista === 'pedidos') cargarPedidos();
  if (vista === 'clientes' && esAdmin) cargarClientes();
}


// --- Pedidos del cliente ---
const ESTADOS_PEDIDO = {
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};
const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

let pedidosCargados = [];   // la última lista leída de Supabase (sin filtrar)
let clienteFiltrado = null; // { id, nombre } cuando el admin llega desde Mis clientes

async function cargarPedidos() {
  if (!usuarioActual) return;
  const lista = document.getElementById('lista-pedidos');
  const mensaje = document.getElementById('mensaje-pedidos');

  document.getElementById('titulo-pedidos').textContent = esAdmin ? 'Pedidos de clientes' : 'Pedidos';
  document.getElementById('filtros-pedidos').hidden = !esAdmin;
  document.getElementById('enlace-sin-pedidos').hidden = true;
  mensaje.textContent = 'Cargando pedidos…';

  // UNA consulta con todo anidado: pedido → sus detalles → el producto de cada
  // detalle, y su historial (Supabase sigue las llaves foráneas).
  // El carrito (estado 'carrito') no es un pedido todavía: queda fuera
  let consulta = db
    .from('pedidos')
    .select(`id, estado, created_at, confirmado_en, envio, direccion, observacion, cliente_id,
             clientes_practica(nombre, correo, telefono),
             detalles_pedidos(id, cantidad, precio_unitario, productos_practica(id, nombre, marca, img_url, imagenes)),
             historial_estados_pedido(estado_anterior, estado_nuevo, cambiado_en)`)
    .neq('estado', 'carrito')
    .order('created_at', { ascending: false });

  // Cliente: el .eq es OBLIGATORIO. La policy ver_pedidos deja al admin ver los
  // de TODOS: RLS dice qué PUEDES ver, no qué QUIERES ver. El admin sí quiere todos
  if (!esAdmin) consulta = consulta.eq('cliente_id', usuarioActual.id);

  const { data, error } = await consulta;

  if (error) {
    console.log('Error al cargar los pedidos:', error);
    pedidosCargados = [];
    lista.replaceChildren();
    mensaje.textContent = 'No se pudieron cargar los pedidos.';
    return;
  }

  pedidosCargados = data;
  pintarPedidos();
}

// Aplica los filtros (estado y cliente) sobre lo ya leído: cambiar un filtro
// no vuelve a consultar Supabase
function pintarPedidos() {
  const lista = document.getElementById('lista-pedidos');
  const mensaje = document.getElementById('mensaje-pedidos');
  const estadoElegido = esAdmin ? document.getElementById('filtro-estado').value : '';

  const visibles = pedidosCargados.filter(pedido =>
    (!estadoElegido || pedido.estado === estadoElegido) &&
    (!clienteFiltrado || pedido.cliente_id === clienteFiltrado.id)
  );

  document.getElementById('filtro-cliente').hidden = !clienteFiltrado;
  document.getElementById('filtro-cliente-nombre').textContent = clienteFiltrado?.nombre ?? '';

  lista.replaceChildren(...visibles.map(crearPedido));

  if (pedidosCargados.length === 0) {
    mensaje.textContent = esAdmin ? 'Todavía no hay pedidos de clientes.' : 'Aún no tienes pedidos.';
    document.getElementById('enlace-sin-pedidos').hidden = esAdmin;
  } else if (visibles.length === 0) {
    mensaje.textContent = 'Ningún pedido coincide con el filtro.';
  } else {
    mensaje.textContent = esAdmin
      ? `${visibles.length} ${visibles.length === 1 ? 'pedido' : 'pedidos'}`
      : '';
  }
}

document.getElementById('filtro-estado').addEventListener('change', pintarPedidos);
document.getElementById('btn-quitar-filtro-cliente').addEventListener('click', () => {
  clienteFiltrado = null;
  pintarPedidos();
});

// Suma de lo GUARDADO: precio_unitario quedó fijo en la base al confirmar
// (confirmar_pedido), así que aquí no se recalcula ningún precio
function totalPedido(pedido) {
  return pedido.detalles_pedidos.reduce(
    (suma, detalle) => suma + detalle.cantidad * detalle.precio_unitario, 0
  );
}

function crearSpan(clase, texto) {
  const span = document.createElement('span');
  span.className = clase;
  span.textContent = texto;
  return span;
}

// <details> + <summary>: el navegador abre y cierra solo, también con teclado
function crearPedido(pedido) {
  const item = document.createElement('li');
  const detalles = document.createElement('details');
  detalles.className = 'pedido';
  detalles.dataset.id = pedido.id; // para volver a abrirlo después de cambiar su estado

  const cliente = pedido.clientes_practica; // el admin lo necesita; el cliente ya sabe quién es
  const fecha = formatoFecha.format(new Date(pedido.confirmado_en ?? pedido.created_at));

  // Cliente: la fecha basta para reconocer su pedido, el número no le dice nada.
  // Admin: el número sirve para hablar del pedido (y el modal de cancelar lo usa)
  const resumen = document.createElement('summary');
  if (esAdmin) {
    resumen.append(
      crearSpan('pedido-numero', `Pedido #${pedido.id}`),
      crearSpan('pedido-fecha', `${cliente?.nombre ?? 'Cliente'} · ${fecha}`)
    );
  } else {
    detalles.classList.add('sin-numero'); // una columna menos en el summary
    resumen.append(crearSpan('pedido-numero', fecha));
  }
  resumen.append(
    crearSpan(`estado-pedido estado-${pedido.estado}`, ESTADOS_PEDIDO[pedido.estado] ?? pedido.estado),
    crearSpan('pedido-total', formatoPrecio.format(totalPedido(pedido)))
  );

  const productos = document.createElement('ul');
  productos.className = 'pedido-productos';
  pedido.detalles_pedidos.forEach(detalle => {
    const producto = detalle.productos_practica;
    const fila = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.href = urlProducto(producto);
    enlace.textContent = producto.marca ? `${producto.marca} · ${producto.nombre}` : producto.nombre;

    // Miniatura: crearImagen (tienda.js) ya pone "Sin imagen" si no hay url o
    // si la imagen no carga. alt vacío: el nombre está justo al lado
    const miniatura = document.createElement('span');
    miniatura.className = 'pedido-miniatura';
    miniatura.setAttribute('aria-hidden', 'true');
    miniatura.append(crearImagen(producto, '', producto.img_url ?? producto.imagenes?.[0]));

    fila.append(
      miniatura,
      enlace,
      crearSpan('cantidad-precio', `${detalle.cantidad} × ${formatoPrecio.format(detalle.precio_unitario)}`),
      crearSpan('subtotal', formatoPrecio.format(detalle.cantidad * detalle.precio_unitario))
    );
    productos.append(fila);
  });

  const entrega = document.createElement('p');
  entrega.className = 'pedido-entrega';
  entrega.textContent = pedido.envio
    ? `Envío a domicilio: ${pedido.direccion ?? 'sin dirección'}`
    : 'Sin envío a domicilio';

  detalles.append(resumen, productos);

  if (esAdmin && cliente) {
    const contacto = document.createElement('p');
    contacto.className = 'pedido-contacto';
    contacto.textContent = ['Cliente: ' + (cliente.nombre ?? 'Sin nombre'), cliente.correo, cliente.telefono]
      .filter(Boolean)
      .join(' · ');
    detalles.append(contacto);
  }

  detalles.append(entrega);

  if (pedido.observacion) {
    const nota = document.createElement('p');
    nota.className = 'pedido-nota';
    nota.textContent = `Observación: ${pedido.observacion}`; // textContent: nunca se interpreta como HTML
    detalles.append(nota);
  }

  detalles.append(crearSeguimiento(pedido));
  if (esAdmin) {
    const acciones = crearAccionesEstado(pedido);
    if (acciones) detalles.append(acciones);
  }
  item.append(detalles);
  return item;
}


// --- Cambiar el estado (solo admin) ---
// Los MISMOS pasos que acepta validar_transicion_estado() en la base. Aquí solo
// sirven para no mostrar botones que la base va a rechazar: quien decide es el
// trigger. entregado y cancelado son finales: sin botones
const SIGUIENTES_ESTADOS = {
  confirmado: [{ estado: 'enviado', texto: 'Marcar como enviado' }],
  enviado: [{ estado: 'entregado', texto: 'Marcar como entregado' }],
};
const SE_PUEDE_CANCELAR = ['confirmado', 'enviado'];

function crearAccionesEstado(pedido) {
  const opciones = [...(SIGUIENTES_ESTADOS[pedido.estado] ?? [])];
  if (SE_PUEDE_CANCELAR.includes(pedido.estado)) {
    opciones.push({ estado: 'cancelado', texto: 'Cancelar pedido', peligro: true });
  }
  if (opciones.length === 0) return null;

  const contenedor = document.createElement('div');
  contenedor.className = 'acciones-pedido';
  const mensaje = document.createElement('p');
  mensaje.className = 'mensaje-accion';
  mensaje.setAttribute('aria-live', 'polite');

  const botones = opciones.map(opcion => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = opcion.texto;
    if (opcion.peligro) boton.className = 'btn-peligro';
    boton.addEventListener('click', () => cambiarEstado(pedido, opcion.estado, botones, mensaje));
    return boton;
  });

  contenedor.append(...botones, mensaje);
  return contenedor;
}

// Abre el modal y espera la respuesta: true si eligió "Sí, cancelar pedido".
// Una Promise porque el modal NO detiene el código como confirm(): hay que
// esperar al evento 'close' para saber qué botón eligió
const modalCancelar = document.getElementById('modal-cancelar');

function confirmarCancelacion(pedido) {
  const unidades = pedido.detalles_pedidos.reduce((suma, detalle) => suma + detalle.cantidad, 0);
  const cliente = pedido.clientes_practica?.nombre;

  document.getElementById('titulo-modal-cancelar').textContent = `¿Cancelar el pedido #${pedido.id}?`;
  document.getElementById('texto-modal-cancelar').textContent =
    `${cliente ? `Pedido de ${cliente}, por ` : 'Pedido por '}${formatoPrecio.format(totalPedido(pedido))}. `
    + `${unidades === 1 ? 'La unidad vuelve' : `Las ${unidades} unidades vuelven`} al inventario.`;

  // Esc cierra sin tocar returnValue: sin este reset quedaría el valor de la
  // vez anterior y un Esc podría contarse como "confirmar"
  modalCancelar.returnValue = '';
  modalCancelar.showModal(); // el foco va a "Volver", el botón seguro

  return new Promise(resolve => {
    modalCancelar.addEventListener('close',
      () => resolve(modalCancelar.returnValue === 'confirmar'),
      { once: true }); // once: cada apertura escucha un solo cierre
  });
}

async function cambiarEstado(pedido, nuevoEstado, botones, mensaje) {
  if (nuevoEstado === 'cancelado' && !(await confirmarCancelacion(pedido))) return;

  botones.forEach(boton => { boton.disabled = true; }); // un doble clic no cambia dos veces
  mensaje.textContent = 'Guardando…';

  // Solo se manda el estado. La base hace el resto: valida la transición,
  // guarda el historial (con la fecha del seguimiento) y, si es cancelación,
  // devuelve el stock (triggers)
  const { data, error } = await db
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', pedido.id)
    .select('id');

  // Sin error pero data = [] → RLS no dejó actualizar (la cuenta no es admin)
  if (error || data.length === 0) {
    console.log('Error al cambiar el estado:', error ?? 'RLS no dejó actualizar');
    // error.message lo escribió el trigger (ej. "Transicion de estado no permitida")
    mensaje.textContent = error?.message ?? 'No tienes permiso para cambiar este pedido.';
    botones.forEach(boton => { boton.disabled = false; });
    return;
  }

  // Se recarga todo: etiqueta, seguimiento con su fecha nueva y filtro al día.
  // El pedido se vuelve a abrir para que el admin vea el resultado
  await cargarPedidos();
  const abierto = document.querySelector(`.pedido[data-id="${pedido.id}"]`);
  if (abierto) {
    abierto.open = true;
    abierto.querySelector('summary').focus(); // el foco no se pierde al repintar
  }
}


// --- Mis clientes (solo admin) ---
// La policy admins_select_clients deja al admin leer clientes_practica, y
// ver_pedidos sus pedidos. Si un no-admin llegara aquí, RLS le devolvería
// solo su propia fila: lo que protege es la base, no el botón escondido
const formatoDia = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

async function cargarClientes() {
  const cuerpo = document.getElementById('lista-clientes');
  const mensaje = document.getElementById('mensaje-clientes');
  mensaje.textContent = 'Cargando clientes…';

  // pedidos(estado) anidado: solo el estado de cada pedido, para contarlos aquí
  // sin el carrito (que no es un pedido)
  const { data, error } = await db
    .from('clientes_practica')
    .select('id, nombre, correo, telefono, direccion, created_at, pedidos(estado)')
    .order('nombre');

  if (error) {
    console.log('Error al cargar los clientes:', error);
    cuerpo.replaceChildren();
    mensaje.textContent = 'No se pudieron cargar los clientes.';
    return;
  }

  cuerpo.replaceChildren(...data.map(crearFilaCliente));
  mensaje.textContent = data.length === 0
    ? 'Todavía no hay clientes registrados.'
    : `${data.length} ${data.length === 1 ? 'cliente' : 'clientes'}`;
}

// Celda con su título en data-label (en celular la tabla se ve en bloques)
function crearCelda(titulo, contenido) {
  const celda = document.createElement('td');
  celda.dataset.label = titulo;
  if (contenido instanceof Node) {
    celda.append(contenido);
  } else if (contenido) {
    celda.textContent = contenido;
  } else {
    celda.textContent = 'Sin registrar';
    celda.classList.add('sin-dato');
  }
  return celda;
}

function crearFilaCliente(cliente) {
  const fila = document.createElement('tr');
  const totalPedidos = cliente.pedidos.filter(pedido => pedido.estado !== 'carrito').length;

  // Con pedidos: botón que abre la vista Pedidos filtrada por este cliente
  let pedidos = '0';
  if (totalPedidos > 0) {
    pedidos = document.createElement('button');
    pedidos.type = 'button';
    pedidos.className = 'enlace';
    pedidos.textContent = `${totalPedidos} ${totalPedidos === 1 ? 'pedido' : 'pedidos'}`;
    pedidos.setAttribute('aria-label', `Ver los ${totalPedidos} pedidos de ${cliente.nombre ?? 'este cliente'}`);
    pedidos.addEventListener('click', () => {
      clienteFiltrado = { id: cliente.id, nombre: cliente.nombre ?? cliente.correo };
      document.getElementById('filtro-estado').value = '';
      mostrarVista('pedidos');
    });
  }

  fila.append(
    crearCelda('Nombre', cliente.nombre),
    crearCelda('Correo', cliente.correo),
    crearCelda('Teléfono', cliente.telefono),
    crearCelda('Dirección', cliente.direccion),
    crearCelda('Pedidos', pedidos),
    crearCelda('Cliente desde', formatoDia.format(new Date(cliente.created_at)))
  );
  return fila;
}


// --- Seguimiento: Confirmado → Enviado → Entregado ---
// Las fechas salen de historial_estados_pedido (lo llenan los triggers de la
// base). Si la policy ver_historial_cliente no existiera, RLS devolvería [] sin
// error: el seguimiento se ve igual, solo sin fechas
const PASOS_PEDIDO = ['confirmado', 'enviado', 'entregado'];
const formatoFechaCorta = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

// Fecha del ÚLTIMO cambio a ese estado, o null
function fechaDelEstado(historial, estado) {
  const cambios = historial
    .filter(cambio => cambio.estado_nuevo === estado)
    .sort((a, b) => new Date(b.cambiado_en) - new Date(a.cambiado_en));
  return cambios[0]?.cambiado_en ?? null;
}

// Índice del último paso al que llegó el pedido (-1 = ninguno)
function pasoAlcanzado(pedido, historial) {
  if (pedido.estado !== 'cancelado') return PASOS_PEDIDO.indexOf(pedido.estado);
  // Cancelado: llegó hasta el estado que tenía justo antes de cancelarse
  const cancelacion = historial.find(cambio => cambio.estado_nuevo === 'cancelado');
  if (cancelacion) return PASOS_PEDIDO.indexOf(cancelacion.estado_anterior);
  // Sin historial: lo único seguro es si alcanzó a confirmarse
  return pedido.confirmado_en ? 0 : -1;
}

function crearSeguimiento(pedido) {
  const historial = pedido.historial_estados_pedido ?? [];
  const cancelado = pedido.estado === 'cancelado';
  const alcanzado = pasoAlcanzado(pedido, historial);

  const contenedor = document.createElement('div');
  contenedor.className = 'seguimiento';

  const titulo = document.createElement('p');
  titulo.className = 'eyebrow';
  titulo.textContent = 'Seguimiento';

  const pasos = document.createElement('ol');
  pasos.className = 'pasos-pedido';
  pasos.classList.toggle('cancelado', cancelado); // el CSS pinta toda la barra de rojo

  // Cancelado: solo los pasos a los que llegó + el paso "Cancelado" al final.
  // Los que faltaban ya no van a pasar: mostrarlos como pendientes confundiría
  const pasosVisibles = cancelado ? PASOS_PEDIDO.slice(0, alcanzado + 1) : PASOS_PEDIDO;
  pasos.style.setProperty('--pasos', pasosVisibles.length + (cancelado ? 1 : 0));

  pasosVisibles.forEach((paso, indice) => {
    // completo = ya pasó · actual = donde está ahora · pendiente = falta
    let situacion = 'pendiente';
    if (indice < alcanzado || cancelado) situacion = 'completo';
    else if (indice === alcanzado) situacion = 'actual';

    const item = document.createElement('li');
    item.className = `paso ${situacion}`;
    if (situacion === 'actual') item.setAttribute('aria-current', 'step');

    const punto = crearSpan('paso-punto', '');
    punto.setAttribute('aria-hidden', 'true'); // solo decorativo

    // Fecha: la del historial; para "confirmado" sirve también confirmado_en
    const fecha = fechaDelEstado(historial, paso)
      ?? (paso === 'confirmado' && situacion !== 'pendiente' ? pedido.confirmado_en : null);

    item.append(
      punto,
      crearSpan('paso-nombre', ESTADOS_PEDIDO[paso]),
      // Para lectores de pantalla: el color no lo pueden ver
      crearSpan('visualmente-oculto', situacion === 'pendiente' ? ' (pendiente)' : ' (completado)')
    );
    if (fecha && situacion !== 'pendiente') {
      item.append(crearSpan('paso-fecha', formatoFechaCorta.format(new Date(fecha))));
    }
    pasos.append(item);
  });

  if (cancelado) {
    const item = document.createElement('li');
    item.className = 'paso cancelado';
    item.setAttribute('aria-current', 'step');
    const punto = crearSpan('paso-punto', '');
    punto.setAttribute('aria-hidden', 'true');
    item.append(punto, crearSpan('paso-nombre', ESTADOS_PEDIDO.cancelado));

    const fechaCancelacion = fechaDelEstado(historial, 'cancelado');
    if (fechaCancelacion) {
      item.append(crearSpan('paso-fecha', formatoFechaCorta.format(new Date(fechaCancelacion))));
    }
    pasos.append(item);
  }

  contenedor.append(titulo, pasos);
  return contenedor;
}

document.querySelectorAll('.menu-cliente button').forEach(boton => {
  boton.addEventListener('click', () => {
    // "Pedidos" desde el menú = todos. El filtro por cliente solo llega desde Mis clientes
    if (boton.dataset.vista === 'pedidos') clienteFiltrado = null;
    mostrarVista(boton.dataset.vista);
  });
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
  // Los pedidos y clientes del que salió (sobre todo si era admin)
  pedidosCargados = [];
  clienteFiltrado = null;
  document.getElementById('filtro-estado').value = '';
  document.getElementById('lista-pedidos').replaceChildren();
  document.getElementById('lista-clientes').replaceChildren();
  pintarMenuUsuario();
  mostrarEstadoSesion();
});


// Esta página no carga productos: la promesa ya está resuelta.
// cargarCarritoDesdeBD (la llama mostrarEstadoSesion) la espera
const productosListos = Promise.resolve();
mostrarEstadoSesion();
