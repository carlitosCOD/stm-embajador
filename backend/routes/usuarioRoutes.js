const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const {
  registrarUsuario,
  loginUsuario,
  verificarToken: verificarCuenta,
  solicitarRestablecimiento,
  restablecerContraseña: restablecerContrasena,
  cambiarContraseña: cambiarContrasena,
  reenviarVerificacion,
  obtenerPerfil,
  actualizarPerfil,
  obtenerAdministradores,
  eliminarAdministrador,
} = require("../controllers/usuarioController");

const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../config/db");

/* =========================
   CONFIGURACIÓN DE MULTER
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.usuario.id}${ext}`);
  },
});

const upload = multer({ storage });

/* =========================
   RUTAS PÚBLICAS
========================= */
router.post("/registro", registrarUsuario);
router.post("/login", loginUsuario);
router.get("/verificar/:token", verificarCuenta);
router.post("/solicitar-restablecimiento", solicitarRestablecimiento);
router.post("/restablecer-contrasena/:token", restablecerContrasena);
router.post("/reenviar-verificacion", reenviarVerificacion);

/* =========================
   VALIDAR TOKEN
========================= */
router.get("/validar-token/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const query =
      "SELECT id FROM usuarios_registro WHERE reset_token = $1 AND token_expira > NOW()";
    const result = await db.query(query, [token]);

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ valido: false, mensaje: "Token inválido o expirado." });
    }

    res.json({ valido: true });
  } catch (err) {
    res.status(500).json({ error: "Error al validar token." });
  }
});

/* =========================
   RUTAS PROTEGIDAS (USUARIO)
========================= */
router.get("/perfil", authMiddleware, obtenerPerfil);
router.put("/perfil", authMiddleware, upload.single("foto"), actualizarPerfil);

router.post("/cambiar-contrasena", authMiddleware, cambiarContrasena);

/* =========================
   RUTAS ADMIN
========================= */
router.get("/administradores", authMiddleware, obtenerAdministradores);
router.delete("/administradores/:id", authMiddleware, eliminarAdministrador);

module.exports = router;
