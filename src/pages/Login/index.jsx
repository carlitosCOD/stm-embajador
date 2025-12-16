  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import logoOscuro from '../../assets/logoUnac.svg';
  import logoClaro from '../../assets/LogoNegro.svg';
  import RecuperarContrasenaModal from '../../components/RecuperarContrasenaModal/RecuperarContrasenaModal';
  import SolicitarVerificacionModal from '../../components/SolicitarVerificacionModal/SolicitarVerificacionModal';
  import ErrorModal from '../../components/ErrorModal/ErrorModal';
  import { Eye, EyeOff } from 'lucide-react';
  import { API_URL } from '../../config/api';

  function Login() {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
    const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
    const [modoClaro, setModoClaro] = useState(false);
    const [mostrarErrorModal, setMostrarErrorModal] = useState(false);
    const [mensajeErrorModal, setMensajeErrorModal] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
      const observer = new MutationObserver(() => {
        const esClaro = document.body.classList.contains('modo-claro');
        setModoClaro(esClaro);
      });

      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      setModoClaro(document.body.classList.contains('modo-claro'));

      return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/usuarios/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correo_electronico: correo,
            contraseña: contrasena,
          }),
        });

        const data = await response.json();
        console.log('Usuario:', data.usuario);

        if (response.ok && data.usuario) {
          // Guardar token y datos de usuario
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', JSON.stringify(data.usuario));

          if (data.usuario.foto_url) {
            localStorage.setItem('fotoPerfil', data.usuario.foto_url);
          }

          // ✅ Redirección según rol
          if (data.usuario.rol === 'admin') {
            navigate('/admin/panel'); // 👈 Página exclusiva admin
          } else {
            navigate('/AñadirReferidos'); // 👈 Página normal usuario
          }

          window.location.reload();
        } else {
          const mensaje = data.error || data.message || 'Correo o contraseña incorrectos';
          setMensajeErrorModal(mensaje);
          setMostrarErrorModal(true);
          
          // Si el error es de verificación, mostrar el modal automáticamente
          if (mensaje.includes('verificar tu cuenta')) {
            setTimeout(() => {
              setMostrarErrorModal(false);
              setMostrarVerificacion(true);
            }, 2000);
          }
        }
      } catch (err) {
        console.error(err);
        setMensajeErrorModal('Error de conexión con el servidor');
        setMostrarErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="login-page">
        <div className="login-container">
          {/* Logo y título */}
          <div className="login-header">
            <img
              src={modoClaro ? logoClaro : logoOscuro}
              className="unac-logo"
              alt="UNAC Logo"
            />
            <h1>Bienvenido al sistema de Embajadores</h1>
          </div>

          {/* Formulario de login */}
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
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                aria-label="Mostrar u ocultar contraseña"
              >
                {mostrarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
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

            <button type="submit" className="login-button">Ingresar</button>

            {error && <p className="error-message">{error}</p>}
          </form>

          {/* Registro */}
          <p className="signup-text">
            ¿No tienes cuenta?{' '}
            <a href="./registro-embajador" className="signup-link-button">Regístrate aquí</a>
          </p>

          {/* Link de verificación */}
          <p className="signup-text" style={{ marginTop: '10px' }}>
            ¿No verificaste tu cuenta?{' '}
            <button
              type="button"
              className="signup-link-button"
              onClick={() => setMostrarVerificacion(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Solicita un nuevo enlace
            </button>
          </p>
        </div>

        {/* Modal de recuperación */}
        {mostrarRecuperar && (
          <RecuperarContrasenaModal 
            onClose={() => setMostrarRecuperar(false)} 
            setLoading={setLoading} 
          />
        )}

        {/* Modal de verificación */}
        {mostrarVerificacion && (
          <SolicitarVerificacionModal
            onClose={() => setMostrarVerificacion(false)}
            setLoading={setLoading}
          />
        )}

        {/* Modal de error */}
        {mostrarErrorModal && (
          <ErrorModal mensaje={mensajeErrorModal} onClose={() => setMostrarErrorModal(false)} />
        )}

        {/* Overlay de carga */}
        {loading && (
          <div className="overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    );
  }

  export default Login;
