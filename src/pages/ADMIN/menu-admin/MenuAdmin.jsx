import React, { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import './MenuAdmin.module.css';

const MenuAdmin = () => {
  const location = useLocation();

  return (
    <nav className="menu-admin">
      <ul className="menu-list">
        <li className={`menu-item ${location.pathname === '/admin/panel' ? 'active' : ''}`}>
          <Link to="/admin/panel">📊 Panel Principal</Link>
        </li>
        <li className={`menu-item ${location.pathname === '/admin/referidos' ? 'active' : ''}`}>
          <Link to="/admin/referidos">👥 Referidos</Link>
        </li>
        <li className={`menu-item ${location.pathname === '/admin/embajadores' ? 'active' : ''}`}>
          <Link to="/admin/embajadores">🎓 Embajadores</Link>
        </li>
        <li className={`menu-item ${location.pathname === '/admin/editar-usuario' ? 'active' : ''}`}>
          <Link to="/admin/editar-usuario">👤 Editar Usuarios</Link>
        </li>
        <li className={`menu-item ${location.pathname === '/admin/administradores' ? 'active' : ''}`}>
          <Link to="/admin/administradores">👥 Administrar Administradores</Link>
        </li>
      </ul>
    </nav>
  );
};

export default MenuAdmin;
