// Inicio (index.html): la vitrina "Los mejor calificados".
// Va DESPUÉS de catalogo.js: usa sus "productos" y espera su "productosListos",
// así los productos se piden a Supabase una sola vez para las dos secciones.
// (Cuando el inicio deje de tener el catálogo, este archivo tendrá que cargar
// sus propios productos.)

const LIMITE_VITRINA = 5;

// Los LIMITE_VITRINA mejor calificados con stock. filter() ya devuelve un array
// nuevo, así que sort no desordena "productos" (el catálogo lo quiere por nombre)
function pintarVitrina() {
  // Primero se quitan los agotados: "los mejor calificados" debe poder comprarse
  // (en los datos reales, el de nota más alta tiene 0 unidades)
  const destacados = productos
    .filter(producto => stockDe(producto) > 0)
    .sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0))
    .slice(0, LIMITE_VITRINA);

  // Si todos estuvieran agotados (o la carga falló), la vitrina se queda oculta
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

// productosListos (catalogo.js) termina cuando los productos llegaron
productosListos.then(pintarVitrina);
