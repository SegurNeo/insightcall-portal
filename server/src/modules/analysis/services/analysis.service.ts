import { v4 as uuidv4 } from 'uuid';
import { generateStructuredResponse } from '@/lib/gemini';
import { TranscriptMessage } from '@/types/transcript.types';
import { getPromptTemplate } from '@/config/prompts';

interface AnalysisResult {
  status: 'completed' | 'failed';
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  topics?: string[];
  summary?: string;
  error?: string;
  conversationId?: string;
  timestamp?: string;
}

const ANALYSIS_PROMPT_SYSTEM = `Eres un experto analista de conversaciones de seguros. Analiza la siguiente conversación y devuelve un análisis estructurado en JSON.

Debes devolver exactamente este formato JSON:
{
  "sentiment": {
    "score": 0.75,
    "label": "positive"
  },
  "topics": ["consulta", "modificacion", "datos"],
  "summary": "Resumen conciso de la conversación en máximo 100 palabras"
}

Criterios para sentiment:
- score: 0.0-1.0 donde 0 es muy negativo, 0.5 neutral, 1.0 muy positivo
- label: "positive" (>0.6), "neutral" (0.4-0.6), "negative" (<0.4)

Topics: Array de 2-5 palabras clave relevantes sobre el tema de la conversación.
Summary: Descripción concisa de qué solicita o necesita el cliente.`;

class AnalysisService {
  async analyzeTranscript(messages: TranscriptMessage[], conversationId: string): Promise<AnalysisResult> {
    try {
      console.log(`[AnalysisService] Analizando conversación ${conversationId} con ${messages.length} mensajes`);
      
      // Formatear conversación para Gemini
      const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${m.message}`)
        .join('\n');

      const fullPrompt = `${ANALYSIS_PROMPT_SYSTEM}\n\nCONVERSACIÓN:\n${conversationText}\n\n### Análisis requerido ###`;

      // Llamada real a Gemini
      const geminiResponse = await generateStructuredResponse<{
        sentiment: { score: number; label: string };
        topics: string[];
        summary: string;
      }>(fullPrompt);

      // Validar response
      if (!geminiResponse.sentiment || !geminiResponse.topics || !geminiResponse.summary) {
        throw new Error('Respuesta de Gemini incompleta');
      }

      // Normalizar sentiment label
      let normalizedLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (geminiResponse.sentiment.score > 0.6) {
        normalizedLabel = 'positive';
      } else if (geminiResponse.sentiment.score < 0.4) {
        normalizedLabel = 'negative';
      }

      const result: AnalysisResult = {
        status: 'completed',
        sentiment: {
          score: Math.max(0, Math.min(1, geminiResponse.sentiment.score)), // Clamp 0-1
          label: normalizedLabel
        },
        topics: geminiResponse.topics.slice(0, 5), // Máximo 5 topics
        summary: geminiResponse.summary.substring(0, 200), // Máximo 200 chars
        conversationId,
        timestamp: new Date().toISOString()
      };

      console.log(`[AnalysisService] Análisis completado para ${conversationId}:`, {
        sentiment: result.sentiment,
        topicsCount: result.topics?.length,
        summaryLength: result.summary?.length
      });

      return result;
    } catch (error: any) {
      console.error(`[AnalysisService] Error analizando ${conversationId}:`, error);
      return {
        status: 'failed',
        error: error.message,
        conversationId,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const analysisService = new AnalysisService(); 