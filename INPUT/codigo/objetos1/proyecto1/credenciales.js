// La contraseña NO se guarda en texto plano: solo su hash SHA-256.
// Para cambiarla, calcula el hash de la nueva contraseña (en consola de Node):
//   node -e "console.log(require('crypto').createHash('sha256').update('NUEVA').digest('hex'))"
// const + Object.freeze: desde la consola no se puede reasignar ni modificar.
const credenciales = Object.freeze({
    usuario: "admin",
    passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
});
