// Inicio (index.html): la vitrina "Los mejor calificados".
// Desde que el catálogo pasó a catalogo.html, el inicio ya no carga catalogo.js:
// este archivo pide sus propios productos. Va después de tienda.js.

const LIMITE_VITRINA = 5;
let destacados = [];

// La base hace el trabajo: solo los LIMITE_VITRINA que necesita la vitrina,
// ya filtrados y ordenados. Antes se traían los 50 y se filtraba aquí.
//   - categoria no nula y disponible → productos de FRESHER habilitados
//   - unidades > 0 → sin agotados: "los mejor calificados" debe poder comprarse
//     (en los datos reales, el de nota más alta tiene 0 unidades)
//   - nullsFirst: false → los que no tienen calificación van al final, no primero
async function cargarDestacados() {
  const { data, error } = await db
    .from('productos_practica')
    .select(COLUMNAS_TARJETA)
    .not('categoria', 'is', null)
    .eq('disponible', true)
    .gt('unidades', 0)
    .order('calificacion', { ascending: false, nullsFirst: false })
    .limit(LIMITE_VITRINA);

  if (error) {
    console.log('Error al cargar la vitrina:', error);
    return; // la vitrina se queda oculta
  }
  destacados = data;
  recordarProductos(destacados); // por si alguno está en el carrito
}

function pintarVitrina() {
  // Sin productos con stock (o si la carga falló), la vitrina se queda oculta
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
  // La imagen también es un enlace al detalle. tabindex -1 + aria-hidden: con
  // el teclado o un lector de pantalla se usa solo el enlace del nombre, para
  // no pasar dos veces por el mismo producto
  const imagen = document.createElement('a');
  imagen.className = 'vitrina-imagen';
  imagen.href = urlProducto(producto);
  imagen.tabIndex = -1;
  imagen.setAttribute('aria-hidden', 'true');
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

// Mismo arranque que las demás páginas: productosListos es la promesa que
// cargarCarritoDesdeBD (tienda.js) espera antes de pintar el panel del carrito.
// Los productos del carrito que no estén entre los destacados los trae ella sola
const productosListos = cargarDestacados();
cargarCarritoDesdeBD();
productosListos.then(pintarVitrina);
