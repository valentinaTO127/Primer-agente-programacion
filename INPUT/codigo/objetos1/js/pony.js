// Lee el parámetro ?id=INDICE de la URL para saber qué pony mostrar
const parametros = new URLSearchParams(window.location.search);
const id = Number(parametros.get("id"));
const pony = ponies[id];

const detalle = document.getElementById("detalle");

if (pony) {
    detalle.appendChild(crearTarjetaPony(pony));
} else {
    detalle.textContent = "No se encontró ese pony.";
}
