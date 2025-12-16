// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware general: valida que el token exista y sea válido
function authMiddleware(req, res, next) {
  console.log("🔐 Ruta solicitada:", req.method, req.originalUrl);
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log("🔐 Token recibido:", token ? "[OCULTO]" : "NINGUNO");

  if (!token) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos el ID y todo el payload del usuario en la request
    req.usuarioId = verificado.id;
    req.usuario = verificado;

    console.log("✅ Token decodificado:", {
      id: verificado.id,
      correo: verificado.correo,
      rol: verificado.rol,
      expira: new Date(verificado.exp * 1000)
    });

    next();
  } catch (error) {
    console.error("❌ Error en authMiddleware:", error.message);
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

// Middleware adicional: verifica si el usuario es administrador
function verificarAdmin(req, res, next) {
  console.log("👮 Verificando permisos de admin para:", req.usuario);
  console.log("👮 Ruta solicitada:", req.method, req.originalUrl);
  
  if (!req.usuario) {
    return res.status(401).json({ mensaje: "No autenticado" });
  }

  // Acepta tanto el rol "admin" como el correo del super admin
  if (
    req.usuario.rol !== "admin" &&
    req.usuario.correo !== "noresponder@unac.edu.co"
  ) {
    return res
      .status(403)
      .json({ mensaje: "Acceso denegado: solo administradores" });
  }

  next();
}

module.exports = {
  authMiddleware,
  verificarAdmin,
};