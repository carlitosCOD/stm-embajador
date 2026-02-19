module.exports = function verificarRol(rolPermitido) {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.rol) {
      return res.status(403).json({
        mensaje: "Acceso denegado: rol no definido",
      });
    }

    if (req.usuario.rol !== rolPermitido) {
      return res.status(403).json({
        mensaje: "Acceso denegado: permisos insuficientes",
      });
    }

    next();
  };
};
