import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import "./NuevaContrasena.css";

const NuevaContrasena = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [ver, setVer] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [validando, setValidando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // 1) Validar token al abrir la página
  useEffect(() => {
    const validar = async () => {
      setValidando(true);
      try {
        const resp = await fetch(
          `${API_URL}/usuarios/validar-token/${token}`
        );
        const data = await resp.json();
        if (!resp.ok) {
          setError(
            data?.error || "El enlace de restablecimiento es inválido o expiró."
          );
        }
      } catch (e) {
        setError("No se pudo validar el enlace. Inténtalo más tarde.");
      } finally {
        setValidando(false);
        setCargando(false);
      }
    };
    validar();
  }, [token]);

  // 2) Enviar nueva contraseña
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (nuevaContrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const resp = await fetch(
        `${API_URL}/usuarios/restablecer-contrasena/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nuevaContrasena }),
        }
      );
      const data = await resp.json();

      if (!resp.ok) {
        setError(data?.error || "No se pudo restablecer la contraseña.");
      } else {
        setMensaje(
          "¡Contraseña restablecida correctamente! Ahora puedes iniciar sesión."
        );
        // Redirigir a login después de 1.5s
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (e) {
      setError("Error de conexión con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  // 3) Estado: validando enlace
  if (cargando || validando) {
    return (
      <div className="nueva-contrasena-container">
        <div className="overlay">
          <div className="spinner" />
          <p>Validando enlace...</p>
        </div>
      </div>
    );
  }

  // 4) Estado: token inválido
  if (error && validando === false && !mensaje) {
    return (
      <div className="nueva-contrasena-container">
        <div className="card">
          <h2>Restablecer contraseña</h2>
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  // 5) Formulario normal
  return (
    <div className="nueva-contrasena-container">
      <form onSubmit={handleSubmit} className="card">
        <h2>Restablecer contraseña</h2>

        <label>Nueva contraseña</label>
        <input
          type={ver ? "text" : "password"}
          value={nuevaContrasena}
          onChange={(e) => setNuevaContrasena(e.target.value)}
          placeholder="Ingrese nueva contraseña"
          required
        />

        <label>Confirmar contraseña</label>
        <input
          type={ver ? "text" : "password"}
          value={confirmarContrasena}
          onChange={(e) => setConfirmarContrasena(e.target.value)}
          placeholder="Repita la contraseña"
          required
        />

        <label className="mostrar-contrasena-label">
          <span>Mostrar contraseña</span>
          <input
            type="checkbox"
            checked={ver}
            onChange={() => setVer(!ver)}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {mensaje && <p className="success">{mensaje}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Restablecer"}
        </button>
      </form>
    </div>
  );
};

export default NuevaContrasena;
