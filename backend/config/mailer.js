// config/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// Verificar credenciales
console.log("📧 Configurando mailer con:", {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? "[OCULTO]" : "[FALTA]",
});

// Validar credenciales requeridas
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ CREDENCIALES DE EMAIL FALTANTES");
  console.error("📧 Debes configurar EMAIL_USER y EMAIL_PASS en .env");
}

// Probar conexión al iniciar
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error al verificar conexión SMTP:", error.message);
  } else {
    console.log("✅ Conexión SMTP verificada correctamente");
  }
});

module.exports = transporter;
