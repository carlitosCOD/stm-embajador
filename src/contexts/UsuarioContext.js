// src/context/UsuarioContext.js
import { createContext, useContext, useState, useEffect } from "react";

export const UsuarioContext = createContext();

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  return (
    <UsuarioContext.Provider value={{ usuario, setUsuario }}>
      {children}
    </UsuarioContext.Provider>
  );
}


// Hook personalizado para acceder fácilmente al contexto
export function useUsuarioContext() {
  return useContext(UsuarioContext);
}
