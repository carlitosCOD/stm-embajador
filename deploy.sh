#!/bin/bash

# Script de despliegue para Sistema de Referidos UNAC
# Este script automatiza el proceso de despliegue en producción

echo "🚀 Iniciando despliegue del Sistema de Referidos UNAC..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
  exit 1
fi

echo "✅ Verificando estructura del proyecto..."

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
npm install

# Instalar dependencias del backend
echo "⚙️  Instalando dependencias del backend..."
cd backend
npm install
cd ..

# Construir el frontend
echo "🏗️  Construyendo el frontend..."
npm run build

# Verificar que la construcción fue exitosa
if [ ! -d "build" ]; then
  echo "❌ Error: No se pudo construir el frontend. Verifica los errores."
  exit 1
fi

echo "✅ Construcción completada exitosamente."

# Verificar configuración de variables de entorno
if [ ! -f "backend/.env" ]; then
  echo "⚠️  Advertencia: No se encontró backend/.env"
  echo "Por favor crea el archivo con las variables de entorno necesarias."
fi

echo "📋 Instrucciones finales:"
echo "1. Asegúrate de que la base de datos PostgreSQL está configurada"
echo "2. Verifica que las tablas ya existen en la base de datos"
echo "3. Configura el servicio systemd o PM2 para mantener el servidor corriendo"
echo "4. Inicia el servidor con: npm run start"

echo "🎉 Despliegue preparado. Para iniciar el servidor ejecuta: npm run start"