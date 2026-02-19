import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  // ❌ No autenticado
  if (!token || !usuario) {
    return <Navigate to="/" replace />;
  }

  // ❌ No es admin e intenta entrar a /admin
  if (location.pathname.startsWith("/admin") && usuario.rol !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ Todo OK
  return children;
};

export default RutaPrivada;
