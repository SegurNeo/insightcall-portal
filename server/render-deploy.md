# Despliegue en Render.com - InsightCall Backend

## 🚀 Pasos para Desplegar

### 1. Crear Cuenta en Render.com
- Ve a [render.com](https://render.com)
- Regístrate o inicia sesión
- Conecta tu cuenta de GitHub

### 2. Crear Nuevo Web Service
1. Click en "New +" → "Web Service"
2. Conecta tu repositorio GitHub: `insightcall-portal`
3. Configurar el servicio:

**Configuración Básica:**
- **Name**: `insightcall-backend`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Variables de Entorno
Agregar estas variables en la sección "Environment":

```bash
NODE_ENV=production
PORT=3000
NOGAL_SUPABASE_URL=https://zfmrknubpbzsowfatnbq.supabase.co
NOGAL_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbXJrbnVicGJ6c293ZmF0bmJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzYxMzEwMCwiZXhwIjoyMDYzMTg5MTAwfQ.iC5KEm96VYSEn
SEGURNEO_VOICE_API_KEY=segurneo
SEGURNEO_VOICE_BASE_URL=https://segurneo-voice.onrender.com/api/v1
GEMINI_API_KEY=AIzaSyABJdVOqFThq3lAOe6M9BLwdcvLbz1d6m8
NOGAL_API_BASE_URL=https://api.nogal.app/v1
NOGAL_API_TIMEOUT=30000
```

### 4. Configuración Avanzada
- **Health Check Path**: `/health`
- **Auto-Deploy**: Habilitado
- **Plan**: Free (para empezar)

### 5. Desplegar
1. Click en "Create Web Service"
2. Render automáticamente:
   - Clonará tu repositorio
   - Instalará dependencias
   - Construirá la aplicación
   - La desplegará

### 6. Obtener URL del Backend
Una vez desplegado, obtendrás una URL como:
`https://insightcall-backend.onrender.com`

## 🔧 Configurar Frontend

### 1. Actualizar Variables de Entorno del Frontend
Agregar a tu `.env` local y en Netlify:

```bash
VITE_API_URL=https://insightcall-backend.onrender.com
```

### 2. Redesplegar Frontend en Netlify
El frontend automáticamente se conectará al nuevo backend.

## 🔍 Verificar Despliegue

### 1. Health Check
Visita: `https://insightcall-backend.onrender.com/health`

Deberías ver:
```json
{
  "status": "OK",
  "message": "Nogal Voice API is healthy",
  "timestamp": "2024-..."
}
```

### 2. Endpoints Disponibles
- `GET /health` - Health check
- `GET /api/v1/calls` - Lista de llamadas
- `POST /api/v1/calls/webhook` - Webhook de Segurneo
- `POST /api/v1/nogal/calls` - Endpoint para Segurneo
- `GET /api/v1/nogal/calls/health` - Health check específico

## 🛠️ Troubleshooting

### Si el despliegue falla:
1. Revisar logs en Render dashboard
2. Verificar que todas las variables de entorno estén configuradas
3. Asegurar que el `package.json` tenga el script `build`

### Si no conecta con Supabase:
1. Verificar que `NOGAL_SUPABASE_URL` y `NOGAL_SUPABASE_SERVICE_KEY` sean correctos
2. Revisar logs de la aplicación

### Si el frontend no conecta:
1. Verificar que `VITE_API_URL` esté configurado correctamente
2. Revisar CORS en el backend
3. Verificar que el backend esté respondiendo

## 📞 Configurar Webhook de Segurneo

Una vez desplegado, configura en Segurneo Voice:
```
Webhook URL: https://insightcall-backend.onrender.com/api/v1/calls/webhook
API Key: segurneo
```

## 🎯 Próximos Pasos

1. **Monitoreo**: Configurar alertas en Render
2. **Escalado**: Considerar plan pago si hay mucho tráfico
3. **Dominio**: Configurar dominio personalizado si es necesario
4. **SSL**: Render incluye SSL automáticamente

---

**¡Tu backend estará listo para recibir llamadas de Segurneo!** 🚀 