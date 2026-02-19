import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../../config/api";
import "./VerificarCorreo.css";

const VerificarCorreo = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("Verificando tu cuenta...");
  const [estado, setEstado] = useState("cargando"); // cargando | exito | error
  const [correo, setCorreo] = useState("");

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/usuarios/verificar/${token}`);
        const data = await respuesta.json();

        if (respuesta.ok) {
          setMensaje(data.mensaje);
          setEstado("exito");
        } else {
          setMensaje(data.mensaje || "❌ Token inválido o ya verificado.");
          setEstado("error");
          setCorreo(data.correo || ""); // si no viene correo, queda vacío
        }
      } catch (error) {
        setMensaje("❌ Error al conectar con el servidor.");
        setEstado("error");
      }
    };

    verificarToken();
  }, [token]);

  const reenviarCorreo = async () => {
    if (!correo) return alert("Ingresa tu correo para reenviar el enlace");

    try {
      const respuesta = await fetch(
        `${API_URL}/usuarios/reenviar-verificacion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo_electronico: correo }),
        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {
        setMensaje("📩 ¡Correo reenviado exitosamente! Revisa tu bandeja de entrada.");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setMensaje(data.error || "No se pudo reenviar el enlace.");
      }
    } catch (error) {
      setMensaje("Error al intentar reenviar el correo.");
    }
  };

  return (
    <div className="verificar-container">
      <div className="verificar-card">
        {estado === "cargando" && <p className="texto-cargando">{mensaje}</p>}

        {estado === "exito" && (
          <>
            <h2 className="texto-exito">{mensaje}</h2>
            <button onClick={() => navigate("/")} className="btn-amarillo">
              Ir al inicio de sesión
            </button>
          </>
        )}

        {estado === "error" && (
          <>
            <h2 className="texto-error">{mensaje}</h2>
            <p>
              Si el enlace expiró o es inválido, ingresa tu correo para recibir
              uno nuevo:
            </p>
            <input
              type="email"
              placeholder="Tu correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="input-correo"
            />
            <div className="acciones-error">
              <button onClick={reenviarCorreo} className="btn-amarillo">
                Solicitar verificación
              </button>
              <button
                onClick={() => navigate("/registro-embajador")}
                className="btn-secundario"
              >
                Ir al registro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificarCorreo;
