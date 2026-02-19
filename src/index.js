import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/GlobalAdmin.css';

// ✅ Ruta corregida (contexts)
import { UsuarioProvider } from './contexts/UsuarioContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <UsuarioProvider>
      <App />
    </UsuarioProvider>
  </React.StrictMode>
);