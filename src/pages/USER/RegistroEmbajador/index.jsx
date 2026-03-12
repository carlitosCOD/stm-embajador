import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config/api';

import logoOscuro from '../../../assets/logoUnac.svg';
import logoClaro from '../../../assets/LogoNegro.svg';

const RegistroEmbajador = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    correoConfirmacion: '',
    telefono: '',
    contraseña: '',
    contraseñaConfirmacion: '',
    aceptaPrivacidad: false
  });

  const [contraseñaValida, setContraseñaValida] = useState(true);
  const [mostrarErrorContraseña, setMostrarErrorContraseña] = useState(false);
  const [mensajeVerificacion, setMensajeVerificacion] = useState('');

  const [codigoAdmin, setCodigoAdmin] = useState('');
  const [mostrarCampoCodigo, setMostrarCampoCodigo] = useState(false);

  const [redirectTimeout, setRedirectTimeout] = useState(null);

  const contraseñaSeguraRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'contraseña') {
      setMostrarErrorContraseña(true);
      setContraseñaValida(contraseñaSeguraRegex.test(value));
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (formData.correo !== formData.correoConfirmacion) {
      alert('Los correos no coinciden');
      return;
    }

    if (formData.contraseña !== formData.contraseñaConfirmacion) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!contraseñaSeguraRegex.test(formData.contraseña)) {
      setContraseñaValida(false);
      setMostrarErrorContraseña(true);
      return;
    }

    if (mostrarCampoCodigo && codigoAdmin !== 'ADMIN123') {
      alert('❌ Código de administrador inválido');
      return;
    }

    try {

      const datosEnvio = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo_electronico: formData.correo,
        numero_telefonico: formData.telefono,
        contrasena: formData.contraseña,
        acepta_privacidad: formData.aceptaPrivacidad ? 1 : 0,
        rol_id: mostrarCampoCodigo ? 2 : 1
      };

      if (mostrarCampoCodigo) {
        datosEnvio.codigo_admin = codigoAdmin;
      }

      const response = await fetch(`${API_URL}/usuarios/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnvio)
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {

        const esAdmin = data?.usuario?.rol === 'admin';

        const mensaje = esAdmin
          ? '¡Registro exitoso! Bienvenido administrador.'
          : '¡Registro exitoso! Bienvenido la sistema para embajadores UNAC';

        setMensajeVerificacion(mensaje);

        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        if (data.usuario) {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
        }

        const timeout = setTimeout(() => {

          if (esAdmin) {
            navigate('/admin/panel');
          } else {
            navigate('/');
          }

        }, 3000);

        setRedirectTimeout(timeout);

      } else {

        const mensaje =
          data.error ||
          data.message ||
          data.msg ||
          'Error al registrar usuario';

        setMensajeVerificacion(`❌ ${mensaje}`);
      }

    } catch (error) {

      console.error('Error al conectar con el servidor:', error);

      setMensajeVerificacion('❌ Error de conexión con el servidor');
    }
  };

  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  const isDarkMode = document.body.classList.contains('modo-oscuro');
  const logo = isDarkMode ? logoOscuro : logoClaro;

  return (

    <div className="registro-embajador-page">

      <div className="registro-embajador-container">

        <div className="info-card">

          <img src={logo} alt="Logo UNAC" className="logo-unac" />

          <h2>¿Qué necesitas saber para empezar?</h2>

          <div className="info-bloque">

            <h3>Conoce el sistema de Embajador</h3>

            <p>
              Como Embajador de la UNAC obtendrás beneficios al acompañar e
              inscribir futuros estudiantes en la UNAC. Por cada estudiante nuevo
              de primer ingreso que complete su proceso de matrícula se reconocerá el
              <strong> 5% del valor efectivamente recaudado</strong>. Cada referido
              se integrará a la base de datos y se verificará que ese nombre no
              se encuentre ya registrado por otra persona o medio. Una vez validado
              como nuevo aspirante, se confirmará al Embajador su clasificación como
              Lead efectivo y el pago de la comisión se realizará al finalizar el
              proceso de matrícula por el medio establecido por la Institución.
            </p>

          </div>

          <div className="info-bloque">

            <h3>¿Debo ser estudiante activo de la UNAC?</h3>

            <p>
              No es requisito ser estudiante de la UNAC para ser embajador
              y participar en el sistema de referidos.
            </p>

          </div>

        </div>

        <div className="form-card">

          <h2>Crea tu cuenta sistema de Embajadores</h2>

          <button
            type="button"
            className="btn btn-outline mb-3"
            onClick={() => setMostrarCampoCodigo(!mostrarCampoCodigo)}
            style={{ width: '100%' }}
          >
            {mostrarCampoCodigo
              ? 'Cancelar registro como admin'
              : '¿Eres administrador?'}
          </button>

          {mensajeVerificacion ? (

            <div className="mensaje-verificacion-overlay">

              <div className="mensaje-verificacion-container">

                <p className="mensaje-verificacion">{mensajeVerificacion}</p>

                <Link to="/" className="btn btn-yellow">
                  Ir a iniciar sesión
                </Link>

              </div>

            </div>

          ) : (

            <form onSubmit={handleSubmit}>

              {mostrarCampoCodigo && (
                <input
                  type="password"
                  placeholder="CÓDIGO DE ADMINISTRADOR*"
                  value={codigoAdmin}
                  onChange={(e) => setCodigoAdmin(e.target.value)}
                  required
                />
              )}

              <input type="text" name="nombre" placeholder="NOMBRE*" onChange={handleChange} required />

              <input type="text" name="apellido" placeholder="APELLIDO*" onChange={handleChange} required />

              <input type="email" name="correo" placeholder="CORREO ELECTRÓNICO*" onChange={handleChange} required />

              <input type="email" name="correoConfirmacion" placeholder="CONFIRMACIÓN DE CORREO ELECTRÓNICO*" onChange={handleChange} required />

              <input type="tel" name="telefono" placeholder="NÚMERO TELEFÓNICO*" onChange={handleChange} required />

              <input
                type="password"
                name="contraseña"
                placeholder="CONTRASEÑA*"
                onChange={handleChange}
                required
              />

              {mostrarErrorContraseña && !contraseñaValida && (
                <p className="error-text">
                  La contraseña debe tener al menos 8 caracteres, una letra,
                  un número y un símbolo especial.
                </p>
              )}

              <input
                type="password"
                name="contraseñaConfirmacion"
                placeholder="CONFIRMACIÓN DE CONTRASEÑA*"
                onChange={handleChange}
                required
              />

              <label className="privacidad-check">

                <input
                  type="checkbox"
                  name="aceptaPrivacidad"
                  onChange={handleChange}
                  required
                />

                <span>
                  Acepto la autorización de la administración de datos personales
                  conforme a la{' '}
                  <a
                    href="https://unac.edu.co/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    política de privacidad
                  </a>
                </span>

              </label>

              <button type="submit">Crear cuenta</button>

              <p className="login-link">
                ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
              </p>

            </form>

          )}

        </div>

      </div>

    </div>
  );
};

export default RegistroEmbajador;