    // src/pages/ADMIN/AdminEditarUsuario/AdminEditarUsuario.jsx
    import React, { useState, useEffect } from "react";
    import { useParams } from "react-router-dom";
    import axios from "axios";
    import { API_URL, API_BASE } from "../../../config/api";
    import "../../../styles/GlobalAdmin.css";
    import verificadoIcon from "../../../assets/verificar.png";


    function AdminEditarUsuario() {
    const { id } = useParams();

    const [usuario, setUsuario] = useState({
        nombre: "",
        apellido: "",
        correo_electronico: "",
        numero_telefonico: "",
        informacion_adicional: "",
        foto_url: "",
    });
    const [loading, setLoading] = useState(true);
    const [verificado, setVerificado] = useState(false); // toggle verificar
    const [showModal, setShowModal] = useState(false); // ✅ estado para el modal

    useEffect(() => {
  const fetchUsuario = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = {
        ...res.data,
        foto_url: res.data.foto_url ? `${API_BASE}/${res.data.foto_url}` : null,
      };

      setUsuario(userData);
      setVerificado(Boolean(Number(res.data.verificado))); // 👈 fuerza boolean
    } catch (error) {
      console.error("❌ Error al cargar usuario:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  fetchUsuario();
}, [id]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setUsuario((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
  e.preventDefault(); // ✅ no recargar ni salir
  try {
    const token = localStorage.getItem("token");
    // 🔹 Cambiado a la ruta correcta para admin
    await axios.put(
      `${API_URL}/usuarios/admin/${id}`,
      { ...usuario, verificado },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // ✅ mostrar modal de confirmación
    setShowModal(true);

    // cerrar el modal automáticamente después de 2.5s
    setTimeout(() => setShowModal(false), 2500);
  } catch (error) {
    console.error(
      "❌ Error al guardar cambios:",
      error.response?.data || error
    );
    alert("Error al guardar cambios");
  }
};


    if (loading) return <p>Cargando datos...</p>;

    return (
        <div className="admin-editar-container">
        <div className="perfil-header">
            <div className="perfil-info">
            <img
                src={usuario.foto_url || "https://via.placeholder.com/80"}
                alt="Foto de perfil"
                className="perfil-avatar"
            />
            <div>
                <h3>
                {usuario.nombre} {usuario.apellido}{" "}
                {verificado && (
    <img
    src={verificadoIcon}
    alt="Verificado"
    className="icono-verificado"
    />
)}

                </h3>
                <p>Embajador UNAC</p>
            </div>
            </div>
            <button type="submit" form="editar-form" className="btn-guardar">
            Guardar cambios
            </button>
        </div>

        <form id="editar-form" className="form-editar" onSubmit={handleSubmit}>
            <div className="form-row">
            <div>
                <label>Nombre</label>
                <input
                type="text"
                name="nombre"
                value={usuario.nombre || ""}
                onChange={handleChange}
                />
            </div>
            <div>
                <label>Apellido</label>
                <input
                type="text"
                name="apellido"
                value={usuario.apellido || ""}
                onChange={handleChange}
                />
            </div>
            </div>

            <div className="form-row">
            <div>
                <label>Correo electrónico</label>
                <input
                type="email"
                name="correo_electronico"
                value={usuario.correo_electronico || ""}
                disabled
                />
            </div>
            <div>
                <label>Teléfono</label>
                <input
                type="text"
                name="numero_telefonico"
                value={usuario.numero_telefonico || ""}
                onChange={handleChange}
                />
            </div>
            </div>

            <div className="form-row">
            <div className="full-width">
                <label>Información adicional</label>
                <input
                type="text"
                name="informacion_adicional"
                value={usuario.informacion_adicional || ""}
                onChange={handleChange}
                />
            </div>
            </div>

            {/* 🔹 Switch de verificación */}
            <div className="acciones-extra">
            <label className="switch">
                <input
                type="checkbox"
                checked={verificado}
                onChange={() => setVerificado(!verificado)}
                />
                <span className="slider"></span>
            </label>
            <span className="label-verificar">
                {verificado ? "Verificado" : "No verificado"}
            </span>
            </div>
        </form>

        {/* ✅ Modal de confirmación */}
        {showModal && (
            <div className="modal-overlay">
            <div className="modal-content">
                <h2>✅ Cambios guardados correctamente</h2>
            </div>
            </div>
        )}
        </div>
    );
    }

    export default AdminEditarUsuario;
