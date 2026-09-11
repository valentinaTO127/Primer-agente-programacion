// Array de 12 objetos: cada uno representa un personaje de My Little Pony.
// Compartido entre index.html (galería) y pony.html (detalle de un solo pony).
const ponies = [
    {
        nombre: "Twilight Sparkle",
        poderes: ["Magia de la amistad", "Teletransportarse"],
        descripcion: "Twilight Sparkle, personaje principal de My little Pony, estudiante de la reina Celestia",
        edad: 16,
        mascotas: true,
        tipo: "unicornio",
        imagen: "https://static.wikia.nocookie.net/characterprofile/images/c/c7/Twilight_Sparkle_Alicorn_vector.png/revision/latest?cb=20160104140556",
        altura: 0.9
    },
    {
        nombre: "Pinkie Pie",
        poderes: ["Fiestas sorpresa", "Pinkie sense"],
        descripcion: "Pinkie Pie, la pony más fiestera de Ponyville, siempre lista para animar a sus amigas",
        edad: 15,
        mascotas: true,
        tipo: "pony terrestre",
        imagen: "https://static.wikia.nocookie.net/characters/images/0/06/Pinkie_Pie_%28MLP%29.png/revision/latest?cb=20240329125321",
        altura: 0.85,
        color: "rgba(247, 168, 196, 0.35)"
    },
    {
        nombre: "Rainbow Dash",
        poderes: ["Vuelo supersónico", "Sonic Rainboom"],
        descripcion: "Rainbow Dash, la pegaso más veloz de Equestria, sueña con unirse a los Wonderbolts",
        edad: 16,
        mascotas: true,
        tipo: "pegaso",
        imagen: "https://static.wikia.nocookie.net/heroes-and-villain/images/8/8e/Rainbow_Dash_by_Nethear.png/revision/latest?cb=20190204203601",
        altura: 0.95,
        color: "rgba(110, 198, 232, 0.35)"
    },
    {
        nombre: "Applejack",
        poderes: ["Fuerza descomunal", "Detectar mentiras"],
        descripcion: "Applejack, encargada de la granja Sweet Apple Acres, honesta hasta el final",
        edad: 17,
        mascotas: true,
        tipo: "pony terrestre",
        imagen: "https://static.wikia.nocookie.net/mlpsneeze/images/7/79/Applejack.png/revision/latest?cb=20170401053115",
        altura: 0.95,
        color: "rgba(232, 163, 61, 0.35)"
    },
    {
        nombre: "Rarity",
        poderes: ["Magia de diseño", "Detectar gemas"],
        descripcion: "Rarity, diseñadora de moda de Ponyville, ama la elegancia y ayudar a sus amigas",
        edad: 17,
        mascotas: true,
        tipo: "unicornio",
        imagen: "https://th09.deviantart.net/fs71/PRE/f/2011/231/c/b/rarity_01_by_rildraw-d46gzq6.png",
        altura: 0.9,
        color: "rgba(220, 220, 225, 0.35)"
    },
    {
        nombre: "Fluttershy",
        poderes: ["Mirada aterradora", "Comunicarse con animales"],
        descripcion: "Fluttershy, cuidadora de animales tímida pero increíblemente amable",
        edad: 16,
        mascotas: true,
        tipo: "pegaso",
        imagen: "https://static.wikia.nocookie.net/book-of-heroes-and-villains/images/2/29/Fluttershy.png/revision/latest?cb=20210506224309",
        altura: 0.85,
        color: "rgba(242, 227, 148, 0.35)"
    },
    {
        nombre: "Spike",
        poderes: ["Aliento de fuego mágico", "Lealtad inquebrantable"],
        descripcion: "Spike, el dragón bebé asistente de Twilight Sparkle",
        edad: 10,
        mascotas: false,
        tipo: "dragón",
        imagen: "https://static.wikia.nocookie.net/characters-in-fiction/images/7/79/Spike_MLP_Wings.png/revision/latest/thumbnail/width/360/height/450?cb=20200624133827",
        altura: 0.6,
        color: "rgba(143, 191, 107, 0.35)"
    },
    {
        nombre: "Princess Celestia",
        poderes: ["Controlar el sol", "Magia ancestral"],
        descripcion: "Princess Celestia, gobernante de Equestria y mentora de Twilight Sparkle",
        edad: 1000,
        mascotas: false,
        tipo: "alicornio",
        imagen: "https://static.wikia.nocookie.net/heroes-and-villain/images/c/cc/Princess_celestia.png/revision/latest?cb=20190127203437",
        altura: 1.8,
        color: "rgba(245, 216, 120, 0.35)"
    },
    {
        nombre: "Princess Luna",
        poderes: ["Controlar la luna", "Entrar en los sueños"],
        descripcion: "Princess Luna, guardiana de la noche y hermana de la Princesa Celestia",
        edad: 1000,
        mascotas: false,
        tipo: "alicornio",
        imagen: "https://static.wikia.nocookie.net/characters/images/8/83/Princess_Luna.png/revision/latest?cb=20171010212421",
        altura: 1.75,
        color: "rgba(65, 105, 225, 0.35)"
    },
    {
        nombre: "Starlight Glimmer",
        poderes: ["Hechizos de igualación", "Viajar en el tiempo"],
        descripcion: "Starlight Glimmer, exalumna de Twilight Sparkle que aprendió el valor de la amistad",
        edad: 18,
        mascotas: false,
        tipo: "unicornio",
        imagen: "https://static.wikia.nocookie.net/near-pure-good-hero/images/d/d9/Vector_443_starlight_glimmer_12_by_remul_lemlem_d9y653f.png/revision/latest/scale-to-width-down/1200?cb=20210627014610",
        altura: 0.9,
        color: "rgba(150, 224, 194, 0.35)"
    },
    {
        nombre: "Discord",
        poderes: ["Magia del caos", "Teletransportarse a voluntad"],
        descripcion: "Discord, el espíritu del caos que ahora es amigo (a su manera) de Fluttershy",
        edad: 500,
        mascotas: false,
        tipo: "draconequus",
        imagen: "https://static.wikia.nocookie.net/p__/images/b/ba/Discord_MLP.png/revision/latest?cb=20190830083516&path-prefix=protagonist",
        altura: 1.2,
        color: "rgba(150, 111, 71, 0.35)"
    },
    {
        nombre: "Trixie Lulamoon",
        poderes: ["Ilusiones mágicas", "Espectáculos de humo"],
        descripcion: "Trixie Lulamoon, la gran y poderosa maga itinerante de Equestria",
        edad: 17,
        mascotas: false,
        tipo: "unicornio",
        imagen: "https://static.wikia.nocookie.net/p__/images/2/2f/Trixie_Lulamoon.png/revision/latest?cb=20201105181721&path-prefix=protagonist",
        altura: 0.9,
        color: "rgba(91, 127, 209, 0.35)"
    }
];
