# 🚀 Configuración de Variables de Entorno en Render

## 📋 **Variables OBLIGATORIAS para configurar en Render**

Ve a tu servicio en Render → **Environment** y agrega estas variables:

### 🔑 **Variables Críticas**
```
NOGAL_SUPABASE_URL=https://zfmrknubpbzsowfatnbq.supabase.co
NOGAL_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbXJrbnVicGJ6c293ZmF0bmJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzYxMzEwMCwiZXhwIjoyMDYzMTg5MTAwfQ.iC5KEm96VYSEn
SEGURNEO_VOICE_API_KEY=segurneo
GEMINI_API_KEY=AIzaSyABJdVOqFThq3lAOe6M9BLwdcvLbz1d6m8
NODE_ENV=production
```

### 🔧 **Variables Opcionales** (tienen valores por defecto)
```
PORT=3000
SEGURNEO_VOICE_API_BASE_URL=https://segurneo-voice.onrender.com/api/v1
NOGAL_API_BASE_URL=https://api.nogal.app/v1
NOGAL_API_TIMEOUT=30000
```

## 📝 **Pasos para configurar:**

1. **Ir a Render Dashboard** → Tu servicio InsightCall Portal
2. **Hacer clic en "Environment"** (pestaña lateral)
3. **Agregar cada variable** con "Add Environment Variable"
4. **Copiar y pegar** exactamente los valores de arriba
5. **Guardar cambios**
6. **Hacer clic en "Manual Deploy"** para forzar redeploy

## ✅ **Verificación post-deployment:**

Una vez configuradas las variables, el log debe mostrar:

```
✅ Server running on port 3000
✅ Environment: production
✅ API base URL: https://insightcall-portal.onrender.com/api/v1
✅ Conexión con Supabase establecida. Total de llamadas: X
✅ Your service is live 🎉
```

## 🚨 **Si aparecen errores:**

### Error: "Required environment variable X is not set"
- **Causa**: Falta configurar una variable obligatoria
- **Solución**: Revisar que todas las variables estén en Render Environment

### Error: "Error al verificar conexión con Supabase: { message: '' }"
- **Causa**: Variables de Supabase incorrectas
- **Solución**: Verificar NOGAL_SUPABASE_URL y NOGAL_SUPABASE_SERVICE_KEY

### Build falla con "MODULE_NOT_FOUND"
- **Causa**: Dependencia faltante (ya corregido)
- **Solución**: El nuevo código incluye todas las dependencias

## 🎯 **URL final:**
Una vez configurado: https://insightcall-portal.onrender.com 