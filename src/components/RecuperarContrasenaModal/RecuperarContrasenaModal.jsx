import React, { useState } from 'react';
import { API_URL } from '../../config/api';
import './RecuperarContrasenaModal.css';

export default function RecuperarContrasenaModal({ onClose, setLoading }) {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async () => {
    setLoading(true); // 🔹 activar overlay
    try {
      const response = await fetch(`${API_URL}/usuarios/solicitar-restablecimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo_electronico: correo }),
      });

      if (response.ok) {
        setEnviado(true);
      } else {
        const data = await response.json();
        const mensaje = data.error || data.message || 'Error desconocido';
        console.error('Error del servidor:', mensaje);
        alert(`❌ ${mensaje}`);
      }
    } catch (err) {
      console.error('Error enviando correo:', err);
    } finally {
      setLoading(false); // 🔹 desactivar overlay cuando termina
    }
  };

  return (
    <div className="recuperar-modal-overlay">
      <div className="recuperar-modal-content">
        {!enviado ? (
          <>
            <h2>Restablecer contraseña</h2>
            <p>Ingresa tu correo y te enviaremos instrucciones para restablecerla</p>
            <input
              type="email"
              placeholder="CORREO ELECTRÓNICO"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
            <div className="recuperar-modal-buttons">
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
              <strong>Instrucciones enviadas:</strong> Si el correo está asociado a una cuenta de embajador,
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <button className="btn btn-yellow" onClick={onClose}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
