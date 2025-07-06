# 🔌 API Integration Guide - Segurneo Voice Calls

## 📋 **Overview**

Esta documentación describe cómo integrar con la API de InsightCall Portal para enviar llamadas de voz desde Segurneo Voice.

### **Base URL**
```
https://insightcall-portal.onrender.com
```

### **API Versión**
```
v1
```

---

## 🔐 **Autenticación**

Todas las requests requieren autenticación mediante API key en el header:

```http
Authorization: Bearer {API_KEY}
```

**API Key:** `segurneo` (temporal - se proporcionará una definitiva)

---

## 📡 **Endpoints Disponibles**

### **1. 📞 Enviar Llamada de Voz [PRINCIPAL]**

```http
POST /api/v1/nogal/calls
```

Este es el endpoint **principal** para enviar llamadas de voz desde Segurneo.

#### **Headers Requeridos**
```http
Content-Type: application/json
Authorization: Bearer segurneo
```

#### **Payload Structure**
```json
{
  "call_id": "string (UUID)",
  "conversation_id": "string", 
  "agent_id": "string",
  "start_time": "string (ISO 8601)",
  "end_time": "string (ISO 8601)",
  "duration_seconds": "number",
  "status": "completed | failed | abandoned",
  "cost": "number",
  "termination_reason": "string (opcional)",
  "transcript_summary": "string (opcional)",
  "call_successful": "boolean",
  "participant_count": {
    "agent_messages": "number",
    "user_messages": "number", 
    "total_messages": "number"
  },
  "audio_available": "boolean",
  "created_at": "string (ISO 8601)"
}
```

#### **Ejemplo de Request**
```bash
curl -X POST https://insightcall-portal.onrender.com/api/v1/nogal/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer segurneo" \
  -d '{
    "call_id": "550e8400-e29b-41d4-a716-446655440000",
    "conversation_id": "conv_abc123xyz789",
    "agent_id": "agent_001",
    "start_time": "2024-01-15T10:30:00.000Z",
    "end_time": "2024-01-15T10:35:00.000Z", 
    "duration_seconds": 300,
    "status": "completed",
    "cost": 2.50,
    "termination_reason": "call_completed",
    "transcript_summary": "Cliente consultó sobre póliza de auto",
    "call_successful": true,
    "participant_count": {
      "agent_messages": 12,
      "user_messages": 15,
      "total_messages": 27
    },
    "audio_available": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }'
```

#### **Respuestas**

**✅ Éxito (201 Created)**
```json
{
  "success": true,
  "message": "Voice call saved successfully",
  "call_id": "550e8400-e29b-41d4-a716-446655440000",
  "nogal_internal_id": "internal_id_abc123"
}
```

**❌ Error de Validación (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "call_id: Must be a valid UUID",
    "duration_seconds: Must be a positive number"
  ]
}
```

**❌ Llamada Duplicada (409 Conflict)**
```json
{
  "success": false,
  "message": "Voice call already exists",
  "call_id": "550e8400-e29b-41d4-a716-446655440000",
  "errors": ["A voice call with this call_id already exists"]
}
```

---

### **2. 🔍 Consultar Llamada**

```http
GET /api/v1/nogal/calls/{call_id}
```

Obtiene los detalles de una llamada específica.

#### **Ejemplo**
```bash
curl -X GET https://insightcall-portal.onrender.com/api/v1/nogal/calls/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer segurneo"
```

#### **Respuesta**
```json
{
  "success": true,
  "message": "Voice call retrieved successfully",
  "call_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "id": "internal_id_abc123",
    "segurneo_call_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00.000Z",
    // ... otros campos
  }
}
```

---

### **3. 📊 Estadísticas de Llamadas**

```http
GET /api/v1/nogal/calls/stats
```

Obtiene estadísticas básicas de las llamadas procesadas.

---

### **4. ❤️ Health Check**

```http
GET /api/v1/nogal/calls/health
```

Verifica el estado del servicio.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 🎣 **Webhook Alternative (Legacy)**

Si prefieren usar webhook en lugar del endpoint directo:

```http
POST /api/v1/calls/webhook
```

#### **Payload para Webhook**
```json
{
  "event_type": "call.completed",
  "call_data": {
    "externalCallId": "string",
    "conversationId": "string",
    "status": "completed",
    "startTime": "number (unix timestamp)",
    "duration": "number (seconds)",
    "clientData": {
      "phone": "string",
      "name": "string",
      "dni": "string"
    },
    "transcripts": [
      {
        "speaker": "agent | user",
        "text": "string",
        "segment_start_time": "number",
        "segment_end_time": "number",
        "confidence": "number"
      }
    ],
    "metadata": {
      "source": "segurneo-voice"
    }
  }
}
```

---

## 🚨 **Códigos de Error**

| Código | Descripción |
|--------|-------------|
| 200 | ✅ Éxito |
| 201 | ✅ Llamada creada exitosamente |
| 400 | ❌ Error de validación de datos |
| 401 | ❌ API key inválida o faltante |
| 409 | ❌ Llamada duplicada (call_id ya existe) |
| 500 | ❌ Error interno del servidor |

---

## ✅ **Validaciones Requeridas**

### **Campos Obligatorios**
- `call_id` (UUID válido)
- `conversation_id` (string no vacío)
- `agent_id` (string no vacío)
- `start_time` (ISO 8601)
- `end_time` (ISO 8601)
- `duration_seconds` (número positivo)
- `status` (uno de: completed, failed, abandoned)
- `cost` (número >= 0)
- `call_successful` (boolean)
- `participant_count` (objeto con agent_messages, user_messages, total_messages)
- `audio_available` (boolean)
- `created_at` (ISO 8601)

### **Validaciones Específicas**
- `call_id` debe ser un UUID válido
- `duration_seconds` debe ser positivo
- `end_time` debe ser posterior a `start_time`
- `participant_count.total_messages` debe ser >= (agent_messages + user_messages)

---

## 🧪 **Testing**

### **Endpoint de Prueba**
```bash
# Test básico de conectividad
curl -X GET https://insightcall-portal.onrender.com/api/v1/nogal/calls/health \
  -H "Authorization: Bearer segurneo"
```

### **Llamada de Prueba**
```bash
curl -X POST https://insightcall-portal.onrender.com/api/v1/nogal/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer segurneo" \
  -d '{
    "call_id": "test-'$(date +%s)'",
    "conversation_id": "test_conv_001",
    "agent_id": "test_agent",
    "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "end_time": "'$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%S.000Z)'",
    "duration_seconds": 300,
    "status": "completed",
    "cost": 1.50,
    "call_successful": true,
    "participant_count": {
      "agent_messages": 5,
      "user_messages": 8,
      "total_messages": 13
    },
    "audio_available": false,
    "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'
```

---

## 📝 **Logs y Monitoreo**

El sistema registra automáticamente:
- ✅ Llamadas recibidas exitosamente
- ❌ Errores de validación
- 🔄 Llamadas duplicadas
- 📊 Tiempos de procesamiento
- 💾 Estado de la base de datos

---

## 🔄 **Flow de Integración Recomendado**

1. **Configurar Autenticación**
   - Usar API key: `segurneo`
   - Implementar en headers de todas las requests

2. **Implementar Endpoint Principal**
   - Usar `/api/v1/nogal/calls` para envío de llamadas
   - Manejar respuestas de error apropiadamente

3. **Testing Inicial** 
   - Probar con llamadas de prueba
   - Verificar conectividad con health check

4. **Monitoreo**
   - Implementar logs de las respuestas
   - Manejar reintentos para errores 5xx

5. **Producción**
   - Enviar llamadas reales
   - Monitorear códigos de respuesta

---

## 🆘 **Soporte Técnico**

**Contacto:** Pablo Senabre  
**Documentación:** Este archivo  
**Health Check:** `GET /api/v1/nogal/calls/health`  

### **URLs de Referencia**
- **Producción:** https://insightcall-portal.onrender.com
- **Health Check:** https://insightcall-portal.onrender.com/api/v1/nogal/calls/health 