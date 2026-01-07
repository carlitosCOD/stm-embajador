// backend/controllers/usuarioController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/* ===========================
   Registrar usuario
=========================== */
const registrarUsuario = async (req, res) => {
  console.log("📥 Solicitud de registro recibida:", {
    body: {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      correo_electronico: req.body.correo_electronico,
      rol: req.body.rol,
      tiene_codigo: !!req.body.codigo_admin,
    },
  });

  const {
    nombre,
    apellido,
    correo_electronico,
    numero_telefonico,
    contraseña,
    acepta_privacidad,
    rol = "usuario",
    codigo_admin,
  } = req.body;

  // Validaciones
  if (
    !nombre ||
    !apellido ||
    !correo_electronico ||
    !numero_telefonico ||
    !contraseña ||
    acepta_privacidad === undefined
  ) {
    return res
      .status(400)
      .json({ error: "Todos los campos marcados con * son obligatorios." });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo_electronico)) {
    return res.status(400).json({ error: "Formato de correo inválido." });
  }

  // Validar contraseña segura
  const contraseñaSeguraRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
  if (!contraseñaSeguraRegex.test(contraseña)) {
    return res.status(400).json({
      error:
        "La contraseña debe tener al menos 8 caracteres, una letra, un número y un símbolo especial.",
    });
  }

  try {
    // Verificar si el correo ya existe
    const correoExistenteQuery =
      "SELECT id FROM usuarios_registro WHERE correo_electronico = $1";
    const correoExistenteResult = await db.query(correoExistenteQuery, [
      correo_electronico,
    ]);

    if (correoExistenteResult.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "El correo electrónico ya está registrado." });
    }

    // Hashear contraseña
    const saltRounds = 10;
    const hash = await bcrypt.hash(contraseña, saltRounds);

    // Determinar rol: permitir 'admin' si se proporciona el código correcto
    let rolFinal = "usuario";
    if (rol === "admin") {
      console.log("🔐 Intento de registro como admin");
      console.log("📄 Código proporcionado:", codigo_admin);

      // Verificar código secreto para registro de administradores
      const codigoSecreto = process.env.CODIGO_ADMIN || "ADMIN123";
      console.log("🔑 Código esperado:", codigoSecreto);

      if (codigo_admin === codigoSecreto) {
        console.log("✅ Código de admin válido - asignando rol admin");
        rolFinal = "admin";
      } else {
        console.log("❌ Código de admin inválido - manteniendo rol usuario");
      }
    }

    console.log("📝 Rol final asignado:", rolFinal);

    // Insertar nuevo usuario
    const insertQuery = `
      INSERT INTO usuarios_registro 
      (nombre, apellido, correo_electronico, numero_telefonico, contraseña, acepta_privacidad, rol)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nombre, apellido, correo_electronico, numero_telefonico, rol
    `;

    const values = [
      nombre,
      apellido,
      correo_electronico,
      numero_telefonico,
      hash,
      acepta_privacidad,
      rolFinal,
    ];

    const result = await db.query(insertQuery, values);
    const nuevoUsuario = result.rows[0];

    console.log("✅ Usuario registrado con éxito:", nuevoUsuario);

    // Generar token JWT
    const token = jwt.sign(
      {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        correo: nuevoUsuario.correo_electronico,
        rol: nuevoUsuario.rol,
      },
      process.env.JWT_SECRET || "unac_clave_secreta_segura",
      { expiresIn: "7d" } // Extendido a 7 días
    );

    // Enviar correo de verificación
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");
    const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Usar la columna correcta: reset_token y token_expira (que ya existen)
    const guardarTokenQuery =
      "UPDATE usuarios_registro SET reset_token = $1, token_expira = $2 WHERE id = $3";

    await db.query(guardarTokenQuery, [
      tokenVerificacion,
      tokenExpira,
      nuevoUsuario.id,
    ]);

    const enlace = `${FRONTEND_URL}/verificar/${tokenVerificacion}`;

    const transporter = require("../config/mailer");

    const mailOptions = {
      from: "UNAC Referidos <noresponder@unac.edu.co>",
      to: correo_electronico,
      subject: "Verifica tu cuenta - UNAC Referidos",
      html: `
        <div style="font-family:Arial,sans-serif;background:#222;padding:24px;border-radius:12px;color:#ddd;">
          <h2 style="color:#f5a800;">Hola ${nombre} 👋</h2>
          <p>Gracias por registrarte en el Sistema de Referidos de la UNAC.</p>
          <p>Por favor, haz clic en el siguiente botón para verificar tu cuenta:</p>
          <a href="${enlace}" style="display:inline-block;margin:16px 0;padding:12px 20px;background:#f5a800;color:#222;text-decoration:none;border-radius:8px;">Verificar cuenta</a>
          <p>Si tú no creaste esta cuenta, simplemente ignora este mensaje.</p>
          <br>
          <small>© UNAC 2025 - Todos los derechos reservados</small>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("❌ Error al enviar correo de verificación:", error);
        console.error("📋 Detalles del error:", {
          code: error.code,
          command: error.command,
          response: error.response,
          message: error.message,
        });
      }
    });

    console.log("✅ Usuario registrado:", nuevoUsuario);
    res.status(201).json({
      mensaje:
        "Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.",
      token,
      usuario: nuevoUsuario,
    });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    console.error("📋 Detalles del error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

/* ===========================
   Reenviar verificación (FALTABA)
=========================== */
const reenviarVerificacion = async (req, res) => {
  const { correo_electronico } = req.body;

  console.log("📧 Solicitud de reenvío para:", correo_electronico);

  if (!correo_electronico)
    return res.status(400).json({ error: "Correo requerido" });

  const buscarQuery =
    "SELECT * FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(buscarQuery, [correo_electronico], async (err, results) => {
    if (err) {
      console.error("❌ Error en consulta BD:", err);
      return res.status(500).json({ error: "Error del servidor." });
    }
    if (results.rows.length === 0) {
      console.log("⚠️ Correo no encontrado:", correo_electronico);
      return res.status(404).json({ error: "Correo no encontrado." });
    }

    const usuario = results.rows[0];

    if (usuario.verificado === 1) {
      console.log("⚠️ Cuenta ya verificada:", correo_electronico);
      return res.status(400).json({ error: "La cuenta ya está verificada." });
    }

    const nuevoToken = crypto.randomBytes(32).toString("hex");
    const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const update =
      "UPDATE usuarios_registro SET token_verificacion = $1, token_expira = $2 WHERE id = $3";

    db.query(update, [nuevoToken, tokenExpira, usuario.id], (err2) => {
      if (err2) {
        console.error("❌ Error al actualizar token:", err2);
        return res.status(500).json({ error: "Error al generar token." });
      }

      console.log("✅ Token actualizado, enviando correo...");
      const enlace = `${FRONTEND_URL}/verificar/${nuevoToken}`;

      const transporter = require("../config/mailer");

      const mailOptions = {
        from: "UNAC Referidos <noresponder@unac.edu.co>",
        to: correo_electronico,
        subject: "Reenvío de verificación de cuenta - UNAC",
        html: `
          <div style="font-family:Arial,sans-serif;background:#222;padding:24px;border-radius:12px;color:#ddd;">
            <h2 style="color:#f5a800;">Hola ${usuario.nombre} 👋</h2>
            <p>Has solicitado un nuevo enlace de verificación.</p>
            <p>Para activar tu cuenta, haz clic en el siguiente botón:</p>
            <a href="${enlace}" style="display:inline-block;margin:16px 0;padding:12px 20px;background:#f5a800;color:#222;text-decoration:none;border-radius:8px;">Verificar cuenta</a>
            <p>Si tú no solicitaste esto, simplemente ignora este mensaje.</p>
            <br>
            <small>© UNAC 2025 - Todos los derechos reservados</small>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error("❌ Error al enviar correo de verificación:", error);
          return res.status(500).json({
            error: "Error al enviar correo.",
            detalle: error.message,
          });
        }

        console.log("✅ Correo enviado exitosamente a:", correo_electronico);
        res.json({ mensaje: "Correo de verificación reenviado." });
      });
    });
  });
};

/* ===========================
   Verificar cuenta
=========================== */
const verificarCuenta = (req, res) => {
  const { token } = req.params;

  const query =
    "SELECT id, correo_electronico, verificado, token_expira FROM usuarios_registro WHERE reset_token = $1";

  db.query(query, [token], (err, results) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al verificar token." });
    if (results.rows.length === 0)
      return res
        .status(400)
        .json({ mensaje: "Token inválido o ya usado.", correo: null });

    const usuario = results.rows[0];

    if (usuario.verificado === 1) {
      return res.status(400).json({
        mensaje: "Tu cuenta ya está verificada.",
        correo: usuario.correo_electronico,
      });
    }

    // Verificar si el token expiró
    if (usuario.token_expira && new Date() > new Date(usuario.token_expira)) {
      return res.status(400).json({
        mensaje: "El enlace de verificación ha expirado. Solicita uno nuevo.",
        correo: usuario.correo_electronico,
        expirado: true,
      });
    }

    const updateQuery = `
      UPDATE usuarios_registro
      SET verificado = 1, token_verificacion = NULL, token_expira = NULL
      WHERE id = $1
    `;

    db.query(updateQuery, [usuario.id], (err2) => {
      if (err2)
        return res.status(500).json({ mensaje: "Error al activar cuenta." });

      res.status(200).json({
        mensaje: "Cuenta verificada exitosamente.",
        correo: usuario.correo_electronico,
      });
    });
  });
};

/* ===========================
   Login usuario
=========================== */
const loginUsuario = (req, res) => {
  let { correo_electronico, contraseña } = req.body;

  if (!correo_electronico)
    return res.status(400).json({ message: "Correo requerido" });

  const query = "SELECT * FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(query, [correo_electronico], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error del servidor" });
    if (results.rows.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado." });

    const usuario = results.rows[0];

    if (usuario.activo === 0)
      return res.status(403).json({ error: "Cuenta desactivada." });

    // Permitir login sin verificación
    // if (usuario.verificado === false || usuario.verificado === 0)
    //   return res.status(403).json({
    //     error:
    //       "Debes verificar tu cuenta antes de iniciar sesión. Revisa tu correo.",
    //   });

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match)
      return res.status(401).json({ error: "Contraseña incorrecta." });

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo_electronico,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET || "unac_clave_secreta_segura",
      { expiresIn: "7d" } // Extendido a 7 días
    );

    res.status(200).json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo_electronico,
        rol: usuario.rol,
        foto_url: usuario.foto_url || null,
      },
    });
  });
};

/* ===========================
   Obtener perfil
=========================== */
const obtenerPerfil = (req, res) => {
  const usuarioId = req.usuario.id;

  const query = `
    SELECT id, nombre, apellido, correo_electronico, numero_telefonico,
    informacion_adicional, foto_url, rol, verificado 
    FROM usuarios_registro WHERE id = $1
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error al obtener perfil" });
    if (results.rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(results.rows[0]);
  });
};

/* ===========================
   Actualizar perfil
=========================== */
const actualizarPerfil = (req, res) => {
  const usuarioId = req.usuario.id;
  const {
    nombre,
    apellido,
    correo_electronico,
    numero_telefonico,
    informacion_adicional,
  } = req.body || {};

  const nuevaFotoUrl = req.file ? `uploads/${req.file.filename}` : null;

  const queryGet = "SELECT * FROM usuarios_registro WHERE id = $1";

  db.query(queryGet, [usuarioId], (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error al verificar usuario." });
    if (results.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado." });

    const usuarioActual = results.rows[0];

    if (usuarioActual.foto_url && req.file) {
      const rutaFoto = path.join(__dirname, "../", usuarioActual.foto_url);
      fs.unlink(rutaFoto, () => {});
    }

    const queryUpdate = `
      UPDATE usuarios_registro 
      SET nombre = $1, apellido = $2, correo_electronico = $3,
          numero_telefonico = $4, informacion_adicional = $5, foto_url = $6
      WHERE id = $7
    `;

    db.query(
      queryUpdate,
      [
        nombre || usuarioActual.nombre,
        apellido || usuarioActual.apellido,
        correo_electronico || usuarioActual.correo_electronico,
        numero_telefonico || usuarioActual.numero_telefonico,
        informacion_adicional || usuarioActual.informacion_adicional,
        nuevaFotoUrl || usuarioActual.foto_url,
        usuarioId,
      ],
      (err) => {
        if (err)
          return res.status(500).json({ error: "Error al actualizar perfil." });

        res.status(200).json({
          id: usuarioId,
          nombre: nombre || usuarioActual.nombre,
          apellido: apellido || usuarioActual.apellido,
          correo_electronico:
            correo_electronico || usuarioActual.correo_electronico,
          numero_telefonico:
            numero_telefonico || usuarioActual.numero_telefonico,
          informacion_adicional:
            informacion_adicional || usuarioActual.informacion_adicional,
          foto_url: nuevaFotoUrl || usuarioActual.foto_url,
        });
      }
    );
  });
};

/* ===========================
   Eliminar usuario
=========================== */
const eliminarUsuario = (req, res) => {
  const { id } = req.params;

  const query = "UPDATE usuarios_registro SET activo = 0 WHERE id = $1";

  db.query(query, [id], (err) => {
    if (err)
      return res.status(500).json({ error: "Error al desactivar usuario." });

    res.status(200).json({ mensaje: "Cuenta eliminada correctamente." });
  });
};

/* ===========================
   Obtener todos usuarios
=========================== */
const obtenerUsuarios = (req, res) => {
  const query =
    "SELECT id, nombre, apellido, correo_electronico, numero_telefonico, rol, fecha_registro, verificado FROM usuarios_registro";

  db.query(query, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error al consultar usuarios." });

    res.status(200).json(results.rows);
  });
};

/* ===========================
   Solicitar restablecimiento
=========================== */
const solicitarRestablecimiento = (req, res) => {
  const { correo_electronico } = req.body;

  console.log("📧 Solicitud de restablecimiento para:", correo_electronico);

  if (!correo_electronico)
    return res.status(400).json({ error: "El correo es obligatorio." });

  const buscarUsuarioQuery =
    "SELECT * FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(buscarUsuarioQuery, [correo_electronico], (err, results) => {
    if (err) {
      console.error("❌ Error al buscar usuario para restablecimiento:", err);
      return res.status(500).json({ error: "Error al buscar usuario." });
    }
    if (results.rows.length === 0) {
      console.log(
        "⚠️ Usuario no encontrado para restablecimiento:",
        correo_electronico
      );
      return res
        .status(404)
        .json({ error: "No existe un usuario con ese correo." });
    }

    const usuario = results.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const guardarTokenQuery =
      "UPDATE usuarios_registro SET reset_token = $1, token_expira = $2 WHERE correo_electronico = $3";

    db.query(
      guardarTokenQuery,
      [token, tokenExpira, correo_electronico],
      (err) => {
        if (err) {
          console.error("❌ Error al guardar token de restablecimiento:", err);
          return res.status(500).json({ error: "Error al guardar token." });
        }

        console.log("✅ Token guardado, enviando correo...");
        const enlace = `${FRONTEND_URL}/restablecer-contrasena/${token}`;

        const transporter = require("../config/mailer");

        const mailOptions = {
          from: "UNAC Referidos <noresponder@unac.edu.co>",
          to: correo_electronico,
          subject: "Restablece tu contraseña - UNAC Referidos",
          html: `
            <div style="font-family:Arial,sans-serif;background:#222;padding:24px;border-radius:12px;color:#ddd;">
              <h2 style="color:#f5a800;">Hola ${usuario.nombre} 👋</h2>
              <p>Has solicitado restablecer tu contraseña.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <a href="${enlace}" style="display:inline-block;margin:16px 0;padding:12px 20px;background:#f5a800;color:#222;text-decoration:none;border-radius:8px;">Restablecer contraseña</a>
              <p>Si tú no solicitaste esto, simplemente ignora este mensaje.</p>
              <br>
              <small>© UNAC 2025 - Todos los derechos reservados</small>
            </div>
          `,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            console.error(
              "❌ Error al enviar correo de restablecimiento:",
              error
            );
            console.error("📋 Detalles del error:", {
              code: error.code,
              command: error.command,
              response: error.response,
              message: error.message,
            });
            return res.status(500).json({
              error: "Error al enviar correo.",
              detalle: error.message,
              codigo: error.code,
            });
          }

          console.log(
            "✅ Correo de restablecimiento enviado a:",
            correo_electronico
          );
          res.status(200).json({ mensaje: "Correo enviado correctamente." });
        });
      }
    );
  });
};

/* ===========================
   Restablecer contraseña
=========================== */
const restablecerContrasena = async (req, res) => {
  const { token } = req.params;
  const { nuevaContrasena } = req.body;

  if (!nuevaContrasena)
    return res
      .status(400)
      .json({ error: "La nueva contraseña es obligatoria." });

  const query =
    "SELECT * FROM usuarios_registro WHERE reset_token = $1 AND token_expira > NOW()";

  db.query(query, [token], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error al buscar token." });
    if (results.rows.length === 0)
      return res.status(400).json({ error: "Token inválido o expirado." });

    const usuario = results.rows[0];
    const hash = await bcrypt.hash(nuevaContrasena, 10);

    const updateQuery = `
      UPDATE usuarios_registro
      SET contraseña = $1, reset_token = NULL, token_expira = NULL
      WHERE id = $2
    `;

    db.query(updateQuery, [hash, usuario.id], (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Error al actualizar contraseña." });

      res
        .status(200)
        .json({ mensaje: "Contraseña restablecida correctamente." });
    });
  });
};

/* ===========================
   Login con Google
=========================== */
const loginConGoogle = (req, res) => {
  const { nombre, apellido, correo_electronico } = req.body;

  const buscarUsuario =
    "SELECT * FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(buscarUsuario, [correo_electronico], (err, results) => {
    if (err) return res.status(500).json({ mensaje: "Error del servidor" });

    if (results.rows.length > 0) {
      const usuario = results.rows[0];

      const token = jwt.sign(
        {
          id: usuario.id,
          correo: usuario.correo_electronico,
          rol: usuario.rol,
        },
        process.env.JWT_SECRET || "secreto",
        { expiresIn: "7d" } // Extendido a 7 días
      );

      return res.json({
        token,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });
    }

    const insertar = `
      INSERT INTO usuarios_registro (nombre, apellido, correo_electronico, rol)
      VALUES ($1, $2, $3, 'usuario')
      RETURNING id
    `;

    db.query(
      insertar,
      [nombre, apellido, correo_electronico],
      (err, result) => {
        if (err)
          return res.status(500).json({ mensaje: "Error al registrar Google" });

        const nuevoUsuarioId = result.rows[0].id;

        const token = jwt.sign(
          { id: nuevoUsuarioId, correo: correo_electronico, rol: "usuario" },
          process.env.JWT_SECRET || "secreto",
          { expiresIn: "7d" } // Extendido a 7 días
        );

        return res.json({ token, nombre, rol: "usuario" });
      }
    );
  });
};

/* ===========================
   Desactivar cuenta
=========================== */
const desactivarCuenta = (req, res) => {
  const usuarioId = req.usuario.id;

  const sql = "UPDATE usuarios_registro SET activo = 0 WHERE id = $1";

  db.query(sql, [usuarioId], (err) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al desactivar cuenta" });

    res.json({ mensaje: "Cuenta desactivada correctamente" });
  });
};

/* ===========================
   Cambiar contraseña
=========================== */
const cambiarContrasena = async (req, res) => {
  console.log("🔐 Iniciando cambio de contraseña para usuario:", req.usuarioId);
  console.log("📄 Headers recibidos:", req.headers);
  console.log("📄 Body recibido:", req.body);

  const usuarioId = req.usuarioId; // Usar req.usuarioId en lugar de req.usuario.id
  const { contrasenaActual, nuevaContrasena } = req.body;

  console.log("🔐 Intento de cambio de contraseña para usuario:", usuarioId);
  console.log("📄 Datos recibidos:", {
    contrasenaActual: !!contrasenaActual,
    nuevaContrasena: !!nuevaContrasena,
  });

  // Validaciones básicas
  if (!contrasenaActual || !nuevaContrasena) {
    console.log("❌ Campos faltantes");
    return res.status(400).json({ error: "Se requieren ambas contraseñas." });
  }

  if (nuevaContrasena.length < 6) {
    console.log("❌ Contraseña muy corta");
    return res
      .status(400)
      .json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  const query = "SELECT contraseña FROM usuarios_registro WHERE id = $1";

  db.query(query, [usuarioId], async (err, results) => {
    if (err) {
      console.error(
        "❌ Error al buscar usuario para cambio de contraseña:",
        err
      );
      return res.status(500).json({ error: "Error al buscar usuario." });
    }

    console.log("🔍 Resultados de búsqueda de usuario:", results.rows.length);

    if (results.rows.length === 0) {
      console.log("❌ Usuario no encontrado");
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const hashActual = results.rows[0].contraseña;
    console.log("🔑 Hash de contraseña obtenido");

    const coincide = await bcrypt.compare(contrasenaActual, hashActual);
    console.log("⚖️ Coincide contraseña actual:", coincide);

    if (!coincide) {
      return res
        .status(401)
        .json({ error: "La contraseña actual no es correcta." });
    }

    const nuevaHash = await bcrypt.hash(nuevaContrasena, 10);
    console.log("🆕 Nueva contraseña hasheada");

    const updateQuery =
      "UPDATE usuarios_registro SET contraseña = $1 WHERE id = $2";

    db.query(updateQuery, [nuevaHash, usuarioId], (err) => {
      if (err) {
        console.error("❌ Error al actualizar contraseña:", err);
        return res
          .status(500)
          .json({ error: "Error al actualizar contraseña." });
      }

      console.log("✅ Contraseña actualizada exitosamente");
      res.json({ mensaje: "Contraseña actualizada correctamente." });
    });
  });
};

/* ===========================
   Obtener usuario por ID (admin)
=========================== */
const obtenerUsuarioPorId = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT id, nombre, apellido, correo_electronico, numero_telefonico, 
           informacion_adicional, foto_url, rol, activo, verificado 
    FROM usuarios_registro WHERE id = $1
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("❌ Error en obtenerUsuarioPorId:", err);
      return res.status(500).json({ error: "Error al obtener usuario" });
    }

    if (results.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(results.rows[0]);
  });
};

/* ===========================
   Actualizar verificación (admin)
=========================== */
const actualizarVerificacion = (req, res) => {
  const { id } = req.params;
  const verificado = parseInt(req.body.verificado);

  if (verificado !== 0 && verificado !== 1)
    return res.status(400).json({ mensaje: "verificado debe ser 0 o 1" });

  const query = "UPDATE usuarios_registro SET verificado = $1 WHERE id = $2";

  db.query(query, [verificado, id], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ mensaje: "Error al actualizar verificación" });

    res.json({ mensaje: "Estado actualizado correctamente" });
  });
};

/* ===========================
   Actualizar usuario por admin
=========================== */
const actualizarUsuarioPorAdmin = (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    numero_telefonico,
    informacion_adicional,
    rol,
    activo,
    verificado,
  } = req.body;

  const query = `
    UPDATE usuarios_registro 
    SET nombre = $1, apellido = $2, numero_telefonico = $3,
        informacion_adicional = $4, rol = $5, activo = $6, verificado = $7
    WHERE id = $8
  `;

  db.query(
    query,
    [
      nombre,
      apellido,
      numero_telefonico,
      informacion_adicional,
      rol || "usuario",
      activo ?? 1,
      verificado ?? 0,
      id,
    ],
    (err) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al actualizar usuario" });

      res.json({ mensaje: "Usuario actualizado correctamente" });
    }
  );
};

/* ===========================
   Crear usuario administrador (solo super admin)
=========================== */
const crearAdmin = async (req, res) => {
  try {
    const { nombre, apellido, correo_electronico, contraseña } = req.body;

    // Validaciones
    if (!nombre || !apellido || !correo_electronico || !contraseña) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar que el correo no exista
    const existeQuery =
      "SELECT id FROM usuarios_registro WHERE correo_electronico = $1";
    const existeResult = await db.query(existeQuery, [correo_electronico]);

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(contraseña, 10);

    // Insertar usuario admin
    const insertQuery = `
      INSERT INTO usuarios_registro 
      (nombre, apellido, correo_electronico, contraseña, rol, verificado, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nombre, apellido, correo_electronico, rol
    `;

    const values = [nombre, apellido, correo_electronico, hash, "admin", 1, 1];
    const result = await db.query(insertQuery, values);

    console.log("✅ Usuario administrador creado:", result.rows[0]);
    res.status(201).json({
      mensaje: "Usuario administrador creado exitosamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los administradores
const obtenerAdministradores = async (req, res) => {
  try {
    console.log("📥 Solicitud para obtener administradores");

    const query = `
      SELECT id, nombre, apellido, correo_electronico, numero_telefonico, 
             fecha_registro, verificado, activo
      FROM usuarios_registro 
      WHERE rol = 'admin'
      ORDER BY fecha_registro DESC
    `;

    const result = await db.query(query);
    console.log(`✅ ${result.rows.length} administradores encontrados`);

    res.status(200).json({
      administradores: result.rows,
    });
  } catch (err) {
    console.error("❌ Error al obtener administradores:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// Eliminar un administrador
const eliminarAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 Solicitud para eliminar administrador ID: ${id}`);

    // Verificar que el ID sea un número válido
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de administrador inválido." });
    }

    // No permitir eliminar al propio usuario que hace la solicitud
    if (parseInt(id) === req.usuario.id) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar tu propia cuenta." });
    }

    const query = `
      DELETE FROM usuarios_registro 
      WHERE id = $1 AND rol = 'admin'
      RETURNING id, nombre, apellido, correo_electronico
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Administrador no encontrado." });
    }

    console.log("✅ Administrador eliminado:", result.rows[0]);
    res.status(200).json({
      mensaje: "Administrador eliminado correctamente.",
      administrador: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error al eliminar administrador:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  verificarToken: verificarCuenta, // Corregido: usar verificarCuenta
  solicitarRestablecimiento,
  restablecerContraseña: restablecerContrasena, // Corregido: usar restablecerContrasena
  cambiarContraseña: cambiarContrasena, // Corregido: usar cambiarContrasena
  reenviarVerificacion,
  obtenerPerfil,
  actualizarPerfil,
  obtenerAdministradores, // Nueva función
  eliminarAdministrador, // Nueva función
};
