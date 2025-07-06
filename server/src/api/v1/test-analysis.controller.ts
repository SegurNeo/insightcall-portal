import { Request, Response } from 'express';
import { analysisService } from '../../modules/analysis';
import { ticketClassifierService } from '../../services/ticketClassifierService';
import { TranscriptMessage } from '../../types/transcript.types';

interface TestAnalysisRequest {
  conversation_id?: string;
  messages: TranscriptMessage[];
}

interface TestAnalysisResponse {
  conversation_id: string;
  timestamp: string;
  analysis: any;
  classification: any;
  recommendations: {
    suggested_tickets: Array<{
      id: string;
      tipo_incidencia: string;
      motivo_incidencia: string;
      score: number;
      justification: string;
      confidence_level: 'high' | 'medium' | 'low';
      should_create: boolean;
    }>;
    summary: string;
  };
}

export class TestAnalysisController {
  
  /**
   * Endpoint para testear análisis completo sin crear tickets reales
   */
  async testFullAnalysis(req: Request, res: Response) {
    try {
      const { conversation_id, messages }: TestAnalysisRequest = req.body;

      // Validaciones
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'Se requiere un array de mensajes válido',
          example: {
            messages: [
              { role: 'user', message: 'Hola, quiero cambiar mi número de cuenta' },
              { role: 'agent', message: '¿Me puede proporcionar su nuevo número de cuenta?' }
            ]
          }
        });
      }

      const testId = conversation_id || `test-${Date.now()}`;
      console.log(`[TestAnalysis] Iniciando análisis completo para ${testId}`);

      // 1. Análisis con Gemini
      console.log(`[TestAnalysis] Paso 1: Análisis de sentimiento y temas`);
      const analysis = await analysisService.analyzeTranscript(messages, testId);

      // 2. Clasificación de tickets
      console.log(`[TestAnalysis] Paso 2: Clasificación de tickets`);
      const classification = await ticketClassifierService.classifyTranscript(messages, testId);

      // 3. Generar recomendaciones
      const recommendations = this.generateRecommendations(classification);

      // 4. Preparar respuesta completa
      const response: TestAnalysisResponse = {
        conversation_id: testId,
        timestamp: new Date().toISOString(),
        analysis,
        classification,
        recommendations
      };

      console.log(`[TestAnalysis] Análisis completado para ${testId}:`, {
        analysisStatus: analysis.status,
        ticketsDetected: classification.suggestions.length,
        highConfidenceTickets: recommendations.suggested_tickets.filter((t: any) => t.confidence_level === 'high').length,
        shouldCreateTickets: recommendations.suggested_tickets.filter((t: any) => t.should_create).length
      });

      return res.json(response);

    } catch (error) {
      console.error('[TestAnalysis] Error en análisis completo:', error);
      return res.status(500).json({
        error: 'Error realizando análisis',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Endpoint para testear solo la clasificación de tickets
   */
  async testTicketClassification(req: Request, res: Response) {
    try {
      const { conversation_id, messages }: TestAnalysisRequest = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Se requiere un array de mensajes válido' });
      }

      const testId = conversation_id || `test-classification-${Date.now()}`;
      console.log(`[TestAnalysis] Clasificando tickets para ${testId}`);

      const classification = await ticketClassifierService.classifyTranscript(messages, testId);
      
      return res.json({
        conversation_id: testId,
        timestamp: new Date().toISOString(),
        ...classification,
        detailed_suggestions: classification.suggestions.map(suggestion => {
          const definition = ticketClassifierService.getDefinitionById(suggestion.id_definicion);
          return {
            ...suggestion,
            definition: definition ? {
              tipo_creacion: definition.tipoCreacion,
              ramo: definition.ramo,
              consideraciones: definition.consideraciones,
              necesidad_cliente: definition.necesidadCliente
            } : null
          };
        })
      });

    } catch (error) {
      console.error('[TestAnalysis] Error en clasificación de tickets:', error);
      return res.status(500).json({
        error: 'Error clasificando tickets',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Endpoint para obtener todas las definiciones de tickets disponibles
   */
  async getTicketDefinitions(req: Request, res: Response) {
    try {
      const definitions = ticketClassifierService.getAvailableDefinitions();
      
      return res.json({
        total_definitions: definitions.length,
        definitions: definitions.map(def => ({
          id: def.id,
          tipo_incidencia: def.tipoIncidencia,
          motivo_incidencia: def.motivoIncidencia,
          ramo: def.ramo,
          tipo_creacion: def.tipoCreacion,
          necesidad_cliente: def.necesidadCliente
        })),
        by_type: this.groupDefinitionsByType(definitions),
        by_creation_type: this.groupDefinitionsByCreationType(definitions)
      });

    } catch (error) {
      console.error('[TestAnalysis] Error obteniendo definiciones:', error);
      return res.status(500).json({
        error: 'Error obteniendo definiciones de tickets'
      });
    }
  }

  /**
   * Generar recomendaciones basadas en la clasificación
   */
  private generateRecommendations(classification: any) {
    const suggestedTickets = classification.suggestions.map((suggestion: any) => {
      let confidence_level: 'high' | 'medium' | 'low' = 'low';
      let should_create = false;

      if (suggestion.score >= 0.7) {
        confidence_level = 'high';
        should_create = true;
      } else if (suggestion.score >= 0.5) {
        confidence_level = 'medium';
        should_create = true;
      } else if (suggestion.score >= 0.3) {
        confidence_level = 'low';
        should_create = false;
      }

      return {
        id: suggestion.id_definicion,
        tipo_incidencia: suggestion.tipo_incidencia,
        motivo_incidencia: suggestion.motivo_incidencia,
        score: suggestion.score,
        justification: suggestion.justification,
        confidence_level,
        should_create
      };
    });

    const highConfidence = suggestedTickets.filter((t: any) => t.confidence_level === 'high');
    const summary = highConfidence.length > 0 
      ? `Se detectaron ${highConfidence.length} incidencias de alta confianza que deberían generar tickets automáticamente.`
      : suggestedTickets.length > 0
        ? `Se detectaron ${suggestedTickets.length} posibles incidencias, pero ninguna con confianza suficiente para creación automática.`
        : 'No se detectaron incidencias que requieran creación de tickets.';

    return {
      suggested_tickets: suggestedTickets,
      summary
    };
  }

  private groupDefinitionsByType(definitions: any[]) {
    const grouped: Record<string, number> = {};
    definitions.forEach(def => {
      grouped[def.tipoIncidencia] = (grouped[def.tipoIncidencia] || 0) + 1;
    });
    return grouped;
  }

  private groupDefinitionsByCreationType(definitions: any[]) {
    const grouped: Record<string, number> = {};
    definitions.forEach(def => {
      grouped[def.tipoCreacion] = (grouped[def.tipoCreacion] || 0) + 1;
    });
    return grouped;
  }
}

export const testAnalysisController = new TestAnalysisController(); 