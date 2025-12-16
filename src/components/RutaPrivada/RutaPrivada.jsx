import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  // 🚨 Si no hay token o usuario → al login
  if (!token || !usuario) {
    return <Navigate to="/" replace />;
  }

  // 🚨 Si intenta acceder a /admin y no es admin → al login
  if (location.pathname.startsWith("/admin") && usuario.rol !== "admin") {
    return <Navigate to="/" replace />;
  }

  // 🚨 Si es admin y quiere entrar a rutas de usuario → lo mandamos al panel admin (solo si no está en /admin)
  if (!location.pathname.startsWith("/admin") && usuario.rol === "admin") {
    return <Navigate to="/admin/panel" replace />;
  }

  // ✅ Si pasa todas las validaciones, muestra el contenido
  return children;
};

export default RutaPrivada;
