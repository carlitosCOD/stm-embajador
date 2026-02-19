import React, { useEffect, useState } from 'react';
import MenuSuperior from '../../../components/MenuSuperior/MenuSuperior';
import { API_URL } from '../../../config/api';

function MisReferidos() {
  const [referidos, setReferidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    // Activar scroll para esta vista
    document.body.classList.add('scroll-habilitado');

    // Remover scroll al salir de la página
    return () => {
      document.body.classList.remove('scroll-habilitado');
    };
  }, []);

  useEffect(() => {
    const fetchReferidos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No se encontró token en localStorage');
          return;
        }

        const response = await fetch(`${API_URL}/referidos/mis-referidos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('No se pudieron cargar los referidos');
        }

        const data = await response.json();
        setReferidos(data);
      } catch (error) {
        console.error('Error al cargar los referidos:', error.message);
      }
    };

    fetchReferidos();
  }, []);

  const referidosFiltrados = referidos.filter((ref) =>
    (`${ref.nombres} ${ref.apellidos} ${ref.correo_electronico} ${ref.programa_interes} ${ref.documento}`)
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <>
      <MenuSuperior />

      <div className="mis-referidos-page">
        <main className="contenido">
          <h1>Mis referidos</h1>

          <div className="buscador-container buscador-flotante">
            <input
              type="text"
              placeholder="🔍 Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="tabla-referidos">
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Documento</th>
                  <th>Programa</th>
                  <th>Fecha de registro</th>
                </tr>
              </thead>
              <tbody>
                {referidosFiltrados.length > 0 ? (
                  referidosFiltrados.map((ref, index) => (
                    <tr key={index}>
                      <td>
                        <div>{ref.nombres} {ref.apellidos}</div>
                        <div className="email">{ref.correo_electronico}</div>
                      </td>
                      <td>{ref.documento}</td>
                      <td>{ref.programa_interes}</td>
                      <td>{ref.fecha_registro ? formatearFecha(ref.fecha_registro) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="vacio">No se encontraron referidos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}

function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia} / ${mes} / ${anio}`;
}

export default MisReferidos;
