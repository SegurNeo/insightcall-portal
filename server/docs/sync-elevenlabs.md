# Sincronización Masiva de Eleven Labs

## 📋 Descripción

Este sistema permite sincronizar automáticamente todas las llamadas de Eleven Labs desde SegurneoVoice, analizarlas y crear tickets en el ERP de Nogal basándose en las categorías definidas en `tickets_nogal.csv`.

## 🔧 Componentes Principales

### 1. **Sincronización con SegurneoVoice**
- Se conecta a la API de SegurneoVoice Gateway
- Descarga todas las llamadas disponibles con sus transcripciones
- Almacena los datos en Supabase

### 2. **Análisis con IA**
- Utiliza Google Gemini para analizar las transcripciones
- Clasifica automáticamente según las categorías del CSV
- Detecta el tipo de incidencia y motivo de gestión

### 3. **Creación de Tickets en Nogal**
- Crea tickets automáticamente si la confianza es >= 70%
- Usa las categorías exactas del archivo `tickets_nogal.csv`
- Incluye justificación y score de confianza

## 🚀 Uso

### Opción 1: Script de Línea de Comandos

```bash
# Sincronizar todas las llamadas
npm run sync:elevenlabs

# Sincronizar un rango de fechas específico
npm run sync:elevenlabs -- --start-date=2024-01-01 --end-date=2024-12-31

# Forzar reprocesamiento de llamadas ya analizadas
npm run sync:elevenlabs -- --force-reprocess

# Cambiar tamaño de página (por defecto 50)
npm run sync:elevenlabs -- --page-size=100
```

### Opción 2: API REST

```bash
# Endpoint para sincronización masiva
POST /api/v1/calls/sync/elevenlabs

# Body (opcional)
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "forceReprocess": false,
  "pageSize": 50
}
```

## 📊 Proceso de Sincronización

1. **Obtención de Llamadas**
   - Se conecta a SegurneoVoice
   - Descarga todas las llamadas del período especificado
   - Guarda en la tabla `processed_calls`

2. **Análisis de Transcripciones**
   - Lee las transcripciones de cada llamada
   - Usa Gemini AI para entender el contexto
   - Clasifica según `tickets_nogal.csv`

3. **Creación de Tickets**
   - Si la confianza >= 70%, crea ticket automático
   - Incluye:
     - Tipo de incidencia
     - Motivo de gestión
     - Notas con score de IA
     - Justificación

## 📈 Categorías de Tickets

Las categorías se definen en `server/tickets_nogal.csv` e incluyen:

- **Nueva contratación de seguros**
- **Modificación póliza emitida**
- **Llamada asistencia en carretera**
- **Retención de Cliente Cartera**
- **Cancelación antes de efecto**
- **Llamada gestión comercial**
- **Baja cliente en BBDD**
- **Reclamación cliente regalo**
- **Solicitud duplicado póliza**

Cada categoría tiene asociado:
- Motivo de gestión específico
- Consideraciones especiales
- Necesidad del cliente
- Tipo de creación (Manual/Automática/Exclusiva IA)

## 🔍 Monitoreo

El sistema proporciona información detallada:

```
📈 RESUMEN DE SINCRONIZACIÓN
═══════════════════════════════
📞 Total de llamadas: 150
✅ Procesadas: 120
🎫 Tickets creados: 85
⏭️  Omitidas: 25
❌ Errores: 5
═══════════════════════════════
```

## ⚙️ Configuración

Asegúrate de tener configuradas las siguientes variables de entorno:

```env
# SegurneoVoice Gateway
SEGURNEO_VOICE_API_KEY=tu_api_key
SEGURNEO_VOICE_BASE_URL=https://segurneo-voice.onrender.com/api/v1

# Google Gemini (para análisis IA)
GEMINI_API_KEY=tu_gemini_key

# Supabase
NOGAL_SUPABASE_URL=tu_supabase_url
NOGAL_SUPABASE_SERVICE_KEY=tu_supabase_key

# API de Nogal
NOGAL_API_BASE_URL=https://datahub.segurosnogal.es:4443
```

## 🛠️ Solución de Problemas

### Error: "No transcripts available"
- La llamada no tiene transcripciones disponibles
- Verificar en SegurneoVoice que la llamada se completó correctamente

### Error: "Client not found"
- No se pudo identificar al cliente en la transcripción
- El ticket se creará con cliente temporal

### Tickets no se crean
- Verificar que el score de confianza sea >= 70%
- Revisar los logs para ver la clasificación de la IA
- Comprobar que las categorías coincidan con `tickets_nogal.csv`

## 📝 Logs

Los logs detallados se muestran en consola e incluyen:
- Estado de cada llamada procesada
- Clasificación de IA y score
- Tickets creados con sus IDs
- Errores específicos por llamada 