require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// 🔐 VARIABLES DE ENTORNO
// =======================

const CLIENTIFY_API_TOKEN = process.env.CLIENTIFY_API_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

// =======================
// ✅ MIDDLEWARES GLOBALES
// =======================

app.use(
  cors({
    origin: FRONTEND_URL === "*" ? "*" : FRONTEND_URL.split(","),
    credentials: true,
  }),
);

app.use(express.json());

// =======================
// 📂 ARCHIVOS ESTÁTICOS
// =======================

// Imágenes de perfil
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Manuales PDF
app.use("/manuales", express.static(path.join(__dirname, "manuales")));

// =======================
// 🚏 RUTAS PRINCIPALES
// =======================

const usuarioRoutes = require("./routes/usuarioRoutes");
const rolRoutes = require("./routes/rolRoutes");
const referidoRoutes = require("./routes/referidoRoutes");

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/referidos", referidoRoutes);

// =======================
// 📧 CLIENTIFY – OBTENER CORREOS
// =======================

app.get("/api/correos", async (req, res) => {
  try {
    if (!CLIENTIFY_API_TOKEN) {
      return res
        .status(500)
        .json({ error: "Token de Clientify no configurado" });
    }

    let url = "https://api.clientify.com/v1/contacts/";
    const contactos = [];

    while (url) {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${CLIENTIFY_API_TOKEN}`,
          Accept: "application/json",
        },
      });

      contactos.push(...(response.data.results || []));
      url = response.data.next;
    }

    const correos = contactos.filter((c) => c.email).map((c) => c.email);

    res.json({
      cantidad: correos.length,
      correos,
    });
  } catch (error) {
    console.error("❌ Clientify error:", error.message);
    res.status(500).json({ error: "Error al obtener correos" });
  }
});

// =======================
// 📧 CLIENTIFY – VERIFICAR CORREO
// =======================

app.get("/api/verificar-correo", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email requerido" });
  }

  try {
    let url = "https://api.clientify.com/v1/contacts/";
    const contactos = [];

    while (url) {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${CLIENTIFY_API_TOKEN}`,
          Accept: "application/json",
        },
      });

      contactos.push(...(response.data.results || []));
      url = response.data.next;
    }

    const existe = contactos.some(
      (c) => c.email?.toLowerCase() === email.toLowerCase(),
    );

    res.json({ existe });
  } catch (error) {
    console.error("❌ Error verificando correo:", error.message);
    res.status(500).json({ error: "Error al verificar correo" });
  }
});

// =======================
// 🧯 RUTA NO ENCONTRADA
// =======================

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// =======================
// 🚀 INICIAR SERVIDOR
// =======================

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
