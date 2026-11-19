// Lógica compartida por index.html y producto.html: reglas del producto,
// carrito, tarjetas, menú de usuario y notificaciones. (El tema está en tema.js
// y CATEGORIAS / formatoPrecio en constantes.js, porque admin.html también los usa.)
// Sale de supabase1/js/galeria.js, que a su vez se basó en "OBJETOS -
// GALERIA 3" de Julian Bejarano (licencia MIT, ver LICENSE-galeria.txt).
// Va DESPUÉS de supabaseClient.js y ANTES del script propio de cada página.

// --- Constantes ---
// Clave distinta a la de supabase1: si las dos tiendas se abren desde el mismo
// servidor (mismo origen), compartirían localStorage y se mezclarían los carritos
const CLAVE_CARRITO = 'carrito-fresher';

// Columnas que necesita una tarjeta (el detalle pide más)
const COLUMNAS_TARJETA = 'id, nombre, descripcion, precio, unidades, descuento, disponible, '
  + 'img_url, imagenes, marca, categoria, calificacion';


// Mensaje para el usuario cuando falla una consulta. 42703 = "esa columna no
// existe": pasa si todavía no se corrió el SQL de FRESHER en Supabase
function mensajeErrorCarga(error) {
  console.log('Error de Supabase:', error);
  return error.code === '42703'
    ? 'Falta correr sql/01_productos_fresher.sql en Supabase.'
    : 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
}


// --- Reglas del producto (iguales a supabase1) ---
// Agotado = sin unidades. disponible = false ya ni llega: el catálogo solo
// pide productos habilitados (ver cargarProductos en catalogo.js)
function stockDe(producto) {
  return producto.disponible ? Math.max(producto.unidades ?? 0, 0) : 0;
}

// descuento es fracción (0.15). Un valor fuera de 0-1 se ignora
function descuentoDe(producto) {
  return producto.descuento > 0 && producto.descuento < 1 ? producto.descuento : 0;
}

function precioFinal(producto) {
  return Math.round(producto.precio * (1 - descuentoDe(producto)));
}

function urlProducto(producto) {
  return `producto.html?id=${encodeURIComponent(producto.id)}`;
}


// --- Carrito guardado en localStorage ---
// Solo id y cantidad, nunca el precio: el precio siempre se lee de la base
const carrito = leerCarrito(); // { idProducto: cantidad }

function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    if (!guardado || typeof guardado !== 'object') return {};
    return Object.fromEntries(
      Object.entries(guardado).filter(([, cantidad]) => Number.isInteger(cantidad) && cantidad > 0)
    );
  } catch (e) {
    return {};
  }
}

function guardarCarrito() {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) {}
}

function cantidadEnCarrito(id) {
  return carrito[id] ?? 0;
}


// --- Carrito en Supabase ---
// En la base, el carrito es un pedido con estado 'carrito' y sus filas en
// detalles_pedidos. Un índice único parcial deja UN solo carrito abierto por cliente
let pedidoId = null;        // id del pedido de este cliente que está en estado 'carrito'
const detalleIds = {};      // { producto_id: id de la fila en detalles_pedidos }

// El usuario con sesión, o null
async function obtenerUsuario() {
  const { data } = await db.auth.getUser();
  return data.user ?? null;
}

// Id del pedido en estado 'carrito' de ese cliente, o null.
// maybeSingle() y no single(): single() da ERROR cuando no hay fila, y "todavía
// no tiene carrito" es un caso normal, no un fallo
async function buscarCarrito(usuario) {
  const { data, error } = await db
    .from('pedidos')
    .select('id')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al buscar el carrito:', error);
    return null;
  }
  return data?.id ?? null;
}

async function obtenerOCrearCarrito(usuario) {
  if (pedidoId) return pedidoId; // ya lo conocemos: no se consulta otra vez

  pedidoId = await buscarCarrito(usuario);
  if (pedidoId) return pedidoId;

  // Solo cliente_id: el estado ('carrito') lo pone la base con su valor por
  // defecto. Si el front lo mandara, alguien podría crear un pedido ya "confirmado"
  const { data, error } = await db
    .from('pedidos')
    .insert({ cliente_id: usuario.id })
    .select('id')
    .single();

  if (error) {
    // 23505 = viola un índice único: ya hay un carrito abierto (doble clic u
    // otra pestaña lo creó un instante antes). No es un fallo: se busca ese
    if (error.code === '23505') {
      pedidoId = await buscarCarrito(usuario);
      return pedidoId;
    }
    console.log('Error al crear el carrito:', error);
    return null;
  }

  pedidoId = data.id;
  return pedidoId;
}

// Suma "cantidad" unidades del producto "id" al carrito. Devuelve true o false.
// "id" llega como texto (de btn.dataset.id): como llave de un objeto da igual
// ("3" y 3 son la misma llave), pero para la columna producto_id se convierte
async function agregarAlCarrito(id, cantidad) {
  const nuevaCantidad = (carrito[id] ?? 0) + cantidad;
  const usuario = await obtenerUsuario();

  // Sin sesión: modo demostración, solo en este navegador
  if (!usuario) {
    carrito[id] = nuevaCantidad;
    guardarCarrito();
    return true;
  }

  const pedido = await obtenerOCrearCarrito(usuario);
  if (!pedido) return false;

  if (detalleIds[id]) {
    // Ya tiene su fila: solo cambia la cantidad.
    // .select() devuelve las filas que DE VERDAD cambiaron: si RLS bloquea el
    // update, Supabase no da error, devuelve [] → también es fallo
    const { data, error } = await db
      .from('detalles_pedidos')
      .update({ cantidad: nuevaCantidad })
      .eq('id', detalleIds[id])
      .select();

    if (error || data.length === 0) {
      console.log('Error al actualizar la cantidad:', error ?? 'RLS no dejó actualizar');
      return false;
    }
  } else {
    // Fila nueva. NUNCA se manda el precio: lo copia un trigger de la base
    // desde productos_practica (si viniera del front, se podría cambiar en la consola)
    const { data, error } = await db
      .from('detalles_pedidos')
      .insert({ pedido_id: pedido, producto_id: Number(id), cantidad })
      .select('id')
      .single();

    if (error) {
      console.log('Error al agregar al carrito:', error);
      return false;
    }
    detalleIds[id] = data.id;
  }

  carrito[id] = nuevaCantidad;
  guardarCarrito();
  return true;
}

// Saca el producto "id" del carrito. Devuelve true o false.
// El pedido NO se borra aunque quede sin productos: el carrito vacío se reutiliza
async function quitarDelCarrito(id) {
  if (detalleIds[id]) {
    // Igual que el update: si RLS bloquea el delete, no hay error, solo data = []
    const { data, error } = await db
      .from('detalles_pedidos')
      .delete()
      .eq('id', detalleIds[id])
      .select();

    if (error || data.length === 0) {
      console.log('Error al quitar del carrito:', error ?? 'RLS no dejó borrar');
      return false; // el carrito local NO se toca: sigue igual que la base
    }
    delete detalleIds[id];
  }

  // Con o sin sesión
  delete carrito[id];
  guardarCarrito();
  actualizarCarrito();
  return true;
}

// Pone la cantidad EXACTA de un producto (la usan los − y + del stepper y del
// panel). A diferencia de agregarAlCarrito, recibe el total, no cuánto sumar:
// así "−" funciona igual que "+" y nunca se inserta una cantidad negativa
async function fijarCantidad(producto, nuevaCantidad) {
  const id = String(producto.id);
  const cantidad = Math.min(nuevaCantidad, stockDe(producto)); // nunca más que el stock
  if (cantidad <= 0) return quitarDelCarrito(id);

  const usuario = await obtenerUsuario();
  if (usuario) {
    const pedido = await obtenerOCrearCarrito(usuario);
    if (!pedido) return false;

    if (detalleIds[id]) {
      const { data, error } = await db
        .from('detalles_pedidos')
        .update({ cantidad })
        .eq('id', detalleIds[id])
        .select();
      if (error || data.length === 0) {
        console.log('Error al cambiar la cantidad:', error ?? 'RLS no dejó actualizar');
        return false;
      }
    } else {
      const { data, error } = await db
        .from('detalles_pedidos')
        .insert({ pedido_id: pedido, producto_id: Number(id), cantidad })
        .select('id')
        .single();
      if (error) {
        console.log('Error al agregar al carrito:', error);
        return false;
      }
      detalleIds[id] = data.id;
    }
  }

  carrito[id] = cantidad;
  guardarCarrito();
  actualizarCarrito();
  return true;
}

// Corre una acción del carrito con el botón deshabilitado (evita el doble clic
// mientras responde Supabase). Si falla, avisa. actualizarCarrito() al final
// vuelve a calcular qué botones deben quedar deshabilitados (ej. "+" sin stock)
async function conBotonOcupado(boton, accion) {
  boton.disabled = true;
  const ok = await accion();
  boton.disabled = false;
  if (!ok) mostrarNotificacion('No se pudo actualizar el carrito. Intenta de nuevo.', 'error');
  actualizarCarrito();
  return ok;
}

// Deja el carrito vacío en esta página (ej. después de confirmar el pedido o
// al cerrar sesión). "carrito" es const: no se le puede asignar {}, así que se
// borran sus llaves una por una
function vaciarCarritoLocal() {
  Object.keys(carrito).forEach(id => delete carrito[id]);
  Object.keys(detalleIds).forEach(id => delete detalleIds[id]);
  pedidoId = null;
  guardarCarrito(); // sin esto, al recargar volvería lo que había en localStorage
  actualizarCarrito();
}

// Al cargar la página: con sesión, la base es la fuente de verdad del carrito.
// Cada página define "productosListos" (la promesa de su carga de productos)
// justo antes de llamar a esta función
async function cargarCarritoDesdeBD() {
  await productosListos;

  const usuario = await obtenerUsuario();
  // Sin sesión: el carrito del visitante vive en localStorage y se conserva.
  // (Si se vaciara aquí, lo perdería al recargar o al ir a cuenta.html a entrar)
  if (!usuario) {
    await cargarProductosDelCarrito();
    return;
  }

  vaciarCarritoLocal();

  // UNA sola consulta: el pedido y, anidadas, sus filas de detalles_pedidos.
  // Supabase lo puede unir porque detalles_pedidos.pedido_id es llave foránea a pedidos.id
  const { data: pedido, error } = await db
    .from('pedidos')
    .select('id, detalles_pedidos(id, producto_id, cantidad)')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al cargar el carrito:', error);
    return;
  }
  if (!pedido) return; // todavía no tiene carrito: se crea al agregar el primero

  pedidoId = pedido.id;
  pedido.detalles_pedidos.forEach(detalle => {
    carrito[detalle.producto_id] = detalle.cantidad;
    detalleIds[detalle.producto_id] = detalle.id;
  });
  guardarCarrito();
  actualizarCarrito();
  // Trae nombre y precio de los productos del carrito que esta página no cargó
  // (ej. en cuenta.html no se carga ninguno), para poder pintarlos en el panel
  await cargarProductosDelCarrito();
}

// Productos ya leídos de Supabase, por id. El panel del carrito los necesita
// aunque la página actual no los muestre (ej. en producto.html)
const productosConocidos = new Map();

function recordarProductos(lista) {
  lista.forEach(producto => productosConocidos.set(String(producto.id), producto));
}

// Funciones que se llaman cada vez que el carrito cambia (tarjetas, stepper
// del detalle...). Así cada parte de la página se pone al día sola
const alCambiarCarrito = new Set();


// Trae de Supabase los productos del carrito que la página no cargó todavía,
// y ajusta las cantidades al stock actual (el carrito guardado puede tener días)
async function cargarProductosDelCarrito() {
  const faltantes = Object.keys(carrito).filter(id => !productosConocidos.has(id));

  if (faltantes.length > 0) {
    const { data, error } = await db
      .from('productos_practica')
      .select(COLUMNAS_TARJETA)
      .in('id', faltantes);

    if (error) {
      console.log('Error al cargar el carrito:', error);
      actualizarCarrito(); // un fallo de red no debe vaciar el carrito
      return;
    }
    recordarProductos(data);
  }

  let huboCambios = false;
  Object.keys(carrito).forEach(id => {
    const producto = productosConocidos.get(id);
    const permitido = producto ? Math.min(carrito[id], stockDe(producto)) : 0;
    if (permitido === carrito[id]) return;
    huboCambios = true;
    if (permitido > 0) carrito[id] = permitido;
    else delete carrito[id];
  });

  if (huboCambios) {
    guardarCarrito();
    mostrarNotificacion('Ajustamos tu carrito según las unidades disponibles.', 'error');
  }
  actualizarCarrito();
}

// Vuelve a pintar el panel y el contador a partir de "carrito"
function actualizarCarrito() {
  const items = Object.keys(carrito)
    .map(id => productosConocidos.get(id))
    .filter(Boolean);
  const unidades = Object.values(carrito).reduce((suma, cantidad) => suma + cantidad, 0);
  const total = items.reduce(
    (suma, producto) => suma + precioFinal(producto) * cantidadEnCarrito(producto.id), 0
  );

  const lista = document.getElementById('lista-carrito');
  const vacio = document.getElementById('carrito-vacio');
  lista.replaceChildren(...items.map(crearItemCarrito));
  lista.hidden = items.length === 0;
  vacio.hidden = items.length > 0;
  vacio.textContent = unidades > 0
    ? 'No pudimos cargar tu carrito en este momento.'
    : 'Tu carrito está vacío.';

  // Carrito vacío: no hay nada que confirmar → se cierra el formulario
  if (items.length === 0) {
    formCheckout.hidden = true;
    btnCheckout.hidden = false;
  }

  document.getElementById('contador-carrito').textContent = unidades;
  document.getElementById('titulo-carrito').textContent = `Tu carrito (${unidades})`;
  document.getElementById('total-carrito').textContent = formatoPrecio.format(total);

  alCambiarCarrito.forEach(refrescar => refrescar());
}

function crearItemCarrito(producto) {
  const item = document.createElement('li');
  item.className = 'item-carrito';

  const miniatura = crearImagen(producto, '');
  miniatura.classList.add('miniatura');
  if (miniatura.tagName === 'IMG') miniatura.alt = ''; // el nombre ya está al lado

  const info = document.createElement('div');
  info.className = 'item-info';
  const marca = document.createElement('p');
  marca.className = 'eyebrow';
  marca.textContent = producto.marca ?? '';
  const nombre = document.createElement('a');
  nombre.href = urlProducto(producto);
  nombre.textContent = producto.nombre;
  info.append(marca, nombre, crearPrecio(producto));

  const cantidad = cantidadEnCarrito(producto.id);

  const restar = crearBotonCantidad('−', `Quitar una unidad de ${producto.nombre}`);
  restar.addEventListener('click', () => conBotonOcupado(restar, () => fijarCantidad(producto, cantidad - 1)));

  const texto = document.createElement('span');
  texto.className = 'cantidad';
  texto.textContent = cantidad;

  const sumar = crearBotonCantidad('+', `Agregar una unidad de ${producto.nombre}`);
  sumar.disabled = cantidad >= stockDe(producto);
  sumar.addEventListener('click', () => conBotonOcupado(sumar, () => fijarCantidad(producto, cantidad + 1)));

  const quitar = document.createElement('button');
  quitar.type = 'button';
  quitar.className = 'btn-quitar';
  quitar.textContent = 'Quitar';
  quitar.setAttribute('aria-label', `Quitar ${producto.nombre} del carrito`);
  quitar.addEventListener('click', () => conBotonOcupado(quitar, () => quitarDelCarrito(String(producto.id))));

  const subtotal = document.createElement('span');
  subtotal.className = 'item-subtotal';
  subtotal.textContent = formatoPrecio.format(precioFinal(producto) * cantidad);

  const controles = document.createElement('div');
  controles.className = 'item-controles';
  controles.append(restar, texto, sumar, quitar, subtotal);

  item.append(miniatura, info, controles);
  return item;
}


// --- Piezas de la interfaz ---
// Todo con createElement + textContent: los datos vienen de la base, así que
// nunca se tratan como HTML

function crearImagen(producto, alt = producto.nombre, url = producto.img_url) {
  const sinImagen = () => {
    const caja = document.createElement('div');
    caja.className = 'sin-imagen';
    caja.textContent = 'Sin imagen';
    return caja;
  };
  if (!url) return sinImagen();

  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.loading = 'lazy';
  img.addEventListener('error', () => img.replaceWith(sinImagen()));
  return img;
}

function crearPrecio(producto) {
  const precio = document.createElement('p');
  precio.className = 'precio';

  const actual = document.createElement('span');
  actual.className = 'precio-actual';
  actual.textContent = formatoPrecio.format(precioFinal(producto));
  precio.append(actual);

  const descuento = descuentoDe(producto);
  if (descuento > 0) {
    precio.classList.add('con-descuento');
    const anterior = document.createElement('s');
    anterior.className = 'precio-anterior';
    anterior.textContent = formatoPrecio.format(producto.precio);

    const etiqueta = document.createElement('span');
    etiqueta.className = 'descuento';
    etiqueta.textContent = `-${Math.round(descuento * 100)}%`;
    precio.append(anterior, etiqueta);
  }
  return precio;
}

// null si el producto no tiene calificación: así no se muestran 0 estrellas
function crearEstrellas(producto) {
  if (producto.calificacion == null) return null;
  const valor = Number(producto.calificacion);

  const caja = document.createElement('p');
  caja.className = 'calificacion';
  // Las estrellas son decorativas; el lector de pantalla lee el texto
  const estrellas = document.createElement('span');
  estrellas.className = 'estrellas';
  estrellas.setAttribute('aria-hidden', 'true');
  estrellas.textContent = '★★★★★';
  estrellas.style.setProperty('--valor', `${(valor / 5) * 100}%`);

  const numero = document.createElement('span');
  numero.textContent = `${valor.toFixed(1)} de 5`;
  caja.append(estrellas, numero);
  return caja;
}

function crearBotonCantidad(simbolo, descripcion) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-cantidad btn-secundario';
  boton.textContent = simbolo;
  boton.setAttribute('aria-label', descripcion);
  return boton;
}

// Botones de una tarjeta (igual que en supabase1):
//   0 en el carrito → [Agregar]   (o [Agotado])
//   1 o más         → [−] n [+]
function crearAcciones(producto) {
  const acciones = document.createElement('div');
  acciones.className = 'acciones-tarjeta';

  const agregar = document.createElement('button');
  agregar.type = 'button';
  agregar.className = 'btn-agregar';

  const stepper = document.createElement('div');
  stepper.className = 'stepper';
  const restar = crearBotonCantidad('−', '');
  const sumar = crearBotonCantidad('+', `Agregar una unidad de ${producto.nombre}`);
  const texto = document.createElement('span');
  texto.className = 'cantidad';
  texto.setAttribute('aria-live', 'polite');
  stepper.append(restar, texto, sumar);

  function refrescar() {
    const stock = stockDe(producto);
    const enCarrito = cantidadEnCarrito(producto.id);
    agregar.hidden = enCarrito > 0;
    stepper.hidden = enCarrito === 0;
    agregar.disabled = stock === 0;
    agregar.textContent = stock === 0 ? 'Agotado' : 'Agregar al carrito';
    texto.textContent = enCarrito;
    sumar.disabled = enCarrito >= stock;
    restar.setAttribute('aria-label', enCarrito === 1
      ? `Quitar ${producto.nombre} del carrito`
      : `Quitar una unidad de ${producto.nombre}`);
  }

  // async: espera a Supabase (agregarAlCarrito) antes de seguir
  agregar.addEventListener('click', async () => {
    agregar.disabled = true; // evita el doble clic mientras responde la base
    const ok = await agregarAlCarrito(String(producto.id), 1);
    agregar.disabled = false;

    // Aviso de 1,2 s. actualizarCarrito() va DESPUÉS a propósito: si se
    // llamara ya, refrescar() escondería el botón (queda 1 en el carrito) y
    // el "Agregado" no alcanzaría a verse
    agregar.textContent = ok ? 'Agregado' : 'Error';
    agregar.classList.add(ok ? 'agregado' : 'error-agregar');

    setTimeout(() => {
      agregar.classList.remove('agregado', 'error-agregar');
      agregar.textContent = 'Agregar al carrito';
      actualizarCarrito();
      // El foco se mueve porque el botón pulsado queda hidden
      if (ok) sumar.focus();
    }, 1200);
  });
  sumar.addEventListener('click', () => {
    conBotonOcupado(sumar, () => fijarCantidad(producto, cantidadEnCarrito(producto.id) + 1));
  });
  restar.addEventListener('click', async () => {
    await conBotonOcupado(restar, () => fijarCantidad(producto, cantidadEnCarrito(producto.id) - 1));
    // Con 0 el stepper se esconde: el foco vuelve a "Agregar"
    if (cantidadEnCarrito(producto.id) === 0) agregar.focus();
  });

  alCambiarCarrito.add(refrescar);
  refrescar();
  acciones.append(agregar, stepper);
  return acciones;
}

// Tarjeta del catálogo, al estilo de la galería de SKIN1004: imagen sola
// sobre fondo suave, marca arriba en mayúsculas, nombre, descripción corta y
// precio. Si el producto tiene una segunda imagen, aparece al pasar el mouse
function crearTarjeta(producto) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';
  tarjeta.dataset.id = producto.id;

  // tabindex -1: la imagen y el nombre llevan al mismo sitio; con Tab basta uno
  const enlaceImagen = document.createElement('a');
  enlaceImagen.className = 'tarjeta-imagen';
  enlaceImagen.href = urlProducto(producto);
  enlaceImagen.tabIndex = -1;
  enlaceImagen.setAttribute('aria-hidden', 'true');
  enlaceImagen.append(crearImagen(producto, ''));

  const segunda = (producto.imagenes ?? []).find(url => url && url !== producto.img_url);
  if (segunda) {
    const hover = crearImagen(producto, '', segunda);
    hover.classList.add('imagen-hover');
    enlaceImagen.append(hover);
  }

  const stock = stockDe(producto);
  const descuento = descuentoDe(producto);
  if (stock === 0 || descuento > 0) {
    const insignia = document.createElement('span');
    insignia.className = stock === 0 ? 'insignia agotado' : 'insignia';
    insignia.textContent = stock === 0 ? 'Agotado' : `-${Math.round(descuento * 100)}%`;
    enlaceImagen.append(insignia);
  }

  const cuerpo = document.createElement('div');
  cuerpo.className = 'tarjeta-cuerpo';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = [producto.marca, CATEGORIAS[producto.categoria]?.singular]
    .filter(Boolean).join(' · ');

  const nombre = document.createElement('h3');
  const enlaceNombre = document.createElement('a');
  enlaceNombre.href = urlProducto(producto);
  enlaceNombre.textContent = producto.nombre;
  nombre.append(enlaceNombre);

  const descripcion = document.createElement('p');
  descripcion.className = 'descripcion';
  descripcion.textContent = producto.descripcion ?? '';

  cuerpo.append(eyebrow, nombre, descripcion);
  const estrellas = crearEstrellas(producto);
  if (estrellas) cuerpo.append(estrellas);
  if (stock > 0 && stock <= 5) {
    const pocas = document.createElement('p');
    pocas.className = 'pocas-unidades';
    pocas.textContent = `Últimas ${stock} unidades`;
    cuerpo.append(pocas);
  }
  cuerpo.append(crearPrecio(producto), crearAcciones(producto));

  tarjeta.append(enlaceImagen, cuerpo);
  return tarjeta;
}


// --- Checkout (formulario de envío) ---
// const al nivel del archivo: actualizarCarrito() las usa, y solo se llama
// cuando el archivo ya terminó de ejecutarse (nunca antes de esta línea)
const btnCheckout = document.getElementById('btn-pago');
const formCheckout = document.getElementById('form-checkout');
const mensajeCarrito = document.getElementById('mensaje-carrito');
const checkEnvio = document.getElementById('checkout-envio');


// --- Abrir y cerrar el panel del carrito ---
const panelCarrito = document.getElementById('panel-carrito');
const capaCarrito = document.getElementById('capa-carrito');
const botonCarrito = document.getElementById('btn-carrito');

function abrirCarrito() {
  panelCarrito.classList.add('abierto');
  panelCarrito.inert = false;
  capaCarrito.hidden = false;
  document.getElementById('btn-cerrar-carrito').focus();
}

function cerrarCarrito() {
  panelCarrito.classList.remove('abierto');
  panelCarrito.inert = true;
  capaCarrito.hidden = true;
  botonCarrito.focus(); // el foco vuelve a donde estaba antes de abrir
}

botonCarrito.addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
document.getElementById('btn-seguir').addEventListener('click', cerrarCarrito);
capaCarrito.addEventListener('click', cerrarCarrito);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && panelCarrito.classList.contains('abierto')) cerrarCarrito();
});

// El pago real todavía no existe. Cuando exista, precio y stock se validan en
// Supabase: lo calculado aquí se puede alterar desde la consola
btnCheckout.addEventListener('click', async () => {
  mensajeCarrito.textContent = '';

  if (Object.keys(carrito).length === 0) {
    mensajeCarrito.textContent = 'Tu carrito está vacío.';
    return;
  }
  // El pedido se guarda en la base a nombre del cliente: sin sesión no hay a quién
  if (!(await obtenerUsuario())) {
    mensajeCarrito.textContent = 'Para comprar, inicia sesión en Mi cuenta.';
    return;
  }
  formCheckout.hidden = false;
  btnCheckout.hidden = true;
  checkEnvio.focus(); // el foco va al primer campo del formulario que apareció
});

// 4b. Volver: cierra el formulario sin borrar lo escrito
document.getElementById('btn-cancelar-checkout').addEventListener('click', () => {
  formCheckout.hidden = true;
  btnCheckout.hidden = false;
  btnCheckout.focus();
});

// 4c. Dirección y teléfono son obligatorios solo con envío a domicilio.
// "required" hace que el navegador no deje enviar el form con el campo vacío
// (la base lo vuelve a revisar en confirmar_pedido: el front se puede saltar)
checkEnvio.addEventListener('change', () => {
  document.getElementById('checkout-direccion').required = checkEnvio.checked;
  document.getElementById('checkout-telefono').required = checkEnvio.checked;
});

// Campo de texto → su valor sin espacios, o null si quedó vacío.
// La función de la base usa nullif(trim(...)), pero así llega limpio
const textoONull = id => document.getElementById(id).value.trim() || null;

// Confirmar el pedido. El navegador NO calcula el total ni cambia el estado:
// solo llama a confirmar_pedido, que en la base revisa el stock, lo descuenta,
// fija los precios y pasa el pedido a 'confirmado' (todo o nada)
formCheckout.addEventListener('submit', async (event) => {
  event.preventDefault(); // sin esto el form recargaría la página
  if (!pedidoId) return;

  const botonConfirmar = document.getElementById('btn-confirmar');
  botonConfirmar.disabled = true; // un doble clic no confirma dos veces
  mensajeCarrito.textContent = '';

  // Los nombres de las llaves tienen que ser EXACTAMENTE los parámetros de la
  // función en SQL: rpc() los empareja por nombre, no por orden
  const { data, error } = await db.rpc('confirmar_pedido', {
    p_pedido_id: pedidoId,
    p_envio: checkEnvio.checked,
    p_direccion: textoONull('checkout-direccion'),
    p_telefono: textoONull('checkout-telefono'),
    p_observacion: textoONull('checkout-observacion'),
  });

  if (error) {
    // El mensaje lo escribió la función con "raise exception"
    // (ej. 'Stock insuficiente para el producto 2'). El carrito no se toca
    console.log('Error al confirmar el pedido:', error);
    mensajeCarrito.textContent = error.message;
    botonConfirmar.disabled = false;
    return;
  }

  // data = la fila del pedido ya confirmado. El total lo calcula la vista
  // pedidos_con_total en la base, con los precios definitivos
  const { data: conTotal, error: errorTotal } = await db
    .from('pedidos_con_total')
    .select('total')
    .eq('id', data.id)
    .single();

  if (errorTotal) console.log('Error al leer el total:', errorTotal);

  vaciarCarritoLocal(); // el carrito confirmado ya no es "carrito"
  formCheckout.reset();
  document.getElementById('checkout-direccion').required = false;
  document.getElementById('checkout-telefono').required = false;
  botonConfirmar.disabled = false;

  // Si falló solo la lectura del total, el pedido igual quedó confirmado
  mensajeCarrito.textContent = errorTotal
    ? `Pedido #${data.id} confirmado.`
    : `Pedido #${data.id} confirmado. Total: $${Number(conTotal.total).toLocaleString('es-CO')}`;
});


// --- Menú del usuario en el header (igual que en supabase1) ---
const menuUsuario = document.getElementById('menu-usuario');
const botonUsuario = document.getElementById('btn-usuario');

async function pintarMenuUsuario() {
  const { data } = await db.auth.getUser();
  const usuario = data.user;

  document.getElementById('enlace-login').hidden = Boolean(usuario);
  menuUsuario.hidden = !usuario;
  if (!usuario) return;

  const nombre = document.getElementById('nombre-usuario');
  nombre.textContent = usuario.email;

  // El nombre puede estar en clientes_practica o, si es admin, en admins_practica.
  // Las dos consultas a la vez; sin fila (o sin permiso) cada una da null
  const [respuestaCliente, respuestaAdmin] = await Promise.all([
    db.from('clientes_practica').select('nombre').eq('id', usuario.id).maybeSingle(),
    db.from('admins_practica').select('nombre').eq('id', usuario.id).maybeSingle(),
  ]);

  if (respuestaCliente.error) console.log('Error al leer el nombre del cliente:', respuestaCliente.error);
  if (respuestaAdmin.error) console.log('Error al leer el nombre del admin:', respuestaAdmin.error);

  // ?. = si data es null, no falla: da undefined. ?? = usa el siguiente si es null/undefined.
  // Si no hay nombre en ninguna, se queda el correo que ya estaba escrito
  const nombrePerfil = respuestaCliente.data?.nombre ?? respuestaAdmin.data?.nombre;
  if (nombrePerfil) nombre.textContent = nombrePerfil;
}

function abrirMenuUsuario(abrir) {
  menuUsuario.classList.toggle('abierto', abrir);
  botonUsuario.setAttribute('aria-expanded', abrir);
}

botonUsuario.addEventListener('click', () => {
  abrirMenuUsuario(!menuUsuario.classList.contains('abierto'));
});
document.addEventListener('click', (event) => {
  if (!menuUsuario.contains(event.target)) abrirMenuUsuario(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuUsuario.classList.contains('abierto')) {
    abrirMenuUsuario(false);
    botonUsuario.focus();
  }
});
menuUsuario.addEventListener('focusout', (event) => {
  if (!menuUsuario.contains(event.relatedTarget)) abrirMenuUsuario(false);
});


// --- Notificación ---
let temporizadorNotificacion;
function mostrarNotificacion(mensaje, tipo) {
  const caja = document.getElementById('notificacion');
  caja.textContent = mensaje;
  caja.className = tipo;
  caja.hidden = false;
  clearTimeout(temporizadorNotificacion);
  temporizadorNotificacion = setTimeout(() => { caja.hidden = true; }, 4000);
}


pintarMenuUsuario();
