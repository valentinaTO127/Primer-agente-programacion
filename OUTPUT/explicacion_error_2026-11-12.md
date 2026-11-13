# Explicación de error — 2026-11-12

## Error de lógica: `.hidden` en un `<svg>` no hace nada

**Síntoma:** al abrir el carrito en `INPUT/codigo/supabase1/galeria.html` solo se oscurece el fondo: no se ve el rastro de crema y el panel no entra. No aparece ningún error en la consola.

**Tipo de error:** de lógica. El código corre sin fallar, pero no hace lo que esperamos, y por eso la consola no dice nada.

**Causa** (`js/galeria.js`, `abrirCarrito()`):

```js
rastroCrema.hidden = false; // rastroCrema es un <svg>
```

- `.hidden` es una **propiedad de `HTMLElement`** que está conectada al atributo `hidden`. Un `<svg>` es un `SVGElement`, no un `HTMLElement`, así que no tiene esa propiedad.
- En JS, asignarle una propiedad que no existe a un objeto no da error: solo crea una propiedad nueva sin ninguna conexión. El **atributo** `hidden` siguió en el HTML, y con `[hidden] { display: none !important; }` el svg nunca se mostró.
- Un elemento con `display: none` no corre animaciones → `animationend` nunca se disparó → `mostrarPanel()` nunca se llamó.

**Corrección:** cambiar el atributo directamente, porque eso funciona en cualquier elemento:

```js
rastroCrema.toggleAttribute('hidden', false); // mostrar
rastroCrema.toggleAttribute('hidden', true);  // ocultar
```

Además se agregó un `setTimeout` de respaldo (900 ms) para que el panel entre aunque la animación no corra.

**Concepto para recordar:**
- **Atributo** = lo que está escrito en el HTML. **Propiedad** = lo que existe en el objeto de JS.
- Algunas propiedades (`hidden`, `id`, `value`) están "conectadas" a su atributo, pero solo en los elementos que las definen.
- Si una propiedad no hace efecto, revisa en DevTools → Elements si el atributo cambió de verdad.
- Si algo depende de un evento (`animationend`, `load`), piensa qué pasa si ese evento nunca llega.
