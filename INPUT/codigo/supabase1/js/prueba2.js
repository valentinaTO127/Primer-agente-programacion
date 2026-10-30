// --- Galería (sección 2) ---
// La usan "Traer productos" Y los dos buscadores: todos pintan tarjetas en el
// mismo lugar. Por eso son funciones aparte y no código dentro de cada listener.

// Pinta las tarjetas + un título que dice QUÉ se está viendo
// (todos los productos o el resultado de una búsqueda).
function mostrarEnGaleria(productos, titulo) {
  const galeria = document.getElementById('resultado');
  galeria.replaceChildren(); // borra lo anterior (otra búsqueda o la lista completa)
  productos.forEach((producto, i) => {
    const tarjeta = crearTarjetaProducto(producto);
    // --i = posición de la tarjeta (0, 1, 2...). El CSS la usa para retrasar
    // un poco la animación de cada una → aparecen en "cascada", no todas de golpe
    tarjeta.style.setProperty('--i', i);
    galeria.appendChild(tarjeta);
  });

  const tituloGaleria = document.getElementById('titulo-galeria');
  // Guardamos el título SIN el número: al eliminar un producto, el número
  // cambia y hay que volver a escribirlo (ver actualizarTituloGaleria)
  tituloGaleria.dataset.base = titulo;
  tituloGaleria.hidden = false;
  actualizarTituloGaleria();
  // Haya llegado por "Traer" o por una búsqueda, el próximo clic la esconde
  document.getElementById('btn-traer').textContent = 'Ocultar productos';

  // En el celular las secciones están apiladas: la galería queda debajo del
  // buscador y no se vería el resultado → bajamos hasta ella.
  // (Mismo valor que el @media del CSS)
  if (matchMedia('(max-width: 800px)').matches) {
    galeria.scrollIntoView({ behavior: 'smooth' });
  }
}

// "Todos los productos" + " (5)". El número se CUENTA en la página
// (cuántas tarjetas hay), así siempre coincide con lo que se ve.
function actualizarTituloGaleria() {
  const tituloGaleria = document.getElementById('titulo-galeria');
  const cantidad = document.getElementById('resultado').childElementCount;
  tituloGaleria.textContent = `${tituloGaleria.dataset.base} (${cantidad})`;
}

function ocultarGaleria() {
  document.getElementById('resultado').replaceChildren(); // :not(:empty) deja de aplicar el grid
  document.getElementById('titulo-galeria').hidden = true;
  document.getElementById('btn-traer').textContent = 'Traer productos';
}

document.getElementById('btn-traer').addEventListener('click', async () => {
  const galeria = document.getElementById('resultado');

  // Botón "toggle": si la galería YA tiene tarjetas, este clic es para
  // esconderlas. childElementCount cuenta las tarjetas dentro de #resultado.
  if (galeria.childElementCount > 0) {
    ocultarGaleria();
    return;                             // no hace falta consultar Supabase
  }

  // Mismo "async" que en el Paso 2: esta función necesita "await" para
  // esperar la respuesta real de Supabase antes de seguir.
  const { data, error } = await db.from('productos_practica').select('*');
  // ↑ El código se DETIENE en esta línea hasta que la base de datos
  //   responde. Compáralo con localStorage.getItem('productos'): esa
  //   llamada te devuelve el valor guardado EN EL MISMO INSTANTE, sin
  //   esperar nada, porque no sale de tu computador. Esta línea sí
  //   puede tardar (viaja a internet y vuelve) — por eso necesita await.

  if (error) {
    // Revisamos "error" ANTES de tocar "data": si la consulta falló,
    // "data" llega como null, y usar null más adelante (ej. null.map())
    // rompería el script. Mismo patrón de "validar antes de operar"
    // que ya usaste en el CRUD de la semana 7.
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // Antes pintábamos el JSON crudo + 3 <ul> sueltas (nombres, precios, unidades)
  // con innerHTML. Ahora cada producto es UNA tarjeta con todos sus datos juntos.
  if (data.length > 0) mostrarEnGaleria(data, 'Todos los productos');
});

// Formato de moneda colombiana: 150000 → "$ 150.000"
const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
});

// Recibe UN producto (objeto de Supabase) y devuelve un <article> listo para
// agregar a la página. Todo con createElement + textContent: los datos vienen
// de la base y cualquiera pudo escribirlos, así que nunca se tratan como HTML.
function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';
  // data-id="4" en el HTML: sirve para encontrar ESTA tarjeta después
  // (al guardar cambios) con querySelector('.tarjeta[data-id="4"]')
  tarjeta.dataset.id = producto.id;

  // img_url puede ser null (se guardó vacío) → solo creamos <img> si hay URL,
  // así no aparece una imagen rota
  if (producto.img_url) {
    const img = document.createElement('img');
    img.src = producto.img_url;
    img.alt = producto.nombre;
    tarjeta.appendChild(img);
  }

  const nombre = document.createElement('h3');
  nombre.textContent = producto.nombre;

  const descripcion = document.createElement('p');
  descripcion.className = 'descripcion';
  descripcion.textContent = producto.descripcion || 'Sin descripción';

  // descuento es fracción (0.15) → la mostramos como porcentaje (15%)
  const precio = document.createElement('p');
  precio.className = 'precio';
  precio.textContent = formatoPrecio.format(producto.precio);
  if (producto.descuento > 0) {
    const descuento = document.createElement('span');
    descuento.className = 'descuento';
    descuento.textContent = `-${Math.round(producto.descuento * 100)}%`;
    precio.appendChild(descuento);
  }

  // bool → texto legible + clase para el color
  const estado = document.createElement('p');
  estado.className = producto.disponible ? 'estado disponible' : 'estado agotado';
  estado.textContent = `${producto.disponible ? 'Disponible' : 'No disponible'} · ${producto.unidades} unidades`;

  // categorias es un array json; "?? []" por si viene null
  const etiquetas = document.createElement('ul');
  etiquetas.className = 'etiquetas';
  (producto.categorias ?? []).forEach(categoria => {
    const li = document.createElement('li');
    li.textContent = categoria;
    etiquetas.appendChild(li);
  });

  // Editar y Eliminar juntos en una fila (ver .acciones-tarjeta en el CSS)
  const acciones = document.createElement('div');
  acciones.className = 'acciones-tarjeta';
  acciones.append(crearBotonEditar(producto), crearBotonEliminar(producto));

  // El id no se muestra, pero sigue guardado en data-id y en "producto"
  tarjeta.append(nombre, descripcion, precio, estado, etiquetas, acciones);
  return tarjeta;
}

// Botón Editar: reutiliza el modo "Editar" del form de producto.
// No hace falta consultar Supabase otra vez: "producto" ya tiene todos
// los datos (la función flecha lo "recuerda" = closure).
function crearBotonEditar(producto) {
  const editar = document.createElement('button');
  editar.type = 'button';
  editar.className = 'btn-secundario btn-editar';
  editar.textContent = 'Editar';
  editar.addEventListener('click', () => {
    llenarFormulario(document.getElementById('form-producto'), producto);
    ponerModoEdicion(producto);
    // Lleva la pantalla hasta el form, que está más abajo en la página
    document.getElementById('desplegable-producto').scrollIntoView({ behavior: 'smooth' });
  });
  return editar;
}

async function agregarProducto(datos) {

    const { data, error } = await db
        .from('productos_practica') // la tabla
        .insert([datos])            // insert() siempre recibe un ARRAY de objetos,
                                    // aunque insertes uno solo
        .select();                  // .select() le pide a Supabase que te
                                    // devuelva la fila ya creada (con su id
                                    // nuevo) — sin esto, insert() no te
                                    // devuelve nada útil

    if (error) {
        console.log("Error al agregar:", error);
        return null;
    }

    return data[0];   // data siempre es un array — tomamos el primer
                        // elemento, que es la fila recién creada
}

// --- Formulario de producto: sirve para CREAR y para EDITAR ---

// Form → objeto listo para Supabase. Lo usan tanto el insert como el update,
// así las conversiones de tipo se escriben UNA sola vez.
function leerFormulario(form) {
    // OJO: .value SIEMPRE devuelve un string, aunque el input sea type="number".
    // Las columnas precio/unidades/descuento son numéricas, así que hay que
    // convertir con Number() — "100000" (texto) no es lo mismo que 100000.
    return {
        nombre: form.nombre.value.trim(),
        descripcion: form.descripcion.value.trim(),
        precio: Number(form.precio.value),
        unidades: Number(form.unidades.value),
        // El usuario escribe la fracción directa (0.15) → se guarda igual en
        // la columna float8. En JS no hay int vs float: todo es Number.
        descuento: Number(form.descuento.value),
        // Un checkbox no usa .value sino .checked → true / false
        disponible: form.disponible.checked,
        // "tecnología, audio" → ["tecnología", "audio"]
        // filter(c => c) quita vacíos si sobra una coma al final
        categorias: form.categorias.value.split(',').map(c => c.trim()).filter(c => c),
        // Campo vacío → null (no ""), así la galería sabe que no hay
        // imagen y no pinta un <img> roto
        img_url: form.img_url.value.trim() || null
    };
}

// Lo INVERSO de leerFormulario: objeto de Supabase → campos del form.
// Cada conversión se deshace: array → texto con comas, null → '' (vacío).
function llenarFormulario(form, producto) {
    form.idEditar.value = producto.id;
    form.nombre.value = producto.nombre;
    form.descripcion.value = producto.descripcion ?? '';
    form.precio.value = producto.precio;
    form.unidades.value = producto.unidades;
    form.descuento.value = producto.descuento;
    form.disponible.checked = producto.disponible;
    form.categorias.value = (producto.categorias ?? []).join(', ');
    form.img_url.value = producto.img_url ?? '';
    // Asignar .value desde JS NO dispara el evento "input" (solo lo dispara
    // el usuario al escribir), así que la previsualización se actualiza a mano
    actualizarPreview(form.img_url.value);
}

// --- Previsualización de la imagen ---
// El navegador descarga la imagen apenas cambia img.src, y avisa cómo le fue
// con dos eventos: "load" (llegó una imagen) o "error" (URL mal escrita,
// no existe o no es una imagen). Los listeners se registran UNA vez aquí
// afuera; si estuvieran dentro de actualizarPreview se acumularían.
const previewImagen = document.getElementById('preview-imagen');
const imgPreview = previewImagen.querySelector('img');
const textoPreview = previewImagen.querySelector('figcaption');

imgPreview.addEventListener('load', () => {
    imgPreview.hidden = false;
    previewImagen.classList.remove('error');
    textoPreview.textContent = 'Así se verá en la galería';
});

imgPreview.addEventListener('error', () => {
    // Si src quedó vacío a propósito (ver abajo) no es un error real
    if (!imgPreview.getAttribute('src')) return;
    imgPreview.hidden = true;        // sin ícono de imagen rota
    previewImagen.classList.add('error');
    textoPreview.textContent = 'No se pudo cargar la imagen (revisa la URL)';
});

function actualizarPreview(url) {
    url = url.trim();
    if (!url) {
        previewImagen.hidden = true;
        imgPreview.removeAttribute('src'); // deja de mostrar la imagen anterior
        return;
    }
    previewImagen.hidden = false;
    previewImagen.classList.remove('error');
    textoPreview.textContent = 'Cargando…';
    imgPreview.src = url; // dispara "load" o "error" más tarde
}

// "input" = cada vez que el usuario escribe, pega o borra en el campo
document.getElementById('form-producto').img_url.addEventListener('input', (event) => {
    actualizarPreview(event.target.value);
});

// Cambia textos y botones según el modo, para que el usuario sepa si va a
// crear uno nuevo o a sobrescribir uno existente.
function ponerModoEdicion(producto) {
    document.getElementById('titulo-producto').textContent = `Editar producto (ID ${producto.id})`;
    document.getElementById('btn-guardar').textContent = 'Guardar cambios';
    document.getElementById('btn-cancelar-edicion').hidden = false;
    document.getElementById('desplegable-producto').open = true; // abre el <details>
}

function ponerModoNuevo() {
    const form = document.getElementById('form-producto');
    form.reset();
    // reset() NO vacía un input hidden: en ellos .value cambia el valor "por
    // defecto", así que reset() lo deja igual. Hay que vaciarlo a mano.
    form.idEditar.value = '';
    // reset() tampoco dispara "input": escondemos la previsualización a mano
    actualizarPreview('');
    document.getElementById('titulo-producto').textContent = 'Nuevo producto';
    document.getElementById('btn-guardar').textContent = 'Agregar producto';
    document.getElementById('btn-cancelar-edicion').hidden = true;
}

// Escuchamos "submit" (no "click") porque se dispara tanto con el botón
// como al presionar Enter dentro de un campo.
document.getElementById('form-producto').addEventListener('submit', async (event) => {
    // Por defecto un <form> recarga la página al enviarse; esto lo evita
    // para que nuestro JS pueda manejar el envío.
    event.preventDefault();

    const form = event.target;
    const datos = leerFormulario(form);

    // El input hidden decide el modo: con id → update; vacío → insert
    if (form.idEditar.value) {
        const id = Number(form.idEditar.value); // .value es string → Number()
        const actualizado = await modificarProducto(id, datos);
        if (actualizado) {
            mostrarNotificacion(`✔ Producto "${actualizado.nombre}" (ID ${actualizado.id}) actualizado`, 'exito');
            // Si su tarjeta está en la galería, la cambiamos por una nueva con
            // los datos guardados; si no, la tarjeta seguiría mostrando lo viejo
            const tarjetaVieja = document.querySelector(`.tarjeta[data-id="${actualizado.id}"]`);
            if (tarjetaVieja) tarjetaVieja.replaceWith(crearTarjetaProducto(actualizado));
            ponerModoNuevo();
        } else {
            mostrarNotificacion('No se pudo actualizar (revisa el id o la consola).', 'error');
        }
        return;
    }

    const nuevoProducto = await agregarProducto(datos);
    if (nuevoProducto) {
        // Usamos los datos que DEVOLVIÓ Supabase (no los del form): así el
        // mensaje confirma lo que de verdad quedó guardado en la tabla.
        mostrarNotificacion(`✔ Producto "${nuevoProducto.nombre}" agregado con ID: ${nuevoProducto.id}`, 'exito');
        ponerModoNuevo(); // limpia todos los campos para agregar otro
    } else {
        mostrarNotificacion('Error al agregar el producto (revisa la consola).', 'error');
    }
});

document.getElementById('btn-cancelar-edicion').addEventListener('click', ponerModoNuevo);

// "Cargar": trae el producto de Supabase y llena el form con sus datos actuales
document.getElementById('form-cargar').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = Number(event.target.idCargar.value);
    const { producto, error } = await buscarProductoPorId(id);

    if (error) {
        mostrarNotificacion('Error al buscar el producto (revisa la consola).', 'error');
        return;
    }
    if (!producto) {
        mostrarNotificacion(`No existe un producto con ID ${id}`, 'error');
        return;
    }

    llenarFormulario(document.getElementById('form-producto'), producto);
    ponerModoEdicion(producto);
    event.target.reset();
    mostrarNotificacion(`Editando "${producto.nombre}": cambia lo que quieras y guarda`, 'exito');
});

// Muestra un mensaje en #notificacion y lo oculta solo después de unos segundos.
// textContent (no innerHTML): el nombre lo escribe el usuario, así que se
// trata como texto y nunca como HTML.
let temporizadorNotificacion;
function mostrarNotificacion(mensaje, tipo) {
    const caja = document.getElementById('notificacion');
    caja.textContent = mensaje;
    caja.className = tipo;   // 'exito' o 'error' → el CSS cambia el color
    caja.hidden = false;

    // Si llega otro mensaje antes de que se oculte el anterior, reiniciamos
    // el conteo para que el nuevo se vea completo.
    clearTimeout(temporizadorNotificacion);
    temporizadorNotificacion = setTimeout(() => { caja.hidden = true; }, 4000);
}



async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .eq('id', id)    // eq = "equal" (igual a) — equivalente a find(p => p.id === id)
    .maybeSingle();  // maybeSingle() = "dame la fila como objeto (no array)".
                     // A diferencia de single(), si NO hay fila devuelve
                     // data = null SIN error → así "error" queda solo para
                     // fallos reales (red, RLS...) y no se confunden.

  if (error) console.log("Error al buscar:", error);
  // Devolvemos ambos para que quien llama decida qué mensaje mostrar
  return { producto: data, error };
}

async function buscarProductosPorNombre(texto) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .ilike('nombre', `%${texto}%`);
    // ilike = "like" insensible a mayúsculas/minúsculas.
    // los símbolos % significan "cualquier texto antes/después" —
    // equivalente a .toLowerCase().includes(texto)

  if (error) return [];
  return data;
}

// Los buscadores pintan su resultado en la galería (sección 2) con
// mostrarEnGaleria, igual que "Traer productos".
document.getElementById('form-buscar-id').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;

    // .value es string ("4"); la columna id es numérica → Number()
    const id = Number(form.idProducto.value);
    const { producto, error } = await buscarProductoPorId(id);

    // Dos casos distintos, dos mensajes distintos:
    // error → algo falló; producto null → la consulta funcionó pero ese id no existe
    if (error) {
        ocultarGaleria();
        mostrarNotificacion('Error al buscar (revisa la consola).', 'error');
    } else if (producto) {
        mostrarEnGaleria([producto], `Producto con ID ${id}`); // en array para reusar la misma función
    } else {
        ocultarGaleria();
        mostrarNotificacion(`No existe un producto con ID ${id}`, 'error');
    }
});

document.getElementById('form-buscar-nombre').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;

    const texto = form.texto.value.trim();
    const productos = await buscarProductosPorNombre(texto);

    // A diferencia de .single(), una búsqueda sin coincidencias NO es error:
    // devuelve [] → revisamos .length
    if (productos.length > 0) {
        mostrarEnGaleria(productos, `Resultados para "${texto}"`);
    } else {
        ocultarGaleria();
        mostrarNotificacion(`Ningún producto contiene "${texto}"`, 'error');
    }
});



async function modificarProducto(id, cambios) {

  const { data, error } = await db
    .from('productos_practica')
    .update(cambios)   // solo actualiza las propiedades que vengan en "cambios"
    .eq('id', id)        // ...de la fila donde el id coincida
    .select();

  if (error) {
    console.log("Error al actualizar:", error);
    return null;
  }
  // Si ningún id coincide, Supabase NO da error: devuelve data = [].
  // data[0] queda undefined, y lo convertimos en null para tratarlo como fallo.
  return data[0] ?? null;
}

// (El botón fijo "Actualizar producto" con id 4 se reemplazó por el modo
// "Editar" del form de producto, más arriba.)

// --- Vista galería / tabla ---
// El JS solo pone o quita la clase "vista-tabla" en la sección 2; TODO el
// cambio de acomodo lo hace el CSS. Las tarjetas no se vuelven a crear, por eso
// Editar, Eliminar y el contador siguen funcionando igual en las dos vistas.
const panelProductos = document.getElementById('panel-productos');
const botonVista = document.getElementById('btn-vista');

function aplicarVista(vista) {
  const esTabla = vista === 'tabla';
  // toggle(clase, true/false): pone la clase si es true, la quita si es false
  panelProductos.classList.toggle('vista-tabla', esTabla);
  // Igual que el botón de tema: el texto dice a qué vista vas a CAMBIAR
  botonVista.textContent = esTabla ? 'Ver como galería' : 'Ver como tabla';
}

// Recordamos la última vista elegida (mismo patrón que el tema)
let vistaGuardada = null;
try { vistaGuardada = localStorage.getItem('vista'); } catch (e) {}
aplicarVista(vistaGuardada || 'galeria');

botonVista.addEventListener('click', () => {
  const nueva = panelProductos.classList.contains('vista-tabla') ? 'galeria' : 'tabla';
  aplicarVista(nueva);
  try { localStorage.setItem('vista', nueva); } catch (e) {}
});

// --- Modo oscuro ---
// El tema INICIAL ya lo eligió el <script> del <head> (para que no parpadee).
// Aquí solo manejamos el botón y los cambios del sistema.
const botonTema = document.getElementById('btn-tema');
const consultaOscuro = matchMedia('(prefers-color-scheme: dark)');

// Pone data-tema="oscuro" o "claro" en <html>; el CSS hace el resto con
// :root[data-tema="oscuro"]. El botón muestra el modo AL QUE vas a cambiar.
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const oscuro = tema === 'oscuro';
  botonTema.textContent = oscuro ? '☀️' : '🌙';
  botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

aplicarTema(document.documentElement.dataset.tema); // sincroniza el ícono al cargar

botonTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
  aplicarTema(nuevo);
  // Guardamos la elección: al recargar, el <head> la lee y la respeta
  try { localStorage.setItem('tema', nuevo); } catch (e) {}
});

// Si el usuario NUNCA usó el botón, seguimos al sistema en vivo
// (ej. el celular pasa a oscuro de noche sin recargar la página)
consultaOscuro.addEventListener('change', (event) => {
  let guardado = null;
  try { guardado = localStorage.getItem('tema'); } catch (e) {}
  if (!guardado) aplicarTema(event.matches ? 'oscuro' : 'claro');
});


async function eliminarProducto(id) {

  const { data, error } = await db
    .from('productos_practica')
    .delete()
    .eq('id', id)
    .select();       // igual que en update: devuelve las filas que SÍ se borraron

  if (error) {
    console.log("Error al eliminar:", error);
    return false;
  }
  // Mismo caso que modificarProducto: si el id no existe (o RLS no deja
  // borrar), Supabase NO da error, solo borra 0 filas → data = [].
  // Sin el .select(), "!error" diría true aunque no se haya borrado nada.
  return data.length > 0;
}


// --- Eliminar con confirmación ---

// Abre el modal y ESPERA la respuesta del usuario.
// Devuelve una Promise: por eso quien la llama puede escribir
//   const confirmado = await confirmarEliminacion(producto);
// igual que hace "await" con Supabase: el código se detiene hasta que
// el usuario pulse Cancelar o Eliminar.
function confirmarEliminacion(producto) {
  const modal = document.getElementById('modal-eliminar');
  // textContent: el nombre viene de la base, se trata como texto, no HTML
  document.getElementById('modal-nombre').textContent = `"${producto.nombre}"`;

  // returnValue guarda el value del botón con que se cerró el <dialog>.
  // Hay que vaciarlo: si se cierra con Esc NO cambia, y quedaría el
  // "confirmar" de la vez anterior → borraría sin que el usuario lo pidiera.
  modal.returnValue = '';
  modal.showModal(); // "modal" = bloquea el resto de la página hasta cerrarse

  return new Promise(resolve => {
    // { once: true }: el listener se borra solo después de usarse; si no,
    // cada vez que abrieras el modal se acumularía uno más
    modal.addEventListener('close', () => {
      resolve(modal.returnValue === 'confirmar');
    }, { once: true });
  });
}

// Clic en el fondo oscuro (fuera de la caja) = cancelar.
// event.target === modal solo cuando el clic cae en el <dialog> mismo
// (su ::backdrop), no en el texto o los botones de adentro.
document.getElementById('modal-eliminar').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close('cancelar');
});

function crearBotonEliminar(producto) {
  const eliminar = document.createElement('button');
  eliminar.type = 'button';
  eliminar.className = 'btn-eliminar';
  eliminar.textContent = 'Eliminar';
  eliminar.addEventListener('click', async () => {
    const confirmado = await confirmarEliminacion(producto);
    if (!confirmado) return; // Cancelar, Esc o clic afuera → no se borra nada

    const borrado = await eliminarProducto(producto.id);
    if (!borrado) {
      mostrarNotificacion('No se pudo eliminar (revisa la consola).', 'error');
      return;
    }

    // Quitamos la tarjeta de la página (Supabase ya la borró de la tabla).
    // "?." = si no encuentra la tarjeta, no hace nada en vez de dar error
    document.querySelector(`.tarjeta[data-id="${producto.id}"]`)?.remove();
    if (document.getElementById('resultado').childElementCount === 0) {
      ocultarGaleria();          // era la última tarjeta
    } else {
      actualizarTituloGaleria(); // "(5)" → "(4)"
    }

    // Si justo lo estabas editando, el form apuntaría a un id que ya no
    // existe → lo devolvemos a modo "Nuevo"
    const form = document.getElementById('form-producto');
    if (Number(form.idEditar.value) === producto.id) ponerModoNuevo();

    mostrarNotificacion(`✔ Producto "${producto.nombre}" eliminado`, 'exito');
  });
  return eliminar;
}