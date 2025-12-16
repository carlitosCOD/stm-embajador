import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config/api";
import MenuSuperior from "../../../components/MenuSuperior/MenuSuperior";

function AnadirReferidos() {
  const [cedulaReferido, setCedulaReferido] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false); // 🔹 Estado para el overlay
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true); //  Mostrar overlay cargandos

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/referidos/verificar-cedula`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cedula: cedulaReferido }),
        }
      );

      const data = await response.json();

      if (response.ok && data) {
        const { existeEnSion, existeEnBD } = data;

        if (existeEnSion) {
          setMensaje("❌ Este documento ya existe en nuestro sistema de registro.");
        } else if (existeEnBD) {
          setMensaje(
            "❌ Este documento ya existe en nuestro sistema de registro local."
          );
        } else {
          navigate("/registro-referidos", {
            state: { cedula: cedulaReferido },
          });
        }
      } else {
        setMensaje(data?.message || "⚠️ Error al verificar el documento.");
      }
    } catch (error) {
      console.error("❌ Error en la petición:", error);
      setMensaje("⚠️ Error de conexión con el servidor.");
    } finally {
      setLoading(false); // 🔹 Ocultar overlay
    }
  };

  // 🔹 Solo permitir números
  const handleCedulaChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // elimina todo lo que no sea número
    setCedulaReferido(value);
  };

  return (
    <div className="page-anadir-referidos">
      <MenuSuperior />

      <div className="contenedor-referidos">
        <form className="formulario-referido" onSubmit={handleSubmit}>
          <h1>Añadir Referido</h1>
          <input
            type="text"
            placeholder="Cédula del referido"
            value={cedulaReferido}
            onChange={handleCedulaChange}
            required
            maxLength={15} // 🔹 límite opcional de caracteres
          />
          {mensaje && <p className="mensaje-error">{mensaje}</p>}
          <button type="submit">Verificar</button>
        </form>
      </div>

      {/* 🔹 Overlay de carga */}
      {loading && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default AnadirReferidos;
