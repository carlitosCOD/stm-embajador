import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PanelAdmin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo_electronico: "",
    contraseña: ""
  });
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    // ✅ Validar si el usuario es admin
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || usuario.rol !== "admin") {
      navigate("/"); // Si no es admin, redirige al login
    } else {
      setAdmin(usuario);
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCrearAdmin = async (e) => {
    e.preventDefault();
    setMensaje("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/usuarios/crear-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMensaje("✅ Administrador creado exitosamente");
        setFormData({
          nombre: "",
          apellido: "",
          correo_electronico: "",
          contraseña: ""
        });
        setMostrarFormulario(false);
      } else {
        setMensaje(`❌ Error: ${data.error || "No se pudo crear el administrador"}`);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con el servidor");
      console.error("Error:", error);
    }
  };

  if (!admin) {
    return <p className="text-center text-lg mt-10">Cargando panel...</p>;
  }

  return (
    <div className="admin-panel">
      <h1>Administración del SR</h1>

      {/* Botón para crear administradores */}
      <button
        className="btn-admin"
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
      >
        {mostrarFormulario ? "Cancelar" : "Crear Nuevo Administrador"} →
      </button>

      {/* Formulario para crear administrador */}
      {mostrarFormulario && (
        <div className="formulario-crear-admin">
          <h2>Crear Nuevo Administrador</h2>
          <form onSubmit={handleCrearAdmin}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="correo_electronico"
              placeholder="Correo Electrónico"
              value={formData.correo_electronico}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="contraseña"
              placeholder="Contraseña"
              value={formData.contraseña}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className="btn-admin">
              Crear Administrador
            </button>
          </form>
          {mensaje && <p className="mensaje-formulario">{mensaje}</p>}
        </div>
      )}

      {/* Botón para embajadores */}
      <button
        className="btn-admin"
        onClick={() => navigate("/admin/embajadores")}
      >
        Administrar Embajadores →
      </button>

      {/* Botón para referidos */}
      <button
        className="btn-admin"
        onClick={() => navigate("/admin/referidos")}
      >
        Administrar Referidos →
      </button>

      {/* Botón para abrir manual */}
      <button
        className="btn-manual"
        onClick={() => window.open("/manual-admin.pdf", "_blank")}
      >
        Ver Manual de uso del Administrador
      </button>
    </div>
  );
}

export default PanelAdmin;