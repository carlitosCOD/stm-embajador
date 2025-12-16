// Script para probar conexión a la base de datos
const { Pool } = require("pg");
require("dotenv").config();

console.log("🔍 Verificando configuración de base de datos...");
console.log("Host:", process.env.DB_HOST || "localhost");
console.log("User:", process.env.DB_USER || "postgres");
console.log("Database:", process.env.DB_NAME || "unac_pro");
console.log("Port:", process.env.DB_PORT || 5432);
console.log("Password:", process.env.DB_PASSWORD ? "[OCULTO]" : "[NO DEFINIDO]");

const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "unac_pro",
  port: process.env.DB_PORT || 5432,
});

db.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error al conectar con PostgreSQL:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Conectado a PostgreSQL");
    
    // Consultar tabla de usuarios
    db.query('SELECT COUNT(*) FROM usuarios_registro', (err, res) => {
      if (err) {
        console.error("❌ Error al consultar tabla:", err.message);
        // Intentar crear tabla
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS usuarios_registro (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            correo_electronico VARCHAR(255) UNIQUE NOT NULL,
            numero_telefonico VARCHAR(20),
            contraseña VARCHAR(255) NOT NULL,
            acepta_privacidad BOOLEAN DEFAULT FALSE,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verificado BOOLEAN DEFAULT FALSE,
            activo BOOLEAN DEFAULT TRUE,
            informacion_adicional TEXT,
            foto_url VARCHAR(500),
            rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
            reset_token VARCHAR(255),
            token_expira TIMESTAMP
          );
        `;
        
        db.query(createTableQuery, (err) => {
          if (err) {
            console.error("❌ Error al crear tabla:", err.message);
          } else {
            console.log("✅ Tabla usuarios_registro creada");
          }
          release();
          process.exit(0);
        });
      } else {
        console.log("✅ Tabla usuarios_registro existe");
        console.log("Total registros:", res.rows[0].count);
        
        // Mostrar registros
        db.query('SELECT id, nombre, apellido, correo_electronico, rol, verificado FROM usuarios_registro ORDER BY id', (err, res) => {
          if (err) {
            console.error("❌ Error al consultar registros:", err.message);
          } else {
            console.log("📋 Registros en la tabla:");
            res.rows.forEach(row => {
              console.log(`  ${row.id}. ${row.nombre} ${row.apellido} (${row.correo_electronico}) - ${row.rol} ${row.verificado ? '(verificado)' : '(no verificado)'}`);
            });
          }
          release();
          process.exit(0);
        });
      }
    });
  }
});