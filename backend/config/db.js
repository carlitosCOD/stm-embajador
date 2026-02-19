const { Pool } = require("pg");
require("dotenv").config();

const isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";

const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME || "unac_pro",
  port: Number(process.env.DB_PORT) || 5432,
  // Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  }),
});

// Connection logging
db.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error al conectar con PostgreSQL:", err.stack);
  } else {
    if (isDevelopment) {
      console.log("✅ Conectado a PostgreSQL");
    }
    release();
  }
});

module.exports = db;
