document.getElementById('btn-traer').addEventListener('click', async () => {

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
  const galeria = document.getElementById('resultado');
  galeria.replaceChildren(); // si das clic otra vez, no se duplican las tarjetas
  data.forEach(producto => galeria.appendChild(crearTarjetaProducto(producto)));
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

  const id = document.createElement('p');
  id.className = 'id';
  id.textContent = `ID ${producto.id}`;

  tarjeta.append(nombre, descripcion, precio, estado, etiquetas, id);
  return tarjeta;
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

// --- Formulario: el usuario escribe los datos del nuevo producto ---
// Escuchamos "submit" (no "click") porque se dispara tanto con el botón
// como al presionar Enter dentro de un campo.
document.getElementById('form-producto').addEventListener('submit', async (event) => {
    // Por defecto un <form> recarga la página al enviarse; esto lo evita
    // para que nuestro JS pueda manejar el envío.
    event.preventDefault();

    const form = event.target;

    // OJO: .value SIEMPRE devuelve un string, aunque el input sea type="number".
    // Las columnas precio/unidades/descuento son numéricas, así que hay que
    // convertir con Number() — "100000" (texto) no es lo mismo que 100000.
    const nuevo = {
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

    const nuevoProducto = await agregarProducto(nuevo);
    if (nuevoProducto) {
        // Usamos los datos que DEVOLVIÓ Supabase (no los del form): así el
        // mensaje confirma lo que de verdad quedó guardado en la tabla.
        mostrarNotificacion(`✔ Producto "${nuevoProducto.nombre}" agregado con ID: ${nuevoProducto.id}`, 'exito');
        form.reset(); // limpia todos los campos para agregar otro
    } else {
        mostrarNotificacion('Error al agregar el producto (revisa la consola).', 'error');
    }
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
    .single();         // single() = "espero exactamente una fila, dámela
                        // como objeto, no como array de un elemento"

  if (error) return null;
  return data;
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

// Pinta una lista de productos en #resultado-busqueda.
// createElement + textContent (no innerHTML): el nombre viene de la base de
// datos y cualquiera pudo escribirlo, así que se trata como texto, nunca como HTML.
function renderizarResultados(productos) {
    const contenedor = document.getElementById('resultado-busqueda');
    contenedor.replaceChildren(); // borra los resultados de la búsqueda anterior

    const lista = document.createElement('ul');
    productos.forEach(producto => {
        const item = document.createElement('li');
        item.textContent = `ID ${producto.id} · ${producto.nombre} · $${producto.precio} · ${producto.unidades} unidades`;
        lista.appendChild(item);
    });
    contenedor.appendChild(lista);
}

document.getElementById('form-buscar-id').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;

    // .value es string ("4"); la columna id es numérica → Number()
    const id = Number(form.idProducto.value);
    const producto = await buscarProductoPorId(id);

    // Si no hay fila, .single() devuelve un error (esperaba exactamente 1),
    // y buscarProductoPorId lo convierte en null.
    if (producto) {
        renderizarResultados([producto]); // en array para reusar la misma función
    } else {
        document.getElementById('resultado-busqueda').replaceChildren();
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
        renderizarResultados(productos);
        mostrarNotificacion(`✔ ${productos.length} producto(s) encontrado(s) con "${texto}"`, 'exito');
    } else {
        document.getElementById('resultado-busqueda').replaceChildren();
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


document.getElementById('btn-actualizar').addEventListener('click', async () => {
    const cambios = { unidades: 40 };
    const actualizado = await modificarProducto(4, cambios);

    if (actualizado) {
        // Recorremos solo las columnas que pedimos cambiar, y tomamos su valor
        // de "actualizado" (lo que Supabase confirma que quedó guardado).
        // { unidades: 37 } → "unidades = 37"
        const detalle = Object.keys(cambios)
            .map(campo => `${campo} = ${actualizado[campo]}`)
            .join(', ');
        mostrarNotificacion(`✔ Producto ID ${actualizado.id} actualizado: ${detalle}`, 'exito');
    } else {
        mostrarNotificacion('No se pudo actualizar (revisa el id o la consola).', 'error');
    }
});