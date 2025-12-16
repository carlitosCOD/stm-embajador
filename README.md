# Sistema de Referidos UNAC

Sistema de gestión de referidos para la Universidad Nacional de Colombia.

## 🚀 Despliegue en Producción

### Requisitos Previos
- Node.js v16 o superior
- PostgreSQL v12 o superior
- Variables de entorno configuradas

### Pasos para Despliegue

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd STM-EMBAJADOR
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Configurar variables de entorno:**
   - Copiar `backend/.env.example` a `backend/.env`
   - Configurar las credenciales de base de datos y servicios

4. **Construir el frontend:**
   ```bash
   npm run build
   ```

5. **Iniciar el servidor:**
   ```bash
   npm run start
   ```

### Notas Importantes
- Las tablas de base de datos deben estar creadas previamente
- No se ejecutan migraciones automáticas
- El sistema utiliza las tablas existentes en la base de datos

## 🛠️ Desarrollo Local

### Iniciar en modo desarrollo:
```bash
npm run dev
```

Esto iniciará tanto el servidor backend (puerto 5000) como el frontend (puerto 3000).

## 📁 Estructura del Proyecto

```
STM-EMBAJADOR/
├── backend/           # Servidor Node.js/Express
│   ├── config/        # Configuración de base de datos
│   ├── controllers/   # Controladores de la API
│   ├── middleware/    # Middleware de autenticación
│   ├── routes/        # Rutas de la API
│   ├── services/      # Servicios externos
│   └── uploads/       # Archivos subidos
├── src/               # Frontend React
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── styles/        # Hojas de estilo CSS
│   └── contexts/      # Contextos de React
└── public/            # Archivos públicos
```

## 🔐 Variables de Entorno

Crear archivo `backend/.env` con las siguientes variables:

```env
# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_base_datos
DB_USER=usuario
DB_PASSWORD=contraseña

# Cliente Clientify
CLIENTIFY_API_TOKEN=tu_token_de_clientify

# Puerto del servidor
PORT=5000

# Configuración de correo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña
```

## 📞 Soporte

Para cualquier problema con el despliegue, contactar al equipo de desarrollo.