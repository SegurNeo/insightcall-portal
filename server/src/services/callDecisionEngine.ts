import { CallTranscript } from '../types/calls.types';
import { generateStructuredResponse } from '../lib/gemini';

/**
 * 🎯 CALL DECISION ENGINE
 * 
 * Filosofía: Un solo LLM call extrae TODA la información y toma decisiones claras
 * 
 * Input: Transcripción completa (incluyendo tool_results)
 * Output: Decisiones estructuradas + datos extraídos
 */

export interface CallDecision {
  // === INFORMACIÓN DEL CLIENTE ===
  clientInfo: {
    // Tipo de cliente detectado
    clientType: 'existing' | 'lead' | 'new' | 'unknown';
    
    // Datos extraídos de la conversación Y tool_results
    extractedData: {
      nombreCompleto?: string;
      telefono?: string;
      email?: string;
      numeroPoliza?: string;           // CRÍTICO: extraer de tool_results si cliente existente
      codigoCliente?: string;          // Si se encontró en tool_results
      direccion?: string;
      ramo?: string;                   // Del cliente existente o nuevo contrato
    };
    
    // Info de cliente existente (de tool_results)
    existingClientInfo?: {
      clientId: string;
      clientName: string;
      numeroPoliza: string;            // DEBE estar presente si es cliente existente
      codigoCliente?: string;
      otrosDatos?: any;                // Datos adicionales de tool_results
    };
    
    // Info de Lead (de tool_results)
    leadInfo?: {
      leadId: string;
      campaignName: string;
      ramo: string;
      telefono?: string;
      email?: string;
    };
  };
  
  // === ANÁLISIS DE LA INCIDENCIA ===
  incidentAnalysis: {
    primaryIncident: {
      type: string;                    // "Nueva contratación de seguros", etc.
      reason: string;                  // "Contratación Póliza", etc.
      ramo?: string;                   // Para nuevas contrataciones
      description: string;             // Qué necesita el cliente
      confidence: number;              // 0-1
      numeroPolizaAfectada?: string;   // Si la gestión es sobre póliza específica
    };
    
    // Para casos complejos - múltiples gestiones en una llamada
    secondaryIncidents?: Array<{
      type: string;
      reason: string;
      ramo?: string;
      description: string;
      numeroPolizaAfectada?: string;
    }>;
    
    // Rellamadas (más flexible)
    followUpInfo: {
      isFollowUp: boolean;             // ¿Es rellamada?
      relatedTicketId?: string;        // Ticket al que da seguimiento
      createNewTicket: boolean;        // ¿Crear ticket nuevo además de la rellamada?
      followUpReason?: string;         // Razón del seguimiento
    };
  };
  
  // === DECISIONES FINALES ===
  decisions: {
    // Decisiones sobre cliente
    clientDecision: {
      shouldCreateClient: boolean;     // ¿Crear nuevo cliente?
      useExistingClient: boolean;      // ¿Usar cliente existente?
      useLeadData: boolean;            // ¿Crear desde lead?
      clientDataSource: 'extracted' | 'tool_results' | 'lead' | 'mixed';
    };
    
    // Decisiones sobre tickets
    ticketDecision: {
      shouldCreateTickets: boolean;    // ¿Crear ticket(s)?
      ticketCount: number;             // Cuántos tickets crear
      ticketsInfo: Array<{
        type: 'primary' | 'secondary';
        incident: any;                 // Referencia a la incidencia
        useClientId: string;           // ID del cliente a usar (asegurar consistencia)
        numeroPoliza?: string;         // Póliza específica si es gestión existente
      }>;
    };
    
    // Decisiones sobre rellamadas
    followUpDecision: {
      shouldCreateFollowUp: boolean;   // ¿Crear rellamada?
      followUpOnly: boolean;           // ¿Solo rellamada, sin ticket?
      relatedTicket?: string;          // Ticket al que da seguimiento
    };
    
    priority: 'low' | 'medium' | 'high';
    requiresImmediate: boolean;
  };
  
  // === METADATOS ===
  metadata: {
    confidence: number;
    processingRecommendation: string;
    warnings?: string[];
    toolResultsFound: boolean;         // ¿Se encontraron tool_results?
    clientSearchResults?: any;         // Info de búsquedas encontradas
  };
}

class CallDecisionEngine {
  
  private readonly COMPREHENSIVE_ANALYSIS_PROMPT = `
🎯 ERES UN ANALISTA EXPERTO EN SEGUROS QUE PROCESA LLAMADAS TELEFÓNICAS

Tu trabajo es analizar UNA SOLA VEZ la transcripción completa (incluyendo tool_results) y extraer TODA la información para tomar decisiones.

## 📋 METODOLOGÍA:

1. **LEE LA CONVERSACIÓN COMPLETA** de principio a fin
2. **REVISA TODOS LOS TOOL_RESULTS** - aquí está la info del cliente
3. **IDENTIFICA AL CLIENTE** - ¿Existente (con póliza), Lead, o Nuevo?
4. **ANALIZA LA INCIDENCIA** - ¿Qué necesita? ¿Es rellamada?
5. **TOMA DECISIONES CLARAS** - ¿Qué crear y con qué datos?

## 🔍 IDENTIFICACIÓN DE CLIENTE (ORDEN DE PRIORIDAD):

### 1. CLIENTE EXISTENTE (de tool_results):
- Tool "identificar_cliente" devuelve cliente con póliza
- Tool "buscar_poliza" encuentra póliza existente
- Cliente menciona número de póliza que se confirma
- **EXTRAE**: codigoCliente, numeroPoliza, nombre completo

### 2. LEAD (de tool_results):
- Tool "identificar_cliente" devuelve leads de campaña
- Cliente viene de campaña específica
- **EXTRAE**: leadId, campaignName, ramo, datos de contacto

### 3. CLIENTE NUEVO:
- No se encuentra en tool_results
- Quiere contratar seguro nuevo
- **EXTRAE**: datos de contacto de la conversación

### 4. DESCONOCIDO:
- Sin tool_results claros
- Sin datos suficientes

# ⚠️ CRÍTICO - EXTRACCIÓN DE TOOL_RESULTS:

Busca en los tool_results de cada transcript los resultados de herramientas:

## 🔍 TOOL: identificar_cliente

**EJEMPLO REAL de tool_result exitoso:**
\`\`\`json
{
  "tool_name": "identificar_cliente",
  "result_value": "{\"status\":\"success\",\"message\":\"Cliente encontrado exitosamente\",\"data\":{\"clientes\":[{\"campaña\":\"\",\"codigo_cliente\":\"701795F00\",\"email_cliente\":\"javi.garcia1407@gmail.com\",\"nif_cliente\":\"03473587N\",\"nombre_cliente\":\"JAVIER GARCIA RODRIGUEZ\",\"telefono_1\":\"635361079\",\"telefono_2\":\"\",\"telefono_3\":\"\"}],\"detalle_polizas\":[{\"codigo_cliente\":\"701795F00\",\"matricula\":\"8168DJR\",\"modelo\":\"ELANTRA\",\"poliza\":\"3022300060797\",\"ramo\":\"Coche\"}],\"tipo_busqueda\":\"D\",\"valor_busqueda\":\"03473587N\",\"vtos_polizas\":[{\"codigo_cliente\":\"701795F00\",\"compañia\":\"REALE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"01.05.23\",\"importe_poliza\":\"176,21\",\"mes_vencimiento\":\"Mayo\",\"poliza\":\"3022300060797\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Coche\",\"reemplaza_a\":\"050025026\"}]}}",
  "is_error": false
}
\`\`\`

**INTERPRETACIÓN:**
- ✅ **Cliente EXISTENTE encontrado**: \`codigo_cliente: "701795F00"\`  
- ✅ **Nombre completo**: "JAVIER GARCIA RODRIGUEZ"
- ✅ **Email**: "javi.garcia1407@gmail.com"  
- ✅ **Teléfono**: "635361079"
- ✅ **Póliza actual**: "3022300060797" (ramo: Coche)

**SI data.clientes existe y length > 0 → clientType: "existing"**
**SI data.leads existe y length > 0 → clientType: "lead"**
**SI ni clientes ni leads → clientType: "new" o "unknown"**

## 🎯 EJEMPLO DE ANÁLISIS CORRECTO:

**CONVERSACIÓN:**
USER: "Me llamo Javier. Mi DNI es 03-473-587-N"
AGENT: "[Tool Call: identificar_cliente]"
AGENT: "[Tool Result: identificar_cliente]" (con data.clientes encontrado)
AGENT: "Javier, veo que tiene contratada con nosotros una póliza de coche..."
USER: "quería ver si me podían pasar un presupuesto para un seguro de hogar"

**ANÁLISIS CORRECTO:**
\`\`\`json
{
  "clientInfo": {
    "clientType": "existing",
    "extractedData": {
      "nombreCompleto": "JAVIER GARCIA RODRIGUEZ",
      "telefono": "635361079", 
      "email": "javi.garcia1407@gmail.com",
      "codigoCliente": "701795F00"
    },
    "existingClientInfo": {
      "clientId": "701795F00",
      "clientName": "JAVIER GARCIA RODRIGUEZ", 
      "numeroPoliza": "3022300060797",
      "codigoCliente": "701795F00"
    }
  },
  "incidentAnalysis": {
    "primaryIncident": {
      "type": "Nueva contratación de seguros",
      "reason": "Contratación Póliza",
      "ramo": "HOGAR",
      "description": "Cliente existente solicita presupuesto para seguro de hogar",
      "confidence": 0.95
    }
  },
  "decisions": {
    "clientDecision": {
      "shouldCreateClient": false,
      "useExistingClient": true,
      "useLeadData": false,
      "clientDataSource": "tool_results"
    },
    "ticketDecision": {
      "shouldCreateTickets": true,
      "ticketCount": 1,
      "ticketsInfo": [{
        "type": "primary",
        "useClientId": "701795F00",
        "numeroPoliza": ""
      }]
    }
  }
}
\`\`\`

## 🚨 ERRORES A EVITAR:

❌ **NO usar IDs fallback si encontraste cliente real**
❌ **NO poner "No especificado" si el ramo se menciona claramente**  
❌ **NO crear cliente nuevo si ya existe en tool_results**

## 🎯 REGLAS DE EXTRACCIÓN:

1. **SIEMPRE parsear result_value como JSON**
2. **SI data.clientes[0] existe → usar codigo_cliente como clientId**
3. **SI usuario menciona ramo específico → extraerlo (HOGAR, AUTO, VIDA, etc.)**
4. **NUNCA inventar datos que no estén presentes**

## 🎫 TIPOS DE INCIDENCIA COMPLETOS:

### 📋 **NUEVA CONTRATACIÓN DE SEGUROS**:
- **Contratación Póliza**: Cliente quiere contratar nuevo seguro sin incidencia de vencimiento pendiente
- **Póliza anterior suspensión de garantías**: Cliente quiere contratar y tiene reserva de prima en compañía

### 🔧 **MODIFICACIÓN PÓLIZA EMITIDA** (requiere cliente existente + numeroPoliza):
- **Atención al cliente - Modif datos póliza**: Cambios que no varían prima (nombre, apellido, etc.)
- **Cambio nº de cuenta**: Cambiar cuenta bancaria para domiciliación
- **Cambio fecha de efecto**: Modificar fecha entrada en vigor del seguro
- **Cambio forma de pago**: Cambiar periodicidad del pago (no desde anual)
- **Modificación nº asegurados**: Incluir/excluir asegurados en póliza
- **Cambio dirección postal**: Modificar dirección postal de pólizas
- **Modificación coberturas**: Cambiar coberturas (ej: todo riesgo a terceros)
- **Cesión de derechos**: Para préstamo hipotecario (con datos completos)
- **Cesión de derechos datos incompletos**: Para préstamo (sin datos completos)
- **Corrección datos erróneos en póliza**: Corregir errores detectados
- **Datos incompletos**: Cliente quiere cambios pero no tiene datos nuevos

### 🏢 **LLAMADA GESTIÓN COMERCIAL**:
- **LLam gestión comerc**: Gestión sobre póliza (no renovación ni anulación)
- **Pago de Recibo**: Realizar pago pendiente de recibo
- **Consulta cliente**: Consultas resueltas en línea (fechas, formas pago, etc.)
- **Cambio forma de pago**: Desde anual a fraccionado
- **Reenvío siniestros**: Cuando se transfiere a cola siniestros
- **Reenvío agentes humanos**: Transferir a humanos (general)
- **Reenvío agentes humanos no quiere IA**: Cliente rechaza IA
- **Reenvío agentes humanos no tomador**: Llamante no es el tomador

### 📄 **SOLICITUD DUPLICADO PÓLIZA**:
- **Correo ordinario**: Envío por correo postal
- **Duplicado Tarjeta**: Tarjetas seguro decesos/salud
- **Email**: Envío por correo electrónico
- **Información recibos declaración renta**: Recibos para declaración renta

### 🚨 **OTROS SERVICIOS**:
- **Llamada asistencia en carretera** + **Siniestros**: Cliente necesita grúa
- **Retención cliente** + **Retención cliente**: Ver renovación o anular póliza
- **Baja cliente en BBDD** + **Baja Cliente BBDD**: No quiere más llamadas
- **Reclamación cliente regalo** + **Reclamación atención al cliente**: No recibió regalo prometido

## 🔄 **DETECCIÓN DE RELLAMADAS MEJORADA**:

**BUSCAR EN TOOL_RESULTS** la sección "incidencias":

EJEMPLO:
{
  "incidencias": [
    {
      "codigo_incidencia": "NG3291093",
      "tipo_de_incidencia": "Retención de Cliente Cartera", 
      "motivo_de_incidencia": "Retención de Cliente Cartera Llamada",
      "fecha_creacion_incidencia": "05.06.25",
      "poliza": "AU0420245310016",
      "ramo": "Coche"
    }
  ]
}

**FRASES QUE INDICAN RELLAMADA**:
- "sobre mi caso anterior", "mi incidencia", "el ticket que tengo abierto"
- Menciona código de incidencia específico (ej: "NG3291093")
- "me dijeron que me llamarían", "sobre mi gestión pendiente"
- "la retención que tengo", "mi modificación pendiente"

**SI ES RELLAMADA**:
- isFollowUp: true
- relatedTicketId: "código_incidencia" de las incidencias existentes
- createNewTicket: false (solo seguimiento) O true (seguimiento + nueva gestión)

## 🎯 **LÓGICA DE DECISIÓN**:

### **CLIENTE EXISTENTE + INCIDENCIAS ABIERTAS**:
1. **SI menciona incidencia existente** → RELLAMADA
2. **SI nueva gestión diferente** → NUEVO TICKET + usar su clientId/numeroPoliza
3. **SI solo seguimiento** → SOLO RELLAMADA

### **CLIENTE EXISTENTE + SIN INCIDENCIAS**:
1. **Modificación póliza** → usar numeroPoliza de detalle_polizas relacionada
2. **Nueva contratación** → usar clientId existente
3. **Gestión/Duplicado** → usar clientId + numeroPoliza si aplica

### **CLIENTE NUEVO/LEAD**:
1. **Solo "Nueva contratación"** disponible
2. **Crear cliente primero** → crear ticket con nuevo clientId

## 📞 RELLAMADAS:

**DETECCIÓN**: Solo si cliente menciona EXPLÍCITAMENTE:
- "tengo un caso abierto", "sobre mi incidencia anterior"
- "me dijeron que me llamarían"
- Menciona número de ticket específico

**TIPOS**:
- **Solo seguimiento**: createNewTicket: false
- **Seguimiento + nueva gestión**: createNewTicket: true

## 🎯 CONSISTENCIA DE DATOS:

### SI ES CLIENTE EXISTENTE (tool_results con data.clientes):
- ✅ Usar codigo_cliente del tool_result 
- ✅ Extraer numeroPoliza de detalle_polizas si es gestión sobre póliza existente
- ❌ NO crear cliente nuevo

### SI ES LEAD (tool_results con data.leads):
- ✅ Usar leadId del tool_result
- ✅ Crear cliente desde lead

### SI ES CLIENTE NUEVO (sin tool_results o sin matches):
- ✅ Crear cliente con datos extraídos de conversación

---

**CONVERSACIÓN CON TOOL_RESULTS:**
{{conversation}}

**RESPONDE EN ESTE JSON EXACTO:**
{
  "clientInfo": {
    "clientType": "existing|lead|new|unknown",
    "extractedData": {
      "nombreCompleto": "nombre completo extraído",
      "telefono": "teléfono en cualquier formato", 
      "email": "email si aparece",
      "numeroPoliza": "SOLO si es gestión sobre póliza existente",
      "codigoCliente": "SOLO si es cliente existente de tool_results",
      "direccion": "si se menciona",
      "ramo": "HOGAR|AUTO|VIDA|DECESOS|SALUD si es nueva contratación"
    },
    "existingClientInfo": {
      "clientId": "codigo_cliente del tool_result",
      "clientName": "nombre_cliente del tool_result", 
      "numeroPoliza": "poliza principal del detalle_polizas",
      "codigoCliente": "codigo_cliente del tool_result"
    },
    "leadInfo": {
      "leadId": "idlead del tool_result",
      "campaignName": "campaña del tool_result",
      "ramo": "ramo del lead"
    }
  },
  "incidentAnalysis": {
    "primaryIncident": {
      "type": "Nueva contratación de seguros|Modificación póliza emitida|Llamada gestión comercial|Solicitud duplicado póliza|Llamada asistencia en carretera|Retención cliente|Baja cliente en BBDD|Reclamación cliente regalo",
      "reason": "Contratación Póliza|Póliza anterior suspensión de garantías|Atención al cliente - Modif datos póliza|Cambio nº de cuenta|Cambio fecha de efecto|Cambio forma de pago|Modificación nº asegurados|Cambio dirección postal|Modificación coberturas|Cesión de derechos|Cesión de derechos datos incompletos|Corrección datos erróneos en póliza|Datos incompletos|LLam gestión comerc|Pago de Recibo|Consulta cliente|Reenvío siniestros|Reenvío agentes humanos|Reenvío agentes humanos no quiere IA|Reenvío agentes humanos no tomador|Correo ordinario|Duplicado Tarjeta|Email|Información recibos declaración renta|Siniestros|Retención cliente|Baja Cliente BBDD|Reclamación atención al cliente",
      "ramo": "HOGAR|AUTO|VIDA|DECESOS|SALUD|OTROS SOLO para nuevas contrataciones",
      "description": "descripción clara de qué necesita el cliente",
      "confidence": 0.95,
      "numeroPolizaAfectada": "SOLO si es gestión sobre póliza específica de detalle_polizas"
    },
    "followUpInfo": {
      "isFollowUp": false,
      "relatedTicketId": "codigo_incidencia de las incidencias existentes si es rellamada", 
      "createNewTicket": true,
      "followUpReason": "razón del seguimiento si aplica"
    }
  },
  "decisions": {
    "clientDecision": {
      "shouldCreateClient": "true si es new o lead, false si existing",
      "useExistingClient": "true si encontrado en tool_results",
      "useLeadData": "true si es lead de tool_results", 
      "clientDataSource": "tool_results|extracted|mixed"
    },
    "ticketDecision": {
      "shouldCreateTickets": true,
      "ticketCount": 1,
      "ticketsInfo": [{
        "type": "primary",
        "useClientId": "ID del cliente a usar (codigo_cliente o nuevo)",
        "numeroPoliza": "SOLO si gestión sobre póliza existente"
      }]
    },
    "followUpDecision": {
      "shouldCreateFollowUp": false,
      "followUpOnly": false,
      "relatedTicket": "ticket relacionado si aplica"
    },
    "priority": "high|medium|low",
    "requiresImmediate": false
  },
  "metadata": {
    "confidence": 0.95,
    "processingRecommendation": "explicación de qué hacer",
    "warnings": ["advertencias si las hay"],
    "toolResultsFound": true,
    "clientSearchResults": "resumen de lo encontrado en tool_results"
  }
}
`;

  /**
   * 🎯 MÉTODO PRINCIPAL: Analizar llamada completa incluyendo tool_results
   */
  async analyzeCall(transcripts: CallTranscript[], conversationId: string): Promise<CallDecision> {
    console.log(`🎯 [DECISION ENGINE] Analizando llamada completa: ${conversationId}`);
    
    try {
      // Formatear conversación completa incluyendo tool_results
      const conversation = this.formatConversationWithTools(transcripts);
      
      // Preparar prompt
      const prompt = this.COMPREHENSIVE_ANALYSIS_PROMPT.replace('{{conversation}}', conversation);
      
      console.log(`🧠 [DECISION ENGINE] Enviando análisis comprehensivo a Gemini...`);
      
      // Una sola llamada LLM que extrae TODA la información
      const decision = await generateStructuredResponse<CallDecision>(prompt);
      
      if (!decision) {
        throw new Error('No se recibió respuesta válida del LLM');
      }
      
      // Validar y normalizar respuesta
      const validatedDecision = this.validateAndNormalizeDecision(decision);
      
      console.log(`✅ [DECISION ENGINE] Análisis completado:`, {
        clientType: validatedDecision.clientInfo.clientType,
        hasExistingClient: validatedDecision.decisions.clientDecision.useExistingClient,
        hasLead: validatedDecision.decisions.clientDecision.useLeadData,
        shouldCreateClient: validatedDecision.decisions.clientDecision.shouldCreateClient,
        incidentType: validatedDecision.incidentAnalysis.primaryIncident.type,
        ticketCount: validatedDecision.decisions.ticketDecision.ticketCount,
        confidence: validatedDecision.metadata.confidence
      });
      
      return validatedDecision;
      
    } catch (error) {
      console.error(`❌ [DECISION ENGINE] Error en análisis:`, error);
      return this.createFallbackDecision(conversationId);
    }
  }
  
  /**
   * 📝 Formatear conversación incluyendo tool_results (CRÍTICO)
   */
  private formatConversationWithTools(transcripts: CallTranscript[]): string {
    let formattedConversation = '';
    
    for (const transcript of transcripts) {
      // Agregar el mensaje de conversación
      formattedConversation += `${transcript.speaker.toUpperCase()}: ${transcript.message}\n`;
      
      // Agregar tool_results si existen
      if (transcript.tool_results && transcript.tool_results.length > 0) {
        formattedConversation += `TOOL_RESULTS:\n`;
        for (const toolResult of transcript.tool_results) {
          formattedConversation += `- Tool: ${toolResult.tool_name}\n`;
          formattedConversation += `- Result: ${toolResult.result_value}\n`;
          formattedConversation += `- Error: ${toolResult.is_error}\n`;
        }
        formattedConversation += `\n`;
      }
    }
    
    return formattedConversation;
  }
  
  /**
   * ✅ Validar y normalizar la respuesta del LLM
   */
  private validateAndNormalizeDecision(decision: any): CallDecision {
    const normalized: CallDecision = {
      clientInfo: {
        clientType: this.normalizeClientType(decision.clientInfo?.clientType),
        extractedData: decision.clientInfo?.extractedData || {}
      },
      incidentAnalysis: {
        primaryIncident: {
          type: decision.incidentAnalysis?.primaryIncident?.type || 'Llamada gestión comercial',
          reason: decision.incidentAnalysis?.primaryIncident?.reason || 'Consulta cliente',
          description: decision.incidentAnalysis?.primaryIncident?.description || 'Gestión telefónica',
          confidence: Math.max(0, Math.min(1, decision.incidentAnalysis?.primaryIncident?.confidence || 0.5))
        },
        followUpInfo: {
          isFollowUp: decision.incidentAnalysis?.followUpInfo?.isFollowUp || false,
          createNewTicket: decision.incidentAnalysis?.followUpInfo?.createNewTicket !== false, // Default true
          relatedTicketId: decision.incidentAnalysis?.followUpInfo?.relatedTicketId,
          followUpReason: decision.incidentAnalysis?.followUpInfo?.followUpReason
        }
      },
      decisions: {
        clientDecision: {
          shouldCreateClient: decision.decisions?.clientDecision?.shouldCreateClient || false,
          useExistingClient: decision.decisions?.clientDecision?.useExistingClient || false,
          useLeadData: decision.decisions?.clientDecision?.useLeadData || false,
          clientDataSource: this.normalizeDataSource(decision.decisions?.clientDecision?.clientDataSource)
        },
        ticketDecision: {
          shouldCreateTickets: decision.decisions?.ticketDecision?.shouldCreateTickets !== false, // Default true
          ticketCount: Math.max(1, decision.decisions?.ticketDecision?.ticketCount || 1),
          ticketsInfo: decision.decisions?.ticketDecision?.ticketsInfo || []
        },
        followUpDecision: {
          shouldCreateFollowUp: decision.decisions?.followUpDecision?.shouldCreateFollowUp || false,
          followUpOnly: decision.decisions?.followUpDecision?.followUpOnly || false,
          relatedTicket: decision.decisions?.followUpDecision?.relatedTicket
        },
        priority: this.normalizePriority(decision.decisions?.priority),
        requiresImmediate: decision.decisions?.requiresImmediate || false
      },
      metadata: {
        confidence: Math.max(0, Math.min(1, decision.metadata?.confidence || 0.5)),
        processingRecommendation: decision.metadata?.processingRecommendation || 'Procesar según análisis estándar',
        warnings: decision.metadata?.warnings || [],
        toolResultsFound: decision.metadata?.toolResultsFound || false,
        clientSearchResults: decision.metadata?.clientSearchResults
      }
    };
    
    // Agregar campos opcionales
    if (decision.clientInfo?.existingClientInfo) {
      normalized.clientInfo.existingClientInfo = decision.clientInfo.existingClientInfo;
    }
    
    if (decision.clientInfo?.leadInfo) {
      normalized.clientInfo.leadInfo = decision.clientInfo.leadInfo;
    }
    
    if (decision.incidentAnalysis?.primaryIncident?.ramo) {
      normalized.incidentAnalysis.primaryIncident.ramo = decision.incidentAnalysis.primaryIncident.ramo;
    }
    
    if (decision.incidentAnalysis?.primaryIncident?.numeroPolizaAfectada) {
      normalized.incidentAnalysis.primaryIncident.numeroPolizaAfectada = decision.incidentAnalysis.primaryIncident.numeroPolizaAfectada;
    }
    
    if (decision.incidentAnalysis?.secondaryIncidents) {
      normalized.incidentAnalysis.secondaryIncidents = decision.incidentAnalysis.secondaryIncidents;
    }
    
    return normalized;
  }
  
  /**
   * 🔄 Crear decisión fallback para casos de error
   */
  private createFallbackDecision(conversationId: string): CallDecision {
    return {
      clientInfo: {
        clientType: 'unknown',
        extractedData: {}
      },
      incidentAnalysis: {
        primaryIncident: {
          type: 'Llamada gestión comercial',
          reason: 'Consulta cliente',
          description: 'Gestión telefónica procesada con datos limitados',
          confidence: 0.3
        },
        followUpInfo: {
          isFollowUp: false,
          createNewTicket: true
        }
      },
      decisions: {
        clientDecision: {
          shouldCreateClient: false,
          useExistingClient: false,
          useLeadData: false,
          clientDataSource: 'extracted'
        },
        ticketDecision: {
          shouldCreateTickets: true,
          ticketCount: 1,
          ticketsInfo: []
        },
        followUpDecision: {
          shouldCreateFollowUp: false,
          followUpOnly: false
        },
        priority: 'medium',
        requiresImmediate: false
      },
      metadata: {
        confidence: 0.3,
        processingRecommendation: `Procesar como gestión estándar. Error en análisis para ${conversationId}`,
        warnings: ['Error en análisis LLM - usando valores por defecto'],
        toolResultsFound: false
      }
    };
  }
  
  /**
   * 🔧 Métodos auxiliares de normalización
   */
  private normalizeClientType(type: any): 'existing' | 'lead' | 'new' | 'unknown' {
    if (['existing', 'lead', 'new', 'unknown'].includes(type)) {
      return type;
    }
    return 'unknown';
  }
  
  private normalizeDataSource(source: any): 'extracted' | 'tool_results' | 'lead' | 'mixed' {
    if (['extracted', 'tool_results', 'lead', 'mixed'].includes(source)) {
      return source;
    }
    return 'extracted';
  }
  
  private normalizePriority(priority: any): 'low' | 'medium' | 'high' {
    if (['low', 'medium', 'high'].includes(priority)) {
      return priority;
    }
    return 'medium';
  }
}

// Exportar instancia singleton
export const callDecisionEngine = new CallDecisionEngine(); 