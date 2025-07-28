import { generateStructuredResponse } from '../lib/gemini';
import type { TranscriptMessage } from '../types/common.types';
import type { NogalTipoCreacion, NogalClientData } from '../types/nogal_tickets.types';

export interface NogalIncidencia {
  tipo: string;
  motivo: string;
  ramo?: string;
  consideraciones?: string;
  necesidadCliente?: string;
  tipoCreacion: NogalTipoCreacion;
  esRellamada?: boolean; // NUEVO: indica si esta incidencia es una rellamada
  incidenciaRelacionada?: string; // NUEVO: ID de la incidencia existente si es rellamada
}

export interface NogalAnalysisResult {
  incidenciaPrincipal: NogalIncidencia;
  incidenciasSecundarias: NogalIncidencia[];
  confidence: number; // 0-1
  resumenLlamada: string;
  datosExtraidos: {
    [key: string]: any;
  };
  notasParaNogal?: string; // Notas específicas según reglas del CSV
  requiereTicket: boolean;
  prioridad: 'low' | 'medium' | 'high';
  // NUEVOS CAMPOS PARA MÚLTIPLES GESTIONES
  multipleGestiones?: boolean; // true si hay más de una gestión
  totalGestiones?: number; // número total de gestiones identificadas
}

class NogalAnalysisService {
  
  private readonly NOGAL_PROMPT = `
🎯 **ANALISTA EXPERTO DE SEGUROS NOGAL**

Analiza conversaciones telefónicas completas y clasifícalas según los tipos exactos de Nogal.

## 📋 **METODOLOGÍA (SIGUE ESTE ORDEN):**

1. **LEE TODA LA CONVERSACIÓN** de principio a fin
2. **IDENTIFICA QUÉ PASÓ REALMENTE** - ¿Se resolvió o no? ¿Por qué?
3. **CLASIFICA SEGÚN EL RESULTADO FINAL**, no la solicitud inicial

## 🎯 **TIPOS PRINCIPALES:**

### **NUEVA CONTRATACIÓN** 
Cliente quiere contratar un seguro nuevo:
- Frases: "nueva contratación", "quiero contratar", "necesito un seguro"
- Agente: "un compañero se pondrá en contacto para presupuesto"
- **Tipo**: "Nueva contratación de seguros" + **Motivo**: "Contratación Póliza" + **Ramo**: según tipo

### **DATOS INCOMPLETOS**
Cliente solicita algo pero NO tiene la información necesaria:
- Cliente: "no tengo", "no sé", "no me acuerdo"
- Agente: "sin esos datos no puedo", "vuelva a llamar cuando tenga"
- **Tipo**: "Modificación póliza emitida" + **Motivo**: "Datos incompletos"

### **GESTIÓN NO RESUELTA**
Agente NO puede resolver en la misma llamada:
- Agente: "no tengo acceso", "tengo que consultar", "le llamaremos"
- **Tipo**: "Llamada gestión comercial" + **Motivo**: "LLam gestión comerc"

### **CONSULTA RESUELTA**
Agente SÍ responde completamente:
- Se proporciona toda la información solicitada
- **Tipo**: "Llamada gestión comercial" + **Motivo**: "Consulta cliente"

### **DUPLICADO DE PÓLIZA**
Cliente solicita copia de su póliza:
- Por email: **Tipo**: "Solicitud duplicado póliza" + **Motivo**: "Email"
- Por correo: **Tipo**: "Solicitud duplicado póliza" + **Motivo**: "Correo ordinario"

## 📋 **INFORMACIÓN DEL CLIENTE:**
{{clientData}}

## 🏢 **EXTRACCIÓN DE DATOS DEL CLIENTE:**

**EXTRAE TODA LA INFORMACIÓN del cliente que aparezca en la conversación:**
- **nombreCliente**: Nombre completo si se menciona ("Me llamo Juan Pérez")
- **telefono**: Cualquier teléfono mencionado (formatos: 666123456, 666 123 456, +34 666123456)
- **email**: Cualquier email mencionado
- **numeroPoliza**: Si menciona número de póliza existente
- **cuentaBancaria**: Si proporciona nueva cuenta bancaria
- **direccion**: Si menciona dirección nueva

**IMPORTANTE**: Si hay herramientas con resultados de búsqueda de leads, incluir esa información.

## 🎯 **EJEMPLOS CLAROS:**

**EJEMPLO 1 - NUEVA CONTRATACIÓN (CORRECTO)**:
USER: "¿Es para una nueva contratación de una póliza de hogar?"
AGENT: "para una nueva contratación de una póliza de hogar, un compañero se pondrá en contacto"
**CLASIFICACIÓN**: "Nueva contratación de seguros" + "Contratación Póliza" + Ramo: "HOGAR"

**EJEMPLO 2 - DATOS INCOMPLETOS (CORRECTO)**:
USER: "Quiero cambiar el DNI de mi esposa"
AGENT: "Necesito el DNI actual y el nuevo"
USER: "No me acuerdo del DNI actual"
AGENT: "Sin el DNI actual no puedo hacer la modificación"
**CLASIFICACIÓN**: "Modificación póliza emitida" + "Datos incompletos"

**EJEMPLO 3 - GESTIÓN NO RESUELTA (CORRECTO)**:
USER: "¿Mi póliza cubre filtraciones de agua?"
AGENT: "No tengo acceso a esa información"
AGENT: "Le llamaremos con la respuesta"
**CLASIFICACIÓN**: "Llamada gestión comercial" + "LLam gestión comerc"

## ⚠️ **REGLAS CRÍTICAS:**

1. **NO INVENTES INFORMACIÓN** - Solo usa lo explícito en la conversación
2. **EL RESULTADO FINAL cuenta más** que la solicitud inicial
3. **Si dice "nueva contratación" ES nueva contratación**, no otra cosa
4. **Solo marca rellamada si el cliente menciona EXPLÍCITAMENTE una incidencia previa**

## 📞 **RELLAMADAS (SOLO SI ES EXPLÍCITO):**

**MARCAR esRellamada: true ÚNICAMENTE SI:**
- Cliente dice LITERALMENTE: "tengo un caso abierto", "sobre mi incidencia", "me dijeron que me llamarían"
- Se menciona un número/código de incidencia específico
- **NO assumes rellamadas si no son explícitas**

CONVERSACIÓN A ANALIZAR:
{{conversation}}

Responde en este formato JSON:
{
  "incidenciaPrincipal": {
    "tipo": "tipo exacto de la lista",
    "motivo": "motivo exacto de la lista", 
    "ramo": "solo para nueva contratación: HOGAR|AUTO|VIDA|DECESOS|SALUD",
    "consideraciones": "notas específicas basadas en la conversación",
    "necesidadCliente": "qué necesita el cliente exactamente",
    "tipoCreacion": "Manual / Automática",
    "esRellamada": false,
    "incidenciaRelacionada": null
  },
  "incidenciasSecundarias": [],
  "confidence": 0.95,
  "resumenLlamada": "resumen breve de qué pasó en la conversación",
  "datosExtraidos": {
    "nombreCliente": "nombre completo si se menciona explícitamente",
    "telefono": "teléfono si se menciona en cualquier formato",
    "email": "email si se menciona",
    "numeroPoliza": "número de póliza si cliente tiene y se habla de gestión existente",
    "cuentaBancaria": "nueva cuenta bancaria si se proporciona",
    "direccion": "nueva dirección si se menciona",
    "leadInfo": {
      "isLead": false,
      "idLead": "ID del lead si se encontró en herramientas",
      "campaña": "campaña del lead si aplica",
      "ramo": "ramo del lead si aplica"
    }
  },
  "notasParaNogal": "información específica para el ticket",
  "requiereTicket": true,
  "prioridad": "medium",
  "multipleGestiones": false,
  "totalGestiones": 1
}
`;

  async analyzeCallForNogal(
    messages: TranscriptMessage[], 
    conversationId?: string,
    clientData?: NogalClientData
  ): Promise<NogalAnalysisResult> {
    try {
      console.log(`[NogalAnalysis] [SIMPLE] Analizando conversación ${conversationId || 'unknown'} con ${messages.length} mensajes`);
      
      // 🎯 FORMATEAR LA CONVERSACIÓN COMPLETA - La IA analizará TODO
      const conversation = messages
        .map(m => `${m.role.toUpperCase()}: ${m.message}`)
        .join('\n');

      // 🚀 SIMPLE: La IA analizará la conversación completa autónomamente
      // No necesitamos datos externos complejos - está todo en la transcripción
      const clientInfo = clientData ? this.formatClientDataForPrompt(clientData) : 
        'INFORMACIÓN DEL CLIENTE:\nAnalizar la transcripción para extraer datos del cliente.';

      const prompt = this.NOGAL_PROMPT
        .replace('{{conversation}}', conversation)
        .replace('{{clientData}}', clientInfo);

      console.log(`[NogalAnalysis] [SIMPLE] Enviando transcripción completa a Gemini para análisis autónomo`);

      const response = await generateStructuredResponse<NogalAnalysisResult>(prompt);
      
      if (!response || !response.incidenciaPrincipal) {
        throw new Error('Respuesta de Gemini inválida - falta incidenciaPrincipal');
      }

      // Normalizar y validar respuesta
      const result: NogalAnalysisResult = {
        incidenciaPrincipal: {
          tipo: response.incidenciaPrincipal.tipo || 'Llamada gestión comercial',
          motivo: response.incidenciaPrincipal.motivo || 'Consulta cliente',
          ramo: response.incidenciaPrincipal.ramo, // Gemini decide cuándo incluirlo
          consideraciones: response.incidenciaPrincipal.consideraciones,
          necesidadCliente: response.incidenciaPrincipal.necesidadCliente,
          tipoCreacion: response.incidenciaPrincipal.tipoCreacion || 'Manual / Automática',
          esRellamada: response.incidenciaPrincipal.esRellamada || false,
          incidenciaRelacionada: response.incidenciaPrincipal.incidenciaRelacionada
        },
        incidenciasSecundarias: response.incidenciasSecundarias || [],
        confidence: Math.max(0, Math.min(1, response.confidence || 0.8)),
        resumenLlamada: response.resumenLlamada || 'Llamada procesada sin resumen disponible',
        datosExtraidos: response.datosExtraidos || {},
        notasParaNogal: response.notasParaNogal,
        requiereTicket: response.requiereTicket !== false,
        prioridad: this.normalizePriority(response.prioridad),
        // NUEVOS CAMPOS PARA MÚLTIPLES GESTIONES
        multipleGestiones: response.multipleGestiones || false,
        totalGestiones: response.totalGestiones || 1
      };

      console.log(`[NogalAnalysis] [DEBUG] Análisis completado:`, {
        tipo: result.incidenciaPrincipal.tipo,
        motivo: result.incidenciaPrincipal.motivo,
        ramo: result.incidenciaPrincipal.ramo,
        numeroPoliza: result.datosExtraidos.numeroPoliza,
        confidence: result.confidence,
        esRellamada: result.incidenciaPrincipal.esRellamada
      });

      return result;
        
    } catch (error) {
      console.error('[NogalAnalysis] [DEBUG] Error en análisis:', error);
      
      // Resultado de fallback
      return {
        incidenciaPrincipal: {
          tipo: 'Llamada gestión comercial',
          motivo: 'Consulta cliente',
          tipoCreacion: 'Manual / Automática' as const,
          necesidadCliente: 'Consulta general no clasificada'
        },
        incidenciasSecundarias: [],
        confidence: 0.3,
        resumenLlamada: 'Error en análisis - requiere revisión manual',
        datosExtraidos: {},
        requiereTicket: false,
        prioridad: 'low' as const
      };
    }
  }

  /**
   * Formatea los datos del cliente para incluir en el prompt
   */
  private formatClientDataForPrompt(clientData: NogalClientData): string {
    let info = `INFORMACIÓN DEL CLIENTE:\n`;
    
    if (clientData.name) info += `- Nombre: ${clientData.name}\n`;
    if (clientData.dni) info += `- DNI: ${clientData.dni}\n`;
    if (clientData.phone) info += `- Teléfono: ${clientData.phone}\n`;
    if (clientData.email) info += `- Email: ${clientData.email}\n`;
    if (clientData.codigoCliente) info += `- Código Cliente: ${clientData.codigoCliente}\n`;
    
    if (clientData.polizas && clientData.polizas.length > 0) {
      info += `\nPÓLIZAS CONTRATADAS:\n`;
      clientData.polizas.forEach((poliza, index) => {
        info += `${index + 1}. Número: ${poliza.numero}, Ramo: ${poliza.ramo}, Estado: ${poliza.estado}, Compañía: ${poliza.compania}\n`;
        if (poliza.fechaEfecto) info += `   Fecha Efecto: ${poliza.fechaEfecto}\n`;
        if (poliza.mesVencimiento) info += `   Mes Vencimiento: ${poliza.mesVencimiento}\n`;
        if (poliza.importePoliza) info += `   Importe: ${poliza.importePoliza}\n`;
      });
    }
    
    if (clientData.incidenciasAbiertas && clientData.incidenciasAbiertas.length > 0) {
      info += `\nINCIDENCIAS ABIERTAS:\n`;
      clientData.incidenciasAbiertas.forEach((inc, index) => {
        info += `${index + 1}. Código: ${inc.codigo}, Tipo: ${inc.tipo}, Motivo: ${inc.motivo}\n`;
        if (inc.fechaCreacion) info += `   Fecha: ${inc.fechaCreacion}\n`;
        if (inc.poliza) info += `   Póliza: ${inc.poliza}\n`;
      });
    }
    
    return info;
  }

  private normalizePriority(priority?: string): 'low' | 'medium' | 'high' {
    const p = priority?.toLowerCase();
    if (p === 'high' || p === 'alta') return 'high';
    if (p === 'medium' || p === 'media') return 'medium';
    return 'low';
  }

  /**
   * Verifica si una incidencia es de tipo "Exclusiva IA"
   */
  isExclusivaIA(incidencia: NogalIncidencia): boolean {
    if (incidencia.tipoCreacion === 'Exclusiva IA') {
      return true;
    }
    
    const exclusivaIAMotivos = [
      'Cesión de derechos datos incompletos',
      'Datos incompletos',
      'Reenvío siniestros', 
      'Reenvío agentes humanos',
      'Reenvío agentes humanos no quiere IA',
      'Reenvío agentes humanos no tomador'
    ];
    
    return exclusivaIAMotivos.includes(incidencia.motivo);
  }

  /**
   * Determina si se debe crear un ticket automáticamente
   */
  shouldCreateTicket(analysis: NogalAnalysisResult): boolean {
    if (this.isExclusivaIA(analysis.incidenciaPrincipal) && analysis.confidence < 0.8) {
      return false;
    }
    
    return analysis.requiereTicket && analysis.confidence >= 0.3;
  }
}

export const nogalAnalysisService = new NogalAnalysisService(); 