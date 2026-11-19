-- 05: nadie puede darse de alta como admin desde el navegador.
-- La policy "Agregar" dejaba a CUALQUIER usuario con sesión insertarse en
-- admins_practica (solo revisaba auth.uid() = id). Desde 2026-11-19 cuenta.html
-- le muestra al admin los datos de todos los clientes: el hueco ya no es solo
-- editar productos.
-- Sin policy de INSERT, RLS rechaza todo insert desde el navegador.
-- Los admins nuevos se crean desde el SQL Editor (no pasa por RLS):
--   insert into admins_practica (id, correo, nombre, rol)
--   values ('<uuid de auth.users>', '<correo>', '<nombre>', 'admin');
-- Ojo: el registro de admin de supabase1/admin.html deja de funcionar.

drop policy "Agregar" on admins_practica;
