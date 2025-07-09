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
  requiereTicket: boolean;
  prioridad: 'low' | 'medium' | 'high';
}

class NogalAnalysisService {
  
  private readonly NOGAL_PROMPT = `
Eres un experto en seguros y atención al cliente de la Correduría de Seguros Nogal. 
Analiza la siguiente conversación telefónica y clasifícala según los tipos de incidencia exactos de Nogal.

TIPOS DE INCIDENCIA DISPONIBLES (del CSV oficial de Nogal):

1. **Nueva contratación de seguros**
   - Contratación Póliza
   - Póliza anterior suspensión de garantías

2. **Modificación póliza emitida**
   - Atención al cliente - Modif datos póliza
   - Cambio nº de cuenta
   - Cambio fecha de efecto
   - Cambio forma de pago
   - Modificación nº asegurados
   - Cambio dirección postal
   - Modificación coberturas
   - Cesión de derechos datos incompletos (Exclusiva IA)
   - Cesión de derechos
   - Corrección datos erróneos en póliza
   - Datos incompletos (Exclusiva IA)

3. **Llamada asistencia en carretera**
   - Siniestros

4. **Retención de Cliente Cartera**
   - Retención de Cliente Cartera Llamada

5. **Cancelación antes de efecto**
   - Cancelación antes de efecto llamada

6. **Llamada gestión comercial**
   - LLam gestión comerc
   - Pago de Recibo
   - Consulta cliente
   - Cambio forma de pago (desde anual a fraccionado)
   - Reenvío siniestros (Exclusiva IA)
   - Reenvío agentes humanos (Exclusiva IA)

7. **Baja cliente en BBDD**
   - Baja Cliente BBDD

8. **Reclamación cliente regalo**
   - Reclamación atención al cliente

9. **Solicitud duplicado póliza**
   - Correo ordinario
   - Duplicado Tarjeta
   - Email
   - Información recibos declaración renta

RAMOS DISPONIBLES: hogar, auto, vida, decesos, Salud, otros

CONVERSACIÓN A ANALIZAR:
{{conversation}}

INSTRUCCIONES:
1. Identifica la incidencia principal que mejor describe la consulta del cliente
2. Extrae todos los datos relevantes mencionados (números de póliza, cuentas, direcciones, etc.)
3. Determina si requiere creación de ticket
4. Calcula la prioridad basada en la urgencia y complejidad

Responde EXACTAMENTE en este formato JSON:
{
  "incidenciaPrincipal": {
    "tipo": "uno de los tipos exactos listados arriba",
    "motivo": "uno de los motivos exactos listados arriba",
    "ramo": "hogar|auto|vida|decesos|Salud|otros (solo si aplica)",
    "consideraciones": "notas especiales para el gestor",
    "necesidadCliente": "descripción de lo que necesita el cliente",
    "tipoCreacion": "Manual|Automática|Exclusiva IA"
  },
  "incidenciasSecundarias": [],
  "confidence": 0.95,
  "resumenLlamada": "resumen claro y conciso en español",
  "datosExtraidos": {
    "numeroPoliza": "si se menciona",
    "numeroRecibo": "si se menciona",
    "cuentaBancaria": "si se menciona",
    "direccion": "si se menciona nueva dirección",
    "otros": "cualquier otro dato relevante"
  },
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