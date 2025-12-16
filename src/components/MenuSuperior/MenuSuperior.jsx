import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logoOscuro from "../../assets/logoUnac.svg";
import logoClaro from "../../assets/LogoNegro.svg";
import usuarioDefault from "../../assets/usuario.png"; 
import styles from "./MenuSuperior.module.css";
import { useUsuarioContext } from "../../contexts/UsuarioContext";
import { API_BASE } from "../../config/api";

const fotoToUrl = (fotoPath) => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith("http")) {
    return `${fotoPath}?t=${Date.now()}`;
  }
  return `${API_BASE}/${fotoPath}?t=${Date.now()}`;
};

function MenuSuperior() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarFlotante, setMostrarFlotante] = useState(false);
  const [modoClaro, setModoClaro] = useState(false);
  const { usuario } = useUsuarioContext();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const esClaro = document.body.classList.contains("modo-claro");
      setModoClaro(esClaro);
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setModoClaro(document.body.classList.contains("modo-claro"));

    return () => observer.disconnect();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const irA = (ruta) => {
    navigate(ruta);
    setMostrarFlotante(false);
  };

  // ✅ Normalizamos la ruta actual
  const pathActual = location.pathname.toLowerCase().replace(/\/$/, "");
  const estaEnAnadirReferidos =
    pathActual === "/añadirreferidos" || pathActual === "/anadirreferidos";

  return (
    <>
      <header className={styles.menuSuperior}>
        <div
          className={styles.logoContainer}
          onClick={() => navigate("/AñadirReferidos")}
          style={{ cursor: "pointer" }}
        >
          <img
            src={modoClaro ? logoClaro : logoOscuro}
            alt="Logo UNAC"
            className={styles.logoUnac}
          />
        </div>

        <div className={styles.menuDerecha}>
          <Link to="/mis-referidos">
            <button className={styles.verReferidosBtn1}>
              <span className={styles.icono}>🧾</span> Ver mis referidos
            </button>
          </Link>

          {/* ✅ Este botón se oculta en PC/Tablet SOLO cuando estamos en /AñadirReferidos */}
          <Link to="/AñadirReferidos">
            <button
              className={`${styles.verReferidosBtn} ${
                estaEnAnadirReferidos ? styles.ocultoEnGrande : ""
              }`}
            >
              <span className={styles.icono}>➕</span> Añadir Referido
            </button>
          </Link>

          <div className={styles.perfilUsuario} onClick={() => setMenuAbierto(!menuAbierto)}>
            <img
              src={usuario?.foto_url ? fotoToUrl(usuario.foto_url) : usuarioDefault}
              alt="Usuario"
              className={styles.avatar}
            />
            <span>{usuario?.nombre || "Usuario"}</span>
            <span className={styles.flecha}>▼</span>

            {menuAbierto && (
              <div className={styles.menuDesplegable}>
                <div className={styles.infoUsuario}>
                  <strong>{usuario?.nombre || "Nombre"}</strong>
                  <p>{usuario?.correo || "correo@unac.edu.co"}</p>
                </div>
                <ul>
                  <li>
                    <Link to="/perfil">Editar perfil</Link>
                  </li>
                  <li>
                    <Link to="/configuracion">Configuración</Link>
                  </li>
                  <li>
                    <button onClick={cerrarSesion} className={styles.cerrarSesionBtn}>
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ✅ Barra inferior (móvil) */}
      <div className={styles.barraInferior}>
        {/* Ocultar "Inicio" solo si estás en /AñadirReferidos */}
        {!estaEnAnadirReferidos && (
          <button className={styles.botonInferior} onClick={() => irA("/AñadirReferidos")}>
            <span className={styles.emoji}>🏠</span>
            <span>Inicio</span>
          </button>
        )}

        <button className={styles.botonInferior} onClick={() => irA("/mis-referidos")}>
          <span className={styles.emoji}>📄</span>
          <span>Referidos</span>
        </button>
        <button
          className={styles.botonInferior}
          onClick={() => setMostrarFlotante(!mostrarFlotante)}
        >
          <span className={styles.emoji}>👤</span>
          <span>Perfil</span>
        </button>
      </div>

      {mostrarFlotante && (
        <div className={styles.menuDesplegable}>
          <div className={styles.infoUsuario}>
            <strong>{usuario?.nombre || "Nombre"}</strong>
            <p>{usuario?.correo || "correo@unac.edu.co"}</p>
          </div>
          <ul>
            <li>
              <Link to="/perfil">Editar perfil</Link>
            </li>
            <li>
              <Link to="/configuracion">Configuración</Link>
            </li>
            <li>
              <button onClick={cerrarSesion} className={styles.cerrarSesionBtn}>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

export default MenuSuperior;
