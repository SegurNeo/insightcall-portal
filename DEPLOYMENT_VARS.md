# Variables de Entorno para Deployment en Render

## Variables Requeridas (CRÍTICAS)

Estas variables **DEBEN** estar configuradas en Render, o el deployment fallará:

### Supabase Configuration
```
NOGAL_SUPABASE_URL=https://your-project.supabase.co
NOGAL_SUPABASE_SERVICE_KEY=your-service-role-key
```

### Segurneo Voice API
```
SEGURNEO_VOICE_API_KEY=your-api-key
```

### Gemini AI
```
GEMINI_API_KEY=your-gemini-api-key
```

## Variables Opcionales (con valores por defecto)

Estas variables tienen valores por defecto pero pueden ser personalizadas:

### Server Configuration
```
PORT=3000
NODE_ENV=production
```

### API URLs
```
SEGURNEO_VOICE_API_BASE_URL=https://segurneo-voice.onrender.com/api/v1
NOGAL_API_BASE_URL=https://api.nogal.app/v1
NOGAL_API_TIMEOUT=30000
```

### Authentication
```
NOGAL_API_KEY=optional-api-key-for-nogal-endpoints
```

## Configuración en Render

1. Ve a tu servicio en Render Dashboard
2. Navega a **Environment** tab
3. Agrega cada variable con su valor correspondiente
4. Guarda los cambios
5. Redeploy el servicio

## Verificación Post-Deployment

El deployment exitoso debe mostrar:
- ✅ "Server running on port 3000"
- ✅ "Environment: production"
- ✅ "API base URL: https://insightcall-portal.onrender.com/api/v1"
- ✅ "Conexión con Supabase establecida"

## Errores Comunes

### Error: "Required environment variable X is not set"
- **Solución:** Configura la variable en Render Environment

### Error: "Error al verificar conexión con Supabase"
- **Solución:** Verifica NOGAL_SUPABASE_URL y NOGAL_SUPABASE_SERVICE_KEY

### Error: "API base URL: http://localhost:3000/api/v1"
- **Solución:** Verifica que NODE_ENV=production esté configurado 