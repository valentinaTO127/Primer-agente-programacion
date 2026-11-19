// Catálogo: carga los productos, pinta las tarjetas y filtra por categoría y
// por texto. Usa las funciones de tienda.js. Lo usan dos páginas:
//   - catalogo.html: la página del catálogo (a donde lleva el menú del header)
//   - index.html: su sección de catálogo, con límite de 20 (data-limite).
//     La vitrina del inicio está en inicio.js

const seccionCatalogo = document.getElementById('catalogo');

// Límite de la vista inicial: lo pone el HTML con data-limite="20" (solo index).
// Sin el atributo (catalogo.html) no hay límite
const LIMITE_CATALOGO = Number(seccionCatalogo.dataset.limite) || Infinity;
const PAGINA_CON_LIMITE = Number.isFinite(LIMITE_CATALOGO);

let productos = [];
let categoriaActiva = categoriaDeLaUrl(); // '' = sin categoría
// ?ver=todo: así "Todo" también funciona desde otra página y al recargar.
// Sin límite en la página, "ver todo" es lo normal
let mostrarTodos = !PAGINA_CON_LIMITE
  || new URLSearchParams(window.location.search).get('ver') === 'todo';

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

// categoria '' = "Todo": por defecto también quita el límite de 20.
// "Limpiar filtros" vuelve a la vista inicial de la página
function elegirCategoria(categoria, verTodos = categoria === '') {
  categoriaActiva = categoria;
  mostrarTodos = verTodos;
  // Cambia la URL sin recargar: así el enlace se puede compartir o recargar
  // y abre con el mismo filtro. pathname = la página actual (index o catalogo)
  const url = categoria ? `?categoria=${categoria}#catalogo`
    : verTodos && PAGINA_CON_LIMITE ? '?ver=todo#catalogo'
    : `${window.location.pathname}#catalogo`;
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

// ¿El enlace lleva a ESTA página? Solo entonces el menú filtra sin recargar
// (en index.html los enlaces llevan a catalogo.html: ahí se navega normal)
function esEstaPagina(enlace) {
  return new URL(enlace.href).pathname === window.location.pathname;
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

// Título de catalogo.html (data-dinamico): dice qué se está viendo.
// El de index.html no lo tiene: siempre dice "Catálogo"
function actualizarTitulo() {
  const titulo = document.getElementById('titulo-catalogo');
  if (!('dinamico' in titulo.dataset)) return;
  const texto = categoriaActiva ? CATEGORIAS[categoriaActiva].plural : 'Todo el catálogo';
  titulo.textContent = texto;
  document.title = `${texto} · FRESHER`;
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
  // El menú marca la categoría solo si sus enlaces son de esta página
  document.querySelectorAll('.nav-principal a').forEach(enlace => {
    if (esEstaPagina(enlace) && categoriaMarcada(enlace.dataset.categoria)) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });
  actualizarTitulo();

  document.getElementById('resultados-filtro').textContent = limite === LIMITE_CATALOGO && productos.length > limite
    ? `Mostrando ${visibles} de ${productos.length} · elige «Todo» para ver el resto`
    : `Mostrando ${visibles} de ${productos.length}`;
  document.getElementById('sin-resultados').hidden = visibles > 0;
  // Vista inicial: en index = con límite; en catalogo = viendo todo
  const enVistaInicial = mostrarTodos !== PAGINA_CON_LIMITE;
  document.getElementById('btn-limpiar-filtros').hidden = !busqueda && !categoriaActiva && enVistaInicial;
}

buscador.addEventListener('input', aplicarFiltros);
document.getElementById('filtros').addEventListener('submit', (event) => event.preventDefault());

document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  buscador.value = '';
  elegirCategoria('', !PAGINA_CON_LIMITE);
  buscador.focus();
});

// Si el enlace del menú es de esta página (catalogo.html), filtra sin recargar
document.querySelectorAll('.nav-principal a').forEach(enlace => {
  enlace.addEventListener('click', (event) => {
    if (!esEstaPagina(enlace) || productos.length === 0) return; // navega normal
    event.preventDefault();
    elegirCategoria(enlace.dataset.categoria);
    seccionCatalogo.scrollIntoView({ behavior: 'smooth' });
  });
});


// Primero los productos, después el carrito: cargarCarritoDesdeBD espera a
// productosListos para poder pintar el panel con nombre y precio.
// cargarProductos es async, así que devuelve una promesa que termina cuando
// termina la función (también si hubo error: ese caso sale con return, no con throw).
// inicio.js también la espera para pintar la vitrina
const productosListos = cargarProductos();
cargarCarritoDesdeBD();
