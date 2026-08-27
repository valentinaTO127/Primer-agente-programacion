---
name: catalogar-referencias
description: Organiza referencias visuales recolectadas para un proyecto por tema o elemento que inspiran. Use when the user wants to organize, group, or make sense of collected visual references.
---

Cuando se active esta skill:

1. Lee `INPUT/referencias_proyecto.md`.
2. Agrupa las referencias por qué elemento del proyecto inspiran (ej. tipografía, color, layout, movimiento).
3. Por cada grupo, resume en una línea qué característica compartida hace que esas referencias encajen juntas.
4. Guarda el catálogo agrupado en `OUTPUT/catalogo_referencias_[fecha].md`. Si ese archivo ya
   existe (la skill ya se corrió hoy), no lo sobrescribas: anexa el catálogo nuevo al final bajo
   un encabezado `## Actualización [hora]`, conservando lo que ya había.
