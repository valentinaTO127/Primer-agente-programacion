// Detalle de un producto (producto.html?id=…). Usa las funciones de tienda.js.

const idProducto = new URLSearchParams(window.location.search).get('id');
let producto = null;
let cantidadAAgregar = 1; // lo que marca el selector, todavía NO está en el carrito

async function cargarProducto() {
  const estado = document.getElementById('estado-detalle');

  if (!idProducto) {
    estado.textContent = 'No encontramos este producto.';
    return;
  }

  // Mismos filtros que el catálogo: un producto deshabilitado o de supabase1
  // no se debe poder abrir escribiendo su id en la URL
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .eq('id', idProducto)
    .not('categoria', 'is', null)
    .eq('disponible', true)
    .maybeSingle(); // sin fila → null, sin error

  if (error) {
    estado.textContent = mensajeErrorCarga(error);
    return;
  }
  if (!data) {
    estado.textContent = 'No encontramos este producto.';
    return;
  }

  producto = data;
  recordarProductos([producto]);

  estado.hidden = true;
  pintarProducto();
  document.getElementById('producto').hidden = false;
  cargarRelacionados();
}

function pintarProducto() {
  const categoria = CATEGORIAS[producto.categoria];
  document.title = `${producto.nombre} · FRESHER`;

  // Migas: Catálogo › Sérums › Nombre
  const migaCategoria = document.getElementById('miga-categoria');
  migaCategoria.textContent = categoria.plural;
  migaCategoria.href = `index.html?categoria=${producto.categoria}#catalogo`;
  migaCategoria.hidden = false;
  document.getElementById('separador-categoria').hidden = false;
  document.getElementById('miga-nombre').textContent = producto.nombre;
  document.querySelector(`.nav-principal a[data-categoria="${producto.categoria}"]`)
    ?.setAttribute('aria-current', 'page');

  document.getElementById('marca').textContent = producto.marca ?? '';
  document.getElementById('nombre').textContent = producto.nombre;
  const estrellas = crearEstrellas(producto);
  if (estrellas) document.getElementById('calificacion').append(estrellas);
  document.getElementById('precio').append(crearPrecio(producto));
  document.getElementById('descripcion').textContent = producto.descripcion ?? '';

  const beneficios = producto.beneficios ?? [];
  document.getElementById('etiquetas-beneficios').replaceChildren(...beneficios.map(texto => {
    const li = document.createElement('li');
    li.textContent = texto;
    return li;
  }));

  // Los bloques sin datos se ocultan: mejor nada que un "Sin información"
  mostrarTexto('piel-grasa', 'efecto-piel-grasa', producto.efecto_piel_grasa);
  mostrarTexto('bloque-uso', 'modo-uso', producto.modo_uso);
  mostrarTexto('bloque-ingredientes', 'ingredientes', producto.ingredientes);
  document.getElementById('bloque-beneficios').hidden = beneficios.length === 0;
  document.getElementById('lista-beneficios').replaceChildren(...beneficios.map(texto => {
    const li = document.createElement('li');
    li.textContent = texto;
    return li;
  }));

  pintarGaleria();
  alCambiarCarrito.add(refrescarCompra);
  refrescarCompra();
}

function mostrarTexto(idBloque, idTexto, texto) {
  document.getElementById(idBloque).hidden = !texto;
  document.getElementById(idTexto).textContent = texto ?? '';
}


// --- Galería: imagen grande + miniaturas ---
function pintarGaleria() {
  // img_url primero; Set quita las repetidas; filter(Boolean) quita vacías
  const urls = [...new Set([producto.img_url, ...(producto.imagenes ?? [])])].filter(Boolean);
  const principal = document.getElementById('imagen-principal');
  const miniaturas = document.getElementById('miniaturas');

  function verImagen(indice) {
    principal.replaceChildren(crearImagen(producto, producto.nombre, urls[indice]));
    miniaturas.querySelectorAll('button').forEach((boton, i) => {
      boton.setAttribute('aria-current', i === indice);
    });
  }

  if (urls.length === 0) {
    principal.replaceChildren(crearImagen(producto)); // muestra "Sin imagen"
    miniaturas.hidden = true;
    return;
  }

  // Con una sola imagen, las miniaturas sobran
  miniaturas.hidden = urls.length < 2;
  miniaturas.replaceChildren(...urls.map((url, i) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.setAttribute('aria-label', `Ver imagen ${i + 1} de ${urls.length}`);
    boton.append(crearImagen(producto, '', url));
    boton.addEventListener('click', () => verImagen(i));
    return boton;
  }));
  verImagen(0);
}


// --- Compra: selector de cantidad + "Agregar al carrito" ---
// Lo máximo que se puede agregar = stock - lo que ya está en el carrito
function maximoParaAgregar() {
  return Math.max(stockDe(producto) - cantidadEnCarrito(producto.id), 0);
}

function refrescarCompra() {
  const stock = stockDe(producto);
  const maximo = maximoParaAgregar();
  const enCarrito = cantidadEnCarrito(producto.id);

  // Si el carrito cambió (ej. desde el panel), la cantidad elegida se ajusta
  cantidadAAgregar = Math.min(Math.max(cantidadAAgregar, 1), Math.max(maximo, 1));

  const estadoStock = document.getElementById('estado-stock');
  estadoStock.classList.toggle('pocas', stock > 0 && stock <= 5);
  estadoStock.textContent = stock === 0 ? 'Agotado'
    : stock <= 5 ? `Últimas ${stock} unidades`
    : 'Disponible';

  document.getElementById('cantidad-agregar').textContent = cantidadAAgregar;
  document.getElementById('btn-menos').disabled = cantidadAAgregar <= 1 || maximo === 0;
  document.getElementById('btn-mas').disabled = cantidadAAgregar >= maximo;

  const agregar = document.getElementById('btn-agregar-detalle');
  agregar.disabled = maximo === 0;
  agregar.textContent = stock === 0 ? 'Agotado'
    : maximo === 0 ? 'Ya tienes todas las unidades'
    : 'Agregar al carrito';

  const nota = document.getElementById('nota-carrito');
  nota.hidden = enCarrito === 0;
  nota.textContent = `Ya tienes ${enCarrito} en tu carrito.`;
}

document.getElementById('btn-menos').addEventListener('click', () => {
  cantidadAAgregar--;
  refrescarCompra();
});
document.getElementById('btn-mas').addEventListener('click', () => {
  cantidadAAgregar++;
  refrescarCompra();
});

// Como en BoJ: al agregar se abre el panel para ver el carrito.
// fijarCantidad (tienda.js) guarda en Supabase si hay sesión; sin sesión, solo local
document.getElementById('btn-agregar-detalle').addEventListener('click', async (event) => {
  const boton = event.currentTarget;
  const total = cantidadEnCarrito(producto.id) + cantidadAAgregar;
  const ok = await conBotonOcupado(boton, () => fijarCantidad(producto, total));
  if (!ok) return; // conBotonOcupado ya mostró el aviso
  cantidadAAgregar = 1;
  refrescarCompra();
  abrirCarrito();
});


// --- Relacionados: otros productos de la misma categoría ---
async function cargarRelacionados() {
  const { data, error } = await db
    .from('productos_practica')
    .select(COLUMNAS_TARJETA)
    .eq('categoria', producto.categoria)
    .eq('disponible', true)
    .neq('id', producto.id)
    .limit(4);

  if (error) {
    console.log('Error al cargar relacionados:', error);
    return;
  }
  if (data.length === 0) return; // la sección sigue oculta

  recordarProductos(data);
  document.getElementById('titulo-relacionados').textContent =
    `Más ${CATEGORIAS[producto.categoria].plural.toLowerCase()}`;
  document.getElementById('galeria-relacionados').replaceChildren(...data.map(crearTarjeta));
  document.getElementById('relacionados').hidden = false;
}


// Primero el producto, después el carrito (ver catalogo.js)
const productosListos = cargarProducto();
cargarCarritoDesdeBD();
