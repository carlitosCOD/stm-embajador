import React, { useState } from 'react';
import { API_URL } from '../../config/api';
import './SolicitarVerificacionModal.css';

export default function SolicitarVerificacionModal({ onClose, setLoading }) {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleEnviar = async () => {
    if (!correo) {
      setError('Por favor ingresa tu correo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/usuarios/reenviar-verificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo_electronico: correo }),
      });

      const data = await response.json();

      if (response.ok) {
        setEnviado(true);
      } else {
        setError(data.error || 'No se pudo enviar el correo');
      }
    } catch (err) {
      console.error('Error enviando correo:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verificacion-modal-overlay">
      <div className="verificacion-modal-content">
        {!enviado ? (
          <>
            <h2>Reenviar verificación</h2>
            <p>Ingresa tu correo y te enviaremos un nuevo enlace de verificación</p>
            <input
              type="email"
              placeholder="CORREO ELECTRÓNICO"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
            {error && <p className="error-text">{error}</p>}
            <div className="verificacion-modal-buttons">
              <button className="btn btn-yellow" onClick={handleEnviar}>
                Enviar correo
              </button>
              <button className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="check">✅</div>
            <p>
              <strong>¡Correo enviado!</strong> Revisa tu bandeja de entrada y verifica tu cuenta.
            </p>
            <button className="btn btn-yellow" onClick={onClose}>
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
