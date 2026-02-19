#!/bin/bash

# Script para iniciar el servidor en producción
# Asegúrate de que todas las dependencias están instaladas y el frontend construido

echo "🚀 Iniciando servidor en modo producción..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
  exit 1
fi

# Verificar que el frontend está construido
if [ ! -d "build" ]; then
  echo "❌ Error: No se encontró el directorio build. Ejecuta 'npm run build' primero."
  exit 1
fi

# Verificar variables de entorno
if [ ! -f "backend/.env" ]; then
  echo "❌ Error: No se encontró backend/.env. Crea el archivo con las variables de entorno."
  exit 1
fi

# Iniciar el servidor backend
echo "⚙️  Iniciando servidor backend..."
cd backend
node index.js