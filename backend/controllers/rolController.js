// backend/controllers/rolController.js

const db = require("../config/db");

/* ===============================
   OBTENER TODOS LOS ROLES
=============================== */
const obtenerRoles = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, nombre, descripcion FROM roles ORDER BY id",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener roles:", error);
    res.status(500).json({ error: "Error al obtener roles" });
  }
};

/* ===============================
   CREAR NUEVO ROL
=============================== */
const crearRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Verificar duplicado
    const existe = await db.query(
      "SELECT id FROM roles WHERE LOWER(nombre)=LOWER($1)",
      [nombre],
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ese rol ya existe" });
    }

    const result = await db.query(
      `
      INSERT INTO roles (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
      `,
      [nombre.toLowerCase(), descripcion || ""],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al crear rol:", error);
    res.status(500).json({ error: "Error al crear rol" });
  }
};

module.exports = {
  obtenerRoles,
  crearRol,
};
