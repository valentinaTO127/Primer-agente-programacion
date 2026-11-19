-- 06: al cancelar un pedido, las unidades vuelven al inventario.
-- confirmar_pedido() descuenta el stock al confirmar; sin esto, cancelar un
-- pedido confirmado o enviado dejaba esas unidades perdidas.
-- Va en un trigger (no en el JS del admin) para que se cumpla SIEMPRE, se
-- cancele desde cuenta.html, desde el SQL Editor o desde una función futura.
-- Desde 'carrito' no se devuelve nada: ese stock nunca se descontó.
-- security definer: si algún día el cliente puede cancelar, él no tiene
-- permiso de UPDATE en productos_practica.

create or replace function devolver_stock_cancelado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update productos_practica p
  set unidades = p.unidades + d.cantidad
  from detalles_pedidos d
  where d.pedido_id = new.id
    and p.id = d.producto_id;
  return new;
end;
$$;

create trigger pedidos_devolver_stock
after update of estado on pedidos
for each row
when (new.estado = 'cancelado' and old.estado in ('confirmado', 'enviado'))
execute function devolver_stock_cancelado();
