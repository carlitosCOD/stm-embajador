import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../../config/api";
import "../../../styles/GlobalAdmin.css";

function ReferidosSistema() {
  const [cedula, setCedula] = useState("");
  const [referidos, setReferidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busquedaLocal, setBusquedaLocal] = useState(""); // 🔹 para buscador de tabla

  // 🔹 Cargar los referidos del usuario logueado o todos si es admin
  useEffect(() => {
    const fetchReferidos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("⚠️ No se encontró token en localStorage");
          return;
        }

        const res = await axios.get(
          `${API_URL}/referidos/mis-referidos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Formatear fechas
        const datos = res.data.map((r) => {
          let fechaSolo = "—";
          if (r.fecha_registro) {
            fechaSolo = new Date(r.fecha_registro).toISOString().split("T")[0];
          }

          return {
            id: r.id,
            nombre: `${r.nombres} ${r.apellidos}`,
            fecha: fechaSolo,
            correo: r.correo_electronico,
            embajador: r.embajador || null,
          };
        });

        setReferidos(datos);
      } catch (error) {
        console.error("❌ Error al cargar referidos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferidos();
  }, []);

  // 🔎 Buscar por cédula (SION + BD local)
  const handleBuscar = async () => {
    if (cedula.trim() === "") {
      alert("Por favor ingrese una cédula.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/referidos/verificar-cedula`,
        { cedula }
      );

      console.log("🔎 Resultado búsqueda:", res.data);

      if (res.data.existeEnSion) {
        alert("✅ La cédula existe en SION");
      } else if (res.data.existeEnBD) {
        alert("⚠️ La cédula ya está en la base local");
      } else {
        alert("❌ La cédula no existe en SION ni en BD local");
      }
    } catch (error) {
      console.error("❌ Error en búsqueda:", error);
      alert("Error al buscar la cédula");
    }
  };

  // 🔹 Filtrar tabla por nombre o correo
  const referidosFiltrados = referidos.filter(
    (r) =>
      r.nombre.toLowerCase().includes(busquedaLocal.toLowerCase()) ||
      r.correo.toLowerCase().includes(busquedaLocal.toLowerCase())
  );

  return (
    <div className="referidos-container">
      {/* 🔹 Buscador SION sticky */}
      <div className="busqueda-container sticky-buscador-sion">
        <input
          type="text"
          placeholder="INGRESE LA CÉDULA *"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
        <button onClick={handleBuscar}>🔍 Buscar en SION</button>
      </div>

      {/* 🔹 Título y buscador local sticky */}
      <div className="titulo-buscador sticky-titulo">
        <h2>Referidos en sistema</h2>
        <input
          type="text"
          placeholder="Buscar en tabla..."
          value={busquedaLocal}
          onChange={(e) => setBusquedaLocal(e.target.value)}
          className="buscador-tabla"
        />
      </div>

      {/* 🔹 Tabla scrollable */}
      <div className="tabla-scroll">
        {loading ? (
          <p>Cargando referidos...</p>
        ) : (
          <table className="tabla-referidos">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Fecha de registro</th>
                <th>Correo electrónico</th>
              </tr>
            </thead>
            <tbody>
              {referidosFiltrados.map((r) => (
                <tr key={r.id}>
                  <td>{r.nombre}</td>
                  <td>{r.fecha}</td>
                  <td>{r.correo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ReferidosSistema;
