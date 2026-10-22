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
  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
  
  const nombres = data.map(producto => producto.nombre);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById('resultado').innerHTML +=
    '<ul>' + nombres.map(n => `<li>${n}</li>`).join('') + '</ul>';

    
  const precios = data.map(producto => producto.precio);

  document.getElementById('resultado').innerHTML +=
    '<ul>' + precios.map(p => `<li>${p}</li>`).join('') + '</ul>';

  const unidades = data.map(producto => producto.unidades);
  document.getElementById('resultado').innerHTML +=
    '<ul>' + unidades.map(u => `<li>${u}</li>`).join('') + '</ul>';

  
  
  

});

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
        document.getElementById('notificacion').textContent = 'Producto agregado con ID: ' + nuevoProducto.id;
        form.reset(); // limpia todos los campos para agregar otro
    } else {
        document.getElementById('notificacion').textContent = 'Error al agregar el producto (revisa la consola).';
    }
});





    