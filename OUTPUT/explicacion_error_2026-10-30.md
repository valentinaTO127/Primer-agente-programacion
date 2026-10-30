# Explicación de errores — 2026-10-30

## Error de tipo de dato — 22P02 (Postgres / Supabase)

**Mensaje:**
```
invalid input syntax for type bigint: "4d5d4944-4b06-483b-8f53-3783da4ec3e9"
```

**Dónde:** `INPUT/codigo/supabase1/js/cliente.js`, línea 39:
```js
.insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }])
```

**Tipo de error:** tipo de dato — se envía un valor que no se puede convertir al tipo de la columna.

**Causa:** la columna `id` de `clientes_practica` es `bigint` (`int8`, el id autonumérico por defecto
de Supabase), pero `data.user.id` es un `uuid` (texto con letras y guiones). Postgres no puede
convertir un uuid a un número entero.

**Concepto:** el perfil es una relación 1:1 con `auth.users`. El `id` de `clientes_practica` es su
PK y además una FK hacia `auth.users.id`, y una FK tiene que ser del mismo tipo que la PK a la que
apunta. Como `auth.users.id` es `uuid`, el `id` del perfil también tiene que ser `uuid`.

**Solución recomendada:** recrear la tabla con `id uuid`:
```sql
drop table clientes_practica;

create table clientes_practica (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  correo text,
  rol text default 'cliente',
  created_at timestamptz default now()
);
```

**Alternativa:** dejar el `id` numérico y agregar una columna `user_id uuid references auth.users(id)`.
También funciona, pero quedan dos identificadores para la misma persona y hay que cambiar el JS.

**Ojo:**
- `signUp()` sí funcionó: el usuario ya existe en *Authentication → Users*. Bórralo o prueba con
  otro correo.
- Al recrear la tabla se pierden sus policies de RLS. Hay que volver a crearlas.
