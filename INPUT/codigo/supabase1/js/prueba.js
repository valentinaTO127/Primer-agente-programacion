// Paso 2: primera consulta a Supabase.
// En la consola del navegador puedes usar "await" suelto, pero en un
// script clásico (<script src> sin type="module") no se puede: da
// SyntaxError. Por eso aquí va dentro de una función async que se
// ejecuta de inmediato (IIFE).
(async () => {
  const { data, error } = await db.from('productos_practica').select('*');
  console.log(data, error);
})();
