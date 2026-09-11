// --- Modo claro / oscuro (compartido entre index.html y pony.html) ---
const themeToggle = document.getElementById("theme-toggle");

function actualizarTextoBoton() {
    themeToggle.textContent = document.body.classList.contains("light")
        ? "🌙"
        : "☀️";
}

// Recupera la preferencia guardada del navegador (localStorage) al cargar la página
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}
actualizarTextoBoton();

// Cada clic alterna la clase "light" en el body y guarda la preferencia
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    actualizarTextoBoton();
});
