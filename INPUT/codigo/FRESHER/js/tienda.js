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

// Productos ya leídos de Supabase, por id. El panel del carrito los necesita
// aunque la página actual no los muestre (ej. en producto.html)
const productosConocidos = new Map();

function recordarProductos(lista) {
  lista.forEach(producto => productosConocidos.set(String(producto.id), producto));
}

// Funciones que se llaman cada vez que el carrito cambia (tarjetas, stepper
// del detalle...). Así cada parte de la página se pone al día sola
const alCambiarCarrito = new Set();

// Único lugar que cambia el carrito. Nunca pasa del stock; con 0 sale
function cambiarCantidad(producto, nuevaCantidad) {
  const cantidad = Math.min(nuevaCantidad, stockDe(producto));
  if (cantidad > 0) carrito[producto.id] = cantidad;
  else delete carrito[producto.id];

  guardarCarrito();
  actualizarCarrito();
}

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
  const mensaje = document.getElementById('mensaje-carrito');
  lista.replaceChildren(...items.map(crearItemCarrito));
  lista.hidden = items.length === 0;
  mensaje.hidden = items.length > 0;
  mensaje.textContent = unidades > 0
    ? 'No pudimos cargar tu carrito en este momento.'
    : 'Tu carrito está vacío.';

  document.getElementById('contador-carrito').textContent = unidades;
  document.getElementById('titulo-carrito').textContent = `Tu carrito (${unidades})`;
  document.getElementById('total-carrito').textContent = formatoPrecio.format(total);
  document.getElementById('btn-pago').disabled = items.length === 0;

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
  restar.addEventListener('click', () => cambiarCantidad(producto, cantidad - 1));

  const texto = document.createElement('span');
  texto.className = 'cantidad';
  texto.textContent = cantidad;

  const sumar = crearBotonCantidad('+', `Agregar una unidad de ${producto.nombre}`);
  sumar.disabled = cantidad >= stockDe(producto);
  sumar.addEventListener('click', () => cambiarCantidad(producto, cantidad + 1));

  const quitar = document.createElement('button');
  quitar.type = 'button';
  quitar.className = 'btn-quitar';
  quitar.textContent = 'Quitar';
  quitar.setAttribute('aria-label', `Quitar ${producto.nombre} del carrito`);
  quitar.addEventListener('click', () => cambiarCantidad(producto, 0));

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

  // El foco se mueve porque el botón pulsado queda hidden
  agregar.addEventListener('click', () => {
    cambiarCantidad(producto, 1);
    sumar.focus();
  });
  sumar.addEventListener('click', () => cambiarCantidad(producto, cantidadEnCarrito(producto.id) + 1));
  restar.addEventListener('click', () => {
    cambiarCantidad(producto, cantidadEnCarrito(producto.id) - 1);
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
document.getElementById('btn-pago').addEventListener('click', async () => {
  const { data } = await db.auth.getUser();
  if (!data.user) {
    window.location.href = 'cuenta.html'; // el carrito sigue en localStorage
    return;
  }
  mostrarNotificacion('El pago todavía no está disponible.', 'error');
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

  const { data: perfil, error } = await db
    .from('clientes_practica')
    .select('nombre')
    .eq('id', usuario.id)
    .maybeSingle();

  if (error) console.log('Error al leer el nombre del cliente:', error);
  if (perfil?.nombre) nombre.textContent = perfil.nombre;
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
