// routes/referidoRoutes.js
const express = require("express");
const db = require("../config/db");
const axios = require("axios");
const { authMiddleware } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Configuración API de SION desde variables de entorno
const SION_BASE_URL =
  process.env.SION_BASE_URL ||
  "https://sionapi.unac.edu.co/api/Estudiante/LEstudiante";
const SION_ASESOR_URL =
  process.env.SION_ASESOR_URL ||
  "https://sionapi.unac.edu.co/api/Estudiante/Asesores";
const SION_TOKEN = process.env.SION_TOKEN;

// Configuración API de Clientify desde variables de entorno
const CLIENTIFY_BASE_URL =
  process.env.CLIENTIFY_BASE_URL || "https://api.clientify.net/v1/contacts/";
const CLIENTIFY_TOKEN = process.env.CLIENTIFY_API_TOKEN;

// 📌 Endpoint: obtener programas/asesores (proxy a SION)
router.get("/programas", async (req, res) => {
  try {
    const sionRes = await axios.get(`${SION_ASESOR_URL}?token=${SION_TOKEN}`, {
      timeout: 10000,
    });

    const data = sionRes.data;

    if (!Array.isArray(data)) {
      console.warn("Respuesta inesperada de SION (no es array):", data);
      return res.status(502).json({ error: "Respuesta inesperada desde SION" });
    }

    const programas = data
      .filter((it) => it && it.Programa)
      .map((it) => {
        let correo = it.Correo ?? "";

        // 🔄 Reemplazo de correo viejo por el nuevo
        if (correo && correo.toUpperCase() === "YEDAHOYOSC@UNAC.EDU.CO") {
          correo = "asistente-unactec@unac.edu.co";
        }

        return {
          Nombre: it.Nombre ?? "",
          Programa: it.Programa ?? "",
          Correo: correo,
          Respuesta: it.Respuesta ?? "",
          Estado: typeof it.Estado !== "undefined" ? it.Estado : true,
        };
      });

    return res.json(programas);
  } catch (error) {
    console.error(
      "⚠️ Error consultando SION (programas):",
      error.response?.data || error.message
    );
    return res
      .status(500)
      .json({ error: "No se pudieron obtener los programas desde SION" });
  }
});

// 📌 Endpoint: verificar primero en SION, luego en BD local
router.post("/verificar-cedula", async (req, res) => {
  const { cedula } = req.body;

  if (!cedula) {
    return res.status(400).json({ error: "Falta la cédula" });
  }

  try {
    // Intentar en SION
    try {
      const response = await axios.get(
        `${SION_BASE_URL}?Documento=${cedula}&token=${SION_TOKEN}`
      );

      console.log("🔍 Respuesta SION:", response.data);

      if (response.data && response.data.Estado) {
        return res.json({
          existeEnSion: true,
          existeEnBD: false,
          datos: response.data,
        });
      }
    } catch (error) {
      console.warn(
        "⚠️ No se pudo consultar la API de SION:",
        error.response?.data || error.message
      );
    }

    // Consultar en BD local con sintaxis PostgreSQL
    const result = await db.query(
      "SELECT * FROM referidos WHERE documento = $1",
      [cedula]
    );

    if (result.rows.length > 0) {
      return res.json({
        existeEnSion: false,
        existeEnBD: true,
        datos: result.rows[0],
      });
    } else {
      return res.json({ existeEnSion: false, existeEnBD: false });
    }
  } catch (error) {
    console.error("❌ Error general:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 📌 Nuevo endpoint: registrar referido en BD local + Clientify
router.post("/registrar", authMiddleware, async (req, res) => {
  const {
    nombres,
    apellidos,
    numero_telefonico,
    programa_interes,
    acepta_privacidad,
    correo_electronico,
    documento,
    correo_asesor, // 👈 correo del asesor que se usará como owner en Clientify
  } = req.body;

  const usuario_id = req.usuario?.id;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Token inválido o usuario no autenticado" });
  }

  if (
    !nombres ||
    !apellidos ||
    !numero_telefonico ||
    !programa_interes ||
    !correo_electronico ||
    !documento
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const query = `
        INSERT INTO referidos 
        (nombres, apellidos, numero_telefonico, programa_interes, acepta_privacidad, correo_electronico, documento, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `;

  try {
    const result = await db.query(query, [
      nombres,
      apellidos,
      numero_telefonico,
      programa_interes,
      acepta_privacidad,
      correo_electronico,
      documento,
      usuario_id,
    ]);

    const insertedId = result.rows[0].id;

    // Nombre del embajador
    const userResult = await db.query(
      "SELECT nombre FROM usuarios_registro WHERE id = $1",
      [usuario_id]
    );

    let nombreEmbajador = "Embajador desconocido";
    if (userResult.rows.length > 0) {
      nombreEmbajador = userResult.rows[0].nombre;
    }

    // 📌 🔄 Corrección de correo del asesor (antes de enviar a Clientify)
    let correoOwner = correo_asesor;
    if (correoOwner && correoOwner.toUpperCase() === "YEDAHOYOSC@UNAC.EDU.CO") {
      correoOwner = "asistente-unactec@unac.edu.co";
    }

    // 📌 Enviar a Clientify
    try {
      const clientifyResponse = await axios.post(
        CLIENTIFY_BASE_URL,
        {
          first_name: nombres,
          last_name: apellidos,
          email: correo_electronico,
          phone: numero_telefonico,
          status: "cold-lead",
          contact_source: "App Referidos Embajadores UNAC",
          owner: correoOwner || "",
          tags: ["app-referidos", "referido-embajador"],
          custom_fields: [
            {
              field: "Programa de interés",
              value: programa_interes,
            },
            {
              field: "Nombre del Embajador",
              value: nombreEmbajador,
            },
          ],
          description: `Referido por el embajador ${nombreEmbajador} desde la app de referidos UNAC.`,
          custom: {
            documento: documento,
          },
        },
        {
          headers: {
            Authorization: `Token ${CLIENTIFY_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Enviado a Clientify:", clientifyResponse.data);
    } catch (error) {
      console.error(
        "⚠️ Error enviando a Clientify:",
        error.response?.data || error.message
      );
    }

    return res.status(201).json({
      mensaje: "✅ Referido registrado en BD local y enviado a Clientify",
      id: insertedId,
    });
  } catch (err) {
    console.error("❌ Error SQL:", err.sqlMessage || err.message);
    return res.status(500).json({ error: "Error al registrar el referido" });
  }
});

// 📌 Endpoint: listar referidos (admin = todos, user = solo suyos)
router.get("/mis-referidos", authMiddleware, async (req, res) => {
  try {
    // ✅ Si es admin, mostrar TODOS
    if (req.usuario?.rol === "admin") {
      const query = `
        SELECT r.id, r.nombres, r.apellidos, r.documento, r.correo_electronico, 
                r.programa_interes, r.fecha_registro, u.nombre AS embajador
        FROM referidos r
        LEFT JOIN usuarios_registro u ON r.usuario_id = u.id
        ORDER BY r.fecha_registro DESC
      `;
      const result = await db.query(query);
      return res.json(result.rows);
    }

    // 👤 Si es usuario normal, solo los suyos
    const query = `
      SELECT id, nombres, apellidos, documento, correo_electronico, programa_interes, fecha_registro
      FROM referidos
      WHERE usuario_id = $1
      ORDER BY fecha_registro DESC
    `;
    const result = await db.query(query, [req.usuario.id]);
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error SQL:", err.sqlMessage || err.message);
    return res.status(500).json({ error: "Error al obtener los referidos" });
  }
});

module.exports = router;
