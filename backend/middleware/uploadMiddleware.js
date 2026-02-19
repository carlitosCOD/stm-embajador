    const multer = require('multer');
    const path = require('path');

    // Configuración de almacenamiento
    const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Carpeta donde se guardan las imágenes
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);

        // Usamos el ID del usuario autenticado
        const usuarioId = req.usuario?.id;

        if (!usuarioId) {
        return cb(new Error('No se pudo obtener el ID del usuario'), null);
        }

        // Guardar con nombre único por ID
        const filename = `usuario_${usuarioId}${ext}`;
        cb(null, filename);
    }
    });

    // Filtro para solo permitir imágenes
    const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido'), false);
    }
    };

    const upload = multer({ storage, fileFilter });

    module.exports = upload;
