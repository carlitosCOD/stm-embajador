// src/pages/RegistroReferidos/index.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config/api';

import MenuSuperior from '../../../components/MenuSuperior/MenuSuperior';
import SuccessAlert from '../../../components/SuccessAlert/SuccessAlert';

function RegistroReferidos() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Recibimos valores iniciales
  const cedulaInicial = location.state?.cedula || '';
  const correoInicial = location.state?.correo || '';

  const [correo, setCorreo] = useState(correoInicial.toLowerCase());
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [programa, setPrograma] = useState('');
  const [documento] = useState(cedulaInicial); // campo no editable
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [programas, setProgramas] = useState([]);
  const [correoAsesor, setCorreoAsesor] = useState('');
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);

  // ✅ función capitalizar programas (sin escapes innecesarios)
  const capitalizeTitle = (input) => {
    if (!input) return "";

    const stopWords = new Set([
      "de", "del", "la", "las", "el", "los", "en", "y", "o", "a", "al",
      "por", "para", "con", "sin", "sobre", "entre", "lo", "un", "una"
    ]);

    // todo a minúsculas
    let s = input.trim().toLowerCase();

    // capitalizar la primera letra de cada palabra (después de espacio o separador)
    s = s.replace(/(^|[\s\-(),.])([a-záéíóúüñ])/g, (_, sep, ch) => sep + ch.toUpperCase());

    // aplicar reglas de stopWords (excepto la primera palabra)
    const parts = s.split(" ");
    const finalParts = parts.map((part, idx) => {
      const core = part.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quitar tildes
      if (idx !== 0 && stopWords.has(core.toLowerCase())) {
        return part.toLowerCase();
      }
      return part;
    });

    return finalParts.join(" ");
  };

  // 🔄 Consumir programas desde el BACKEND y normalizarlos
  useEffect(() => {
    const obtenerProgramas = async () => {
      try {
        const response = await fetch(`${API_URL}/programas`);
        const data = await response.json();
        if (Array.isArray(data)) {
          const programasNormalizados = data.map((p) => ({
            ...p,
            Programa: capitalizeTitle(p.Programa || p.programa || ''),
            Correo: (p.Correo || p.correo || '').toLowerCase(),
          }));
          setProgramas(programasNormalizados);
        }
      } catch (error) {
        console.error('Error al obtener programas:', error);
      }
    };
    obtenerProgramas();
  }, []);

  // 🔄 Cuando seleccionan un programa, guardamos también el correo del asesor
  const handleProgramaChange = (e) => {
    const programaSeleccionado = e.target.value;
    setPrograma(programaSeleccionado);

    const asesor = programas.find((p) => p.Programa === programaSeleccionado);
    if (asesor) {
      setCorreoAsesor((asesor.Correo || asesor.correo || '').toLowerCase());
    } else {
      setCorreoAsesor('');
    }
  };

  // 📤 Enviar datos al backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));

    if (!usuarioGuardado || !usuarioGuardado.id) {
      console.error("❌ No se encontró el usuario en localStorage");
      setMostrarError(true);
      return;
    }

    const nuevoReferido = {
      nombres,
      apellidos,
      numero_telefonico: telefono,
      programa_interes: programa,
      acepta_privacidad: aceptaPrivacidad ? 1 : 0,
      correo_electronico: (correo || '').toLowerCase(),
      documento,
      usuario_id: usuarioGuardado.id,
      correo_asesor: correoAsesor,
    };

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/referidos/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(nuevoReferido),
      });

      const data = await response.json();

      if (response.ok) {
        setMostrarAlerta(true);
      } else {
        console.error('❌ Error en el registro:', data.error);
        setMostrarError(true);
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      setMostrarError(true);
    }
  };

  return (
    <>
      <MenuSuperior />
      <main id="registroReferidos-main" className="scroll-habilitado">
        <form id="registroReferidos-form" onSubmit={handleSubmit}>
          <h1>Añade tu referido</h1>

          <input
            type="text"
            placeholder="NOMBRES"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="APELLIDOS"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="NÚMERO TELEFÓNICO"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="DOCUMENTO (Cédula o DNI)"
            value={documento}
            readOnly
            required
          />
          <input
            type="email"
            placeholder="CORREO DEL REFERIDO"
            value={correo}
            onChange={(e) => setCorreo(e.target.value.toLowerCase())}
            required
          />

          {/* Selector de programa */}
          <select
            id="registroReferidos-programa"
            value={programa}
            onChange={handleProgramaChange}
            required
          >
            <option value="">PROGRAMA DE INTERÉS*</option>
            {programas.map((prog, index) => (
              <option key={index} value={prog.Programa}>
                {prog.Programa}
              </option>
            ))}
          </select>

          {/* Checkbox de privacidad */}
          <label id="registroReferidos-check">
            <input
              type="checkbox"
              checked={aceptaPrivacidad}
              onChange={(e) => setAceptaPrivacidad(e.target.checked)}
              required
            />
            <span>
              Acepto la autorización de la administración de datos personales conforme a la{' '}
              <a href="https://unac.edu.co/privacidad" target="_blank" rel="noopener noreferrer">
                política de privacidad
              </a>
            </span>
          </label>

          <button type="submit" id="registroReferidos-btn" className="btn btn-yellow">
            Registrarme
          </button>
        </form>

        {/* ✅ Alertas de éxito / error */}
        {mostrarAlerta && (
          <SuccessAlert
            mensaje="✅ Referido registrado correctamente"
            acciones={[
              {
                texto: 'Registrar otro referido',
                tipo: 'primario',
                onClick: () => {
                  setMostrarAlerta(false);
                  navigate('/AñadirReferidos');
                },
              },
              {
                texto: 'Ver mis referidos',
                tipo: 'secundario',
                onClick: () => navigate('/mis-referidos'),
              },
            ]}
          />
        )}

        {mostrarError && (
          <SuccessAlert
            mensaje="❌ Error al registrar el referido"
            acciones={[
              {
                texto: 'Intentar de nuevo',
                tipo: 'primario',
                onClick: () => setMostrarError(false),
              },
            ]}
          />
        )}
      </main>
    </>
  );
}

export default RegistroReferidos;
