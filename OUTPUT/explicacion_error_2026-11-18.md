# Explicación de error — 2026-11-18

## ReferenceError: agregarAlCarrito is not defined

**Síntoma:** al escribir `await agregarAlCarrito('1', 1)` en la consola del navegador sale `Uncaught ReferenceError: agregarAlCarrito is not defined`, aunque la función sí existe en `INPUT/codigo/FRESHER/js/tienda.js`.

**Tipo de error:** de referencia. JavaScript busca un nombre en el ámbito donde corre el código y no lo encuentra.

**Causa:** la consola ejecuta el código **en la página de la pestaña abierta**. Una función de un `<script>` normal es global, pero solo en la página que cargó ese archivo. Si la pestaña es `supabase1/cliente.html` (la que mencionaba el prompt), `FRESHER/admin.html` (que no carga `tienda.js`) o una página que quedó con una versión vieja de `tienda.js`, el nombre no existe ahí.

Un error *dentro* de `tienda.js` no lo explicaría: las funciones declaradas con `function` se crean antes de que el archivo empiece a ejecutarse (*hoisting*).

**Cómo averiguar cuál es:**

```js
location.href              // ¿qué página es?
typeof obtenerUsuario      // 'function' = sí se cargó tienda.js (del paso 1)
typeof agregarAlCarrito    // 'undefined' con lo anterior en 'function' = tienda.js viejo (caché)
```

**Corrección:** abrir `FRESHER/cuenta.html` o `FRESHER/index.html`, recargar con Ctrl+F5 e iniciar sesión con una cuenta de cliente.

**Concepto para recordar:**
- "No está definido" no siempre quiere decir que falte escribirlo. También puede querer decir que **en este lugar** no se ve.
- Cada página tiene su propio ámbito global: solo existen las funciones de los `<script>` que esa página carga.
- La consola del navegador pertenece a la pestaña en la que está abierta.
