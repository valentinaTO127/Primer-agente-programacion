-- 04: el cliente puede leer el historial de estados de SUS pedidos.
-- Lo usa el seguimiento de cada pedido en cuenta.html (fecha de cada paso).
-- Antes solo existía ver_historial_admin. Las policies de SELECT se suman con OR:
-- el admin sigue viendo todo y el cliente ve solo lo suyo.
-- Ya se corrió en Supabase el 2026-11-19.

create policy ver_historial_cliente on historial_estados_pedido
for select to authenticated
using (exists (
  select 1 from pedidos p
  where p.id = historial_estados_pedido.pedido_id
    and p.cliente_id = (select auth.uid())
));
