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

  // JSON.stringify(data, null, 2) convierte el array completo a texto,
  // con sangría (el "2") para que se lea ordenado. Esta línea SÍ es
  // sincrónica (no necesita await) — ya no estamos esperando nada de
  // Supabase, solo transformando el array "data" que ya llegó.

  //document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);

  // map() es SINCRÓNICO (igual que con cualquier array normal, como ya
  // usaste en localStorage/semana 8) — por eso NO lleva await. No viaja
  // a ningún lado: solo transforma el array "data" que ya tienes en
  // memoria, después de que el await de arriba terminó de esperar.
  // Esta es la diferencia clave a quedarte con esta sección: "await" es
  // solo para lo que viaja por la red (la consulta a Supabase); una vez
  // que los datos ya están en tu computador, trabajar con ellos
  // (map, filter, etc.) es exactamente igual que con localStorage.
  const precios = data.map(producto => producto.precio);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos  
  //document.getElementById('resultado').innerHTML =
  //  '<ul>' + data.map(p => `<li>${p.nombre}: $${p.precio}</li>`).join('') + '</ul>';

  // Misma idea que la lista de arriba, pero ahora cada producto es una
  // fila <tr> y cada columna de Supabase es una celda <td>.
  // Algunos tipos llegan "crudos" y conviene formatearlos para leerlos:
  //   - precio (int8)      → 129900 se ve mejor como $129.900
  //   - descuento (float8) → 0.15 es una fracción, la mostramos como 15%
  //   - disponible (bool)  → true/false lo traducimos a Sí/No
  //   - categorias (json)  → Supabase ya lo convierte en array de JS,
  //                          así que podemos usar join() como con cualquier array
  //   - img_url (text)     → es solo un string con una URL; para que se vea
  //                          como imagen hay que ponerlo dentro del src de un <img>.
  //                          Si un producto no tiene URL (null), dejamos la celda vacía
  //                          en vez de un <img> roto.
  /* --- Versión TABLA (anterior) ---
  const filas = data.map(p => `
    <tr>
      <td>${p.img_url ? `<img src="${p.img_url}" alt="${p.nombre}">` : ''}</td>
      <td>${p.nombre}</td>
      <td>${p.descripcion}</td>
      <td>$${p.precio.toLocaleString('es-CO')}</td>
      <td>${p.unidades}</td>
      <td>${Math.round(p.descuento * 100)}%</td>
      <td>${p.disponible ? 'Sí' : 'No'}</td>
      <td>${Array.isArray(p.categorias) ? p.categorias.join(', ') : p.categorias}</td>
    </tr>
  `).join('');

  document.getElementById('resultado').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Precio</th>
          <th>Unidades</th>
          <th>Descuento</th>
          <th>Disponible</th>
          <th>Categorías</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
  */

  // --- Versión GALERÍA ---
  // Los datos y el map() son exactamente los mismos que en la tabla; lo único
  // que cambia es el HTML que armamos por cada producto: en vez de una fila
  // <tr>, cada producto es una tarjeta <article>. El acomodo en cuadrícula
  // NO lo hace el JS, lo hace el CSS (display: grid en .galeria, ver prueba.html).
  // Separar "qué datos muestro" (JS) de "cómo se acomodan" (CSS) es lo que
  // permite cambiar de tabla a galería sin tocar la consulta a Supabase.
  const tarjetas = data.map(p => {
    // Precio final con el descuento aplicado: si descuento es 0.15,
    // pagas el 85% del precio → precio * (1 - 0.15)
    const precioFinal = Math.round(p.precio * (1 - p.descuento));

    return `
      <article class="card ${p.disponible ? '' : 'agotado'}">
        ${p.img_url ? `<img src="${p.img_url}" alt="${p.nombre}">` : ''}
        ${p.descuento > 0 ? `<span class="badge-descuento">-${Math.round(p.descuento * 100)}%</span>` : ''}
        <div class="card-body">
          <div class="categorias">
            ${(Array.isArray(p.categorias) ? p.categorias : []).map(c => `<span class="chip">${c}</span>`).join('')}
          </div>
          <h3>${p.nombre}</h3>
          <p class="descripcion">${p.descripcion}</p>
          <p class="precio">
            ${p.descuento > 0 ? `<s>$${p.precio.toLocaleString('es-CO')}</s>` : ''}
            <strong>$${precioFinal.toLocaleString('es-CO')}</strong>
          </p>
          <p class="stock">${p.disponible ? `${p.unidades} unidades disponibles` : 'Agotado'}</p>
        </div>
      </article>
    `;
  }).join('');

  document.getElementById('resultado').innerHTML = `<div class="galeria">${tarjetas}</div>`;
});
