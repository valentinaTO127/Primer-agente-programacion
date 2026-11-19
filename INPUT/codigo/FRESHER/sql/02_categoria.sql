-- FRESHER: una sola columna de categoría (2026-11-18).
-- tipo_producto ya tiene la regla (CHECK) con las 5 categorías válidas,
-- así que se queda ella con el nombre "categoria" y se borra la vieja.
--
-- OJO: supabase1 usa la columna "categorias" (galeria.js y admin.js).
-- Después de esto, supabase1 deja de cargar productos (error 42703).

alter table productos_practica drop column categorias;

alter table productos_practica rename column tipo_producto to categoria;

-- La regla y el índice siguen funcionando solos tras el rename (Postgres los
-- liga a la columna, no a su nombre). Se renombran solo para que se entiendan
alter table productos_practica rename constraint productos_tipo_valido to productos_categoria_valida;
alter index productos_tipo_idx rename to productos_categoria_idx;
