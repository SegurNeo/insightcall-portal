# 🔄 INTEGRACIÓN SEGURNEO VOICE - SISTEMA DE TICKETS

Este documento describe la **nueva integración con Segurneo Voice** para el envío de tickets a Nogal.

---

## 🎯 **CAMBIOS PRINCIPALES**

### **ANTES** (Envío directo a Nogal)
```
Nuestro Sistema → Nogal API (directo)
• Generábamos: JsonId, Fecha, Hora
• Fallback vía proxy
• Endpoint: https://datahub.segurosnogal.es:4443/api/crear-ticket
```

### **AHORA** (Vía Segurneo Voice)
```
Nuestro Sistema → Segurneo Voice → Nogal API
• Generamos: IdTicket (IA-YYYYMMDD-XXX)
• Segurneo Voice genera: JsonId, Fecha, Hora
• Endpoint único: https://segurneo-voice.onrender.com/api/crear-ticket
```

---

## 🛠️ **IMPLEMENTACIÓN TÉCNICA**

### **1. Nuevos Tipos (`types/calls.types.ts`)**

```typescript
// ✅ NUEVO: Sin campos automáticos
interface NogalTicketPayload {
  IdCliente: string;
  IdTicket: string;        // Generamos nosotros
  IdLlamada: string;
  TipoIncidencia: string;
  MotivoIncidencia: string;
  NumeroPoliza?: string;
  Notas: string;
  // SIN: JsonId, Fecha, Hora (los genera Segurneo Voice)
}

interface NogalTicketResponse {
  success: boolean;
  message: string;
  ticket_id?: string;
  error?: string;
}
```

### **2. Servicio Actualizado (`services/nogalTicketService.ts`)**

**Funcionalidades principales:**
- ✅ **Generación automática de IdTicket**: `IA-YYYYMMDD-XXX`
- ✅ **Envío exclusivo a Segurneo Voice**
- ✅ **Secuencialidad diaria**: Consulta Supabase para el siguiente número
- ✅ **Timeout configurado**: 15 segundos
- ✅ **Logs detallados** para debugging

**Método principal:**
```typescript
async createAndSendTicket(ticketData: Omit<NogalTicketPayload, 'IdTicket'>)
```

**Generación de IDs:**
```typescript
private async generateUniqueTicketId(): Promise<string>
// Resultado: IA-20250108-001, IA-20250108-002, etc.
```

### **3. Endpoint Público Actualizado (`api/v1/crear-ticket.controller.ts`)**

**Cambios en el payload:**
```bash
# ANTES
POST /api/v1/crear-ticket
{
  "IdCliente": "CLI-001",
  "IdTicket": "TICKET-001",     # ← Usuario tenía que proporcionarlo
  "IdLlamada": "call_123",
  "TipoIncidencia": "...",
  "MotivoIncidencia": "...",
  "Notas": "..."
}

# AHORA  
POST /api/v1/crear-ticket
{
  "IdCliente": "CLI-001",
  # IdTicket se genera automáticamente
  "IdLlamada": "call_123", 
  "TipoIncidencia": "...",
  "MotivoIncidencia": "...",
  "Notas": "..."
}
```

### **4. Procesamiento Automático Actualizado**

El sistema automático de procesamiento de llamadas ahora:
1. ✅ Extrae `IdCliente` de tool_results o genera fallback
2. ✅ Usa `IdLlamada` del conversation_id de ElevenLabs  
3. ✅ Genera `IdTicket` automáticamente
4. ✅ Crea notas profesionales del análisis IA
5. ✅ Envía solo a Segurneo Voice (sin fallback)

---

## 🔧 **FLUJO DE DATOS**

### **Automático (desde llamadas procesadas)**
```mermaid
graph LR
    A[Webhook ElevenLabs] --> B[Análisis IA]
    B --> C[Extracción Cliente]
    C --> D[Generación IdTicket]
    D --> E[Envío Segurneo Voice]
    E --> F[Actualización Estado]
```

### **Manual (API pública)**
```mermaid
graph LR
    A[POST /api/v1/crear-ticket] --> B[Validación Campos]
    B --> C[Generación IdTicket]
    C --> D[Envío Segurneo Voice]
    D --> E[Respuesta Cliente]
```

---

## 📋 **GENERACIÓN DE IDs**

### **IdCliente**
- **De tools**: Extraído de `tool_results` en transcripts
- **Fallback**: `CLI_phoneDigits_hash` o `CLI_conversationHash`

### **IdTicket** 
- **Formato**: `IA-YYYYMMDD-XXX`
- **Ejemplo**: `IA-20250108-001`, `IA-20250108-002`
- **Secuencial**: Consulta último del día en Supabase
- **Único**: No se repite nunca

### **IdLlamada**
- **Fuente**: `conversation_id` de ElevenLabs
- **Uso**: Trazabilidad completa

---

## 🧪 **TESTING**

### **Script de Pruebas**
```bash
node server/test-segurneo-voice-integration.js
```

**Pruebas incluidas:**
1. ✅ Validación formato payload
2. ✅ Conectividad Segurneo Voice  
3. ✅ Funcionamiento endpoint local
4. ✅ Validación ejemplos
5. ✅ Generación IDs secuenciales

### **Pruebas Manuales**

**Endpoint de ejemplo:**
```bash
GET /api/v1/crear-ticket/example
```

**Endpoint de conectividad:**
```bash
GET /api/v1/crear-ticket/test
```

**Crear ticket manual:**
```bash
curl -X POST http://localhost:3000/api/v1/crear-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "IdCliente": "CLI-TEST-001",
    "IdLlamada": "test_call_123",
    "TipoIncidencia": "Llamada gestión comercial",
    "MotivoIncidencia": "Consulta cliente", 
    "Notas": "Cliente solicita información sobre póliza"
  }'
```

---

## 📊 **CAMPOS GENERADOS AUTOMÁTICAMENTE**

| Campo | Generado Por | Formato | Ejemplo |
|-------|--------------|---------|---------|
| **IdTicket** | 🟢 Nuestro Sistema | `IA-YYYYMMDD-XXX` | `IA-20250108-001` |
| **JsonId** | 🟡 Segurneo Voice | 4 dígitos | `1234` |
| **Fecha** | 🟡 Segurneo Voice | `DD/MM/YYYY` | `08/01/2025` |
| **Hora** | 🟡 Segurneo Voice | `HH:MM:SS` | `14:30:45` |

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Cambios Breaking**
- ❌ **Eliminado**: Envío directo a Nogal
- ❌ **Eliminado**: Campos JsonId, Fecha, Hora en payload
- ❌ **Eliminado**: IdTicket proporcionado por usuario

### **Compatibilidad**
- ✅ **Mantenido**: Interface pública similar
- ✅ **Mantenido**: Respuestas consistentes  
- ✅ **Mantenido**: Logs y trazabilidad
- ✅ **Mejorado**: Generación automática de IDs

### **Monitoreo**
- ✅ Logs detallados en consola
- ✅ Estados en Supabase: `sent_to_nogal`, `failed_nogal`
- ✅ Metadata completa con timestamps
- ✅ Respuestas de Segurneo Voice guardadas

---

## 🚀 **ESTADO DE IMPLEMENTACIÓN**

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| **🎫 Generación IdTicket** | ✅ **COMPLETADO** | Formato IA-YYYYMMDD-XXX secuencial |
| **📤 Envío Segurneo Voice** | ✅ **COMPLETADO** | Endpoint único, timeout 15s |
| **🔧 Endpoint Público** | ✅ **COMPLETADO** | POST /api/v1/crear-ticket |
| **🤖 Procesamiento Automático** | ✅ **COMPLETADO** | Desde análisis IA |
| **🧪 Suite de Pruebas** | ✅ **COMPLETADO** | Script completo |
| **📋 Documentación** | ✅ **COMPLETADO** | Este documento |

---

## 🎉 **RESULTADO FINAL**

El sistema ahora:
- ✅ **Genera IDs únicos** con formato claro
- ✅ **Envía exclusivamente vía Segurneo Voice**
- ✅ **Simplifica el payload** (sin campos automáticos)
- ✅ **Mantiene trazabilidad completa**
- ✅ **Incluye pruebas automatizadas**
- ✅ **Mejora la robustez** del sistema

**¡La integración está lista para producción!** 🚀 