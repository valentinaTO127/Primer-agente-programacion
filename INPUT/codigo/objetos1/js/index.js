console.log(ponies[0].tipo);

const galeria = document.getElementById("galeria");

// Recorre el array, arma una tarjeta por cada pony y la agrega a la galería.
// Al hacer click en una tarjeta, se abre pony.html con el índice de ese pony en la URL.
ponies.forEach((pony, index) => {
    const card = crearTarjetaPony(pony);
    card.addEventListener("click", () => {
        window.open(`pony.html?id=${index}`, "_blank");
    });
    galeria.appendChild(card);
});

console.log(ponies[0].nombre);
console.log(ponies[0].edad * 3);
console.log(ponies[0].imagen);
console.log(ponies[0].poderes[0]);
