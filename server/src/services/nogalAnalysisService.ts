import { generateStructuredResponse } from '../lib/gemini';
import type { TranscriptMessage } from '../types/common.types';

export interface NogalIncidencia {
  tipo: string;
  motivo: string;
  ramo?: string;
  consideraciones?: string;
  necesidadCliente?: string;
  tipoCreacion: 'Manual' | 'Automática' | 'Exclusiva IA';
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
}

class NogalAnalysisService {
  
  private readonly NOGAL_PROMPT = `
Eres un experto en seguros y atención al cliente de la Correduría de Seguros Nogal. 
Analiza la siguiente conversación telefónica y clasifícala según los tipos de incidencia exactos de Nogal.

TIPOS DE INCIDENCIA DISPONIBLES (CSV oficial actualizado de Nogal):

1. **Nueva contratación de seguros**
   - "Contratación Póliza" (ramo: hogar/auto/vida/decesos/Salud/otros)
     • Consideración: Si el cliente no existe se crea y sobre esa ficha se crea la incidencia
     • Necesidad: Cliente quiere contratar un seguro y no tiene incidencia de vencimiento pendiente
   - "Póliza anterior suspensión de garantías"
     • Consideración: debe tener la póliza el check de suspensión de garantías "sí"
     • Necesidad: Cliente quiere contratar un seguro y tiene una reserva de prima en cia

2. **Modificación póliza emitida**
   - "Atención al cliente - Modif datos póliza"
     • Consideración: rellenamos datos en notas
     • Necesidad: Cliente quiere hacer modificación que no varía prima (nombre, apellido...)
   - "Cambio nº de cuenta"
     • Consideración: rellenamos datos en notas
     • Necesidad: Cliente quiere cambiar la CCC en las pólizas y facilita la nueva cuenta
   - "Cambio fecha de efecto"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita cambio de fecha de efecto/entrada en vigor del seguro
   - "Cambio forma de pago"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita cambio de peridicidad (sin que fuera anual la forma anterior)
   - "Modificación nº asegurados"
     • Consideración: metemos en notas asegurado a incluir/excluir (nombre, apellidos, DNI, fecha nacimiento) y fecha de vigor
     • Necesidad: Cliente solicita incluir nuevo asegurado o eliminar uno existente
   - "Cambio dirección postal"
     • Consideración: metemos en notas la nueva dirección
     • Necesidad: Cliente solicita modificar dirección postal de sus pólizas
   - "Modificación coberturas"
     • Consideración: metemos en notas la cobertura a modificar y fecha de vigor
     • Necesidad: Cliente solicita modificar cobertura (ej: todo riesgo a terceros, electrodomésticos...)
   - "Cesión de derechos datos incompletos" (Exclusiva IA)
     • Consideración: Cliente no tiene datos completos del préstamo hipotecario
     • Necesidad: Cliente solicita cesión pero falta Nº préstamo, banco, fechas
   - "Cesión de derechos"
     • Consideración: metemos en notas Nº préstamo, banco (entidad y oficina), fecha inicio y fin
     • Necesidad: Cliente solicita cesión de derechos y dispone de todos los datos
   - "Corrección datos erróneos en póliza"
     • Consideración: metemos en notas los datos a corregir y valores correctos
     • Necesidad: Cliente solicita corregir errores detectados en su póliza
   - "Datos incompletos" (Exclusiva IA)
     • Consideración: metemos en notas los campos que quería modificar señalando que no tenía datos completos
     • Necesidad: Cliente solicita cambios pero no dispone de los nuevos datos

3. **Llamada asistencia en carretera**
   - "Siniestros"
     • Necesidad: Cliente necesita una grúa. Pasamos directamente con asistencia de cia

4. **Retención de Cliente Cartera**
   - "Retención de Cliente Cartera Llamada"
     • Necesidad: Cliente llama para ver renovación o anular una póliza de cartera

5. **Cancelación antes de efecto**
   - "Cancelación antes de efecto llamada"
     • Necesidad: Cliente llama para cancelar una póliza de NP

6. **Retención cliente**
   - "Retención cliente"
     • Necesidad: Cliente llama para ver renovación o anular una póliza

7. **Llamada gestión comercial**
   - "LLam gestión comerc"
     • Necesidad: Cliente solicita gestión sobre póliza contratada que no es renovación ni anulación
   - "Pago de Recibo"
     • Necesidad: Cliente llama para realizar un pago pendiente de recibo
   - "Consulta cliente"
     • Consideración: los gestores de att al cliente dan respuesta al cliente en línea, la incidencia se les genera y se debe cerrar siempre
     • Necesidad: Cliente llama para consulta resoluble desde att cliente (fechas efecto, formas pago, cias...)
   - "Cambio forma de pago"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente tiene forma de pago anual y quiere fraccionar
   - "Reenvío siniestros" (Exclusiva IA)
     • Consideración: Siempre que se pase la llamada a la cola de siniestros
   - "Reenvío agentes humanos" (Exclusiva IA)
     • Consideración: Siempre que se pase la llamada a la cola de humanos

8. **Baja cliente en BBDD**
   - "Baja Cliente BBDD"
     • Necesidad: Cliente solicita baja en la base de datos porque no quiere que le llamen más

9. **Reclamación cliente regalo**
   - "Reclamación atención al cliente"
     • Necesidad: Cliente indica que no ha recibido regalo ofrecido por comercial o por recomendar

10. **Solicitud duplicado póliza**
    - "Correo ordinario"
      • Necesidad: Cliente solicita envío de duplicado de póliza por correo ordinario
    - "Duplicado Tarjeta"
      • Necesidad: Cliente solicita envío de duplicado de tarjetas de seguro de decesos o salud
    - "Email"
      • Necesidad: Cliente solicita envío de duplicado de póliza por email
    - "Información recibos declaración renta"
      • Necesidad: Cliente solicita envío de recibos de ejercicio fiscal anterior para declaración renta

REGLAS ESPECIALES:
- En modificaciones: SIEMPRE preguntar fecha de inicio (hoy, renovación póliza...)
- Si existe incidencia pendiente de vencimiento: crear rellamada sobre esa incidencia
- Para "Exclusiva IA": solo crear automáticamente con alta confianza

CONVERSACIÓN A ANALIZAR:
{{conversation}}

INSTRUCCIONES:
1. Identifica la incidencia principal que mejor describe la consulta del cliente
2. Extrae TODOS los datos relevantes mencionados (números de póliza, cuentas, direcciones, etc.)
3. **IDENTIFICA EL NOMBRE DEL CLIENTE** mencionado en la conversación (si se menciona)
4. Genera notas específicas según las consideraciones del CSV
5. Determina si requiere creación de ticket
6. Calcula la prioridad basada en urgencia y complejidad

⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
- SOLO extraer información que se mencione EXPLÍCITAMENTE en la conversación
- NO asumir, NO interpretar, NO deducir información que no esté clara
- Si hay dudas sobre cualquier dato, NO incluirlo
- Preferir campos vacíos que datos inventados o asumidos
- Validar EXHAUSTIVAMENTE antes de extraer cualquier información

⚠️ IMPORTANTE - NÚMEROS DE PÓLIZA:
- SOLO incluir numeroPoliza si el cliente menciona un número específico (ej: "POL-123456", "póliza número ABC789")
- NO incluir si dice solo "mi póliza", "la póliza", "cambiar en mi seguro" sin especificar número
- Debe estar 100% claro que se refiere a esa póliza específica
- Si hay dudas, NO incluir número de póliza

⚠️ IMPORTANTE - NOMBRE DEL CLIENTE:
- SOLO incluir nombreCliente si se menciona explícitamente en la conversación (ej: "Soy José Luis Pérez", "Mi nombre es María García")
- Extraer el nombre completo tal como se menciona
- Si solo se dice "soy Juan" sin apellido, extraer solo "Juan"
- Si no se menciona el nombre explícitamente, NO incluir este campo

⚠️ IMPORTANTE - TODOS LOS DEMÁS DATOS:
- SOLO incluir datos que se mencionen EXPLÍCITAMENTE y sin ambigüedad
- NO asumir información basada en el contexto del tipo de incidencia
- Cada campo debe tener una mención clara y específica en la conversación
- Si no se menciona explícitamente un dato, NO incluirlo

Responde EXACTAMENTE en este formato JSON:
{
  "incidenciaPrincipal": {
    "tipo": "uno de los tipos exactos listados arriba",
    "motivo": "uno de los motivos exactos listados arriba",
    "ramo": "hogar|auto|vida|decesos|Salud|otros (solo si aplica)",
    "consideraciones": "notas específicas según reglas del CSV",
    "necesidadCliente": "descripción exacta de lo que necesita el cliente",
    "tipoCreacion": "Manual / Automática|Exclusiva IA"
  },
  "incidenciasSecundarias": [],
  "confidence": 0.95,
  "resumenLlamada": "resumen claro y conciso en español",
  "datosExtraidos": {
    "nombreCliente": "SOLO si el cliente menciona su nombre explícitamente en la conversación (ej: 'Soy José Luis Pérez'). NO incluir si no se menciona claramente",
    "numeroPoliza": "SOLO si el cliente menciona un número específico de póliza (ej: POL-123456) y está 100% claro que se refiere a ESA póliza. Si dice 'mi póliza' sin especificar número, NO incluir",
    "numeroRecibo": "si se menciona",
    "telefono": "teléfono principal si se menciona",
    "telefono2": "teléfono secundario si se menciona",
    "email": "email si se menciona",
    "cuentaBancaria": "nueva CCC si se proporciona",
    "direccion": "nueva dirección completa si se menciona",
    "fechaEfecto": "fecha de inicio del cambio si se menciona",
    "asegurados": "datos de asegurados a incluir/excluir",
    "prestamo": "datos del préstamo hipotecario si aplica",
    "recomendadoPor": "SOLO si el cliente menciona explícitamente que fue recomendado por alguien (ej: 'Me recomendó Juan', 'Vengo de parte de María'). Incluir nombre completo del recomendante",
    "campaña": "SOLO si el cliente menciona una campaña específica (ej: 'Vi el anuncio de verano', 'Llamé por la oferta navideña'). Incluir nombre de la campaña",
    "ramo": "tipo de seguro si se menciona específicamente (hogar, auto, vida, decesos, salud)",
    "otros": "cualquier otro dato específico relevante"
  },
  "notasParaNogal": "información específica que debe ir en el campo Notas del ticket según las reglas del CSV",
  "requiereTicket": true,
  "prioridad": "low|medium|high"
}
`;

  async analyzeCallForNogal(messages: TranscriptMessage[], conversationId?: string): Promise<NogalAnalysisResult> {
    try {
      console.log(`[NogalAnalysis] [DEBUG] Analizando conversación ${conversationId || 'unknown'} con ${messages.length} mensajes`);
      console.log(`⚠️ [NogalAnalysis] [DEBUG] REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS - Solo extraer lo que se mencione explícitamente`);
      console.log(`[NogalAnalysis] [DEBUG] Mensajes recibidos:`, messages);
      
      // Formatear la conversación
      const conversation = messages
        .map(m => `${m.role.toUpperCase()}: ${m.message}`)
        .join('\n');

      console.log(`[NogalAnalysis] [DEBUG] Conversación formateada:`, conversation);

      const prompt = this.NOGAL_PROMPT.replace('{{conversation}}', conversation);

      console.log(`[NogalAnalysis] [DEBUG] Enviando prompt a Gemini (${prompt.length} caracteres)`);
      console.log(`[NogalAnalysis] [DEBUG] Prompt completo:`, prompt.substring(0, 500) + '...[truncado]');

      try {
        const response = await generateStructuredResponse<NogalAnalysisResult>(prompt);
        console.log(`[NogalAnalysis] [DEBUG] Respuesta cruda de Gemini:`, response);

        // Validar la respuesta
        if (!response || !response.incidenciaPrincipal) {
          console.error(`[NogalAnalysis] [DEBUG] Respuesta inválida - falta incidenciaPrincipal:`, response);
          throw new Error('Respuesta de Gemini inválida - falta incidenciaPrincipal');
        }

        console.log(`[NogalAnalysis] [DEBUG] Respuesta válida recibida, procesando...`);

        // ⚠️ VALIDACIÓN DE DATOS EXTRAÍDOS: Verificar que no se hayan inventado datos
        const validatedDatosExtraidos = this.validateExtractedData(response.datosExtraidos || {}, conversation);

        // Normalizar y validar
        const result: NogalAnalysisResult = {
          incidenciaPrincipal: {
            tipo: response.incidenciaPrincipal.tipo || 'Llamada gestión comercial',
            motivo: response.incidenciaPrincipal.motivo || 'Consulta cliente',
            ramo: response.incidenciaPrincipal.ramo,
            consideraciones: response.incidenciaPrincipal.consideraciones,
            necesidadCliente: response.incidenciaPrincipal.necesidadCliente,
            tipoCreacion: response.incidenciaPrincipal.tipoCreacion || 'Manual'
          },
          incidenciasSecundarias: response.incidenciasSecundarias || [],
          confidence: Math.max(0, Math.min(1, response.confidence || 0.8)),
          resumenLlamada: response.resumenLlamada || 'Llamada procesada sin resumen disponible',
          datosExtraidos: validatedDatosExtraidos,
          notasParaNogal: response.notasParaNogal,
          requiereTicket: response.requiereTicket !== false, // Default true
          prioridad: this.normalizePriority(response.prioridad)
        };

        console.log(`[NogalAnalysis] [DEBUG] Análisis completado exitosamente:`, {
          tipo: result.incidenciaPrincipal.tipo,
          motivo: result.incidenciaPrincipal.motivo,
          confidence: result.confidence,
          requiereTicket: result.requiereTicket,
          prioridad: result.prioridad,
          datosValidados: Object.keys(result.datosExtraidos).length
        });

        return result;
        
      } catch (geminiError) {
        console.error('[NogalAnalysis] [DEBUG] Error específico en llamada a Gemini:', geminiError);
        console.error('[NogalAnalysis] [DEBUG] Stack trace:', geminiError instanceof Error ? geminiError.stack : 'No stack available');
        throw geminiError; // Re-lanzar para que sea capturado por el catch principal
      }
      
    } catch (error) {
      console.error('[NogalAnalysis] [DEBUG] Error general en análisis:', error);
      console.error('[NogalAnalysis] [DEBUG] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      // Resultado de fallback
      const fallbackResult = {
        incidenciaPrincipal: {
          tipo: 'Llamada gestión comercial',
          motivo: 'Consulta cliente',
          tipoCreacion: 'Manual' as const,
          necesidadCliente: 'Consulta general no clasificada'
        },
        incidenciasSecundarias: [],
        confidence: 0.3,
        resumenLlamada: 'Error en análisis - requiere revisión manual',
        datosExtraidos: {},
        requiereTicket: false,
        prioridad: 'low' as const
      };
      
      console.log('[NogalAnalysis] [DEBUG] Devolviendo resultado de fallback:', fallbackResult);
      return fallbackResult;
    }
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
    const exclusivaIAMotivos = [
      'Cesión de derechos datos incompletos',
      'Datos incompletos',
      'Reenvío siniestros', 
      'Reenvío agentes humanos'
    ];
    
    return exclusivaIAMotivos.includes(incidencia.motivo);
  }

  /**
   * Determina si se debe crear un ticket automáticamente
   */
  shouldCreateTicket(analysis: NogalAnalysisResult): boolean {
    // No crear tickets para "Exclusiva IA" con baja confianza
    if (this.isExclusivaIA(analysis.incidenciaPrincipal) && analysis.confidence < 0.8) {
      return false;
    }
    
    // Crear ticket si la confianza es alta y se requiere
    return analysis.requiereTicket && analysis.confidence >= 0.7;
  }

  /**
   * ⚠️ VALIDACIÓN DE DATOS EXTRAÍDOS: Verificar que no se hayan inventado datos
   * - Valida que cada dato extraído se mencione realmente en la conversación
   * - Remueve datos que no tengan una mención explícita
   * - Aplica validaciones específicas por tipo de dato
   */
  private validateExtractedData(datosExtraidos: any, conversation: string): any {
    console.log(`⚠️ [NogalAnalysis] [DEBUG] Validando datos extraídos - NUNCA permitir datos inventados`);
    
    const validatedData: any = {};
    const conversationLower = conversation.toLowerCase();

    // Validar cada campo específicamente
    if (datosExtraidos.nombreCliente) {
      if (this.isNameMentionedInConversation(datosExtraidos.nombreCliente, conversationLower)) {
        validatedData.nombreCliente = datosExtraidos.nombreCliente;
        console.log(`✅ [NogalAnalysis] [DEBUG] Nombre validado: ${datosExtraidos.nombreCliente}`);
      } else {
        console.log(`❌ [NogalAnalysis] [DEBUG] Nombre NO encontrado en conversación, removiendo: ${datosExtraidos.nombreCliente}`);
      }
    }

    if (datosExtraidos.numeroPoliza) {
      if (this.isPolizaMentionedInConversation(datosExtraidos.numeroPoliza, conversationLower)) {
        validatedData.numeroPoliza = datosExtraidos.numeroPoliza;
        console.log(`✅ [NogalAnalysis] [DEBUG] Número de póliza validado: ${datosExtraidos.numeroPoliza}`);
      } else {
        console.log(`❌ [NogalAnalysis] [DEBUG] Número de póliza NO encontrado en conversación, removiendo: ${datosExtraidos.numeroPoliza}`);
      }
    }

    if (datosExtraidos.telefono) {
      if (this.isPhoneMentionedInConversation(datosExtraidos.telefono, conversationLower)) {
        validatedData.telefono = datosExtraidos.telefono;
        console.log(`✅ [NogalAnalysis] [DEBUG] Teléfono validado: ${datosExtraidos.telefono}`);
      } else {
        console.log(`❌ [NogalAnalysis] [DEBUG] Teléfono NO encontrado en conversación, removiendo: ${datosExtraidos.telefono}`);
      }
    }

    if (datosExtraidos.email) {
      if (this.isEmailMentionedInConversation(datosExtraidos.email, conversationLower)) {
        validatedData.email = datosExtraidos.email;
        console.log(`✅ [NogalAnalysis] [DEBUG] Email validado: ${datosExtraidos.email}`);
      } else {
        console.log(`❌ [NogalAnalysis] [DEBUG] Email NO encontrado en conversación, removiendo: ${datosExtraidos.email}`);
      }
    }

    // Validar otros campos con validación genérica
    const otherFields = ['cuentaBancaria', 'direccion', 'fechaEfecto', 'recomendadoPor', 'campaña', 'ramo'];
    for (const field of otherFields) {
      if (datosExtraidos[field]) {
        if (this.isFieldMentionedInConversation(datosExtraidos[field], conversationLower)) {
          validatedData[field] = datosExtraidos[field];
          console.log(`✅ [NogalAnalysis] [DEBUG] ${field} validado: ${datosExtraidos[field]}`);
        } else {
          console.log(`❌ [NogalAnalysis] [DEBUG] ${field} NO encontrado en conversación, removiendo: ${datosExtraidos[field]}`);
        }
      }
    }

    // Mantener campos estructurados sin validación textual
    if (datosExtraidos.asegurados) {
      validatedData.asegurados = datosExtraidos.asegurados;
    }
    if (datosExtraidos.prestamo) {
      validatedData.prestamo = datosExtraidos.prestamo;
    }
    if (datosExtraidos.otros) {
      validatedData.otros = datosExtraidos.otros;
    }

    console.log(`⚠️ [NogalAnalysis] [DEBUG] Validación completada: ${Object.keys(validatedData).length} campos validados de ${Object.keys(datosExtraidos).length} originales`);
    return validatedData;
  }

  /**
   * Verificar si un nombre se menciona en la conversación
   */
  private isNameMentionedInConversation(name: string, conversation: string): boolean {
    const nameParts = name.toLowerCase().split(' ').filter(part => part.length > 2);
    
    // Buscar patrones específicos de presentación
    const patterns = [
      `soy ${name.toLowerCase()}`,
      `me llamo ${name.toLowerCase()}`,
      `mi nombre es ${name.toLowerCase()}`,
      `${name.toLowerCase()} soy`
    ];
    
    for (const pattern of patterns) {
      if (conversation.includes(pattern)) {
        return true;
      }
    }
    
    // Verificar que al menos la mayoría de las partes del nombre estén presentes
    const foundParts = nameParts.filter(part => conversation.includes(part));
    return foundParts.length >= Math.ceil(nameParts.length * 0.7);
  }

  /**
   * Verificar si un número de póliza se menciona en la conversación
   */
  private isPolizaMentionedInConversation(poliza: string, conversation: string): boolean {
    const patterns = [
      `póliza ${poliza.toLowerCase()}`,
      `poliza ${poliza.toLowerCase()}`,
      `número ${poliza.toLowerCase()}`,
      `numero ${poliza.toLowerCase()}`,
      poliza.toLowerCase()
    ];
    
    return patterns.some(pattern => conversation.includes(pattern));
  }

  /**
   * Verificar si un teléfono se menciona en la conversación
   */
  private isPhoneMentionedInConversation(phone: string, conversation: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    const phonePatterns = [
      phone,
      cleanPhone,
      phone.replace(/\s/g, ''),
      phone.replace(/-/g, '')
    ];
    
    return phonePatterns.some(pattern => conversation.includes(pattern));
  }

  /**
   * Verificar si un email se menciona en la conversación
   */
  private isEmailMentionedInConversation(email: string, conversation: string): boolean {
    return conversation.includes(email.toLowerCase());
  }

  /**
   * Verificar si un campo genérico se menciona en la conversación
   */
  private isFieldMentionedInConversation(value: string, conversation: string): boolean {
    if (!value || value.length < 3) return false;
    
    const valueLower = value.toLowerCase();
    
    // Para valores cortos, buscar exacto
    if (valueLower.length <= 10) {
      return conversation.includes(valueLower);
    }
    
    // Para valores largos, buscar partes significativas
    const words = valueLower.split(' ').filter(word => word.length > 3);
    const foundWords = words.filter(word => conversation.includes(word));
    
    return foundWords.length >= Math.ceil(words.length * 0.6);
  }
}

export const nogalAnalysisService = new NogalAnalysisService(); 