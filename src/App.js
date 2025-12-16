// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import useScrollControl from "./hooks/useScrollControl";

//  🟡 Páginas públicas
import Login from "./pages/Login";
import RegistroReferidos from "./pages/USER/registro-referidos";
import RegistroEmbajador from "./pages/USER/RegistroEmbajador";
import NuevaContrasena from "./components/NuevaContrasena/NuevaContrasena";

//  🟢 NUEVA: Página pública de verificación por correo
import VerificarCorreo from "./pages/USER/VerificarCorreo/VerificarCorreo";

//  🔵 Páginas privadas USER
import AnadirReferidos from "./pages/USER/AnadirReferidos";
import MisReferidos from "./pages/USER/mis-referidos";
import Configuracion from "./pages/USER/configuracion/configuracion";
import Perfil from "./pages/USER/perfil";

//  🔒 Rutas protegidas
import RutaPrivada from "./components/RutaPrivada/RutaPrivada";

//  🔴 Páginas Admin
import PanelAdmin from "./pages/ADMIN/AdminPanel";
import ReferidosSistema from "./pages/ADMIN/AdminConsulta/referidosSistema";
import AdminEmbajadores from "./pages/ADMIN/AdminEmbajadores/AdminEmbajadores";
import AdminEditarUsuario from "./pages/ADMIN/AdminEditarUsuario/AdminEditarUsuario";
import MenuAdmin from "./pages/ADMIN/menu-admin/MenuAdmin"; // ✅ Layout del admin

//  🎨 Estilos y assets globales
import "./styles/global.css";
//import './styles/GlobalAdmin.css';//
import linea1 from "./assets/linea1.svg";
import linea2 from "./assets/linea2.svg";

function AppContent({ modoOscuro, setModoOscuro }) {
  useScrollControl();

  // 🌙 Cambia el tema del body según el modo oscuro/claro
  useEffect(() => {
    const claseTema = modoOscuro ? "modo-oscuro" : "modo-claro";
    document.body.classList.remove("modo-oscuro", "modo-claro");
    document.body.classList.add(claseTema);
    localStorage.setItem("modoOscuro", JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  return (
    <>
      {/* Líneas decorativas superiores e inferiores */}
      <img src={linea1} className="linea1" alt="Decoración superior" />
      <img src={linea2} className="linea2" alt="Decoración inferior" />

      <main>
        <Routes>
          {/* ===============================
              🟡 RUTAS PÚBLICAS
          =============================== */}
          <Route path="/" element={<Login />} />
          <Route path="/registro-referidos" element={<RegistroReferidos />} />
          <Route path="/registro-embajador" element={<RegistroEmbajador />} />
          <Route path="/restablecer-contrasena/:token" element={<NuevaContrasena />} />

          {/* ✅ NUEVA RUTA: Verificación de cuenta por correo */}
          <Route path="/verificar/:token" element={<VerificarCorreo />} />

          {/* ===============================
              🔵 RUTAS PRIVADAS USER
          =============================== */}
          <Route
            path="/AñadirReferidos"
            element={
              <RutaPrivada>
                <AnadirReferidos />
              </RutaPrivada>
            }
          />
          <Route
            path="/mis-referidos"
            element={
              <RutaPrivada>
                <MisReferidos />
              </RutaPrivada>
            }
          />
          <Route
            path="/perfil"
            element={
              <RutaPrivada>
                <Perfil />
              </RutaPrivada>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RutaPrivada>
                <Configuracion
                  modoOscuro={modoOscuro}
                  setModoOscuro={setModoOscuro}
                />
              </RutaPrivada>
            }
          />

          {/* ===============================
              🔴 RUTAS ADMIN (con layout persistente)
          =============================== */}
          <Route
            path="/admin"
            element={
              <RutaPrivada>
                <MenuAdmin />
              </RutaPrivada>
            }
          >
            <Route path="panel" element={<PanelAdmin />} />
            <Route path="embajadores" element={<AdminEmbajadores />} />
            <Route path="referidos" element={<ReferidosSistema />} />
            <Route path="editar-usuario/:id" element={<AdminEditarUsuario />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

function App() {
  // 🌓 Estado global del modo oscuro guardado en localStorage
  const [modoOscuro, setModoOscuro] = useState(() => {
    const guardado = localStorage.getItem("modoOscuro");
    return guardado !== null ? JSON.parse(guardado) : true;
  });

  return (
    <Router>
      <AppContent modoOscuro={modoOscuro} setModoOscuro={setModoOscuro} />
    </Router>
  );
}

export default App;
