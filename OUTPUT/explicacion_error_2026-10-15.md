## Error de sintaxis SQL en policy de Supabase

**Error:** `ERROR: 42601: syntax error at or near ")"` en `with check ( );`

**Causa:** la cláusula `with check (...)` se dejó vacía — Postgres espera una expresión booleana dentro de los paréntesis, no un paréntesis vacío.

**Concepto:** en policies `for all`, `using (...)` valida lecturas y `with check (...)` valida escrituras (INSERT/UPDATE). Ambas necesitan una condición real cuando la policy aplica a todas las operaciones.

**Corrección:** repetir la misma condición de `using` dentro de `with check`, o eliminar la cláusula `with check` completa (no dejarla vacía) para que herede la de `using`.
