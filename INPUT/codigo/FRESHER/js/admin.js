// Administración de FRESHER (admin.html): acceso de admin e inventario.
// Sale de supabase1/js/admin.js, con tres cambios:
//   - Sin registro de admin (hueco de seguridad visto el 2026-11-13).
//   - El form tiene los campos nuevos de sql/01_productos_fresher.sql.
//   - "Deshabilitar" en vez de eliminar (ficha FRESHER.pdf, sección 5): un
//     producto borrado rompería los pedidos que lo tengan en detalles_pedidos.

let inventario = []; // productos de FRESHER leídos de Supabase


// --- Acceso ---
document.getElementById('form-login-admin').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;

  const { error } = await db.auth.signInWithPassword({
    email: form.correo.value.trim(),
    password: form.password.value,
  });

  if (error) {
    console.log('Error al iniciar sesión:', error);
    document.getElementById('estado-sesion-admin').textContent = 'Correo o contraseña incorrectos.';
    return;
  }
  form.reset(); // no dejamos la contraseña escrita en un form oculto
  mostrarEstadoSesionAdmin();
});

// ÚNICO lugar que decide qué se ve. Arranca en "no es admin" y solo cambia
// si la base lo confirma: ante cualquier error, el panel se queda oculto
async function mostrarEstadoSesionAdmin() {
  const { data } = await db.auth.getUser();
  const conSesion = Boolean(data.user);
  let esAdmin = false;
  let mensaje = 'Inicia sesión con tu cuenta de administrador.';

  if (conSesion) {
    // Tener sesión no basta: la sesión se comparte con cuenta.html, así que
    // aquí también puede llegar un cliente
    const { data: perfil, error } = await db
      .from('admins_practica')
      .select('nombre')
      .eq('id', data.user.id)
      .maybeSingle();

    if (error) {
      console.log('Error al verificar el administrador:', error);
      mensaje = 'No se pudo verificar tu cuenta.';
    } else if (perfil) {
      esAdmin = true;
    } else {
      mensaje = 'Esta cuenta no es de administrador.';
    }
  }

  document.getElementById('panel-admin').hidden = !esAdmin;
  document.getElementById('zona-acceso-admin').hidden = esAdmin;
  document.getElementById('btn-logout-admin').hidden = !conSesion;
  document.getElementById('form-login-admin').hidden = conSesion;
  document.getElementById('estado-sesion-admin').textContent = mensaje;

  if (esAdmin) cargarInventario();
  else limpiarPanel();
}

// Ocultar no borra: sin esto, los productos seguirían en la página
// (escondidos) hasta que entre otra persona
function limpiarPanel() {
  inventario = [];
  document.getElementById('cuerpo-inventario').replaceChildren();
  document.getElementById('modal-producto').close();
}

document.getElementById('btn-logout-admin').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesionAdmin();
});


// --- Inventario ---
async function cargarInventario() {
  const resumen = document.getElementById('resumen-inventario');

  // categoria no nula = productos de FRESHER (la tabla es la misma de supabase1).
  // Aquí SÍ llegan los deshabilitados: el admin tiene que poder volver a habilitarlos
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .not('categoria', 'is', null)
    .order('nombre');

  if (error) {
    console.log('Error al cargar el inventario:', error);
    resumen.textContent = 'No se pudo cargar el inventario.';
    return;
  }
  inventario = data;
  pintarInventario();
}

const buscador = document.getElementById('buscar-inventario');
const filtroCategoria = document.getElementById('filtro-categoria');

function pintarInventario() {
  const texto = buscador.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;

  const visibles = inventario.filter(producto =>
    (!categoria || producto.categoria === categoria) &&
    `${producto.nombre} ${producto.marca ?? ''}`.toLowerCase().includes(texto)
  );

  document.getElementById('cuerpo-inventario').replaceChildren(...visibles.map(crearFila));
  const deshabilitados = inventario.filter(p => !p.disponible).length;
  document.getElementById('resumen-inventario').textContent = inventario.length === 0
    ? 'Todavía no hay productos. Crea el primero con «Nuevo producto».'
    : `Mostrando ${visibles.length} de ${inventario.length} · ${deshabilitados} `
      + (deshabilitados === 1 ? 'deshabilitado' : 'deshabilitados');
}

buscador.addEventListener('input', pintarInventario);
filtroCategoria.addEventListener('change', pintarInventario);

// Una fila de la tabla. Todo con textContent: los datos vienen de la base
function crearFila(producto) {
  const fila = document.createElement('tr');
  fila.classList.toggle('deshabilitado', !producto.disponible);

  const celdaProducto = document.createElement('td');
  const caja = document.createElement('div');
  caja.className = 'celda-producto';
  const textos = document.createElement('div');
  const nombre = document.createElement('strong');
  nombre.textContent = producto.nombre;
  const marca = document.createElement('span');
  marca.textContent = `${producto.marca ?? 'Sin marca'} · ID ${producto.id}`;
  textos.append(nombre, marca);
  caja.append(crearMiniatura(producto), textos);
  celdaProducto.append(caja);

  const celdaCategoria = document.createElement('td');
  celdaCategoria.textContent = CATEGORIAS[producto.categoria]?.singular ?? producto.categoria;

  const celdaPrecio = document.createElement('td');
  celdaPrecio.textContent = formatoPrecio.format(producto.precio);
  if (producto.descuento > 0) celdaPrecio.textContent += ` (−${Math.round(producto.descuento * 100)}%)`;

  const celdaUnidades = document.createElement('td');
  celdaUnidades.textContent = producto.unidades;

  const celdaEstado = document.createElement('td');
  const chip = document.createElement('span');
  chip.className = producto.disponible ? 'estado-chip' : 'estado-chip apagado';
  chip.textContent = producto.disponible ? 'Habilitado' : 'Deshabilitado';
  celdaEstado.append(chip);

  const celdaAcciones = document.createElement('td');
  const acciones = document.createElement('div');
  acciones.className = 'acciones-fila';

  const editar = document.createElement('button');
  editar.type = 'button';
  editar.className = 'btn-secundario';
  editar.textContent = 'Editar';
  editar.setAttribute('aria-label', `Editar ${producto.nombre}`);
  editar.addEventListener('click', () => abrirFormulario(producto));

  const alternar = document.createElement('button');
  alternar.type = 'button';
  alternar.className = producto.disponible ? 'btn-peligro' : 'btn-secundario';
  alternar.textContent = producto.disponible ? 'Deshabilitar' : 'Habilitar';
  alternar.setAttribute('aria-label', `${alternar.textContent} ${producto.nombre}`);
  alternar.addEventListener('click', () => cambiarDisponible(producto));

  acciones.append(editar, alternar);
  celdaAcciones.append(acciones);

  fila.append(celdaProducto, celdaCategoria, celdaPrecio, celdaUnidades, celdaEstado, celdaAcciones);
  return fila;
}

function crearMiniatura(producto) {
  if (!producto.img_url) {
    const caja = document.createElement('div');
    caja.className = 'sin-imagen';
    caja.textContent = 'Sin foto';
    return caja;
  }
  const img = document.createElement('img');
  img.src = producto.img_url;
  img.alt = '';
  img.loading = 'lazy';
  return img;
}

// Deshabilitar = disponible: false. El producto sigue en la base (y en los
// pedidos viejos), pero el catálogo ya no lo muestra
async function cambiarDisponible(producto) {
  const actualizado = await guardarCambios(producto.id, { disponible: !producto.disponible });
  if (!actualizado) {
    mostrarNotificacion('No se pudo cambiar el estado.', 'error');
    return;
  }
  reemplazarEnInventario(actualizado);
  mostrarNotificacion(`«${actualizado.nombre}» ${actualizado.disponible ? 'habilitado' : 'deshabilitado'}.`, 'exito');
}

function reemplazarEnInventario(producto) {
  const i = inventario.findIndex(p => p.id === producto.id);
  if (i >= 0) inventario[i] = producto;
  else inventario.push(producto);
  inventario.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  pintarInventario();
}


// --- Insert y update ---
// .select() devuelve las filas que DE VERDAD cambiaron. Si RLS no deja,
// Supabase no da error: devuelve [] → lo tratamos como fallo
async function guardarCambios(id, cambios) {
  const { data, error } = await db
    .from('productos_practica')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error) console.log('Error al actualizar:', error);
  return error ? null : (data[0] ?? null);
}

async function agregarProducto(datos) {
  const { data, error } = await db
    .from('productos_practica')
    .insert([datos])
    .select();

  if (error) console.log('Error al agregar:', error);
  return error ? null : (data[0] ?? null);
}


// --- Formulario (modal) ---
const modal = document.getElementById('modal-producto');
const form = document.getElementById('form-producto');

// Los <select> de categoría salen de CATEGORIAS (constantes.js), igual que el catálogo
Object.entries(CATEGORIAS).forEach(([clave, categoria]) => {
  form.categoria.append(new Option(categoria.singular, clave));
  filtroCategoria.append(new Option(categoria.plural, clave));
});

// "una\n\ndos \n" → ["una", "dos"]. Para beneficios e imágenes (uno por línea)
const lineas = texto => texto.split('\n').map(l => l.trim()).filter(Boolean);

// Form → objeto listo para Supabase. Las conversiones se escriben UNA vez:
//   .value siempre es texto → Number() para las columnas numéricas
//   vacío → null, para que la tienda sepa que "no hay" (y no muestre "")
function leerFormulario() {
  const calificacion = form.calificacion.value.trim();
  return {
    nombre: form.nombre.value.trim(),
    marca: form.marca.value.trim(),
    categoria: form.categoria.value,
    descripcion: form.descripcion.value.trim(),
    calificacion: calificacion === '' ? null : Number(calificacion),
    precio: Number(form.precio.value),
    descuento: Number(form.descuento.value) / 100, // 15 % → 0.15
    unidades: Number(form.unidades.value),
    disponible: form.disponible.checked,
    efecto_piel_grasa: form.efecto_piel_grasa.value.trim() || null,
    beneficios: lineas(form.beneficios.value),
    modo_uso: form.modo_uso.value.trim() || null,
    ingredientes: form.ingredientes.value.trim() || null,
    img_url: form.img_url.value.trim() || null,
    imagenes: lineas(form.imagenes.value),
  };
}

// Lo INVERSO: objeto de Supabase → campos (null → '', array → líneas)
function llenarFormulario(producto) {
  form.idEditar.value = producto.id;
  form.nombre.value = producto.nombre;
  form.marca.value = producto.marca ?? '';
  form.categoria.value = producto.categoria ?? '';
  form.descripcion.value = producto.descripcion ?? '';
  form.calificacion.value = producto.calificacion ?? '';
  form.precio.value = producto.precio;
  form.descuento.value = Math.round((producto.descuento ?? 0) * 100);
  form.unidades.value = producto.unidades;
  form.disponible.checked = producto.disponible;
  form.efecto_piel_grasa.value = producto.efecto_piel_grasa ?? '';
  form.beneficios.value = (producto.beneficios ?? []).join('\n');
  form.modo_uso.value = producto.modo_uso ?? '';
  form.ingredientes.value = producto.ingredientes ?? '';
  form.img_url.value = producto.img_url ?? '';
  form.imagenes.value = (producto.imagenes ?? []).join('\n');
}

// Sin producto = modo "Nuevo"; con producto = modo "Editar"
function abrirFormulario(producto = null) {
  form.reset();
  form.idEditar.value = ''; // reset() no vacía los input hidden
  if (producto) llenarFormulario(producto);
  document.getElementById('mensaje-modal').textContent = '';

  document.getElementById('titulo-modal').textContent = producto
    ? `Editar producto (ID ${producto.id})` : 'Nuevo producto';
  document.getElementById('btn-guardar').textContent = producto ? 'Guardar cambios' : 'Agregar producto';
  // Asignar .value desde JS no dispara "input": la previsualización va a mano
  actualizarPreview(form.img_url.value);
  modal.showModal();
  form.nombre.focus();
}

document.getElementById('btn-nuevo').addEventListener('click', () => abrirFormulario());
document.getElementById('btn-cerrar-modal').addEventListener('click', () => modal.close());
document.getElementById('btn-cancelar-modal').addEventListener('click', () => modal.close());

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const datos = leerFormulario();
  const botonGuardar = document.getElementById('btn-guardar');

  botonGuardar.disabled = true; // evita guardar dos veces
  const editando = Boolean(form.idEditar.value);
  const guardado = editando
    ? await guardarCambios(Number(form.idEditar.value), datos)
    : await agregarProducto(datos);
  botonGuardar.disabled = false;

  if (!guardado) {
    document.getElementById('mensaje-modal').textContent = 'No se pudo guardar (revisa la consola).';
    return;
  }
  // Se usa lo que DEVOLVIÓ Supabase: confirma lo que de verdad quedó guardado
  reemplazarEnInventario(guardado);
  modal.close();
  mostrarNotificacion(`✔ «${guardado.nombre}» ${editando ? 'actualizado' : 'agregado'}.`, 'exito');
});


// --- Previsualización de la imagen principal (igual que en supabase1) ---
const previewImagen = document.getElementById('preview-imagen');
const imgPreview = previewImagen.querySelector('img');
const textoPreview = previewImagen.querySelector('figcaption');

imgPreview.addEventListener('load', () => {
  imgPreview.hidden = false;
  previewImagen.classList.remove('error');
  textoPreview.textContent = 'Así se verá en el catálogo';
});
imgPreview.addEventListener('error', () => {
  if (!imgPreview.getAttribute('src')) return; // src vacío a propósito
  imgPreview.hidden = true;
  previewImagen.classList.add('error');
  textoPreview.textContent = 'No se pudo cargar la imagen (revisa la URL)';
});

function actualizarPreview(url) {
  url = url.trim();
  if (!url) {
    previewImagen.hidden = true;
    imgPreview.removeAttribute('src');
    return;
  }
  previewImagen.hidden = false;
  textoPreview.textContent = 'Cargando…';
  imgPreview.src = url;
}

form.img_url.addEventListener('input', (event) => actualizarPreview(event.target.value));


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


mostrarEstadoSesionAdmin();
