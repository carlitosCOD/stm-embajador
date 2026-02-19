import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoOscuro from '../../assets/logoUnac.svg';
import logoClaro from '../../assets/LogoNegro.svg';
import RecuperarContrasenaModal from '../../components/RecuperarContrasenaModal/RecuperarContrasenaModal';
import SolicitarVerificacionModal from '../../components/SolicitarVerificacionModal/SolicitarVerificacionModal';
import ErrorModal from '../../components/ErrorModal/ErrorModal';
import { Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../../config/api';
import { useUsuarioContext } from "../../contexts/UsuarioContext";

function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [modoClaro, setModoClaro] = useState(false);
  const [mostrarErrorModal, setMostrarErrorModal] = useState(false);
  const [mensajeErrorModal, setMensajeErrorModal] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ OBTENER setter del contexto
  const { setUsuario } = useUsuarioContext();

  // Observador de modo claro/oscuro
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModoClaro(document.body.classList.contains('modo-claro'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    setModoClaro(document.body.classList.contains('modo-claro'));

    return () => observer.disconnect();
  }, []);

  // Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo_electronico: correo,
          contrasena
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.usuario) {
        const mensaje =
          data.error ||
          data.message ||
          'Correo o contraseña incorrectos';

        setMensajeErrorModal(mensaje);
        setMostrarErrorModal(true);

        if (mensaje.toLowerCase().includes('verificar')) {
          setTimeout(() => {
            setMostrarErrorModal(false);
            setMostrarVerificacion(true);
          }, 2000);
        }

        return;
      }

      // Normalizar usuario
      const usuario = {
  ...data.usuario,
  foto_url: data.usuario.foto_url || null,
};


      // ✅ Guardar sesión
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // ✅ ACTUALIZAR CONTEXTO (FIX PRINCIPAL)
      setUsuario(usuario);

      // Redirección por rol
      navigate(
        usuario.rol === 'admin'
          ? '/admin/panel'
          : '/AñadirReferidos'
      );

    } catch (error) {
      console.error('Error de conexión:', error);
      setMensajeErrorModal('Error de conexión con el servidor');
      setMostrarErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-header">
          <img
            src={modoClaro ? logoClaro : logoOscuro}
            className="unac-logo"
            alt="UNAC Logo"
          />
          <h1>Bienvenido al sistema de Embajadores</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="CORREO"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={mostrarContrasena ? 'text' : 'password'}
              placeholder="CONTRASEÑA"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setMostrarContrasena(!mostrarContrasena)
              }
            >
              {mostrarContrasena
                ? <EyeOff size={20} />
                : <Eye size={20} />}
            </button>
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Recuérdame
            </label>

            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setMostrarRecuperar(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="login-button">
            Ingresar
          </button>
        </form>

        <p className="signup-text">
          ¿No tienes cuenta?{' '}
          <a
            href="./registro-embajador"
            className="signup-link-button"
          >
            Regístrate aquí
          </a>
        </p>
                {/*
        <p className="signup-text" style={{ marginTop: '10px' }}>
          ¿No verificaste tu cuenta?{' '}
          <button
            type="button"
            className="signup-link-button"
            onClick={() => setMostrarVerificacion(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Solicita un nuevo enlace
          </button>
        </p>
                  */}
      </div>

      {mostrarRecuperar && (
        <RecuperarContrasenaModal
          onClose={() => setMostrarRecuperar(false)}
          setLoading={setLoading}
        />
      )}

      {mostrarVerificacion && (
        <SolicitarVerificacionModal
          onClose={() => setMostrarVerificacion(false)}
        />
      )}

      {mostrarErrorModal && (
        <ErrorModal
          mensaje={mensajeErrorModal}
          onClose={() => setMostrarErrorModal(false)}
        />
      )}

      {loading && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default Login;
