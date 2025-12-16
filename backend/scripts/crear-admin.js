// backend/scripts/crear-admin.js
// Script para crear usuario administrador
const bcrypt = require('bcrypt');
const db = require('../config/db');
require('dotenv').config();

async function crearUsuarioAdmin() {
  const correo = process.argv[2] || 'admin@unac.edu.co';
  const nombre = process.argv[3] || 'Administrador';
  const apellido = process.argv[4] || 'UNAC';
  const contraseña = process.argv[5] || 'Admin123!';
  const rol = 'admin';
  
  console.log('Creando usuario administrador...');
  console.log('Correo:', correo);
  console.log('Nombre:', nombre);
  console.log('Apellido:', apellido);
  
  try {
    // Hashear contraseña
    const saltRounds = 10;
    const hash = await bcrypt.hash(contraseña, saltRounds);
    
    // Insertar usuario
    const query = `
      INSERT INTO usuarios_registro 
      (nombre, apellido, correo_electronico, contraseña, rol, verificado, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [nombre, apellido, correo, hash, rol, 1, 1];
    
    const result = await db.query(query, values);
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('ID:', result.rows[0].id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  crearUsuarioAdmin();
}