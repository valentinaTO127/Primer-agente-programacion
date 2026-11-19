// Catálogo (index.html): carga los productos, pinta las tarjetas y filtra por
// categoría y por texto. Usa las funciones de tienda.js.

let productos = [];
let categoriaActiva = categoriaDeLaUrl(); // '' = Todo

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
    cargarProductosDelCarrito();
    return;
  }

  productos = data;
  recordarProductos(productos);
  cargarProductosDelCarrito(); // ya conoce casi todos: solo ajusta al stock

  // Con RLS sin policy de lectura, Supabase devuelve [] SIN error
  if (productos.length === 0) {
    estado.textContent = 'Todavía no hay productos.';
    return;
  }

  estado.hidden = true;
  document.getElementById('galeria').replaceChildren(...productos.map(crearTarjeta));
  pintarChips();
  document.getElementById('filtros').hidden = false;
  aplicarFiltros();
}


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

function elegirCategoria(categoria) {
  categoriaActiva = categoria;
  // Cambia la URL sin recargar: así el enlace se puede compartir o recargar
  // y abre con el mismo filtro
  history.replaceState(null, '', categoria ? `?categoria=${categoria}#catalogo` : 'index.html#catalogo');
  aplicarFiltros();
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
  let visibles = 0;

  productos.forEach(producto => {
    const tarjeta = document.querySelector(`.tarjeta[data-id="${producto.id}"]`);
    const visible = coincide(producto, busqueda);
    tarjeta.hidden = !visible;
    if (visible) visibles++;
  });

  document.querySelectorAll('.chip-categoria').forEach(chip => {
    chip.setAttribute('aria-pressed', chip.dataset.categoria === categoriaActiva);
  });
  document.querySelectorAll('.nav-principal a').forEach(enlace => {
    if (enlace.dataset.categoria === categoriaActiva) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });

  document.getElementById('resultados-filtro').textContent = `Mostrando ${visibles} de ${productos.length}`;
  document.getElementById('sin-resultados').hidden = visibles > 0;
  document.getElementById('btn-limpiar-filtros').hidden = !busqueda && !categoriaActiva;
}

buscador.addEventListener('input', aplicarFiltros);
document.getElementById('filtros').addEventListener('submit', (event) => event.preventDefault());

document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  buscador.value = '';
  elegirCategoria('');
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


cargarProductos();
