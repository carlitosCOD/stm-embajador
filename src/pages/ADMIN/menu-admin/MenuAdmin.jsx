// src/pages/ADMIN/menu-admin/MenuAdmin.jsx

import React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";

import styles from "./MenuAdmin.module.css"; // 👈 IMPORTANTE

import logoUnac from "../../../assets/logoUnac.svg";

const MenuAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className={styles.adminLayout}>
      
      {/* SIDEBAR */}
      <aside className={styles.adminSidebar}>

        {/* LOGO */}
        <div className={styles.adminLogo}>
          <img src={logoUnac} alt="UNAC" />
          
        </div>

        {/* MENU */}
        <ul className={styles.menuList}>

          <li
            className={
              location.pathname === "/admin/panel"
                ? styles.active
                : ""
            }
          >
            <Link to="/admin/panel"> inicio</Link>
          </li>

          <li
            className={
              location.pathname === "/admin/referidos"
                ? styles.active
                : ""
            }
          >
            <Link to="/admin/referidos">👥 Referidos</Link>
          </li>

          <li
            className={
              location.pathname === "/admin/embajadores"
                ? styles.active
                : ""
            }
          >
            <Link to="/admin/embajadores">🎓 Embajadores</Link>
          </li>

          <li
            className={
              location.pathname.includes("/admin/editar-usuario")
                ? styles.active
                : ""
            }
          >
            <Link to="/admin/embajadores">✏️ Editar Usuarios</Link>
          </li>

        </ul>

        {/* LOGOUT */}
        <div className={styles.logoutBox}>
          <button onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>

      </aside>

      {/* CONTENIDO */}
      <main className={styles.adminContent}>
        <Outlet />
      </main>

    </div>
  );
};

export default MenuAdmin;
