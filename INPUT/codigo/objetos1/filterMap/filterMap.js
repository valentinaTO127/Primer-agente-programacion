let productos = [
  { id: 1, nombre: "Audífonos Bluetooth",   categoria: "audio",       precio: 89000,  stock: 12, enOferta: true  },
  { id: 2, nombre: "Mouse inalámbrico",      categoria: "accesorios", precio: 45000,  stock: 0,  enOferta: false },
  { id: 3, nombre: "Teclado mecánico",       categoria: "accesorios", precio: 150000, stock: 5,  enOferta: true  },
  { id: 4, nombre: "Parlante portátil",      categoria: "audio",      precio: 120000, stock: 8,  enOferta: false },
  { id: 5, nombre: "Cargador rápido 65W",    categoria: "energia",    precio: 60000,  stock: 20, enOferta: true  },
  { id: 6, nombre: "Power bank 10000mAh",    categoria: "energia",    precio: 75000,  stock: 0,  enOferta: false },
];

const disponibles = productos.filter(function (p) {
  return p.stock > 0;
});

console.log(disponibles);
console.log("Cantidad disponible:", disponibles.length);

const soloAudio = productos.filter(function (p) {
  return p.categoria === "audio";
});

console.log(soloAudio);

const enOferta = productos.filter(function (p) {
  return p.enOferta;
});

console.log(enOferta);


const presupuesto = 80000;

const alAlcance = productos.filter(function (p) {
  return p.precio > presupuesto;
});

console.log(alAlcance);

const disponibleYOferta = productos.filter(function (p) {
  return p.stock > 0 && p.enOferta;
});

console.log(disponibleYOferta);

const nombres = productos.map(function (p) {
  return p.nombre;
});

console.log(nombres);

const catalogo = productos.map(function (p) {
  return p.nombre + " - $" + p.precio;
  /* TODO: un string "nombre — $precio", ej. "Mouse inalámbrico — $45000" */;
});

console.log(catalogo);

const catalogoDeOfertas = productos
  .filter(function (p) {
        return p.stock > 0 && p.enOferta;
  })
  .map(function (p) {
        return p.nombre + " - $" + p.precio;
  })
  /* TODO: encadena aquí un .map() con el mismo formato del Ejercicio 7 */;

console.log(catalogoDeOfertas);