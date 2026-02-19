// src/hooks/useScrollControl.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import paginasConScroll from '../config/scrollPages';

function useScrollControl() {
  const location = useLocation();

  useEffect(() => {
    const rutaActual = location.pathname;
    const debeTenerScroll = paginasConScroll.includes(rutaActual);

    // ✅ Aplica o quita scroll solo si cambia
    if (debeTenerScroll) {
      document.body.classList.add('scroll-habilitado');
    } else {
      document.body.classList.remove('scroll-habilitado');
    }

    // ❌ No limpies siempre — solo cuando cambie la ruta
  }, [location.pathname]);
}

export default useScrollControl;
