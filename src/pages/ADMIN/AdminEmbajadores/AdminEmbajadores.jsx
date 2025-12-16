// src/pages/ADMIN/AdminEmbajadores.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config/api";
import "../../../styles/GlobalAdmin.css";

function AdminEmbajadores() {
  const [busqueda, setBusqueda] = useState("");
  const [embajadores, setEmbajadores] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const EDITAR_USUARIO_ROUTE = "/admin/editar-usuario";

  useEffect(() => {
    const fetchEmbajadores = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/usuarios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const datos = res.data.map((u) => {
          let fechaSolo = "—";
          if (u.fecha_registro) {
            const fechaObj = new Date(u.fecha_registro);
            fechaSolo = fechaObj.toISOString().split("T")[0];
          }

          return {
            id: u.id,
            nombre: `${u.nombre} ${u.apellido}`,
            fecha: fechaSolo,
            correo: u.correo_electronico,
            rol: u.rol,
          };
        });

        setEmbajadores(datos);
      } catch (error) {
        console.error("❌ Error al cargar embajadores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmbajadores();
  }, []);

  // 🔹 Normalizamos para que ignore mayúsculas, minúsculas y acentos
  const normalizar = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filtrados = embajadores.filter(
    (e) =>
      normalizar(e.nombre).includes(normalizar(busqueda)) ||
      normalizar(e.correo).includes(normalizar(busqueda))
  );

  const handleEditar = (id) => {
    navigate(`${EDITAR_USUARIO_ROUTE}/${id}`);
  };

  return (
    <div className="embajadores-container">
      {/* 🔹 El h2 queda estático arriba */}
      <h2 className="titulo-embajadores">Embajadores registrados</h2>

      {/* 🔹 Solo el buscador es sticky */}
      <div className="header-busqueda">
        <div className="input-busqueda">
          <span className="icono-lupa">🔍</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando embajadores...</p>
      ) : (
        <table className="tabla-embajadores">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Fecha de registro</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((embajador) => (
              <tr key={embajador.id}>
                <td>{embajador.nombre}</td>
                <td>{embajador.fecha}</td>
                <td>{embajador.correo}</td>
                <td>{embajador.rol}</td>
                <td>
                  <button
                    className="btn-editar"
                    onClick={() => handleEditar(embajador.id)}
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminEmbajadores;
