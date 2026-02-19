// backend/routes/rolRoutes.js

const express = require("express");
const router = express.Router();

const { obtenerRoles, crearRol } = require("../controllers/rolController");

const {
  authMiddleware,
  verificarAdmin,
} = require("../middleware/authMiddleware");

/* ===============================
   ROLES (ADMIN)
=============================== */

// Ver roles
router.get("/", authMiddleware, verificarAdmin, obtenerRoles);

// Crear rol
router.post("/", authMiddleware, verificarAdmin, crearRol);

module.exports = router;
