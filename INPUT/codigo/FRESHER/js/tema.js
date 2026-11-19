// Modo claro / oscuro de todas las páginas de FRESHER (antes estaba en tienda.js;
// salió a su propio archivo porque admin.html no carga tienda.js).
// Clave propia: si supabase1 se abre en el mismo origen, no se mezclan
const CLAVE_TEMA = 'tema-fresher';

// El tema inicial lo pone un <script> en el <head> de cada página, antes de
// pintar, para que no se vea un parpadeo de color al cargar
const botonTema = document.getElementById('btn-tema');

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const oscuro = tema === 'oscuro';
  botonTema.textContent = oscuro ? '☀️' : '🌙';
  botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

aplicarTema(document.documentElement.dataset.tema);

botonTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
  aplicarTema(nuevo);
  try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch (e) {}
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE_TEMA); } catch (e) {}
  if (!guardado) aplicarTema(event.matches ? 'oscuro' : 'claro');
});
