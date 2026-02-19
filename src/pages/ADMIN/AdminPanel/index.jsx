import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/GlobalAdmin.css";

function PanelAdmin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo_electronico: "",
    contrasena: "",
    rol: "admin",
  });

  /* ===============================
     Validación de administrador
  =============================== */
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || usuario.rol !== "admin") {
      navigate("/");
    } else {
      setAdmin(usuario);
    }
  }, [navigate]);

  /* ===============================
     Manejo de inputs
  =============================== */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* ===============================
     Crear usuario admin / tesorero
  =============================== */
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const token = localStorage.getItem("token");
      const rol_id = formData.rol === "admin" ? 2 : 3;

      const response = await fetch("/api/usuarios/crear-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo_electronico: formData.correo_electronico,
          contrasena: formData.contrasena,
          rol_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(`❌ ${data.msg || "Error al crear usuario"}`);
        return;
      }

      setMensaje("✅ Usuario administrativo creado correctamente");
      setFormData({
        nombre: "",
        apellido: "",
        correo_electronico: "",
        contrasena: "",
        rol: "admin",
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  if (!admin) {
    return <p className="text-center mt-10">Cargando panel...</p>;
  }

  return (
    <div className="admin-panel">
      <h1>Panel de Administración</h1>

      {/* Crear usuario */}
      <button
        className="btn-admin"
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
      >
        {mostrarFormulario
          ? "Cancelar creación"
          : "Crear usuario administrativo"}
      </button>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="formulario-crear-admin">
          <h2>Nuevo usuario administrativo</h2>

          <form onSubmit={handleCrearUsuario}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="correo_electronico"
              placeholder="Correo electrónico"
              value={formData.correo_electronico}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="contrasena"
              placeholder="Contraseña"
              value={formData.contrasena}
              onChange={handleChange}
              required
            />

            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
            >
              <option value="admin">Administrador</option>
              <option value="tesorero">Tesorero</option>
            </select>

            <button type="submit" className="btn-admin">
              Crear usuario
            </button>
          </form>

          {mensaje && <p className="mensaje-formulario">{mensaje}</p>}
        </div>
      )}

      {/* Navegación admin */}
      <button
        className="btn-admin"
        onClick={() => navigate("/admin/embajadores")}
      >
        Administrar Embajadores →
      </button>

      <button
        className="btn-admin"
        onClick={() => navigate("/admin/referidos")}
      >
        Administrar Referidos →
      </button>

      {/* 📘 MANUAL PDF (ruta relativa, producción-safe) */}
      <button
  className="btn-manual"
  onClick={() =>
    window.open("/manuales/manual-admin-embajadores.pdf", "_blank")
  }
>
  Ver Manual de uso del Administrador
</button>

    </div>
  );
}

export default PanelAdmin;
