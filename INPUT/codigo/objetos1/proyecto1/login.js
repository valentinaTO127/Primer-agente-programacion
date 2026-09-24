// Verifica usuario y contraseña contra credenciales.js.
// Se declara con const (no se puede reasignar desde la consola) y todo lo que usa por dentro
// (el hash, crypto.subtle, las credenciales) queda privado en el closure de esta IIFE.
const verificarLogin = (() => {
    // Se guardan las funciones nativas al cargar la página, antes de que alguien pueda
    // sobrescribirlas desde la consola (ej. crypto.subtle.digest = () => hashFalso)
    const calcularDigest = crypto.subtle ? crypto.subtle.digest.bind(crypto.subtle) : null;
    const codificador = new TextEncoder();
    const credencialesAdmin = credenciales;

    // Convierte un texto en su hash SHA-256 (en hexadecimal), igual al que está en credenciales.js
    async function calcularHash(texto) {
        const buffer = await calcularDigest("SHA-256", codificador.encode(texto));
        return Array.from(new Uint8Array(buffer))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    // Devuelve true si usuario y contraseña coinciden; lanza un error si el navegador no puede calcular el hash
    return async function verificarLogin(usuario, password) {
        // crypto.subtle solo existe en contextos seguros (https, localhost o file://)
        if (!calcularDigest) {
            throw new Error("crypto.subtle no está disponible en este navegador");
        }

        const hashIngresado = await calcularHash(password);
        return usuario.trim() === credencialesAdmin.usuario && hashIngresado === credencialesAdmin.passwordHash;
    };
})();
