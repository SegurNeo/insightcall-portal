# 📡 Especificación del Endpoint Nogal Dashboard

**Documentación completa para implementar el endpoint que recibirá datos de llamadas desde Segurneo Voice Middleware**

---

## 🎯 **Resumen**

Nogal Dashboard debe implementar un endpoint REST que reciba información estructurada de llamadas procesadas por ElevenLabs, incluyendo metadatos, transcripciones y análisis.

---

## 📋 **Especificaciones del Endpoint**

### **📌 Información Básica**
- **Método**: `POST`
- **Ruta sugerida**: `/api/calls` o `/api/voice/calls`
- **Content-Type**: `application/json`
- **Autenticación**: Bearer Token (opcional)

### **🔗 URL Completa de Ejemplo**
```
POST https://dashboard.nogal.local/api/calls
Content-Type: application/json
Authorization: Bearer your_api_key_here
```

---

## 📦 **Estructura del Payload**

### **🏗️ Objeto Principal**

```json
{
  "call_id": "uuid",
  "conversation_id": "string", 
  "agent_id": "string",
  "start_time": "ISO8601",
  "end_time": "ISO8601", 
  "duration_seconds": "number",
  "status": "enum",
  "cost": "number",
  "termination_reason": "string",
  "transcript_summary": "string",
  "call_successful": "boolean",
  "participant_count": "object",
  "audio_available": "boolean",
  "created_at": "ISO8601"
}
```

### **📝 Descripción Detallada de Campos**

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `call_id` | UUID | ✅ | ID único interno de Segurneo | `"550e8400-e29b-41d4-a716-446655440000"` |
| `conversation_id` | String | ✅ | ID de conversación de ElevenLabs | `"conv_01jvc3xamxebxsxgkwj4x3eg1m"` |
| `agent_id` | String | ✅ | ID del agente de IA que manejó la llamada | `"WMhcYA8wBYc6uXeKOdhw"` |
| `start_time` | ISO8601 | ✅ | Momento de inicio de la llamada | `"2025-01-27T14:30:00.000Z"` |
| `end_time` | ISO8601 | ✅ | Momento de finalización de la llamada | `"2025-01-27T14:35:30.000Z"` |
| `duration_seconds` | Number | ✅ | Duración total en segundos | `330` |
| `status` | Enum | ✅ | Estado final de la llamada | `"completed"`, `"failed"`, `"abandoned"` |
| `cost` | Number | ✅ | Coste de la llamada en céntimos | `1250` (= 12.50€) |
| `termination_reason` | String | ❌ | Motivo de finalización | `"Client disconnected"`, `"end_call tool was called"` |
| `transcript_summary` | String | ❌ | Resumen automático de la conversación | `"Cliente consulta sobre su póliza Adeslas..."` |
| `call_successful` | Boolean | ✅ | Si la llamada cumplió su objetivo | `true` |
| `participant_count` | Object | ✅ | Estadísticas de participación | Ver estructura abajo |
| `audio_available` | Boolean | ✅ | Si hay audio disponible | `true` |
| `created_at` | ISO8601 | ✅ | Momento de creación del registro | `"2025-01-27T14:36:00.000Z"` |

### **👥 Estructura de `participant_count`**

```json
{
  "participant_count": {
    "agent_messages": 15,
    "user_messages": 12,
    "total_messages": 27
  }
}
```

---

## 🎯 **Ejemplo de Payload Completo**

### **📨 Request Example**

```json
POST /api/calls
Content-Type: application/json
Authorization: Bearer nogal_api_key_here

{
  "call_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "conv_01jvc3xamxebxsxgkwj4x3eg1m", 
  "agent_id": "WMhcYA8wBYc6uXeKOdhw",
  "start_time": "2025-01-27T14:30:00.000Z",
  "end_time": "2025-01-27T14:35:30.000Z",
  "duration_seconds": 330,
  "status": "completed",
  "cost": 1250,
  "termination_reason": "end_call tool was called",
  "transcript_summary": "Cliente consulta sobre el estado de su póliza Adeslas Go. Se verifica DNI 87654321B, se confirma que la póliza está activa con cobertura ambulatoria y cuota mensual de 25.30€. Cliente satisfecho con la información proporcionada.",
  "call_successful": true,
  "participant_count": {
    "agent_messages": 15,
    "user_messages": 12,
    "total_messages": 27
  },
  "audio_available": true,
  "created_at": "2025-01-27T14:36:00.000Z"
}
```

---

## ✅ **Respuestas Esperadas**

### **🎉 Éxito (200 OK)**

```json
{
  "success": true,
  "message": "Call data received successfully",
  "call_id": "550e8400-e29b-41d4-a716-446655440000",
  "nogal_internal_id": "NGH_20250127_001234"
}
```

### **❌ Error de Validación (400 Bad Request)**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "conversation_id is required",
    "duration_seconds must be a positive number"
  ]
}
```

### **🔐 Error de Autenticación (401 Unauthorized)**

```json
{
  "success": false,
  "message": "Invalid or missing API key"
}
```

### **🚫 Error del Servidor (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "Internal server error",
  "error_id": "ERR_20250127_143000"
}
```

---

## 🔐 **Autenticación**

### **Opción 1: Bearer Token (Recomendado)**
```http
Authorization: Bearer nogal_secret_api_key_2025
```

### **Opción 2: API Key Header**
```http
X-API-Key: nogal_secret_api_key_2025
```

### **Opción 3: Sin Autenticación** 
Si Nogal está en red privada y no requiere autenticación.

---

## 🛡️ **Validaciones Requeridas**

### **✅ Campos Obligatorios**
- `call_id` debe ser UUID válido
- `conversation_id` no puede estar vacío
- `agent_id` no puede estar vacío
- `start_time` y `end_time` deben ser ISO8601 válidos
- `duration_seconds` debe ser número positivo
- `status` debe ser: `completed`, `failed`, o `abandoned`

### **✅ Validaciones de Lógica**
- `end_time` debe ser posterior a `start_time`
- `duration_seconds` debe coincidir con la diferencia de tiempo
- `participant_count.total_messages` debe ser suma de `agent_messages` + `user_messages`

### **✅ Validaciones de Duplicados**
- Verificar que `conversation_id` no existe previamente
- En caso de duplicado, responder con `409 Conflict`

---

## 📊 **Manejo de Datos**

### **💾 Almacenamiento Sugerido**

```sql
-- Tabla principal de llamadas
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segurneo_call_id UUID NOT NULL UNIQUE,
  conversation_id VARCHAR(255) NOT NULL UNIQUE,
  agent_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL, 
  duration_seconds INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'failed', 'abandoned')),
  cost_cents INTEGER NOT NULL DEFAULT 0,
  termination_reason TEXT,
  transcript_summary TEXT,
  call_successful BOOLEAN NOT NULL DEFAULT false,
  agent_messages INTEGER NOT NULL DEFAULT 0,
  user_messages INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  audio_available BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL
);
```

### **🔍 Índices Recomendados**

```sql
CREATE INDEX idx_voice_calls_conversation_id ON voice_calls(conversation_id);
CREATE INDEX idx_voice_calls_agent_id ON voice_calls(agent_id);
CREATE INDEX idx_voice_calls_start_time ON voice_calls(start_time);
CREATE INDEX idx_voice_calls_received_at ON voice_calls(received_at);
```

---

## 🔄 **Integración con Dashboard**

### **📈 Métricas Sugeridas**
- Total de llamadas por día/mes
- Duración promedio de llamadas
- Tasa de éxito (`call_successful = true`)
- Distribución por `termination_reason`
- Costes totales por periodo

### **🎯 KPIs Recomendados**
- **Tiempo de respuesta promedio**: Diferencia entre `start_time` y primer mensaje del agente
- **Satisfacción**: Basado en `call_successful` y `termination_reason`
- **Eficiencia**: Ratio `user_messages` / `agent_messages`

---

## 🚨 **Casos Especiales**

### **📞 Llamadas Fallidas**
```json
{
  "status": "failed",
  "termination_reason": "Technical error",
  "call_successful": false,
  "transcript_summary": null,
  "participant_count": {
    "agent_messages": 1,
    "user_messages": 0,
    "total_messages": 1
  }
}
```

### **📞 Llamadas Abandonadas**
```json
{
  "status": "abandoned", 
  "termination_reason": "Client disconnected",
  "call_successful": false,
  "participant_count": {
    "agent_messages": 3,
    "user_messages": 2,
    "total_messages": 5
  }
}
```

---

## 🧪 **Testing del Endpoint**

### **📝 Script de Prueba con cURL**

```bash
#!/bin/bash

# Test basic call data
curl -X POST https://dashboard.nogal.local/api/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "call_id": "550e8400-e29b-41d4-a716-446655440000",
    "conversation_id": "test_conv_123",
    "agent_id": "test_agent_456", 
    "start_time": "2025-01-27T14:30:00.000Z",
    "end_time": "2025-01-27T14:35:30.000Z",
    "duration_seconds": 330,
    "status": "completed",
    "cost": 1250,
    "termination_reason": "end_call tool was called",
    "transcript_summary": "Test call summary",
    "call_successful": true,
    "participant_count": {
      "agent_messages": 5,
      "user_messages": 4,
      "total_messages": 9
    },
    "audio_available": true,
    "created_at": "2025-01-27T14:36:00.000Z"
  }'
```

### **📊 Test Cases Recomendados**

1. **Llamada exitosa completa** ✅
2. **Llamada fallida técnica** ❌  
3. **Llamada abandonada por cliente** 📞❌
4. **Duplicado de `conversation_id`** 🔄
5. **Datos inválidos** ❌
6. **Autenticación incorrecta** 🔐❌

---

## 🔧 **Configuración en Segurneo Voice**

### **Variables de Entorno a Configurar**

```bash
# En Render Dashboard
NOGAL_API_URL=https://dashboard.nogal.local
NOGAL_API_KEY=tu_api_key_secreto_de_nogal
```

### **🎯 Endpoint Final en Segurneo**

El middleware enviará automáticamente a:
```
POST ${NOGAL_API_URL}/api/calls
```

---

## 📋 **Checklist de Implementación**

### **Backend (Nogal)**
- [ ] Endpoint `POST /api/calls` implementado
- [ ] Validación de payload JSON
- [ ] Autenticación API key configurada  
- [ ] Manejo de errores y respuestas correctas
- [ ] Validación de duplicados por `conversation_id`
- [ ] Base de datos preparada con tabla `voice_calls`
- [ ] Índices de performance creados
- [ ] Logging de requests entrantes

### **Frontend (Dashboard)**
- [ ] Vista de listado de llamadas
- [ ] Detalle individual de llamada  
- [ ] Métricas y KPIs en dashboard
- [ ] Filtros por fecha, agente, estado
- [ ] Exportación de datos

### **Testing**
- [ ] Tests unitarios del endpoint
- [ ] Tests de integración con Segurneo
- [ ] Tests de carga y performance
- [ ] Validación de todos los casos edge

---

## 🚀 **¡Listo para Implementar!**

Con esta especificación, el equipo de Nogal puede implementar el endpoint que recibirá perfectamente toda la información de las llamadas procesadas por ElevenLabs a través del middleware de Segurneo Voice.

**¿Alguna duda sobre la implementación?** 🤔 