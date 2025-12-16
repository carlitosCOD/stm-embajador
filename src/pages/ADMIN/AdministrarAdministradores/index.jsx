import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../config/api';
import './AdministrarAdministradores.css';

const AdministrarAdministradores = () => {
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarAdministradores();
  }, []);

  const cargarAdministradores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/usuarios/administradores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar administradores');
      }

      const data = await response.json();
      setAdministradores(data.administradores || []);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('❌ Error al cargar la lista de administradores');
    } finally {
      setLoading(false);
    }
  };

  const eliminarAdministrador = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/usuarios/administradores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar administrador');
      }

      // Actualizar la lista
      setAdministradores(administradores.filter(admin => admin.id !== id));
      alert('✅ Administrador eliminado correctamente');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error al eliminar administrador');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Cargando administradores...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>👥 Administrar Administradores</h2>
        <button 
          className="btn-refresh" 
          onClick={cargarAdministradores}
          disabled={loading}
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="admins-list">
        {administradores.length === 0 ? (
          <div className="no-data">
            <p>No hay administradores registrados</p>
          </div>
        ) : (
          <table className="admins-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Fecha Registro</th>
                <th>Verificado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {administradores.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.nombre}</td>
                  <td>{admin.apellido}</td>
                  <td>{admin.correo_electronico}</td>
                  <td>{admin.numero_telefonico || 'No especificado'}</td>
                  <td>{new Date(admin.fecha_registro).toLocaleDateString()}</td>
                  <td>
                    {admin.verificado ? (
                      <span className="status verified">✓ Verificado</span>
                    ) : (
                      <span className="status pending">⏳ Pendiente</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn-danger"
                      onClick={() => eliminarAdministrador(admin.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdministrarAdministradores;