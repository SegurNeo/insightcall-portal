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
3. Genera notas específicas según las consideraciones del CSV
4. Determina si requiere creación de ticket
5. Calcula la prioridad basada en urgencia y complejidad

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
    "numeroPoliza": "si se menciona exactamente",
    "numeroRecibo": "si se menciona",
    "cuentaBancaria": "nueva CCC si se proporciona",
    "direccion": "nueva dirección completa si se menciona",
    "fechaEfecto": "fecha de inicio del cambio si se menciona",
    "asegurados": "datos de asegurados a incluir/excluir",
    "prestamo": "datos del préstamo hipotecario si aplica",
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
          datosExtraidos: response.datosExtraidos || {},
          notasParaNogal: response.notasParaNogal,
          requiereTicket: response.requiereTicket !== false, // Default true
          prioridad: this.normalizePriority(response.prioridad)
        };

        console.log(`[NogalAnalysis] [DEBUG] Análisis completado exitosamente:`, {
          tipo: result.incidenciaPrincipal.tipo,
          motivo: result.incidenciaPrincipal.motivo,
          confidence: result.confidence,
          requiereTicket: result.requiereTicket,
          prioridad: result.prioridad
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
}

export const nogalAnalysisService = new NogalAnalysisService(); 