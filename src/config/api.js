// src/config/api.js
// En desarrollo: http://localhost:5000/api
// En producción: /api (mismo servidor)
const isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export const API_BASE = isDevelopment ? "http://localhost:5000" : "";
export const API_URL = isDevelopment ? "http://localhost:5000/api" : "/api";
