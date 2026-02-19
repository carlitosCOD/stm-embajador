// src/pages/ADMIN/AdminEmbajadores.js

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config/api";
import "../../../styles/GlobalAdmin.css";

function AdminEmbajadores() {
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const EDITAR_USUARIO_ROUTE = "/admin/editar-usuario";

  /* ===============================
     CARGAR USUARIOS
  =============================== */
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("❌ No hay token");
          return;
        }

        const url = `${API_URL}/usuarios/todos`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const datos = res.data.map((u) => {
          let fecha = "—";

          if (u.fecha_registro) {
            const f = new Date(u.fecha_registro);
            fecha = f.toISOString().split("T")[0];
          }

          return {
            id: u.id,

            // 🔹 Limpieza desde aquí
            nombre: `${u.nombre || ""} ${u.apellido || ""}`
              .replace(/\s+/g, " ")
              .trim(),

            correo: (u.correo_electronico || "").trim(),
            rol: (u.rol || "").trim(),
            fecha,
          };
        });

        setUsuarios(datos);
      } catch (error) {
        console.error("❌ Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  /* ===============================
     NORMALIZAR TEXTO (ROBUSTO)
  =============================== */
  const normalizar = (texto = "") => {
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/\s+/g, " ") // espacios dobles
      .trim();
  };

  /* ===============================
     FILTRO GLOBAL (TODO JUNTO)
  =============================== */
  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);

    if (!termino) return usuarios;

    console.log("🔍 BUSCANDO:", termino);

    return usuarios.filter((u) => {
      // 🔥 Unimos TODO en un solo string
      const textoCompleto = normalizar(`
        ${u.nombre}
        ${u.correo}
        ${u.rol}
        ${u.fecha}
      `);

      console.log("📄 TEXTO:", textoCompleto);

      return textoCompleto.includes(termino);
    });
  }, [busqueda, usuarios]);

  /* ===============================
     EDITAR
  =============================== */
  const handleEditar = (id) => {
    navigate(`${EDITAR_USUARIO_ROUTE}/${id}`);
  };

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="embajadores-container">
      <h2 className="titulo-embajadores">Usuarios registrados</h2>

      {/* BUSCADOR */}
      <div className="header-busqueda">
        <div className="input-busqueda">
          <span className="icono-lupa">🔍</span>

          <input
            type="text"
            placeholder="Buscar por nombre, correo, rol, fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* TABLA */}
      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table className="tabla-embajadores">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Fecha</th>
              <th>Correo</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No hay resultados
                </td>
              </tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.fecha}</td>
                  <td>{u.correo}</td>
                  <td>{u.rol}</td>

                  <td>
                    <button
                      className="btn-editar"
                      onClick={() => handleEditar(u.id)}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminEmbajadores;
