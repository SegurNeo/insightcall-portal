/**
 * Servicio que clasifica transcripciones y detecta qué tickets de la tabla `ticketDefinitions` aplican.
 */

import { ticketDefinitions, TicketDefinition } from '../utils/ticketDefinitions';
import { generateStructuredResponse } from '../lib/gemini';
import { TranscriptMessage } from '../types/transcript.types';

export interface TicketSuggestion {
  id_definicion: string; // uuid de la definición
  score: number; // 0-1
  justification: string; // frase corta explicando la relación
  tipo_incidencia: string; // Para facilitar debugging
  motivo_incidencia: string; // Para facilitar debugging
}

export interface ClassificationResult {
  suggestions: TicketSuggestion[];
  rawResponse: any; // texto o json devuelto por Gemini (para debug)
  conversationId?: string;
  timestamp?: string;
  totalDefinitionsAnalyzed: number;
}

const PROMPT_SYSTEM = `Eres un experto clasificador de incidencias de seguros. Tu trabajo es identificar qué tipos de incidencias aplican a una conversación telefónica.

IMPORTANTE: Analiza cuidadosamente la conversación y detecta las NECESIDADES REALES del cliente. No te limites a palabras clave.

CATÁLOGO DE INCIDENCIAS DISPONIBLES:
{CATALOG_TABLE}

INSTRUCCIONES:
1. Lee la conversación completa
2. Identifica qué solicita o necesita el cliente
3. Busca en el catálogo las incidencias que mejor coincidan
4. Asigna un score de 0.0 a 1.0 basado en qué tan bien encaja
5. Proporciona una justificación clara

CRITERIOS DE SCORING:
- 0.9-1.0: Coincidencia perfecta, el cliente solicita exactamente esto
- 0.7-0.8: Coincidencia alta, muy probable que sea esta incidencia
- 0.5-0.6: Coincidencia media, podría ser esta incidencia
- 0.3-0.4: Coincidencia baja, solo si no hay mejores opciones
- 0.0-0.2: No aplica o coincidencia muy débil

Devuelve un JSON con esta estructura exacta:
{
  "tickets_detected": [
    {
      "id_definicion": "uuid-exacto-del-catalogo",
      "score": 0.85,
      "justification": "Descripción de máximo 80 caracteres"
    }
  ]
}

IMPORTANTE: 
- Solo incluye incidencias con score >= 0.3
- Máximo 5 incidencias por conversación
- Solo usa id_definicion que existan en el catálogo
- Ordena por score descendente`;

function buildDefinitionsTableCsv(): string {
  // Construimos una tabla más completa para mejor contexto
  const header = 'id_definicion | tipo_incidencia | motivo_gestion | ramo | necesidad_cliente | tipo_creacion';
  const rows = ticketDefinitions.map(d => 
    `${d.id} | ${d.tipoIncidencia} | ${d.motivoIncidencia} | ${d.ramo || 'N/A'} | ${d.necesidadCliente || 'N/A'} | ${d.tipoCreacion}`
  );
  return [header, ...rows].join('\n');
}

function buildPrompt(conversationText: string): string {
  const table = buildDefinitionsTableCsv();
  return PROMPT_SYSTEM.replace('{CATALOG_TABLE}', table) + 
         `\n\nCONVERSACIÓN A ANALIZAR:\n${conversationText}\n\n### Clasificación requerida ###`;
}

export class TicketClassifierService {
  private formatConversation(messages: TranscriptMessage[]): string {
    return messages
      .map(m => `${m.role.toUpperCase()}: ${m.message}`)
      .join('\n');
  }

  async classifyTranscript(messages: TranscriptMessage[], conversationId?: string): Promise<ClassificationResult> {
    try {
      console.log(`[TicketClassifier] Clasificando conversación ${conversationId || 'unknown'} con ${messages.length} mensajes`);
      console.log(`[TicketClassifier] Definiciones disponibles: ${ticketDefinitions.length}`);

      const conversation = this.formatConversation(messages);
      const prompt = buildPrompt(conversation);

      console.log(`[TicketClassifier] Enviando prompt a Gemini (${prompt.length} caracteres)`);

      const raw = await generateStructuredResponse<{
        tickets_detected: Array<{
          id_definicion: string;
          score: number;
          justification: string;
        }>;
      }>(prompt);

      if (!raw || !Array.isArray(raw.tickets_detected)) {
        throw new Error('Respuesta de Gemini inválida o sin tickets_detected');
      }

      // Procesar y validar sugerencias
      const suggestions: TicketSuggestion[] = [];
      
      for (const ticket of raw.tickets_detected) {
        // Buscar la definición correspondiente
        const definition = ticketDefinitions.find(d => d.id === ticket.id_definicion);
        
        if (!definition) {
          console.warn(`[TicketClassifier] ID de definición no encontrado: ${ticket.id_definicion}`);
          continue;
        }

        // Validar score
        const score = Math.max(0, Math.min(1, ticket.score || 0));
        
        // Solo incluir si score >= 0.3
        if (score >= 0.3) {
          suggestions.push({
            id_definicion: ticket.id_definicion,
            score,
            justification: (ticket.justification || 'Sin justificación').substring(0, 80),
            tipo_incidencia: definition.tipoIncidencia,
            motivo_incidencia: definition.motivoIncidencia
          });
        }
      }

      // Ordenar por score descendente
      suggestions.sort((a, b) => b.score - a.score);

      // Limitar a máximo 5
      const finalSuggestions = suggestions.slice(0, 5);

      console.log(`[TicketClassifier] Clasificación completada para ${conversationId}:`, {
        totalSuggestions: finalSuggestions.length,
        highConfidence: finalSuggestions.filter(s => s.score >= 0.7).length,
        mediumConfidence: finalSuggestions.filter(s => s.score >= 0.5 && s.score < 0.7).length,
        topSuggestion: finalSuggestions[0] ? {
          tipo: finalSuggestions[0].tipo_incidencia,
          motivo: finalSuggestions[0].motivo_incidencia,
          score: finalSuggestions[0].score
        } : null
      });

      return { 
        suggestions: finalSuggestions, 
        rawResponse: raw,
        conversationId,
        timestamp: new Date().toISOString(),
        totalDefinitionsAnalyzed: ticketDefinitions.length
      };
    } catch (error: any) {
      console.error(`[TicketClassifier] Error clasificando ${conversationId}:`, error);
      return {
        suggestions: [],
        rawResponse: { error: error.message },
        conversationId,
        timestamp: new Date().toISOString(),
        totalDefinitionsAnalyzed: ticketDefinitions.length
      };
    }
  }

  // Método útil para testing
  getAvailableDefinitions(): TicketDefinition[] {
    return ticketDefinitions;
  }

  // Método para obtener definición por ID
  getDefinitionById(id: string): TicketDefinition | undefined {
    return ticketDefinitions.find(d => d.id === id);
  }
}

export const ticketClassifierService = new TicketClassifierService(); 