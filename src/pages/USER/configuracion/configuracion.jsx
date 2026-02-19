import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import MenuSuperior from '../../../components/MenuSuperior/MenuSuperior';
import { API_URL } from '../../../config/api';
import '../../../styles/global.css';
import SoporteModal from "../../../components/SoporteModal/SoporteModal";

function Configuracion({ modoOscuro, setModoOscuro }) {

  const [usuario, setUsuario] = useState(null);
  const [idioma, setIdioma] = useState('es');

  const [mostrarModalContrasena, setMostrarModalContrasena] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [mostrarModalCerrarSesion, setMostrarModalCerrarSesion] = useState(false);
  const [mostrarModalSoporte, setMostrarModalSoporte] = useState(false);

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [exitoCambio, setExitoCambio] = useState(false);

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    if (user) setUsuario(user);

    document.body.classList.add('scroll-habilitado');
    return () => document.body.classList.remove('scroll-habilitado');
  }, []);

  const confirmarCerrarSesionTodos = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  const cerrarCuenta = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/usuarios/desactivar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Tu cuenta ha sido desactivada correctamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/');
      } else {
        const data = await response.json();
        alert(`Hubo un problema: ${data.mensaje || 'Inténtalo más tarde'}`);
      }
    } catch (error) {
      console.error('Error al cerrar cuenta:', error);
      alert('Error inesperado al cerrar cuenta.');
    }
  };

  const handleCambiarContrasena = async () => {

    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena)
      return alert('Por favor completa todos los campos.');

    if (nuevaContrasena !== confirmarContrasena)
      return alert('Las contraseñas no coinciden.');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/usuarios/cambiar-contrasena`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contrasenaActual,
          nuevaContrasena
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeConfirmacion("Contraseña actualizada correctamente");
        setContrasenaActual('');
        setNuevaContrasena('');
        setConfirmarContrasena('');

        setTimeout(() => {
          setMensajeConfirmacion('');
          setMostrarModalContrasena(false);
        }, 2000);

      } else {
        alert(data.error || 'No se pudo cambiar la contraseña.');
      }

    } catch (error) {
      console.error(error);
      alert('Error inesperado al cambiar contraseña.');
    }
  };

  return (
    <div className="configuracion-page">

      <MenuSuperior />

      <main className="configuracion-container">

        <h2 className="config-title">Configuración</h2>
        <p className="config-subtitle">
          Administra tu cuenta y personaliza tu experiencia.
        </p>

        {/* SEGURIDAD */}
        <section className="config-box">
          <h3 className="config-section-title">🔐 Seguridad y cuenta</h3>

          <div className="config-item">
            <p className="config-label">Cambiar contraseña</p>
            <button
              className="btn btn-yellow"
              onClick={() => setMostrarModalContrasena(true)}
            >
              Cambiar la contraseña
            </button>
          </div>

          <div className="config-item">
            <p className="config-label">
              Cerrar sesión en todos los dispositivos
            </p>
            <button
              className="btn btn-yellow"
              onClick={() => setMostrarModalCerrarSesion(true)}
            >
              Cerrar sesión en todos los dispositivos
            </button>
          </div>
        </section>

        {/* PERSONALIZACION */}
        <section className="config-box">
          <h3 className="config-section-title">🎨 Personalización</h3>

          <div className="config-item">
            <p className="config-label">Tema</p>

            <div className="config-buttons-row">

              <button
                className={`btn btn-option ${modoOscuro ? 'activo' : ''}`}
                onClick={() => setModoOscuro(true)}
              >
                🌙 Oscuro
              </button>

              <button
                className={`btn btn-option ${!modoOscuro ? 'activo' : ''}`}
                onClick={() => setModoOscuro(false)}
              >
                ☀️ Claro
              </button>

            </div>
          </div>
        </section>

        {/* SOPORTE */}
        <section className="config-box">
          <h3 className="config-section-title">📞 Soporte</h3>

          <button
            className="btn btn-yellow"
            onClick={() => setMostrarModalSoporte(true)}
          >
            Contactar a soporte
          </button>

        </section>

        {/* ELIMINAR CUENTA */}
        <section className="config-box">
          <h3 className="config-section-title">⚠️ Eliminar cuenta</h3>

          <button
            className="btn btn-red"
            onClick={() => setMostrarModalEliminar(true)}
          >
            🗑 Eliminar cuenta
          </button>

        </section>

      </main>


      {/* MODALES */}

      {mostrarModalSoporte && (
        <SoporteModal onClose={() => setMostrarModalSoporte(false)} />
      )}

      {mostrarModalCerrarSesion && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <button
              className="cerrar-modal"
              onClick={() => setMostrarModalCerrarSesion(false)}
            >×</button>

            <h3>Cerrar sesión en todos los dispositivos</h3>

            <button
              className="btn btn-yellow"
              onClick={confirmarCerrarSesionTodos}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {mostrarModalEliminar && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <button
              className="cerrar-modal"
              onClick={() => setMostrarModalEliminar(false)}
            >×</button>

            <h3>Cerrar cuenta</h3>

            <button
              className="btn btn-red"
              onClick={cerrarCuenta}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {mostrarModalContrasena && (
        <div className="modal-overlay">
          <div className="modal-contenido">

            <button
              className="cerrar-modal"
              onClick={() => setMostrarModalContrasena(false)}
            >×</button>

            <h3>Cambiar contraseña</h3>

            <div className="campo-password">
              <input
                type={mostrarActual ? 'text' : 'password'}
                placeholder="CONTRASEÑA ACTUAL"
                value={contrasenaActual}
                onChange={(e) => setContrasenaActual(e.target.value)}
              />
              <button className="btn-ojo"
                onClick={() => setMostrarActual(!mostrarActual)}>
                {mostrarActual ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <div className="campo-password">
              <input
                type={mostrarNueva ? 'text' : 'password'}
                placeholder="CONTRASEÑA NUEVA"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
              />
              <button className="btn-ojo"
                onClick={() => setMostrarNueva(!mostrarNueva)}>
                {mostrarNueva ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <div className="campo-password">
              <input
                type={mostrarConfirmar ? 'text' : 'password'}
                placeholder="CONFIRMAR"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
              />
              <button className="btn-ojo"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}>
                {mostrarConfirmar ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <button className="btn btn-yellow"
              onClick={handleCambiarContrasena}>
              Guardar
            </button>

            {mensajeConfirmacion && (
              <div className="mensaje-exito">
                ✅ {mensajeConfirmacion}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default Configuracion;
