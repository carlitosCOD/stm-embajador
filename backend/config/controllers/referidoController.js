// controllers/referidoController.js
const db = require('../config/db');
const axios = require('axios');
const { enviarAClientify } = require("../services/clientifyService");

// ==================================================
// 📥 Registrar nuevo referido vinculado al usuario
// ==================================================
const registrarReferido = async (req, res) => {
  const {
    cedula,
    nombres,
    apellidos,
    numero_telefonico,
    programa_interes,
    acepta_privacidad,
    correo_electronico
  } = req.body;

  const usuario_id = req.usuario?.id || req.usuarioId;
  const embajadorNombre = `${req.usuario?.nombre} ${req.usuario?.apellido}`;

  if (!usuario_id) {
    return res.status(401).json({ error: 'Token no válido o usuario no autenticado.' });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO referidos 
      (documento, nombres, apellidos, numero_telefonico, programa_interes, acepta_privacidad, correo_electronico, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cedula, nombres, apellidos, numero_telefonico, programa_interes, acepta_privacidad, correo_electronico, usuario_id]
    );

    const nuevoReferido = {
      id: result.insertId,
      cedula,
      nombres,
      apellidos,
      numero_telefonico,
      programa_interes,
      correo_electronico,
      usuario_id,
    };

    // ✅ Sincronizar con Clientify
    enviarAClientify(nuevoReferido, embajadorNombre)
      .then(() => console.log("📨 Referido sincronizado con Clientify"))
      .catch((err) => console.error("⚠️ Error en sincronización con Clientify:", err.message));

    return res.status(201).json({
      mensaje: "✅ Referido registrado con éxito",
      referido: nuevoReferido,
    });
  } catch (err) {
    console.error("❌ Error al registrar referido:", err.message);
    return res.status(500).json({ error: "Error al registrar el referido" });
  }
};

// ==================================================
// 📋 Obtener todos los referidos del usuario logueado
// ==================================================
const obtenerReferidosPorUsuario = (req, res) => {
  const usuario_id = req.usuario?.id || req.usuarioId;

  if (!usuario_id) {
    return res.status(401).json({ error: 'Token no válido o usuario no autenticado.' });
  }

  const query = `
    SELECT id, documento, nombres, apellidos, numero_telefonico, programa_interes, correo_electronico, fecha_registro
    FROM referidos
    WHERE usuario_id = ?
    ORDER BY fecha_registro DESC
  `;

  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener referidos:', err.message);
      return res.status(500).json({ error: 'Error al consultar referidos.' });
    }

    res.status(200).json(results);
  });
};

// ==================================================
// 🌐 Verificar cédula en SION y luego en base local
// ==================================================
const verificarCedulaGlobal = async (req, res) => {
  try {
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ message: 'La cédula es requerida' });
    }

    let existeEnSion = false;
    let existeEnBD = false;

    // 1️⃣ Consultar API de SION
    try {
      const SION_BASE_URL = "https://sionapi.unac.edu.co/api/Estudiante/LEstudiante";
      const SION_TOKEN = "d3f94a26-b0K5-4f3a-Tbf2-8ecb6b7Y93a2";

      const response = await axios.get(
        `${SION_BASE_URL}?Documento=${cedula}&token=${SION_TOKEN}`
      );

      if (response.data && response.data.Estado) {
        existeEnSion = true;
      }
    } catch (error) {
      console.warn("⚠️ No se pudo consultar la API de SION:", error.message);
    }

    // 2️⃣ Verificar en base local
    const [rows] = await db.promise().query(
      'SELECT documento FROM referidos WHERE documento = ?',
      [cedula]
    );

    if (rows.length > 0) {
      existeEnBD = true;
    }

    // 3️⃣ Respuesta final
    return res.json({ existeEnSion, existeEnBD });

  } catch (error) {
    console.error('❌ Error en verificarCedulaGlobal:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = {
  registrarReferido,
  obtenerReferidosPorUsuario,
  verificarCedulaGlobal
};
