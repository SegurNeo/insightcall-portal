import { generateStructuredResponse } from '../lib/gemini';
import type { TranscriptMessage } from '../types/common.types';
import type { NogalTipoCreacion } from '../types/nogal_tickets.types';

export interface NogalIncidencia {
  tipo: string;
  motivo: string;
  ramo?: string;
  consideraciones?: string;
  necesidadCliente?: string;
  tipoCreacion: NogalTipoCreacion;
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

TIPOS DE INCIDENCIA DISPONIBLES (CSV oficial actualizado de Nogal - 15.07.25):

1. **Nueva contratación de seguros**
   - "Contratación Póliza" (ramo: hogar/auto/vida/decesos/Salud/otros)
     • Consideración: Si el cliente no existe se crea y sobre esa ficha se crea la incidencia => entramos en creación de clientes, puede ser recomendado de cliente, sin referencias. Puede haber creado por una campaña de referimiento actualmente no muy activas salvo la del metro
     • Necesidad: Cliente llama porque quiere contratar un seguro y no tiene incidencia de vencimiento pendiente de contratar en nuestro sistema
     • Tipo creación: Manual / Automática
   - "Póliza anterior suspensión de garantías"
     • Consideración: debe de tener la póliza el check de suspensión de garantias "si"
     • Necesidad: Cliente llama porque quiere contratar un seguro y tiene una reserva de prima en cia
     • Tipo creación: Manual / Automática

2. **Modificación póliza emitida**
   - "Atención al cliente - Modif datos póliza"
     • Consideración: rellenamos datos en notas
     • Necesidad: Cliente llama porque quiere hacer alguna modificación que no varía prima (nombre o apellido…) y nos facilita directamente el dato correcto
     • Tipo creación: Manual / Automática
   - "Cambio nº de cuenta"
     • Consideración: rellenamos datos en notas
     • Necesidad: Cliente llama porque quiere cambiar la ccc en las pólizas y nos facilita la nueva cuenta
     • Tipo creación: Manual / Automática
   - "Cambio fecha de efecto"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita el cambio de la fecha de efecto de la póliza, el cambio de la entrada en vigor de su seguro
     • Tipo creación: Manual / Automática
   - "Cambio forma de pago"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita el cambio de la forma de pago, de la peridicidad del pago de su póliza sin que fuera anual la forma de pago que tenia y que quiere modificar
     • Tipo creación: Manual / Automática
   - "Modificación nº asegurados"
     • Consideración: metemos en notas este dato. Metemos en notas asegurado a incluir o excluir. Nombre apellidos DNI si lo tuviera y fecha de nacimiento- Nombre y apellidos del asegurado a excluir. Metemos en notas desde que fecha quiere el cliente que entre en vigor el cambio
     • Necesidad: Cliente solicita que se incluya a un nuevo asegurado o bien que se elimine a alguno de los que tiene inluidos en póliza. Hay que preguntarle desde que que fecha quiere que aplique el cambio
     • Tipo creación: Manual / Automática
   - "Cambio dirección postal"
     • Consideración: metemos en notas la nueva dirección
     • Necesidad: Cliente solitica que se modifique la dirección postal de sus pólizas
     • Tipo creación: Manual / Automática
   - "Modificación coberturas"
     • Consideración: metemos en notas lo que nos indiquen respecto a la cobertura amodificar, ejemplo: de todo riesgo a terceros en coche, quitar o incluir reparación de electrodomésticos... Metemos en notas desde que fecha quiere el cliente que entre en vigor el cambio
     • Necesidad: Cliente solicita modificación de cobertura de su póliza, ejemplo: de todo riesgo a terceros en coche, quitar o incluir reparación de electrodomésticos... Hay que preguntarle desde que que fecha quiere que aplique el cambio
     • Tipo creación: Manual / Automática
   - "Cesión de derechos datos incompletos"
     • Consideración: Cliente solicita una cesión de derechos para un préstamo hiptecario, pero no tienen los datos para darnoslos en la llamada. Hay que indicarle que los busque y nos vuelva a llamar cuando los tenga disponibles inciandole que necesitamos Nº de préstamo; banco (entidad y oficina) / Fecha inicio y fin del préstamo
     • Necesidad: Cliente solicita una cesión de derechos para un préstamo hiptecario, pero no tienen los datos para darnoslos en la llamada
     • Tipo creación: exclusiva IA
   - "Cesión de derechos"
     • Consideración: metemos en notas Nº de préstamo; banco (entidad y oficina) / Fecha inicio y fin del préstamo
     • Necesidad: Cliente solicita una cesión de derechos para un préstamo hipotecario y dispone de los datos requeridos, Nº de préstamo; banco (entidad y oficina) / Fecha inicio y fin del préstamo
     • Tipo creación: Manual / Automática
   - "Corrección datos erróneos en póliza"
     • Consideración: metemos en notas los datos a corregir y los valores correctos
     • Necesidad: Cliente solicita corregir errores que ha detectado en su póliza. Nos debe indicar los datos a corregir así como los valores correctos
     • Tipo creación: Manual / Automática
   - "Datos incompletos"
     • Consideración: metemos en notas los campos que quería modificar el cliente señalando que no tenia los datos completos en el momento de la llamada
     • Necesidad: Cliente solicita cambios pero no dispone de los nuevos datos
     • Tipo creación: Exclusiva IA

3. **Llamada asistencia en carretera**
   - "Siniestros"
     • Consideración: Cliente llama porque necesita una grúa. Pasamos directamente con asistencia de cia
     • Necesidad: Cliente llama porque necesita una grúa. Pasamos directamente con asistencia de cia
     • Tipo creación: Manual / Automática

4. **Retención cliente**
   - "Retención cliente"
     • Consideración: Cliente llama para ver renovación o anular una póliza
     • Necesidad: Cliente llama para ver renovación o anular una póliza
     • Tipo creación: Manual / Automática

5. **Llamada gestión comercial**
   - "LLam gestión comerc"
     • Consideración: Cliente solicita alguna gestión sobre una póliza ya contratada que no es ni renovación ni anulación
     • Necesidad: Cliente solicita alguna gestión sobre una póliza ya contratada que no es ni renovación ni anulación
     • Tipo creación: Manual / Automática
   - "Pago de Recibo"
     • Consideración: Cliente llama para realizar un pago pendiente de recibo. Se puede crear sobre una póliza contratada o cancelada
     • Necesidad: Cliente llama para realizar un pago pendiente de recibo. Se puede crear sobre una póliza contratada o cancelada
     • Tipo creación: Manual / Automática
   - "Consulta cliente"
     • Consideración: los gestores de att al cliente dan respuesta al cliente en línea , la incidencia se les genera a ellos y se debe cerrar siempre
     • Necesidad: Cliente llama para realiza consulta y se puede resolver desde att cliente (info fechas de efecto, formas de pago, cias contratadas…)
     • Tipo creación: Manual / Automática
   - "Cambio forma de pago"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita el cambio de la forma de pago, tiene forma de pago anual y quiere fraccionar
     • Tipo creación: Manual / Automática
   - "Reenvío siniestros"
     • Consideración: Siempre que se pase la llamada a la cola de siniestros el ticket a crear debe tener el tipo "LLamada gestión comercial" y el motivo "Reenvío siniestros"
     • Necesidad: Cliente necesita ser transferido a la cola de siniestros
     • Tipo creación: Exclusiva IA
   - "Reenvío agentes humanos"
     • Consideración: Cuando se pase la llamada a la cola de humanos el ticket a crear debe tener el tipo "LLamada gestión comercial" y el motivo "Reenvío agentes humanos", siempre que no sea porque el cliente no quiere hablar con la IA o porque la persona que llama no es el tomador de la póliza de referencia
     • Necesidad: Cliente necesita ser transferido a agentes humanos
     • Tipo creación: Exclusiva IA
   - "Reenvío agentes humanos no quiere IA"
     • Consideración: El cliente indica que quiere hablar con un agente humano
     • Necesidad: El cliente indica que quiere hablar con un agente humano
     • Tipo creación: Exclusiva IA
   - "Reenvío agentes humanos no tomador"
     • Consideración: La persona que llama no se corresponde con el tomador de la póliza
     • Necesidad: La persona que llama no se corresponde con el tomador de la póliza
     • Tipo creación: Exclusiva IA

6. **Baja cliente en BBDD**
   - "Baja Cliente BBDD"
     • Consideración: Cliente llama solicitando baja en la base de datos de sus datos porque no quiere que le llamen más
     • Necesidad: Cliente llama solicitando baja en la base de datos de sus datos porque no quiere que le llamen más
     • Tipo creación: Manual / Automática

7. **Reclamación cliente regalo**
   - "Reclamación atención al cliente"
     • Consideración: Cliente llama indicando que no ha recibido regalo ofrecido por comercial, por recomendar a otro cliente...
     • Necesidad: Cliente llama indicando que no ha recibido regalo ofrecido por comercial, por recomendar a otro cliente...
     • Tipo creación: Manual / Automática

8. **Solicitud duplicado póliza**
   - "Correo ordinario"
     • Consideración: Cliente solicita envío de duplicado de póliza por correo ordinario
     • Necesidad: Cliente solicita envío de duplicado de póliza por correo ordinario
     • Tipo creación: Manual / Automática
   - "Duplicado Tarjeta"
     • Consideración: Cliente solicita envío de duplicado de las tarjetas de seguro de decesos o salud
     • Necesidad: Cliente solicita envío de duplicado de las tarjetas de seguro de decesos o salud
     • Tipo creación: Manual / Automática
   - "Email"
     • Consideración: Cliente solicita envío de duplicado de póliza por email
     • Necesidad: Cliente solicita envío de duplicado de póliza por email
     • Tipo creación: Manual / Automática
   - "Información recibos declaración renta"
     • Consideración: Cliente solicita envío de recibos de ejercicio fiscal anterior para incorporar los datos a su declaración de la renta
     • Necesidad: Cliente solicita envío de recibos de ejercicio fiscal anterior para incorporar los datos a su declaración de la renta
     • Tipo creación: Manual / Automática

REGLAS ESPECIALES:
- En modificaciones: SIEMPRE preguntar fecha de inicio (hoy, renovación póliza...)
- Si existe incidencia pendiente de vencimiento: crear rellamada sobre esa incidencia
- Para "Exclusiva IA": solo crear automáticamente con alta confianza
- Para "Manual / Automática": se puede crear tanto manual como automáticamente

⚠️ REGLA CRÍTICA - DETECCIÓN DE DATOS INCOMPLETOS:
SIEMPRE usar motivo "Datos incompletos" cuando:
1. El cliente solicita una modificación/gestión específica PERO no tiene los datos necesarios
2. El agente le dice que necesita más información
3. El cliente indica que "no tiene", "no sabe", "no recuerda" datos específicos
4. El agente sugiere que "vuelva a llamar cuando tenga la información"
5. La conversación termina sin completar la gestión por falta de datos

⚠️ REGLA CRÍTICA - SOLICITUDES DE ANULACIÓN DE PÓLIZAS:
Para solicitudes de anulación/cancelación de pólizas, evaluar el final de la llamada:

ESCENARIO 1 - FINALIZACIÓN DIRECTA:
- El agente finaliza la llamada indicando que "se pondrán en contacto con el cliente"
- El agente dice que "llamarán para gestionar la anulación"
- No hay transferencia a cola de humanos
→ USAR: "Retención cliente" - "Retención cliente"

ESCENARIO 2 - TRANSFERENCIA A HUMANOS:
- El agente transfiere/deriva la llamada a la cola de humanos
- Se usa [Tool Call: transfer_to_human] o similar
- La llamada se pasa a agentes humanos para gestionar la anulación
- Frases como "te voy a pasar con un compañero", "transferir a un agente humano"
- Final de llamada con tool calls de transferencia
→ USAR: "Llamada gestión comercial" - "Reenvío agentes humanos"

IMPORTANTE: SIEMPRE generar ticket en solicitudes de anulación, NUNCA dejar sin ticket.

SEÑALES DE TRANSFERENCIA A DETECTAR:
- [Tool Call: transfer_to_human], [Tool Call: transfer_to_queue], [Tool Call: escalate_to_human]
- Frases: "te paso con un compañero", "derivar a un agente humano", "transferir la llamada"
- Mensajes: "un agente humano se pondrá en contacto contigo", "te van a atender desde la cola de humanos"

EJEMPLOS ESPECÍFICOS:
- Cliente: "Quiero cambiar el DNI de un asegurado" + "No tengo el DNI ahora mismo" → "Datos incompletos"
- Cliente: "Quiero cambiar la cuenta bancaria" + "No sé el número de cuenta" → "Datos incompletos"  
- Cliente: "Necesito cesión de derechos" + "No tengo los datos del préstamo" → "Cesión de derechos datos incompletos"
- Cliente: "Quiero modificar la dirección" + "No recuerdo la dirección completa" → "Datos incompletos"

PROCESO DE DECISIÓN:
1. ¿Qué gestión quiere hacer el cliente? → Identifica la intención original
2. ¿Tiene todos los datos necesarios? → Si NO → Usar "Datos incompletos"
3. ¿La llamada se completa exitosamente? → Si NO por falta de datos → Usar "Datos incompletos"

CONVERSACIÓN A ANALIZAR:
{{conversation}}

INSTRUCCIONES:
1. Identifica la incidencia principal que mejor describe la consulta del cliente
2. Extrae TODOS los datos relevantes mencionados (números de póliza, cuentas, direcciones, etc.)
3. **IDENTIFICA EL NOMBRE DEL CLIENTE** mencionado en la conversación (si se menciona)
4. Genera notas específicas según las consideraciones del CSV
5. **EVALÚA SI EL CLIENTE TIENE TODOS LOS DATOS NECESARIOS** para completar la gestión solicitada
6. Si la gestión no se puede completar por falta de datos → usar "Datos incompletos"
7. **EVALÚA EL FINAL DE LA LLAMADA** para solicitudes de anulación/cancelación:
   - Finalización directa + agente promete contacto → "Retención cliente"
   - Transferencia a humanos → "Llamada gestión comercial - Reenvío agentes humanos"
8. Determina si requiere creación de ticket
9. Calcula la prioridad basada en urgencia y complejidad

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
            tipoCreacion: response.incidenciaPrincipal.tipoCreacion || 'Manual / Automática'
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
    // Verificar primero por tipoCreacion
    if (incidencia.tipoCreacion === 'Exclusiva IA') {
      return true;
    }
    
    // Lista actualizada de motivos exclusivos de IA según CSV 15.07.25
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
    // No crear tickets para "Exclusiva IA" con baja confianza
    if (this.isExclusivaIA(analysis.incidenciaPrincipal) && analysis.confidence < 0.8) {
      return false;
    }
    
    // Crear ticket si la confianza es alta y se requiere
    return analysis.requiereTicket && analysis.confidence >= 0.3; // Umbral más flexible
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