// backend/index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

console.log("🔐 CLIENTIFY_API_TOKEN cargado:", process.env.CLIENTIFY_API_TOKEN);

const app = express();
const PORT = process.env.PORT || 5000;
const API_TOKEN = process.env.CLIENTIFY_API_TOKEN;

// =======================
// ✅ MIDDLEWARES
// =======================

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000"],
    credentials: true,
  })
);

app.use(express.json());

// 👉 SERVIR IMÁGENES SUBIDAS (AVATARES, ETC)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// ✅ RUTAS
// =======================

const usuarioRoutes = require("./routes/usuarioRoutes");
const referidoRoutes = require("./routes/referidoRoutes");

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/referidos", referidoRoutes);

// (opcional, lo dejé porque ya lo estabas usando)
app.use("/api", referidoRoutes);

// =======================
// ✅ CLIENTIFY – OBTENER CORREOS
// =======================

app.get("/api/correos", async (req, res) => {
  try {
    const contactos = [];
    let url = "https://api.clientify.com/v1/contacts/";

    while (url) {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${API_TOKEN}`,
          Accept: "application/json",
        },
      });

      const data = response.data;

      if (!Array.isArray(data.results)) {
        throw new Error("Respuesta inesperada de Clientify");
      }

      contactos.push(...data.results);
      url = data.next;
    }

    const correos = contactos
      .filter((contacto) => contacto.email)
      .map((contacto) => contacto.email);

    res.json({ cantidad: correos.length, correos });
  } catch (error) {
    console.error("❌ Error al consultar Clientify:", error.message);
    res.status(500).json({ error: "Error al obtener correos de Clientify" });
  }
});

// =======================
// ✅ CLIENTIFY – VERIFICAR CORREO
// =======================

app.get("/api/verificar-correo", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: "Falta el parámetro email" });
  }

  try {
    const contactos = [];
    let url = "https://api.clientify.com/v1/contacts/";

    while (url) {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${API_TOKEN}`,
          Accept: "application/json",
        },
      });

      const data = response.data;

      if (!Array.isArray(data.results)) {
        throw new Error("Respuesta inesperada de Clientify");
      }

      contactos.push(...data.results);
      url = data.next;
    }

    const existe = contactos.some(
      (c) => c.email?.toLowerCase() === email.toLowerCase()
    );

    res.json({ existe });
  } catch (error) {
    console.error("❌ Error al verificar correo:", error.message);
    res.status(500).json({ error: "Error al verificar el correo" });
  }
});

// =======================
// ✅ FRONTEND BUILD
// =======================

app.use(express.static(path.join(__dirname, "../build")));

// =======================
// ✅ INICIAR SERVIDOR
// =======================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
