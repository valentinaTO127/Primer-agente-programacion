// Galería de productos y carrito para clientes.
// Basado en "OBJETOS - GALERIA 3" de Julian Bejarano (licencia MIT,
// ver LICENSE-galeria.txt). Se cambió el array fijo por datos de Supabase, y
// las tarjetas siguen el patrón de admin.js.

// --- Estado ---
const CLAVE_CARRITO = 'carrito';

// Solo las columnas que usa esta página
const COLUMNAS = 'id, nombre, descripcion, precio, unidades, descuento, disponible, categorias, img_url';

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

let productos = [];              // lo último que llegó de Supabase
const carrito = leerCarrito();   // { idProducto: cantidad }, ej. { 1: 2, 3: 1 }

// Una función por tarjeta que pone al día sus botones. Cuando el carrito
// cambia, el stock que queda por agregar también cambia en la tarjeta.
const refrescosTarjetas = new Map();


// --- Carrito guardado en localStorage ---
// Se guardan SOLO id y cantidad, nunca el precio: el precio siempre se lee de
// la base. Si estuviera aquí, cualquiera podría cambiarlo desde la consola.
function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    if (!guardado || typeof guardado !== 'object') return {};
    // Lo guardado se puede editar a mano → solo aceptamos enteros positivos
    return Object.fromEntries(
      Object.entries(guardado).filter(([, cantidad]) => Number.isInteger(cantidad) && cantidad > 0)
    );
  } catch (e) {
    return {}; // JSON dañado o almacenamiento bloqueado
  }
}

function guardarCarrito() {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) {}
}


// --- Reglas del producto ---
// Agotado = disponible en false o sin unidades
function stockDe(producto) {
  return producto.disponible ? Math.max(producto.unidades ?? 0, 0) : 0;
}

// descuento es fracción (0.15). Un valor fuera de 0-1 se ignora: nunca debe
// dar un precio negativo
function descuentoDe(producto) {
  return producto.descuento > 0 && producto.descuento < 1 ? producto.descuento : 0;
}

function precioFinal(producto) {
  return Math.round(producto.precio * (1 - descuentoDe(producto)));
}

function cantidadEnCarrito(id) {
  return carrito[id] ?? 0;
}


// --- Galería ---
async function cargarProductos() {
  const estado = document.getElementById('estado-galeria');

  const { data, error } = await db
    .from('productos_practica')
    .select(COLUMNAS)
    .order('nombre');

  if (error) {
    console.log('Error al cargar los productos:', error);
    estado.textContent = 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
    actualizarCarrito(); // sin tocar lo guardado: un fallo de red no debe vaciar el carrito
    return;
  }

  productos = data;

  // Ojo: con RLS sin policy de lectura, Supabase devuelve [] SIN error
  if (productos.length === 0) {
    estado.textContent = 'Todavía no hay productos.';
    actualizarCarrito();
    return;
  }

  ajustarCarrito();
  estado.hidden = true;
  pintarGaleria();
  pintarCategorias();
  aplicarFiltros();
  document.getElementById('filtros').hidden = false;
  actualizarCarrito();
}

function pintarGaleria() {
  const galeria = document.getElementById('galeria');
  refrescosTarjetas.clear();

  galeria.replaceChildren(...productos.map((producto, i) => {
    const tarjeta = crearTarjeta(producto);
    tarjeta.style.setProperty('--i', i); // retraso de la animación en cascada
    return tarjeta;
  }));
}

// Todo con createElement + textContent: los datos vienen de la base, así que
// nunca se tratan como HTML. (El ejemplo original usaba innerHTML.)
function crearTarjeta(producto) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';
  tarjeta.dataset.id = producto.id;

  const nombre = document.createElement('h3');
  nombre.textContent = producto.nombre;

  const descripcion = document.createElement('p');
  descripcion.className = 'descripcion';
  descripcion.textContent = producto.descripcion || 'Sin descripción';

  const stock = stockDe(producto);
  const estado = document.createElement('p');
  estado.className = stock > 0 ? 'estado disponible' : 'estado agotado';
  estado.textContent = stock > 0 ? `Disponible · ${stock} unidades` : 'Agotado';

  const etiquetas = document.createElement('ul');
  etiquetas.className = 'etiquetas';
  (producto.categorias ?? []).forEach(categoria => {
    const li = document.createElement('li');
    li.textContent = categoria;
    etiquetas.appendChild(li);
  });

  tarjeta.append(
    crearImagen(producto), nombre, descripcion, crearPrecio(producto),
    estado, etiquetas, crearAcciones(producto)
  );
  return tarjeta;
}

function crearImagen(producto) {
  const sinImagen = () => {
    const caja = document.createElement('div');
    caja.className = 'sin-imagen';
    caja.textContent = 'Sin imagen';
    return caja;
  };

  if (!producto.img_url) return sinImagen();

  const img = document.createElement('img');
  img.src = producto.img_url;
  img.alt = producto.nombre;
  img.loading = 'lazy'; // no descarga las imágenes que aún no se ven
  img.addEventListener('error', () => img.replaceWith(sinImagen()));
  return img;
}

function crearPrecio(producto) {
  const precio = document.createElement('p');
  precio.className = 'precio';
  precio.textContent = formatoPrecio.format(precioFinal(producto));

  const descuento = descuentoDe(producto);
  if (descuento > 0) {
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

// Botones de UNA tarjeta. Dos estados, según lo que haya en el carrito:
//   0 unidades   → [Agregar]   (o [Agotado] si no hay stock)
//   1 o más      → [−] n [+]   (stepper)
// La tarjeta no guarda su propia cantidad: lee siempre "carrito". Así el
// número de la tarjeta y el del panel del carrito nunca se contradicen.
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
  // aria-live: el lector de pantalla anuncia el número nuevo al cambiar
  texto.setAttribute('aria-live', 'polite');

  stepper.append(restar, texto, sumar);

  // Pone al día la tarjeta a partir del carrito. La llama actualizarCarrito()
  // cada vez que el carrito cambia (desde la tarjeta o desde el panel)
  function refrescar() {
    const stock = stockDe(producto);
    const enCarrito = cantidadEnCarrito(producto.id);

    agregar.hidden = enCarrito > 0;
    stepper.hidden = enCarrito === 0;

    agregar.disabled = stock === 0;
    agregar.textContent = stock === 0 ? 'Agotado' : 'Agregar';

    texto.textContent = enCarrito;
    sumar.disabled = enCarrito >= stock;
    // Con 1 unidad, "−" no resta: saca el producto del carrito. El nombre
    // accesible lo dice para que no sea una sorpresa
    restar.setAttribute('aria-label', enCarrito === 1
      ? `Quitar ${producto.nombre} del carrito`
      : `Quitar una unidad de ${producto.nombre}`);
  }

  // Todo pasa por cambiarCantidad(): limita al stock y con 0 borra el producto.
  // El foco se mueve porque el botón pulsado queda hidden: sin esto, quien
  // navega con teclado "pierde" su lugar y vuelve al inicio de la página
  agregar.addEventListener('click', () => {
    cambiarCantidad(producto, 1);
    sumar.focus();
  });
  sumar.addEventListener('click', () => {
    cambiarCantidad(producto, cantidadEnCarrito(producto.id) + 1);
  });
  restar.addEventListener('click', () => {
    cambiarCantidad(producto, cantidadEnCarrito(producto.id) - 1);
    if (cantidadEnCarrito(producto.id) === 0) agregar.focus();
  });

  refrescosTarjetas.set(producto.id, refrescar);
  refrescar();

  acciones.append(agregar, stepper);
  return acciones;
}

function crearBotonCantidad(simbolo, descripcion) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-cantidad btn-secundario';
  boton.textContent = simbolo;
  boton.setAttribute('aria-label', descripcion);
  return boton;
}


// --- Buscador y filtro por categoría ---
// Las tarjetas ya existen: filtrar solo las muestra u oculta con hidden. No se
// consulta Supabase en cada tecla, y cada tarjeta conserva sus botones.
const buscador = document.getElementById('buscador');
let categoriaActiva = ''; // texto normalizado; '' = Todas

// "Audífonos" → "audifonos": así buscar "audifonos" o "AUDÍFONOS" da lo mismo.
// normalize('NFD') separa la letra de su tilde, y el replace quita las tildes.
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Sale de los productos, no de una lista fija. El Map une "Audio" y "audio"
// en un solo botón, porque en admin las categorías se escriben a mano.
function pintarCategorias() {
  const categorias = new Map();
  productos.forEach(producto => {
    (producto.categorias ?? []).forEach(categoria => {
      const clave = normalizar(categoria);
      if (clave && !categorias.has(clave)) categorias.set(clave, String(categoria).trim());
    });
  });

  const contenedor = document.getElementById('filtro-categorias');
  // Sin categorías no tiene sentido mostrar un "Todas" solo
  contenedor.hidden = categorias.size === 0;

  const ordenadas = [...categorias].sort(([, a], [, b]) => a.localeCompare(b, 'es'));
  contenedor.replaceChildren(
    crearChipCategoria('Todas', ''),
    ...ordenadas.map(([clave, etiqueta]) => crearChipCategoria(etiqueta, clave))
  );
}

function crearChipCategoria(etiqueta, clave) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip-categoria';
  chip.textContent = etiqueta;
  chip.dataset.categoria = clave;
  chip.addEventListener('click', () => {
    categoriaActiva = clave;
    aplicarFiltros();
  });
  return chip;
}

// Cada palabra debe aparecer en el nombre, la descripción o las categorías.
// Por eso "bluetooth audifonos" encuentra "Audífonos Bluetooth".
function coincide(producto, busqueda) {
  const categorias = (producto.categorias ?? []).map(normalizar);
  if (categoriaActiva && !categorias.includes(categoriaActiva)) return false;

  const texto = normalizar([producto.nombre, producto.descripcion, ...categorias].join(' '));
  return busqueda.split(/\s+/).every(palabra => texto.includes(palabra));
}

function aplicarFiltros() {
  const busqueda = normalizar(buscador.value);
  let visibles = 0;

  productos.forEach(producto => {
    const tarjeta = document.querySelector(`.tarjeta[data-id="${producto.id}"]`);
    const visible = coincide(producto, busqueda);
    // Al reaparecer se repite la animación: sin esto, una tarjeta del final
    // esperaría su retraso de la cascada mientras el usuario escribe
    if (tarjeta.hidden && visible) tarjeta.style.setProperty('--i', 0);
    tarjeta.hidden = !visible;
    if (visible) visibles++;
  });

  document.querySelectorAll('.chip-categoria').forEach(chip => {
    chip.setAttribute('aria-pressed', chip.dataset.categoria === categoriaActiva);
  });

  document.getElementById('resultados-filtro').textContent = `Mostrando ${visibles} de ${productos.length}`;
  document.getElementById('sin-resultados').hidden = visibles > 0;
  document.getElementById('btn-limpiar-filtros').hidden = !busqueda && !categoriaActiva;
}

// "input" = cada vez que cambia el texto; también al borrar con la ✕ del buscador
buscador.addEventListener('input', aplicarFiltros);

// Enter dentro del buscador enviaría el form y recargaría la página
document.getElementById('filtros').addEventListener('submit', (event) => event.preventDefault());

document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  buscador.value = '';
  categoriaActiva = '';
  aplicarFiltros();
  buscador.focus();
});


// --- Carrito ---
// Único lugar que cambia el carrito. El resultado nunca pasa del stock; con 0
// (o menos) el producto sale del carrito.
function cambiarCantidad(producto, nuevaCantidad) {
  const cantidad = Math.min(nuevaCantidad, stockDe(producto));
  if (cantidad > 0) carrito[producto.id] = cantidad;
  else delete carrito[producto.id];

  guardarCarrito();
  actualizarCarrito();
}

// El carrito guardado puede tener días: el producto pudo agotarse o borrarse.
function ajustarCarrito() {
  let hubieronCambios = false;

  Object.keys(carrito).forEach(id => {
    const producto = productos.find(p => String(p.id) === id);
    const permitido = producto ? Math.min(carrito[id], stockDe(producto)) : 0;

    if (permitido === carrito[id]) return;
    hubieronCambios = true;
    if (permitido > 0) carrito[id] = permitido;
    else delete carrito[id];
  });

  if (hubieronCambios) {
    guardarCarrito();
    mostrarNotificacion('Ajustamos tu carrito según las unidades disponibles.', 'error');
  }
}

// Vuelve a pintar el panel y los contadores a partir de "carrito"
function actualizarCarrito() {
  const items = productos.filter(producto => cantidadEnCarrito(producto.id) > 0);
  const lista = document.getElementById('lista-carrito');
  const mensaje = document.getElementById('mensaje-carrito');

  // Unidades: suma de las cantidades. El total se calcula con el precio de la base.
  const unidades = Object.values(carrito).reduce((suma, cantidad) => suma + cantidad, 0);
  const total = items.reduce(
    (suma, producto) => suma + precioFinal(producto) * cantidadEnCarrito(producto.id), 0
  );

  lista.replaceChildren(...items.map(crearItemCarrito));
  lista.hidden = items.length === 0;
  mensaje.hidden = items.length > 0;
  // Hay algo guardado pero no se pudo leer la lista de productos
  mensaje.textContent = unidades > 0
    ? 'No pudimos cargar tu carrito en este momento.'
    : 'Tu carrito está vacío.';

  document.getElementById('contador-carrito').textContent = unidades;
  document.getElementById('total-carrito').textContent = formatoPrecio.format(total);
  document.getElementById('btn-pago').disabled = items.length === 0;

  refrescosTarjetas.forEach(refrescar => refrescar());
}

function crearItemCarrito(producto) {
  const item = document.createElement('li');
  item.className = 'item-carrito';

  let miniatura;
  if (producto.img_url) {
    miniatura = document.createElement('img');
    miniatura.src = producto.img_url;
    miniatura.alt = ''; // el nombre ya está al lado: sería repetirlo
  } else {
    miniatura = document.createElement('div');
    miniatura.className = 'sin-miniatura';
  }

  const info = document.createElement('div');
  info.className = 'item-info';
  const nombre = document.createElement('strong');
  nombre.textContent = producto.nombre;
  const unitario = document.createElement('span');
  unitario.textContent = `${formatoPrecio.format(precioFinal(producto))} c/u`;
  info.append(nombre, unitario);

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


// --- Abrir y cerrar el panel ---
const panelCarrito = document.getElementById('panel-carrito');
const capaCarrito = document.getElementById('capa-carrito');
const botonCarrito = document.getElementById('btn-carrito');
const rastroCrema = document.getElementById('rastro-crema');
// El trazo de la máscara: de él sale la curva y su animación avisa cuándo abrir el panel
const mascaraCrema = rastroCrema.querySelector('.crema-mascara');
const sinAnimaciones = matchMedia('(prefers-reduced-motion: reduce)');
// true mientras la crema está pasando y el panel todavía no entra
let esperandoRastro = false;
let respaldoRastro = null; // id del setTimeout de respaldo

// --- Borde de la crema: ancho en la punta redonda, delgado hacia la derecha ---
// Un stroke tiene el mismo grosor en todo el recorrido, así que el borde se
// arma como una forma rellena: se recorre la curva y, en cada punto, se pone un
// punto a cada lado (sobre la normal) a una distancia que va cambiando.
// Valores en unidades del viewBox (1600 × 900)
// Ancho de la forma a cada lado de la curva = ANCHO_BASE + lo que vaya del borde
const ANCHO_BASE = 129;  // la mitad del ancho que tenía el cuerpo (258 / 2)
const BORDE_INICIO = 70; // cuánto se suma a cada lado en la punta redonda
const BORDE_FINAL = 4;   // cuánto se suma al final de la curva (borde derecho)
// Grosor del contorno oscuro: más grueso en la punta, más fino hacia la derecha.
// Se reparte mitad afuera y mitad adentro de la forma, como haría un stroke
const CONTORNO_PUNTA = 44;
const CONTORNO_FINAL = 24;
const MUESTRAS = 150;    // puntos por lado: más = contorno más suave
const MUESTRAS_PUNTA = 60; // puntos de la media circunferencia de la punta

function calcularBordeCrema() {
  // Copia de la curva SIN pathLength, para medir en unidades reales del viewBox
  const curva = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  curva.setAttribute('d', mascaraCrema.getAttribute('d'));
  rastroCrema.querySelector('defs').append(curva);
  const largo = curva.getTotalLength();

  // Punto, tangente (hacia dónde va la curva) y normal (la tangente girada 90°)
  function medir(distancia) {
    const p = curva.getPointAtLength(distancia);
    const antes = curva.getPointAtLength(Math.max(0, distancia - 1));
    const despues = curva.getPointAtLength(Math.min(largo, distancia + 1));
    const dx = despues.x - antes.x;
    const dy = despues.y - antes.y;
    const tamano = Math.hypot(dx, dy);
    const tx = dx / tamano;
    const ty = dy / tamano;
    return { x: p.x, y: p.y, tx, ty, nx: -ty, ny: tx };
  }

  // Interpolación lineal: en avance 0 da "inicio", en avance 1 da "final"
  const mezclar = (inicio, final, avance) => inicio + (final - inicio) * avance;

  // Arma el "d" de la forma. "extra" se suma al ancho (negativo = más angosta),
  // así la misma función sirve para la forma oscura de afuera y la clara de adentro
  function forma(extraPunta, extraFinal) {
    const ladoA = [];
    const ladoB = [];
    for (let i = 0; i <= MUESTRAS; i++) {
      const avance = i / MUESTRAS; // 0 = punta redonda, 1 = final de la curva
      const m = medir(avance * largo);
      const ancho = ANCHO_BASE + mezclar(BORDE_INICIO, BORDE_FINAL, avance)
                  + mezclar(extraPunta, extraFinal, avance);
      ladoA.push([m.x + m.nx * ancho, m.y + m.ny * ancho]);
      ladoB.push([m.x - m.nx * ancho, m.y - m.ny * ancho]);
    }

    // Punta redonda: media circunferencia que va del lado B al lado A
    // pasando por "detrás" del inicio (en contra de la tangente)
    const inicio = medir(0);
    const radio = ANCHO_BASE + BORDE_INICIO + extraPunta;
    const punta = [];
    for (let i = 0; i <= MUESTRAS_PUNTA; i++) {
      const angulo = Math.PI * (1 - i / MUESTRAS_PUNTA); // de π a 0
      const cos = Math.cos(angulo);
      const sen = Math.sin(angulo);
      punta.push([
        inicio.x + radio * (cos * inicio.nx - sen * inicio.tx),
        inicio.y + radio * (cos * inicio.ny - sen * inicio.ty),
      ]);
    }

    // Lado A de ida, lado B de vuelta y la punta para cerrar
    const puntos = [...ladoA, ...ladoB.reverse(), ...punta];
    return 'M ' + puntos.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
  }

  // La oscura asoma media franja por fuera; la clara queda media franja por dentro
  document.getElementById('contorno-crema')
    .setAttribute('d', forma(CONTORNO_PUNTA / 2, CONTORNO_FINAL / 2));
  document.getElementById('relleno-crema')
    .setAttribute('d', forma(-CONTORNO_PUNTA / 2, -CONTORNO_FINAL / 2));
  curva.remove();
}
calcularBordeCrema();

function mostrarPanel() {
  esperandoRastro = false;
  panelCarrito.classList.add('abierto');
  panelCarrito.inert = false;
  document.getElementById('btn-cerrar-carrito').focus();
}

// Ojo: el rastro es un <svg>, y .hidden solo existe en elementos HTML.
// En un SVG, "rastroCrema.hidden = false" no toca el atributo y el svg
// sigue oculto. Por eso aquí se cambia el ATRIBUTO con toggleAttribute
function ocultarRastro() {
  rastroCrema.toggleAttribute('hidden', true);
  rastroCrema.classList.remove('pasando');
}

// Primero pasa la crema y, cuando termina de dibujarse, entra el panel
function abrirCarrito() {
  if (esperandoRastro || panelCarrito.classList.contains('abierto')) return;
  capaCarrito.hidden = false;

  if (sinAnimaciones.matches) {
    mostrarPanel();
    return;
  }
  esperandoRastro = true;
  rastroCrema.toggleAttribute('hidden', false);
  rastroCrema.classList.add('pasando');
  // Respaldo: si la animación no llega a correr, animationend nunca se dispara
  // y el panel no entraría. A los 1100 ms se abre igual (duración de
  // crema-dibujar en el CSS + ~300 ms de margen: si cambias una, cambia la otra)
  respaldoRastro = setTimeout(() => { if (esperandoRastro) mostrarPanel(); }, 1100);
}

// animationend "burbujea" hacia arriba: al svg le llegan los eventos de todos
// sus hijos (trazos, burbujas). Por eso se revisa event.target
mascaraCrema.addEventListener('animationend', () => {
  if (esperandoRastro) mostrarPanel();
});
rastroCrema.addEventListener('animationend', (event) => {
  if (event.target === rastroCrema) ocultarRastro(); // terminó de desvanecerse
});

function cerrarCarrito() {
  esperandoRastro = false; // por si se cierra mientras la crema aún pasa
  clearTimeout(respaldoRastro);
  ocultarRastro();
  panelCarrito.classList.remove('abierto');
  panelCarrito.inert = true;
  capaCarrito.hidden = true;
  botonCarrito.focus(); // el foco vuelve a donde estaba antes de abrir
}

botonCarrito.addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
capaCarrito.addEventListener('click', cerrarCarrito);

document.addEventListener('keydown', (event) => {
  const abiertoOAbriendo = panelCarrito.classList.contains('abierto') || esperandoRastro;
  if (event.key === 'Escape' && abiertoOAbriendo) cerrarCarrito();
});


// --- Proceder al pago ---
// El pago real todavía no existe. Cuando exista, el precio y el stock se deben
// validar en Supabase: lo calculado aquí se puede alterar desde la consola.
document.getElementById('btn-pago').addEventListener('click', async () => {
  const { data } = await db.auth.getUser();

  if (!data.user) {
    // El carrito sigue en localStorage: no se pierde al cambiar de página
    window.location.href = 'cliente.html';
    return;
  }

  mostrarNotificacion('El pago todavía no está disponible.', 'error');
});


// --- Menú del usuario en el header ---
// Con sesión: botón con el nombre. Sin sesión: enlace "Iniciar sesión".
const menuUsuario = document.getElementById('menu-usuario');
const botonUsuario = document.getElementById('btn-usuario');

async function pintarMenuUsuario() {
  const { data } = await db.auth.getUser();
  const usuario = data.user;

  document.getElementById('enlace-login').hidden = Boolean(usuario);
  menuUsuario.hidden = !usuario;
  if (!usuario) return;

  // Primero el correo (lo tenemos ya), y si hay perfil, el nombre.
  // Así el botón nunca queda vacío mientras llega la respuesta
  const nombre = document.getElementById('nombre-usuario');
  nombre.textContent = usuario.email;

  const { data: perfil, error } = await db
    .from('clientes_practica')
    .select('nombre')
    .eq('id', usuario.id)
    .maybeSingle(); // sin fila (ej. sesión de admin) → null, se queda el correo

  if (error) console.log('Error al leer el nombre del cliente:', error);
  if (perfil?.nombre) nombre.textContent = perfil.nombre;
}

// Una sola función abre/cierra: la clase (para el CSS) y aria-expanded
// (para el lector de pantalla) nunca quedan desincronizados
function abrirMenuUsuario(abrir) {
  menuUsuario.classList.toggle('abierto', abrir);
  botonUsuario.setAttribute('aria-expanded', abrir);
}

botonUsuario.addEventListener('click', () => {
  abrirMenuUsuario(!menuUsuario.classList.contains('abierto'));
});

// Se cierra al hacer clic afuera, con Escape o al salir con Tab
document.addEventListener('click', (event) => {
  if (!menuUsuario.contains(event.target)) abrirMenuUsuario(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuUsuario.classList.contains('abierto')) {
    abrirMenuUsuario(false);
    botonUsuario.focus(); // el foco vuelve a donde estaba
  }
});
// focusout + relatedTarget = "a dónde se fue el foco". Si fue fuera del menú, se cierra
menuUsuario.addEventListener('focusout', (event) => {
  if (!menuUsuario.contains(event.relatedTarget)) abrirMenuUsuario(false);
});

pintarMenuUsuario();


// --- Notificación (igual que en admin.js) ---
let temporizadorNotificacion;
function mostrarNotificacion(mensaje, tipo) {
  const caja = document.getElementById('notificacion');
  caja.textContent = mensaje;
  caja.className = tipo;
  caja.hidden = false;

  clearTimeout(temporizadorNotificacion);
  temporizadorNotificacion = setTimeout(() => { caja.hidden = true; }, 4000);
}


// --- Modo claro / oscuro (igual que en cliente.js) ---
const botonTema = document.getElementById('btn-tema');

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const oscuro = tema === 'oscuro';
  botonTema.textContent = oscuro ? '☀️' : '🌙';
  botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

aplicarTema(document.documentElement.dataset.tema);

botonTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
  aplicarTema(nuevo);
  try { localStorage.setItem('tema', nuevo); } catch (e) {}
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  let guardado = null;
  try { guardado = localStorage.getItem('tema'); } catch (e) {}
  if (!guardado) aplicarTema(event.matches ? 'oscuro' : 'claro');
});


// Al final del archivo: usa const de más arriba, que no existen hasta que el
// script llega a su línea.
cargarProductos();
