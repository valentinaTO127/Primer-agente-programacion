# Explicación de error — 2026-08-27

## [hora] — Error de lógica en condición de `for`

**Código:**
```js
for(let i=0; i>10; i++) {
  console.log(i+1)
  document.write(i+1)
}
```

**Tipo de error:** lógica (no lanza excepción; el código es válido pero no hace lo esperado).

**Causa:** la condición `i>10` es falsa desde el arranque (`i` empieza en `0`, y `0 > 10` es `false`),
así que el loop nunca entra a ejecutarse — ni una sola vuelta.

**Concepto:** en un `for`, la condición se evalúa antes de cada vuelta, incluida la primera. El loop
sigue mientras esa condición sea `true`.

**Corrección:**
```js
for (let i = 0; i < 10; i++) {
  console.log(i + 1)
  document.write(i + 1)
}
```
Cambiar `>` por `<`.
