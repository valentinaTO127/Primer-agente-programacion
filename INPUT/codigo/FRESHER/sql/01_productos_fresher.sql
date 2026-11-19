-- FRESHER: amplía productos_practica para skincare (ficha FRESHER.pdf, sección 6).
-- Solo AGREGA columnas: no renombra ni borra nada, así supabase1
-- (que usa la misma tabla) sigue funcionando igual.
alter table productos_practica
  add column if not exists marca             text,
  add column if not exists tipo_producto     text,            -- el filtro principal del catálogo
  add column if not exists calificacion      numeric(2,1),    -- 0.0 a 5.0
  add column if not exists modo_uso          text,
  add column if not exists ingredientes      text,            -- lista INCI completa
  add column if not exists beneficios        text[] default '{}',
  add column if not exists efecto_piel_grasa text,            -- el diferencial de FRESHER
  add column if not exists imagenes          text[] default '{}'; -- galería del detalle (img_url sigue siendo la principal)

-- Reglas en la base, no en el form. Un CHECK con NULL pasa,
-- así que los productos viejos (sin tipo ni calificación) no rompen nada
alter table productos_practica
  add constraint productos_tipo_valido
    check (tipo_producto in ('limpiador', 'serum', 'mascarilla', 'crema', 'bloqueador')),
  add constraint productos_calificacion_rango
    check (calificacion between 0 and 5);

-- El catálogo filtra por tipo en cada carga: índice normal (tema del 2026-11-13)
create index if not exists productos_tipo_idx on productos_practica (tipo_producto);

comment on column productos_practica.efecto_piel_grasa is
  'Cómo afecta el producto a la piel grasa (texto corto que se muestra en el detalle)';
