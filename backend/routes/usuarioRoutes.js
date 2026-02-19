const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const db = require("../config/db");

const usuarioController = require("../controllers/usuarioController");
const { authMiddleware } = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolMiddleware");

// ===============================
// Configuración Multer — Subida de fotos
// ===============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    if (!req.usuario?.id)
      return cb(new Error("No se pudo obtener ID de usuario"));

    const ext = path.extname(file.originalname);
    cb(null, `usuario_${req.usuario.id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Formato de archivo no permitido"), false);
};

const upload = multer({ storage, fileFilter });

// ===============================
// AUTENTICACIÓN
// ===============================
router.post("/registro", usuarioController.registrarUsuario);
router.post("/login", usuarioController.loginUsuario);

// ===============================
// PERFIL
// ===============================
router.get("/perfil", authMiddleware, usuarioController.obtenerPerfil);

router.put(
  "/perfil",
  authMiddleware,
  upload.single("foto"),
  usuarioController.actualizarPerfil,
);

router.post(
  "/perfil/foto",
  authMiddleware,
  upload.single("foto"),
  usuarioController.actualizarPerfil,
);

router.post(
  "/restablecer-contrasena/:token",
  usuarioController.restablecerContrasena,
);

// ===============================
// ✅ ADMIN — CREAR USUARIO (ADMIN / TESORERO)
// ===============================
router.post(
  "/crear-admin",
  authMiddleware,
  verificarRol("admin"),
  usuarioController.crearUsuarioAdmin,
);

// ===============================
// ✅ ADMIN — LISTAR USUARIOS
// ===============================
router.get(
  "/todos",
  authMiddleware,
  verificarRol("admin"),
  usuarioController.obtenerTodosUsuarios,
);

// ===============================
// ✅ ADMIN — OBTENER USUARIO POR ID
// ===============================
router.get(
  "/:id",
  authMiddleware,
  verificarRol("admin"),
  usuarioController.obtenerUsuarioPorId,
);

// ===============================
// ✅ ADMIN — ACTUALIZAR USUARIO
// ===============================
router.put(
  "/admin/:id",
  authMiddleware,
  verificarRol("admin"),
  usuarioController.actualizarUsuario,
);

// ===============================
// RESTABLECIMIENTO DE CONTRASEÑA
// ===============================
router.post(
  "/solicitar-restablecimiento",
  usuarioController.solicitarRestablecimiento,
);

// usuarioRoutes.js
router.get("/validar-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      "SELECT id FROM usuarios_registro WHERE reset_token=$1 AND token_expira > NOW()",
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    res.json({ msg: "Token válido" });
  } catch (error) {
    console.error("❌ Error validarToken:", error);
    res.status(500).json({ error: "Error validando token" });
  }
});

// ===============================
// 🔐 CAMBIAR CONTRASEÑA (usuario logueado)
// ===============================
router.put(
  "/cambiar-contrasena",
  authMiddleware,
  usuarioController.cambiarContrasena,
);

module.exports = router;
