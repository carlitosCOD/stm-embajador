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
  const {
    nombre,
    apellido,
    correo_electronico,
    numero_telefonico,
    contraseña,
    acepta_privacidad,
  } = req.body;

  if (
    !nombre ||
    !apellido ||
    !correo_electronico ||
    !numero_telefonico ||
    !contraseña ||
    acepta_privacidad !== 1
  ) {
    return res
      .status(400)
      .json({ error: "Faltan campos requeridos o no aceptó privacidad." });
  }

  const correoQuery =
    "SELECT id FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(correoQuery, [correo_electronico], async (err, results) => {
    if (err)
      return res.status(500).json({ error: "Error al verificar el correo." });
    if (results.rows.length > 0)
      return res.status(409).json({ error: "El correo ya está registrado." });

    const hash = await bcrypt.hash(contraseña, 10);
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");

    const insertQuery = `
  INSERT INTO usuarios_registro 
  (nombre, apellido, correo_electronico, numero_telefonico, contraseña, acepta_privacidad, rol, verificado, token_verificacion)
  VALUES ($1, $2, $3, $4, $5, $6, 'usuario', false, $7)
`;

    db.query(
      insertQuery,
      [
        nombre,
        apellido,
        correo_electronico,
        numero_telefonico,
        hash,
        acepta_privacidad,
        tokenVerificacion,
      ],
      (err) => {
        if (err) {
          console.error("❌ Error al insertar usuario en BD:", err);
          return res
            .status(500)
            .json({ error: "Error en el servidor: " + err.message });
        }

        // Enlace de verificación
        const enlace = `${FRONTEND_URL}/verificar/${tokenVerificacion}`;

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: "UNAC Referidos <noresponder@unac.edu.co>",
          to: correo_electronico,
          subject: "Verifica tu cuenta - UNAC Referidos",
          html: `
            <p>Hola ${nombre}, verifica tu cuenta aquí:</p>
            <a href="${enlace}">Verificar cuenta</a>
          `,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error)
            return res
              .status(500)
              .json({ error: "Error al enviar el correo de verificación." });

          res.status(201).json({
            mensaje:
              "Usuario registrado. Revisa tu correo para verificar tu cuenta.",
          });
        });
      }
    );
  });
};

/* ===========================
   Reenviar verificación (FALTABA)
=========================== */
const reenviarVerificacion = async (req, res) => {
  const { correo_electronico } = req.body;

  if (!correo_electronico)
    return res.status(400).json({ error: "Correo requerido" });

  const buscarQuery =
    "SELECT * FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(buscarQuery, [correo_electronico], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error del servidor." });
    if (results.rows.length === 0)
      return res.status(404).json({ error: "Correo no encontrado." });

    const usuario = results.rows[0];

    if (usuario.verificado === 1)
      return res.status(400).json({ error: "La cuenta ya está verificada." });

    const nuevoToken = crypto.randomBytes(32).toString("hex");

    const update =
      "UPDATE usuarios_registro SET token_verificacion = $1 WHERE id = $2";

    db.query(update, [nuevoToken, usuario.id], (err2) => {
      if (err2)
        return res.status(500).json({ error: "Error al generar token." });

      const enlace = `${FRONTEND_URL}/verificar/${nuevoToken}`;

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: "UNAC Referidos <noresponder@unac.edu.co>",
        to: correo_electronico,
        subject: "Reenvío de verificación de cuenta",
        html: `
          <p>Hola ${usuario.nombre}, aquí tienes tu enlace de verificación:</p>
          <a href="${enlace}">Verificar cuenta</a>
        `,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error)
          return res.status(500).json({ error: "Error al enviar correo." });

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
    "SELECT id, correo_electronico, verificado FROM usuarios_registro WHERE token_verificacion = $1";

  db.query(query, [token], (err, results) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al verificar token." });
    if (results.rows.length === 0)
      return res.status(400).json({ mensaje: "Token inválido o ya usado." });

    const usuario = results.rows[0];

    if (usuario.verificado === 1) {
      return res.status(400).json({
        mensaje: "Tu cuenta ya está verificada.",
        correo: usuario.correo_electronico,
      });
    }

    const updateQuery = `
      UPDATE usuarios_registro
      SET verificado = 1, token_verificacion = NULL
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

    // Verificar si el usuario tiene cuenta verificada
    if (usuario.verificado === false || usuario.verificado === 0)
      return res
        .status(403)
        .json({
          error:
            "Debes verificar tu cuenta antes de iniciar sesión. Revisa tu correo.",
        });

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
      { expiresIn: "1d" }
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
  } = req.body;
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

  if (!correo_electronico)
    return res.status(400).json({ error: "El correo es obligatorio." });

  const buscarUsuarioQuery =
    "SELECT * FROM usuarios_registro WHERE correo_electronico = $1";

  db.query(buscarUsuarioQuery, [correo_electronico], (err, results) => {
    if (err) return res.status(500).json({ error: "Error al buscar usuario." });
    if (results.rows.length === 0)
      return res
        .status(404)
        .json({ error: "No existe un usuario con ese correo." });

    const usuario = results.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpira = new Date(Date.now() + 3600000);

    const guardarTokenQuery =
      "UPDATE usuarios_registro SET reset_token = $1, token_expira = $2 WHERE correo_electronico = $3";

    db.query(
      guardarTokenQuery,
      [token, tokenExpira, correo_electronico],
      (err) => {
        if (err)
          return res.status(500).json({ error: "Error al guardar token." });

        const enlace = `${FRONTEND_URL}/restablecer/${token}`;

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: "UNAC Referidos <noresponder@unac.edu.co>",
          to: correo_electronico,
          subject: "Restablece tu contraseña",
          html: `
          <p>Hola ${usuario.nombre}, restablece tu contraseña aquí:</p>
          <a href="${enlace}">Restablecer contraseña</a>
        `,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error)
            return res.status(500).json({ error: "Error al enviar correo." });

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
        { expiresIn: "1d" }
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
          { expiresIn: "1d" }
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
  const usuarioId = req.usuario.id;
  const { contrasenaActual, nuevaContrasena } = req.body;

  if (!contrasenaActual || !nuevaContrasena)
    return res.status(400).json({ error: "Se requieren ambas contraseñas." });

  const query = "SELECT contraseña FROM usuarios_registro WHERE id = $1";

  db.query(query, [usuarioId], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error al buscar usuario." });
    if (results.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado." });

    const hashActual = results.rows[0].contraseña;

    const coincide = await bcrypt.compare(contrasenaActual, hashActual);

    if (!coincide)
      return res
        .status(401)
        .json({ error: "La contraseña actual no es correcta." });

    const nuevaHash = await bcrypt.hash(nuevaContrasena, 10);

    const updateQuery =
      "UPDATE usuarios_registro SET contraseña = $1 WHERE id = $2";

    db.query(updateQuery, [nuevaHash, usuarioId], (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Error al actualizar contraseña." });

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

module.exports = {
  registrarUsuario,
  verificarCuenta,
  reenviarVerificacion,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  eliminarUsuario,
  obtenerUsuarios,
  solicitarRestablecimiento,
  restablecerContrasena,
  loginConGoogle,
  desactivarCuenta,
  cambiarContrasena,
  obtenerUsuarioPorId,
  actualizarVerificacion,
  actualizarUsuarioPorAdmin,
};
