# 🎯 **PLAN DE IMPLEMENTACIÓN: TICKETS REALES CON API NOGAL**

## **1. ARQUITECTURA ACTUAL vs OBJETIVO**

### **Estado Actual**
- ✅ Gateway Segurneo Voice procesa llamadas con Eleven Labs
- ✅ Middleware recibe transcripciones y las analiza con Gemini
- ✅ Se crean tickets simulados en localStorage
- ✅ Base de datos Supabase con `processed_calls` y `tickets`

### **Objetivo Final**
- 🎯 Tickets reales creados automáticamente via API Nogal
- 🎯 Integración con tipos de incidencia reales de Nogal
- 🎯 Datos de cliente obtenidos durante la llamada
- 🎯 Un ticket por llamada, sin duplicados
- 🎯 Todo funcionando desde servidor (no local)

---

## **2. TIPOS DE TICKETS NOGAL (Análisis del CSV)**

### **Tipos Principales Identificados:**
```
TIPOS DE INCIDENCIA NOGAL:
├── Nueva contratación de seguros
├── Modificación póliza emitida  
├── Llamada asistencia en carretera
├── Retención de Cliente Cartera
├── Cancelación antes de efecto
├── Llamada gestión comercial
├── Baja cliente en BBDD
├── Reclamación cliente regalo
├── Solicitud duplicado póliza
```

### **Motivos Más Comunes:**
- **Contratación Póliza** (nuevo seguro)
- **Atención al cliente - Modif datos póliza**
- **Cambio nº de cuenta**
- **Siniestros**
- **Retención de Cliente Cartera Llamada**
- **Cancelación antes de efecto llamada**
- **Pago de Recibo**
- **Consulta cliente**

### **Campos Importantes del CSV:**
- `ramo`: hogar/auto/vida/decesos/Salud/otros
- `consideraciones`: Notas específicas para el gestor
- `Tipo de creación`: Manual / Automática / **Exclusiva IA**

---

## **3. MAPEO GEMINI → NOGAL**

### **Mapeo Actual de Acciones:**
```typescript
// ACTUAL (Gemini)          →  FUTURO (Nogal API)
DEVOLUCION_RECIBOS         →  "Llamada gestión comercial" + "Pago de Recibo"
ANULACION_POLIZA          →  "Cancelación antes de efecto" + "Cancelación antes de efecto llamada"  
REGULARIZACION_POLIZA     →  "Modificación póliza emitida" + "Atención al cliente - Modif datos póliza"
CAMBIO_MEDIADOR           →  "Modificación póliza emitida" + "Cambio de mediador"
CONTRASEÑAS              →  "Llamada gestión comercial" + "Consulta cliente"
```

### **Casos Especiales (Exclusiva IA):**
- `Reenvío siniestros` → Cuando se deriva a cola de siniestros
- `Reenvío agentes humanos` → Cuando se deriva a agentes humanos
- `Datos incompletos` → Cuando el cliente no tiene los datos completos

---

## **4. ESTRUCTURA DE DATOS REQUERIDA**

### **A. Datos que debe enviar Segurneo Voice Gateway:**
```typescript
interface CallDataFromGateway {
  // Identificación
  externalCallId: string;
  conversationId: string; // ID de Eleven Labs
  
  // Datos de la llamada
  startTime: number; // Unix timestamp
  duration: number; // segundos
  status: 'completed' | 'failed';
  
  // Transcripción
  transcript: {
    role: 'agent' | 'user';
    message: string;
    timestamp: number; // segundos desde inicio
    confidence: number;
  }[];
  
  // DATOS DEL CLIENTE (obtenidos durante la llamada)
  clientData: {
    dni?: string;
    phone?: string;
    name?: string;
    email?: string;
    codigoCliente?: string; // Si se obtuvo de buscar-cliente
    
    // Datos encontrados por buscar-cliente
    polizas?: {
      numero: string;
      compania: string;
      estado: string;
      ramo: string; // hogar/auto/vida/decesos/Salud/otros
    }[];
    
    incidenciasAbiertas?: {
      codigo: string;
      tipo: string;
      motivo: string;
    }[];
  };
  
  // Metadatos técnicos
  audioQuality?: number;
  language?: string;
  
  // Control de tickets
  ticketCreated?: boolean; // Para evitar duplicados
}
```

### **B. Respuesta de Análisis Gemini (actualizada):**
```typescript
interface GeminiAnalysisResult {
  // Clasificación principal
  tipoIncidencia: string; // Ej: "Llamada gestión comercial"
  motivoGestion: string;  // Ej: "Pago de Recibo"
  ramo?: string;         // hogar/auto/vida/decesos/Salud/otros
  
  // Confianza y prioridad
  confidence: number;    // 0-1
  priority: 'low' | 'medium' | 'high';
  
  // Contexto extraído
  resumenLlamada: string;
  datosExtraidos: {
    numeroPoliza?: string;
    numeroRecibo?: string;
    motivo?: string;
    fechaEfecto?: string;
    // ... otros datos según el tipo
  };
  
  // Control
  requiereTicket: boolean;
  esExclusivaIA: boolean; // Para tipos "Exclusiva IA"
}
```

---

## **5. IMPLEMENTACIÓN PASO A PASO**

### **FASE 1: Preparación Base de Datos**
- [ ] Agregar campo `nogal_ticket_id` a tabla `processed_calls`
- [ ] Agregar campo `ticket_creation_attempted` para evitar duplicados
- [ ] Crear tabla de configuración para mapeo de tipos

### **FASE 2: Actualizar Análisis Gemini**
- [ ] Actualizar prompt para devolver tipos de Nogal
- [ ] Incluir extracción de datos específicos (pólizas, recibos, etc.)
- [ ] Validar que funcione con transcripciones reales

### **FASE 3: Servicio de Integración Nogal**
- [ ] Crear `NogalApiService` con métodos:
  - `buscarCliente()` - Ya disponible durante llamada
  - `crearTicket()` - Nueva implementación
- [ ] Manejar autenticación y whitelist de IP
- [ ] Implementar retry logic y manejo de errores

### **FASE 4: Flujo Completo**
- [ ] Modificar endpoint que recibe datos del Gateway
- [ ] Implementar lógica "un ticket por llamada"
- [ ] Integrar análisis + creación automática
- [ ] Logs completos para debugging

### **FASE 5: Testing y Deployment**
- [ ] Tests con datos reales de desarrollo
- [ ] Configurar IP del servidor en whitelist Nogal
- [ ] Deploy en servidor de producción

---

## **6. ENDPOINTS Y SERVICIOS**

### **A. Nuevo endpoint en Middleware:**
```
POST /api/v1/calls/process-complete
```
Recibe datos completos de Gateway (incluyendo clientData)

### **B. Servicios a implementar:**
```typescript
// server/src/services/nogalApiService.ts
class NogalApiService {
  async crearTicket(payload: NogalTicketPayload): Promise<NogalTicketResponse>
  async buscarCliente(criteria: ClientSearchCriteria): Promise<ClientData>
}

// server/src/services/ticketCreationService.ts  
class TicketCreationService {
  async processCallAndCreateTicket(callData: CallDataFromGateway): Promise<ProcessedCall>
  private shouldCreateTicket(analysis: GeminiAnalysisResult): boolean
  private mapAnalysisToNogalTicket(analysis: GeminiAnalysisResult, clientData: ClientData): NogalTicketPayload
}
```

---

## **7. CONFIGURACIÓN DE PRODUCCIÓN**

### **Variables de Entorno Necesarias:**
```env
# API Nogal
NOGAL_API_BASE_URL=https://datahub.segurosnogal.es:4443
NOGAL_API_TIMEOUT=30000

# Seguridad
NOGAL_WEBHOOK_SECRET=xxx
SERVER_PUBLIC_IP=xxx.xxx.xxx.xxx

# Control de tickets
TICKET_CREATION_ENABLED=true
TICKET_MIN_CONFIDENCE=0.7
```

### **IP Whitelisting:**
- Configurar IP del servidor en Nogal
- Validar conectividad antes del deploy

---

## **8. CRITERIOS DE ÉXITO**

### **Funcionales:**
- ✅ Un ticket por llamada analizada con alta confianza
- ✅ Mapeo correcto de tipos Gemini → Nogal
- ✅ Datos de cliente incluidos automáticamente
- ✅ No duplicados de tickets

### **Técnicos:**
- ✅ Logs completos para debugging
- ✅ Manejo de errores robusto
- ✅ Performance aceptable (<5s por ticket)
- ✅ Monitoring de llamadas fallidas

### **Operacionales:**
- ✅ Dashboard muestra tickets reales
- ✅ Estado de creación visible por llamada
- ✅ Posibilidad de retry manual si falla

---

## **🚀 PRÓXIMOS PASOS INMEDIATOS**

1. **Actualizar estructura de datos** (Base de datos + tipos TypeScript)
2. **Crear servicio NogalApiService** con integración real
3. **Actualizar prompt de Gemini** para tipos de Nogal
4. **Implementar endpoint de procesamiento completo**
5. **Testing con IP en whitelist**

---

**¿Empezamos por algún punto específico?** 🤔 