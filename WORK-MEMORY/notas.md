# Notas de mi agente

- El taller que más se atrasa suele ser el de Narrativas — priorizar sus entregas cuando haya empate de fechas.
- Prefiero que las referencias de color se agrupen aparte de las de tipografía, aunque compartan la misma fuente.
- Errores frecuentes: `ReferenceError` (variable no declarada) en sketches de p5.js — repasar declaración de variables (`let`) antes de usarlas.
- 2026-11-06: en `INPUT/codigo/supabase1/` se renombró `prueba2.html` → `admin.html` y `js/prueba2.js` → `js/admin.js`. Las entradas de `bitacora_reflexiones.md` anteriores a esa fecha conservan los nombres viejos a propósito.
- Tema para repasar (2026-11-13): **índices** en Postgres. Un índice normal acelera las búsquedas (por ejemplo, en llaves foráneas que RLS consulta). Un índice único parcial (`unique ... where estado = 'carrito'`) además impone una regla: un solo carrito por cliente.
- 2026-11-18: FRESHER (`INPUT/codigo/FRESHER/`) arranca **sin** el rastro de crema del carrito de `supabase1/galeria.html`. Tenerlo en cuenta para agregarlo más adelante (SVG + máscara + `calcularBordeCrema()`).
- 2026-11-18: pendiente en FRESHER: la estudiante va a pasar el texto de `efecto_piel_grasa` de los 50 productos de `sql/03_productos_fresher.sql` (se cargaron sin ese campo). Con eso se arma un `update` por producto (por nombre + marca).
- 2026-11-18: esquema de pedidos en Supabase (lo usa FRESHER). `pedidos`: id, created_at, cliente_id (uuid), estado (carrito/confirmado/enviado/entregado/cancelado), envio (bool), direccion, telefono, observacion, confirmado_en. `detalles_pedidos`: id, created_at, pedido_id, producto_id, cantidad, precio_unitario (lo pone un trigger). `historial_estados_pedido`: id, pedido_id, estado_anterior, estado_nuevo, cambiado_por, cambiado_en (trigger). Función `confirmar_pedido(p_pedido_id, p_envio, p_direccion, p_telefono, p_observacion)` descuenta stock y confirma; otro trigger valida las transiciones de estado. Pendiente: cancelar no devuelve stock.
