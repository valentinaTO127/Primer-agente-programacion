// Constantes de todas las páginas de FRESHER (tienda y admin).

// Los mismos valores que el CHECK de la columna categoria (sql/01 la creó como
// tipo_producto y sql/02_categoria.sql le cambió el nombre)
const CATEGORIAS = {
  limpiador:  { plural: 'Limpiadores',  singular: 'Limpiador' },
  serum:      { plural: 'Sérums',       singular: 'Sérum' },
  mascarilla: { plural: 'Mascarillas',  singular: 'Mascarilla' },
  crema:      { plural: 'Cremas',       singular: 'Crema' },
  bloqueador: { plural: 'Bloqueadores', singular: 'Bloqueador solar' },
};

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
});
