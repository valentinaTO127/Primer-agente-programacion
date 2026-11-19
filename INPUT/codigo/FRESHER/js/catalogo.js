// Catálogo (index.html): carga los productos, pinta las tarjetas y filtra por
// categoría y por texto. Usa las funciones de tienda.js.

// Sin filtros, el catálogo muestra solo los primeros LIMITE_CATALOGO.
// Los muestra todos cuando la persona elige "Todo" en el menú (o el chip "Todo")
const LIMITE_CATALOGO = 20;
const LIMITE_VITRINA = 5;

let productos = [];
let categoriaActiva = categoriaDeLaUrl(); // '' = sin categoría
// ?ver=todo: así "Todo" también funciona desde producto.html o cuenta.html,
// y al recargar la página se sigue viendo todo
let mostrarTodos = new URLSearchParams(window.location.search).get('ver') === 'todo';

// ?categoria=serum → 'serum'. Si no es una categoría válida, se ignora
function categoriaDeLaUrl() {
  const categoria = new URLSearchParams(window.location.search).get('categoria') ?? '';
  return categoria in CATEGORIAS ? categoria : '';
}

async function cargarProductos() {
  const estado = document.getElementById('estado-galeria');

  // Misma tabla que supabase1, así que se filtra:
  //   - categoria no nula → solo los productos de FRESHER
  //   - disponible = true     → los deshabilitados por el admin no se muestran
  //     (sin unidades sí se muestran, como "Agotado")
  const { data, error } = await db
    .from('productos_practica')
    .select(COLUMNAS_TARJETA + ', ingredientes, beneficios')
    .not('categoria', 'is', null)
    .eq('disponible', true)
    .order('nombre');

  if (error) {
    estado.textContent = mensajeErrorCarga(error);
    return;
  }

  productos = data;
  recordarProductos(productos);

  // Con RLS sin policy de lectura, Supabase devuelve [] SIN error
  if (productos.length === 0) {
    estado.textContent = 'Todavía no hay productos.';
    return;
  }

  estado.hidden = true;
  pintarVitrina();
  document.getElementById('galeria').replaceChildren(...productos.map(crearTarjeta));
  pintarChips();
  document.getElementById('filtros').hidden = false;
  aplicarFiltros();
}


// --- Vitrina horizontal ---
// Los LIMITE_VITRINA mejor calificados con stock. filter() ya devuelve un array
// nuevo, así que sort no desordena "productos" (el catálogo lo quiere por nombre)
function pintarVitrina() {
  // Primero se quitan los agotados: "los mejor calificados" debe poder comprarse
  // (en los datos reales, el de nota más alta tiene 0 unidades)
  const destacados = productos
    .filter(producto => stockDe(producto) > 0)
    .sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0))
    .slice(0, LIMITE_VITRINA);

  // Si todos estuvieran agotados, la vitrina se queda oculta
  if (destacados.length === 0) return;

  document.getElementById('vitrina-pista').replaceChildren(...destacados.map(crearItemVitrina));
  document.querySelector('.vitrina').hidden = false;
  actualizarFlechasVitrina();
}

function crearItemVitrina(producto) {
  const item = document.createElement('li');
  item.className = 'vitrina-item';
  // El color de la franja sale de la categoría (ver .vitrina-item[data-categoria] en el CSS)
  item.dataset.categoria = producto.categoria;

  const nombre = document.createElement('h3');
  const enlace = document.createElement('a');
  enlace.href = urlProducto(producto);
  enlace.textContent = producto.nombre;
  nombre.append(enlace);

  const marca = document.createElement('p');
  marca.className = 'eyebrow';
  marca.textContent = producto.marca ?? '';

  // La franja es el ::before de .vitrina-escena; la imagen va encima
  const escena = document.createElement('div');
  escena.className = 'vitrina-escena';
  const imagen = document.createElement('div');
  imagen.className = 'vitrina-imagen';
  imagen.append(crearImagen(producto, ''));
  escena.append(imagen);

  const descripcion = document.createElement('p');
  descripcion.className = 'vitrina-descripcion';
  descripcion.textContent = producto.descripcion ?? '';

  item.append(nombre, marca, escena, descripcion);
  return item;
}

const pista = document.getElementById('vitrina-pista');
const btnAnterior = document.getElementById('vitrina-anterior');
const btnSiguiente = document.getElementById('vitrina-siguiente');

// Cada flecha mueve casi un "ancho de pantalla" de la pista
function moverVitrina(direccion) {
  const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  pista.scrollBy({ left: direccion * pista.clientWidth * 0.8, behavior: suave ? 'smooth' : 'auto' });
}

// Se apaga la flecha del lado al que ya no se puede avanzar.
// El -1 es por los decimales: a veces el scroll se queda en 0.5px del final
function actualizarFlechasVitrina() {
  btnAnterior.disabled = pista.scrollLeft <= 0;
  btnSiguiente.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 1;
}

btnAnterior.addEventListener('click', () => moverVitrina(-1));
btnSiguiente.addEventListener('click', () => moverVitrina(1));
pista.addEventListener('scroll', actualizarFlechasVitrina, { passive: true });
window.addEventListener('resize', actualizarFlechasVitrina);


// --- Filtros ---
const buscador = document.getElementById('buscador');

// "Sérum" → "serum": así buscar "serum" o "SÉRUM" da lo mismo
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Los chips salen de CATEGORIAS (lista fija, igual al CHECK de la base), no de los
// productos como en supabase1: ahí las categorías se escribían a mano
function pintarChips() {
  const chips = [['', 'Todo'], ...Object.entries(CATEGORIAS).map(([clave, categoria]) => [clave, categoria.plural])];
  document.getElementById('filtro-categorias').replaceChildren(...chips.map(([clave, etiqueta]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-categoria';
    chip.dataset.categoria = clave;
    const cuantos = clave ? productos.filter(p => p.categoria === clave).length : productos.length;
    chip.textContent = `${etiqueta} (${cuantos})`;
    chip.addEventListener('click', () => elegirCategoria(clave));
    return chip;
  }));
}

// categoria '' = "Todo": por defecto también quita el límite de 20.
// "Limpiar filtros" pasa verTodos = false para volver a la vista inicial
function elegirCategoria(categoria, verTodos = categoria === '') {
  categoriaActiva = categoria;
  mostrarTodos = verTodos;
  // Cambia la URL sin recargar: así el enlace se puede compartir o recargar
  // y abre con el mismo filtro
  const url = categoria ? `?categoria=${categoria}#catalogo`
    : verTodos ? '?ver=todo#catalogo'
    : 'index.html#catalogo';
  history.replaceState(null, '', url);
  aplicarFiltros();
}

// El límite solo aplica a la vista inicial. Con categoría o búsqueda se ven
// todas las coincidencias: buscar solo entre 20 escondería resultados
function hayLimite(busqueda) {
  return !mostrarTodos && !categoriaActiva && !busqueda;
}

// "Todo" está activo solo cuando de verdad se ven todos
function categoriaMarcada(clave) {
  return clave === '' ? !categoriaActiva && mostrarTodos : clave === categoriaActiva;
}

// Cada palabra debe aparecer en el nombre, la marca, la descripción, los
// ingredientes o los beneficios. "niacinamida serum" encuentra un sérum con niacinamida
function coincide(producto, busqueda) {
  if (categoriaActiva && producto.categoria !== categoriaActiva) return false;
  const texto = normalizar([
    producto.nombre, producto.marca, producto.descripcion,
    producto.ingredientes, ...(producto.beneficios ?? []),
  ].join(' '));
  return busqueda.split(/\s+/).every(palabra => texto.includes(palabra));
}

function aplicarFiltros() {
  const busqueda = normalizar(buscador.value);
  const limite = hayLimite(busqueda) ? LIMITE_CATALOGO : Infinity;
  let visibles = 0;

  productos.forEach(producto => {
    const tarjeta = document.querySelector(`.tarjeta[data-id="${producto.id}"]`);
    const visible = visibles < limite && coincide(producto, busqueda);
    tarjeta.hidden = !visible;
    if (visible) visibles++;
  });

  document.querySelectorAll('.chip-categoria').forEach(chip => {
    chip.setAttribute('aria-pressed', categoriaMarcada(chip.dataset.categoria));
  });
  document.querySelectorAll('.nav-principal a').forEach(enlace => {
    if (categoriaMarcada(enlace.dataset.categoria)) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });

  document.getElementById('resultados-filtro').textContent = limite === LIMITE_CATALOGO && productos.length > limite
    ? `Mostrando ${visibles} de ${productos.length} · elige «Todo» para ver el resto`
    : `Mostrando ${visibles} de ${productos.length}`;
  document.getElementById('sin-resultados').hidden = visibles > 0;
  document.getElementById('btn-limpiar-filtros').hidden = !busqueda && !categoriaActiva && !mostrarTodos;
}

buscador.addEventListener('input', aplicarFiltros);
document.getElementById('filtros').addEventListener('submit', (event) => event.preventDefault());

document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  buscador.value = '';
  elegirCategoria('', false);
  buscador.focus();
});

// En esta página, el menú del header filtra sin recargar
document.querySelectorAll('.nav-principal a').forEach(enlace => {
  enlace.addEventListener('click', (event) => {
    if (productos.length === 0) return; // sin productos, que navegue normal
    event.preventDefault();
    elegirCategoria(enlace.dataset.categoria);
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
  });
});


// Primero los productos, después el carrito: cargarCarritoDesdeBD espera a
// productosListos para poder pintar el panel con nombre y precio.
// cargarProductos es async, así que devuelve una promesa que termina cuando
// termina la función (también si hubo error: ese caso sale con return, no con throw)
const productosListos = cargarProductos();
cargarCarritoDesdeBD();
