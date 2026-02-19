const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

/* =====================================================
   Helper — Normalizar Rol
===================================================== */
const normalizarRol = (rol) => {
  if (!rol) return "usuario";

  const r = rol.toString().toLowerCase().trim();

  if (r.includes("admin")) return "admin";
  if (r.includes("tesorero")) return "tesorero";
  if (r.includes("contador")) return "contador";
  if (r.includes("usuario")) return "usuario";

  return "usuario";
};

/* ===========================
   Registrar usuario (PÚBLICO)
=========================== */
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, correo_electronico, contrasena, rol_id } =
      req.body;

    if (!nombre || !apellido || !correo_electronico || !contrasena) {
      return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    const existe = await db.query(
      "SELECT id FROM usuarios_registro WHERE correo_electronico = $1",
      [correo_electronico],
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ msg: "El correo ya existe" });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    await db.query(
      `
      INSERT INTO usuarios_registro
      (nombre, apellido, correo_electronico, "contraseña", rol_id)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [nombre, apellido, correo_electronico, hash, rol_id || 1],
    );

    res.json({ msg: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("❌ Error registrarUsuario:", error);
    res.status(500).json({ msg: "Error registrando usuario" });
  }
};

/* ===========================
   LOGIN
=========================== */
const loginUsuario = async (req, res) => {
  try {
    const { correo_electronico, contrasena } = req.body;

    if (!correo_electronico || !contrasena) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    const result = await db.query(
      `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo_electronico,
        u."contraseña" AS contrasena,
        u.foto_url,
        r.nombre AS rol
      FROM usuarios_registro u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.correo_electronico = $1
      `,
      [correo_electronico],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) {
      return res.status(401).json({ msg: "Contraseña incorrecta" });
    }

    const rolNormalizado = normalizarRol(usuario.rol);

    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo_electronico,
      rol: rolNormalizado,
      foto: usuario.foto_url,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "unac_clave_secreta_segura",
      { expiresIn: "7d" },
    );

    res.json({ token, usuario: payload });
  } catch (error) {
    console.error("❌ Error loginUsuario:", error);
    res.status(500).json({ msg: "Error en login" });
  }
};

/* ===========================
   Obtener perfil
=========================== */
const obtenerPerfil = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT u.id,
             u.nombre,
             u.apellido,
             u.correo_electronico,
             u.verificado,
             u.numero_telefonico,
             u.informacion_adicional,
             u.foto_url,
             r.nombre AS rol
      FROM usuarios_registro u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
      `,
      [req.usuario.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Perfil no encontrado" });
    }

    const perfil = result.rows[0];
    perfil.rol = normalizarRol(perfil.rol);

    res.json(perfil);
  } catch (error) {
    console.error("❌ Error obtenerPerfil:", error);
    res.status(500).json({ msg: "Error obteniendo perfil" });
  }
};

/* =====================================================
   ✅ ADMIN — CREAR USUARIO (ADMIN / TESORERO)
===================================================== */
const crearUsuarioAdmin = async (req, res) => {
  try {
    if (req.usuario?.rol !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const { nombre, apellido, correo_electronico, contrasena, rol_id } =
      req.body;

    if (!nombre || !apellido || !correo_electronico || !contrasena || !rol_id) {
      return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    if (![2, 3].includes(Number(rol_id))) {
      return res.status(400).json({
        msg: "Solo se permite crear usuarios Administrador o Tesorero",
      });
    }

    const existe = await db.query(
      "SELECT id FROM usuarios_registro WHERE correo_electronico = $1",
      [correo_electronico],
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ msg: "El correo ya existe" });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const result = await db.query(
      `
      INSERT INTO usuarios_registro
      (nombre, apellido, correo_electronico, "contraseña", rol_id)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, nombre, apellido, correo_electronico, rol_id
      `,
      [nombre, apellido, correo_electronico, hash, rol_id],
    );

    res.status(201).json({
      msg: "Usuario creado correctamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error crearUsuarioAdmin:", error);
    res.status(500).json({ msg: "Error creando usuario" });
  }
};

/* ===========================
   ADMIN — Obtener todos usuarios
=========================== */
const obtenerTodosUsuarios = async (req, res) => {
  try {
    if (req.usuario?.rol !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const result = await db.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo_electronico,
        u.fecha_registro,
        r.nombre AS rol
      FROM usuarios_registro u
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.fecha_registro DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obtenerTodosUsuarios:", error);
    res.status(500).json({ msg: "Error obteniendo usuarios" });
  }
};

/* ===========================
   ADMIN — Obtener usuario por ID
=========================== */
const obtenerUsuarioPorId = async (req, res) => {
  try {
    if (req.usuario?.rol !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo_electronico,
        u.numero_telefonico,
        u.informacion_adicional,
        u.foto_url,
        u.verificado,
        r.nombre AS rol,
        u.fecha_registro
      FROM usuarios_registro u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];
    usuario.rol = normalizarRol(usuario.rol);

    res.json(usuario);
  } catch (error) {
    console.error("❌ Error obtenerUsuarioPorId:", error);
    res.status(500).json({ msg: "Error obteniendo usuario" });
  }
};

/* ===========================
   Actualizar perfil
=========================== */
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, numero_telefonico, informacion_adicional } =
      req.body || {};

    let foto_url = null;
    if (req.file) {
      foto_url = req.file.path.replace(/\\/g, "/");
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${index++}`);
      values.push(nombre);
    }

    if (apellido !== undefined) {
      fields.push(`apellido = $${index++}`);
      values.push(apellido);
    }

    if (numero_telefonico !== undefined) {
      fields.push(`numero_telefonico = $${index++}`);
      values.push(numero_telefonico);
    }

    if (informacion_adicional !== undefined) {
      fields.push(`informacion_adicional = $${index++}`);
      values.push(informacion_adicional);
    }

    if (foto_url) {
      fields.push(`foto_url = $${index++}`);
      values.push(foto_url);
    }

    if (fields.length === 0) {
      return res.status(400).json({ msg: "Nada para actualizar" });
    }

    values.push(req.usuario.id);

    const query = `
      UPDATE usuarios_registro
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error actualizarPerfil:", error);
    res.status(500).json({ msg: "Error actualizando perfil" });
  }
};

/* ===========================
   ADMIN — Actualizar usuario
=========================== */
const actualizarUsuario = async (req, res) => {
  try {
    if (req.usuario?.rol !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const { id } = req.params;
    const {
      nombre,
      apellido,
      correo_electronico,
      numero_telefonico,
      informacion_adicional,
      rol_id,
      verificado,
    } = req.body;

    const result = await db.query(
      `
      UPDATE usuarios_registro
      SET nombre = $1,
          apellido = $2,
          correo_electronico = $3,
          numero_telefonico = $4,
          informacion_adicional = $5,
          rol_id = $6,
          verificado = $7
      WHERE id = $8
      RETURNING *
      `,
      [
        nombre,
        apellido,
        correo_electronico,
        numero_telefonico || null,
        informacion_adicional || null,
        rol_id || 1,
        verificado ?? false,
        id,
      ],
    );

    res.json({
      msg: "Usuario actualizado correctamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error actualizarUsuario:", error);
    res.status(500).json({ msg: "Error actualizando usuario" });
  }
};

/* ===========================
  RESTABLECER CONTRASEÑA CON HTML PROFESIONAL
=========================== */
const solicitarRestablecimiento = async (req, res) => {
  try {
    const { correo_electronico } = req.body;
    if (!correo_electronico)
      return res.status(400).json({ msg: "Correo requerido" });

    const result = await db.query(
      "SELECT id, nombre FROM usuarios_registro WHERE correo_electronico = $1",
      [correo_electronico],
    );

    if (result.rows.length === 0) {
      // Mensaje neutral para no filtrar si existe el correo
      return res.json({
        msg: "Si el correo existe, recibirás un enlace de restablecimiento",
      });
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiracion = new Date(Date.now() + 3600 * 1000); // 1 hora

    await db.query(
      "UPDATE usuarios_registro SET reset_token=$1, token_expira=$2 WHERE id=$3",
      [token, expiracion, usuario.id],
    );

    // Generar URL del frontend según entorno
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    const link = `${FRONTEND_URL}/restablecer/${token}`;

    // Configurar nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // HTML del correo
    // HTML del correo con fondo oscuro
    const htmlCorreo = `
  <div style="
      font-family: Arial, sans-serif; 
      background-color: #1e1e1e; 
      color: #f0f0f0; 
      padding: 30px; 
      border-radius: 8px;
  ">
    <h2 style="color: #FF8C00;">Restablece tu contraseña</h2>
    <p>Hola <strong>${usuario.nombre}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón a continuación para continuar:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${link}" 
         style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
         Restablecer contraseña
      </a>
    </p>
    <p>Este enlace expirará en 1 hora. Si no solicitaste el cambio, puedes ignorar este correo.</p>
    <hr style="border: none; border-top: 1px solid #555;" />
    <p style="font-size: 12px; color: #ccc;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
    <p style="font-size: 12px; color: #aaa;">${link}</p>
  </div>
`;

    // Enviar correo
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correo_electronico,
      subject: "Restablecer contraseña",
      html: htmlCorreo,
    });

    res.json({
      msg: "Si el correo está registrado, recibirás un enlace de restablecimiento",
    });
  } catch (error) {
    console.error("❌ Error solicitarRestablecimiento:", error);
    res.status(500).json({ msg: "Error al enviar correo" });
  }
};

const restablecerContrasena = async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
      return res.status(400).json({
        msg: "Token y nueva contraseña requeridos",
      });
    }

    const result = await db.query(
      `SELECT id FROM usuarios_registro
       WHERE reset_token=$1
       AND token_expira > NOW()`,
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        msg: "Token inválido o expirado",
      });
    }

    const usuarioId = result.rows[0].id;
    const hash = await bcrypt.hash(nuevaContrasena, 10);

    await db.query(
      `UPDATE usuarios_registro
       SET "contraseña"=$1,
           reset_token=NULL,
           token_expira=NULL
       WHERE id=$2`,
      [hash, usuarioId],
    );

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error restablecerContrasena:", error);
    res.status(500).json({ msg: "Error actualizando contraseña" });
  }
};

// ===============================
// 🔐 CAMBIAR CONTRASEÑA
// ===============================
const cambiarContrasena = async (req, res) => {
  try {
    const { contrasenaActual, nuevaContrasena } = req.body;
    const userId = req.usuario.id;

    if (!contrasenaActual || !nuevaContrasena) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // Obtener hash actual
    const result = await db.query(
      'SELECT "contraseña" FROM usuarios_registro WHERE id=$1',
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const hashGuardado = result.rows[0].contraseña;

    const coincide = await bcrypt.compare(contrasenaActual, hashGuardado);

    if (!coincide) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const nuevoHash = await bcrypt.hash(nuevaContrasena, 10);

    await db.query('UPDATE usuarios_registro SET "contraseña"=$1 WHERE id=$2', [
      nuevoHash,
      userId,
    ]);

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error cambiarContrasena:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

/* ===========================
   EXPORTAR FUNCIONES
=========================== */
module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  crearUsuarioAdmin,
  obtenerTodosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  actualizarPerfil,
  solicitarRestablecimiento,
  restablecerContrasena,
  cambiarContrasena,
};
